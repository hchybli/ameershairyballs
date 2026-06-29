import { cn } from "../cn";

export interface DenialLineRiskView {
  lineIndex: number;
  cdtCode: string;
  riskScore: number;
  denialRate: number;
  reasons: string[];
  recommendedFix: string;
}

export interface DenialRiskPanelProps {
  claimRiskScore: number;
  lines: DenialLineRiskView[];
  loading?: boolean;
  onRescore?: () => void;
  className?: string;
}

export function DenialRiskPanel({
  claimRiskScore,
  lines,
  loading = false,
  onRescore,
  className,
}: DenialRiskPanelProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-white p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[color:var(--bs-navy)]">Denial risk</h2>
          <p className="text-xs text-muted-foreground">
            Moat score from payer outcome history · claim risk {claimRiskScore}%
          </p>
        </div>
        {onRescore && (
          <button
            type="button"
            onClick={onRescore}
            disabled={loading}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {loading ? "Scoring…" : "Re-score"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Scoring denial risk…</p>
      ) : lines.length === 0 ? (
        <p className="mt-3 text-sm text-[color:var(--bs-success)]">
          No high-risk lines from payer intelligence.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {lines.map((line) => (
            <li key={`${line.lineIndex}-${line.cdtCode}`} className="rounded-md bg-amber-50 px-3 py-2 text-sm">
              <p className="font-medium text-amber-950">
                {line.cdtCode} · {line.riskScore}% risk ({line.denialRate}% historical denial)
              </p>
              <p className="mt-1 text-amber-900">{line.reasons.join(" ")}</p>
              <p className="mt-1 text-xs text-amber-800">{line.recommendedFix}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
