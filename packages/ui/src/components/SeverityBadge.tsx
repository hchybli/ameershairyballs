import { cn } from "../cn";

const SEVERITY_CLASS: Record<string, string> = {
  critical: "border-[color:var(--bs-danger)] bg-red-50 text-[color:var(--bs-danger)]",
  high: "border-orange-200 bg-orange-50 text-orange-900",
  medium: "border-[color:var(--bs-warn)] bg-amber-50 text-amber-900",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        SEVERITY_CLASS[severity] ?? SEVERITY_CLASS.low,
        className,
      )}
    >
      {severity}
    </span>
  );
}
