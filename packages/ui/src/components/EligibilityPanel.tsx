import { cn } from "../cn";

export interface EligibilityAlertView {
  code: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface EligibilityPanelProps {
  patientRef: string;
  payerName: string;
  active: boolean;
  annualMaxRemaining: number | null;
  deductibleRemaining: number | null;
  coverageSummary?: string;
  alerts: EligibilityAlertView[];
  loading?: boolean;
  checkedAt?: string | null;
  onRecheck?: () => void;
  className?: string;
}

export function EligibilityPanel({
  patientRef,
  payerName,
  active,
  annualMaxRemaining,
  deductibleRemaining,
  coverageSummary,
  alerts,
  loading = false,
  checkedAt,
  onRecheck,
  className,
}: EligibilityPanelProps) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-white p-4", className)}
      data-patient-ref={patientRef}
      data-payer={payerName}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[color:var(--bs-navy)]">Eligibility</h2>
          <p className="text-xs text-muted-foreground">
            {active ? "Active coverage" : "Inactive / lapsed"} · {payerName}
            {checkedAt ? ` · checked ${new Date(checkedAt).toLocaleString()}` : ""}
          </p>
        </div>
        {onRecheck && (
          <button
            type="button"
            onClick={onRecheck}
            disabled={loading}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {loading ? "Checking…" : "Re-check"}
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Annual max left</p>
          <p className="font-medium tabular-nums">
            {annualMaxRemaining != null ? `$${annualMaxRemaining.toFixed(0)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Deductible left</p>
          <p className="font-medium tabular-nums">
            {deductibleRemaining != null ? `$${deductibleRemaining.toFixed(0)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Coverage</p>
          <p className="font-medium">{coverageSummary ?? "—"}</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading benefits…</p>
      ) : alerts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {alerts.map((alert) => (
            <li
              key={alert.code}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                alert.severity === "critical" && "bg-red-50 text-red-900",
                alert.severity === "high" && "bg-amber-50 text-amber-950",
                alert.severity === "medium" && "bg-muted text-foreground",
              )}
            >
              {alert.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--bs-success)]">No chair-side coverage alerts.</p>
      )}
    </section>
  );
}
