import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@backstop/auth";
import { callEdgeFunction } from "@backstop/api-client";
import { createBrowserClient } from "@backstop/db";
import { fetchClaimDetail } from "@backstop/handlers/browser";
import type { StoredClaim } from "@backstop/core";
import { AppShell, Card, FlagCard } from "@backstop/ui";

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

  const resolvedFlags = useMemo(
    () => claim?.scrub.flags.filter((f) => f.status !== "open") ?? [],
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
      <AppShell title="Backstop Operator" nav={[{ href: "/", label: "Work queue" }]}>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!claim) {
    return (
      <AppShell title="Backstop Operator" nav={[{ href: "/", label: "Work queue" }]}>
        <p>Claim not found.</p>
      </AppShell>
    );
  }

  const feeTotal = claim.lines.reduce((s, l) => s + l.feeBilled, 0);
  const atRisk = claim.scrub.summary.estimatedDollarAtRisk;

  return (
    <AppShell
      title="Backstop Operator"
      nav={[
        { href: "/", label: "Work queue" },
        { href: "/upload", label: "Upload CSV" },
      ]}
    >
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Work queue
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[color:var(--bs-navy)]">
            {claim.patientRef} · {claim.payerName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {claim.externalClaimId} · ${feeTotal.toFixed(0)} billed ·{" "}
            <span className="tabular-nums font-medium text-[color:var(--bs-terracotta)]">
              ${atRisk.toFixed(0)} at risk
            </span>{" "}
            · {openFlags.length} open
          </p>
        </div>
      </div>

      {primary && (
        <Card className="mt-4 border-[color:var(--bs-warn)] bg-amber-50/80 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--bs-warn)]">
            Primary blocker
          </p>
          <p className="mt-1 font-medium text-[color:var(--bs-navy)]">{primary.reason}</p>
        </Card>
      )}

      {claim.autoFixes.length > 0 && (
        <Card className="mt-4 border-[color:var(--bs-success)] bg-green-50/60 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--bs-success)]">
            Applied fixes
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {claim.autoFixes.map((fix) => (
              <li key={fix}>✓ {fix}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {openFlags
          .sort((a, b) => {
            const rank = { critical: 4, high: 3, medium: 2, low: 1 };
            return rank[b.severity] - rank[a.severity];
          })
          .map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              onApprove={(flagId) => gate(flagId, "approve")}
              onFix={(flagId) => gate(flagId, "approve")}
              onOverride={(flagId, reason) => gate(flagId, "override", reason)}
            />
          ))}
      </div>

      {openFlags.length === 0 && (
        <Card className="mt-6 border-[color:var(--bs-success)] bg-green-50/60 p-4 text-sm">
          All flags resolved — claim passed the gate.
          <button type="button" className="ml-2 font-medium underline" onClick={() => navigate("/")}>
            Back to queue
          </button>
        </Card>
      )}

      {resolvedFlags.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Resolved flags ({resolvedFlags.length})
          </summary>
          <div className="mt-3 space-y-2">
            {resolvedFlags.map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
            ))}
          </div>
        </details>
      )}

      <details className="mt-6 rounded-xl border border-border bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium text-[color:var(--bs-navy)]">Claim lines</summary>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {claim.lines.map((line) => (
            <li key={line.cdtCode} className="tabular-nums">
              {line.cdtCode} — ${line.feeBilled.toFixed(2)}
              {line.tooth && ` · tooth ${line.tooth}`}
              {line.quadrant && ` · ${line.quadrant}`}
            </li>
          ))}
        </ul>
      </details>
    </AppShell>
  );
}
