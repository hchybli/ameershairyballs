import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth, SignOutButton } from "@backstop/auth";
import { callEdgeFunctionAuthed, formatEdgeError } from "@backstop/api-client";
import { fetchClaimDetail } from "@backstop/handlers/browser";
import type { StoredClaim } from "@backstop/core";
import { AppShell, Card, DenialRiskPanel, EligibilityPanel, FlagCard } from "@backstop/ui";

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supabase } = useAuth();
  const [claim, setClaim] = useState<StoredClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentLoading, setAgentLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{
    active: boolean;
    annualMaxRemaining: number;
    deductibleRemaining: number;
    coverageSummary: string | null;
    alerts: Array<{ code: string; severity: "critical" | "high" | "medium" | "low"; message: string }>;
    checkedAt: string;
  } | null>(null);
  const [denialRisk, setDenialRisk] = useState<{
    claimRiskScore: number;
    lines: Array<{
      lineIndex: number;
      cdtCode: string;
      riskScore: number;
      denialRate: number;
      reasons: string[];
      recommendedFix: string;
    }>;
  } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await fetchClaimDetail(supabase, id);
    setClaim(data);
  }, [id, supabase]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const runAgents = useCallback(async () => {
    if (!claim) return;
    setAgentLoading(true);
    try {
      const procedureCodes = claim.lines.map((l) => l.cdtCode);
      const [eligRes, predRes] = await Promise.all([
        callEdgeFunctionAuthed(supabase, "check-eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_ref: claim.patientRef,
            payer_name: claim.payerName,
            external_claim_id: claim.externalClaimId,
            procedure_codes: procedureCodes,
          }),
        }),
        callEdgeFunctionAuthed(supabase, "predict-denial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            external_claim_id: claim.externalClaimId,
            payer_name: claim.payerName,
            lines: claim.lines.map((line, lineIndex) => ({
              line_index: lineIndex,
              cdt_code: line.cdtCode,
              fee_billed: line.feeBilled,
            })),
          }),
        }),
      ]);

      if (eligRes.ok) {
        const data = await eligRes.json();
        setEligibility({
          active: Boolean(data.active),
          annualMaxRemaining: Number(data.annual_max_remaining ?? 0),
          deductibleRemaining: Number(data.deductible_remaining ?? 0),
          coverageSummary: data.coverage_summary ?? null,
          alerts: Array.isArray(data.alerts) ? data.alerts : [],
          checkedAt: data.checked_at ?? new Date().toISOString(),
        });
      }

      if (predRes.ok) {
        const data = await predRes.json();
        setDenialRisk({
          claimRiskScore: Number(data.claim_risk_score ?? 0),
          lines: Array.isArray(data.lines)
            ? data.lines.map((line: Record<string, unknown>) => ({
                lineIndex: Number(line.line_index ?? 0),
                cdtCode: String(line.cdt_code ?? ""),
                riskScore: Number(line.risk_score ?? 0),
                denialRate: Number(line.denial_rate ?? 0),
                reasons: Array.isArray(line.reasons) ? (line.reasons as string[]) : [],
                recommendedFix: String(line.recommended_fix ?? ""),
              }))
            : [],
        });
      }

      await load();
    } finally {
      setAgentLoading(false);
    }
  }, [claim, load, supabase]);

  const agentsRan = useRef(false);

  useEffect(() => {
    if (!claim || agentsRan.current) return;
    agentsRan.current = true;
    void runAgents();
  }, [claim?.externalClaimId, runAgents]);

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
    const res = await callEdgeFunctionAuthed(supabase, "gate-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag_id: flagId, action, reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(formatEdgeError(res.status, err));
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <AppShell
        title="Backstop Operator"
        nav={[{ href: "/", label: "Work queue" }]}
        actions={<SignOutButton />}
      >
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!claim) {
    return (
      <AppShell
        title="Backstop Operator"
        nav={[{ href: "/", label: "Work queue" }]}
        actions={<SignOutButton />}
      >
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
      actions={<SignOutButton />}
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <EligibilityPanel
          patientRef={claim.patientRef}
          payerName={claim.payerName}
          active={eligibility?.active ?? true}
          annualMaxRemaining={eligibility?.annualMaxRemaining ?? null}
          deductibleRemaining={eligibility?.deductibleRemaining ?? null}
          coverageSummary={eligibility?.coverageSummary ?? undefined}
          alerts={eligibility?.alerts ?? []}
          loading={agentLoading && !eligibility}
          checkedAt={eligibility?.checkedAt}
          onRecheck={runAgents}
        />
        <DenialRiskPanel
          claimRiskScore={denialRisk?.claimRiskScore ?? 0}
          lines={denialRisk?.lines ?? []}
          loading={agentLoading && !denialRisk}
          onRescore={runAgents}
        />
      </div>

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
