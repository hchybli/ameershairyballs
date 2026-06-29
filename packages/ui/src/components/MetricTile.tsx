import type { ReactNode } from "react";
import { cn } from "../cn";
import { Card } from "./Card";

export function MetricTile({
  label,
  value,
  hint,
  hero,
  tone = "default",
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  hero?: boolean;
  tone?: "default" | "success" | "warn" | "danger";
  onClick?: () => void;
  className?: string;
}) {
  const toneClass = {
    default: "text-[color:var(--bs-navy)]",
    success: "text-[color:var(--bs-success)]",
    warn: "text-[color:var(--bs-warn)]",
    danger: "text-[color:var(--bs-danger)]",
  }[tone];

  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular-nums font-semibold",
          hero ? "text-4xl sm:text-5xl" : "text-2xl",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        <Card className={cn("p-4 transition hover:border-[color:var(--bs-terracotta)] sm:p-5", className)}>
          {body}
        </Card>
      </button>
    );
  }

  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      {body}
    </Card>
  );
}
