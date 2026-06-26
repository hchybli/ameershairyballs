"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClaimFlag } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<ClaimFlag["severity"], string> = {
  low: "bg-slate-100 text-slate-800 border-slate-200",
  medium: "bg-amber-50 text-amber-900 border-amber-200",
  high: "bg-orange-50 text-orange-900 border-orange-200",
  critical: "bg-red-50 text-red-900 border-red-200",
};

interface ClaimFlagsPanelProps {
  flags: ClaimFlag[];
  autoFixes: string[];
  summary: {
    flagsOpen: number;
    highOrCritical: number;
    estimatedDollarAtRisk: number;
  };
}

export function ClaimFlagsPanel({ flags, autoFixes, summary }: ClaimFlagsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => flags.filter((f) => !dismissed.has(f.id)),
    [flags, dismissed],
  );

  function approve(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Open flags" value={String(visible.length)} />
        <Stat label="High / critical" value={String(summary.highOrCritical)} />
        <Stat
          label="Est. $ at risk"
          value={`$${summary.estimatedDollarAtRisk.toFixed(0)}`}
        />
      </div>

      {autoFixes.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          <p className="font-medium">Auto-fixed ({autoFixes.length})</p>
          <ul className="mt-1 list-inside list-disc text-xs">
            {autoFixes.map((fix) => (
              <li key={fix}>{fix}</li>
            ))}
          </ul>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
          No open flags — claim batch looks clean for pre-submission.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((flag) => (
            <li
              key={flag.id}
              className={cn(
                "rounded-lg border p-4 text-sm",
                SEVERITY_STYLES[flag.severity],
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-medium">
                    {flag.externalClaimId}
                    {flag.lineIndex >= 0 && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · line {flag.cdtCode}
                      </span>
                    )}
                  </p>
                  <p className="text-xs uppercase tracking-wide opacity-80">
                    {flag.type.replace(/_/g, " ")} · {flag.severity}
                    {flag.dollarImpact != null && ` · $${flag.dollarImpact.toFixed(0)}`}
                  </p>
                  <p>{flag.reason}</p>
                  {flag.suggestedFix && (
                    <p className="text-xs opacity-90">→ {flag.suggestedFix}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 bg-white/80"
                  onClick={() => approve(flag.id)}
                >
                  OK
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
