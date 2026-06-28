import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@backstop/auth";
import { callEdgeFunction } from "@backstop/api-client";
import { createBrowserClient } from "@backstop/db";
import { fetchClaimDetail } from "@backstop/handlers/browser";
import type { StoredClaim } from "@backstop/core";
import { FlagCard } from "../components/flag-card";
import { Layout } from "../components/ui";

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supabaseSession } = useAuth();
  const [claim, setClaim] = useState<StoredClaim | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const supabase = createBrowserClient();
    const data = await fetchClaimDetail(supabase, id);
    setClaim(data);
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const openFlags = useMemo(
    () => claim?.scrub.flags.filter((f) => f.status === "open") ?? [],
    [claim],
  );

  const primary = useMemo(() => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...openFlags].sort((a, b) => rank[b.severity] - rank[a.severity])[0];
  }, [openFlags]);

  async function gate(flagId: string, action: "approve" | "override", reason?: string) {
    const token = supabaseSession?.access_token;
    if (!token) {
      alert("Not signed in.");
      return;
    }

    const res = await callEdgeFunction(token, "gate-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag_id: flagId, action, reason }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Gate action failed");
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout>
        <p>Claim not found.</p>
      </Layout>
    );
  }

  const feeTotal = claim.lines.reduce((s, l) => s + l.feeBilled, 0);

  return (
    <Layout>
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Work queue
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">
            {claim.patientRef} · {claim.payerName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {claim.externalClaimId} · ${feeTotal.toFixed(0)} · {openFlags.length} flag(s) open
          </p>
        </div>
      </div>

      {primary && (
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
          <p className="font-medium">Primary blocker</p>
          <p>{primary.reason}</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {claim.scrub.flags
          .filter((f) => f.status === "open")
          .sort((a, b) => {
            const rank = { critical: 4, high: 3, medium: 2, low: 1 };
            return rank[b.severity] - rank[a.severity];
          })
          .map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              onApprove={(flagId) => gate(flagId, "approve")}
              onOverride={(flagId, reason) => gate(flagId, "override", reason)}
            />
          ))}
      </div>

      {openFlags.length === 0 && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          All flags resolved — claim passed the gate.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => navigate("/")}
          >
            Back to queue
          </button>
        </div>
      )}

      <details className="mt-8 rounded-lg border p-4 text-sm">
        <summary className="cursor-pointer font-medium">Claim lines</summary>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {claim.lines.map((line) => (
            <li key={line.cdtCode}>
              {line.cdtCode} — ${line.feeBilled.toFixed(2)}
              {line.tooth && ` · tooth ${line.tooth}`}
              {line.quadrant && ` · ${line.quadrant}`}
            </li>
          ))}
        </ul>
      </details>
    </Layout>
  );
}
