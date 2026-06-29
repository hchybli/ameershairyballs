import { useState } from "react";
import type { ClaimFlag } from "@backstop/core";
import { cn } from "../cn";
import { Button } from "./Button";
import { SeverityBadge } from "./SeverityBadge";

export interface FlagCardProps {
  flag: ClaimFlag;
  onApprove: (id: string) => void;
  onFix?: (id: string) => void;
  onOverride: (id: string, reason: string) => void;
  actionsDisabled?: boolean;
}

export function FlagCard({ flag, onApprove, onFix, onOverride, actionsDisabled = false }: FlagCardProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState("");
  const resolved = flag.status !== "open";

  if (resolved) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={flag.severity} />
          <span className="line-through">{flag.type.replace(/_/g, " ")}</span>
          <span>— {flag.status}</span>
          {flag.overrideReason && <span className="text-xs">({flag.overrideReason})</span>}
        </div>
      </div>
    );
  }

  const canFix = Boolean(flag.suggestedFix && onFix);

  return (
    <div className="rounded-xl border border-border bg-white p-4 text-sm shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={flag.severity} />
            <span className="font-semibold text-[color:var(--bs-navy)]">
              {flag.type.replace(/_/g, " ")}
            </span>
            {flag.lineIndex >= 0 && (
              <span className="text-muted-foreground">· {flag.cdtCode}</span>
            )}
            {flag.dollarImpact != null && flag.dollarImpact > 0 && (
              <span className="tabular-nums font-medium text-[color:var(--bs-terracotta)]">
                ${flag.dollarImpact.toFixed(0)} at risk
              </span>
            )}
          </div>
          <p className="leading-relaxed">{flag.reason}</p>
          {flag.suggestedFix && (
            <p className="rounded-md bg-[color:var(--bs-surface)] px-3 py-2 text-xs text-muted-foreground">
              Suggested fix: {flag.suggestedFix}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canFix && (
            <Button variant="primary" disabled={actionsDisabled} onClick={() => onFix!(flag.id)}>
              Apply fix
            </Button>
          )}
          <Button variant="secondary" disabled={actionsDisabled} onClick={() => onApprove(flag.id)}>
            Approve
          </Button>
          <Button variant="ghost" disabled={actionsDisabled} onClick={() => setShowOverride(true)}>
            Override…
          </Button>
        </div>
      </div>

      {showOverride && (
        <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 p-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reason (required)
          </label>
          <textarea
            className="w-full rounded-md border bg-white p-2 text-sm"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Attachment sent via portal…"
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              disabled={actionsDisabled || !reason.trim()}
              onClick={() => {
                onOverride(flag.id, reason.trim());
                setShowOverride(false);
              }}
            >
              Confirm override
            </Button>
            <Button variant="ghost" onClick={() => setShowOverride(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
