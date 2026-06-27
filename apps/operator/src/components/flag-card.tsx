import { useState } from "react";
import type { ClaimFlag } from "../types";
import { SeverityBadge } from "./ui";

interface FlagCardProps {
  flag: ClaimFlag;
  onApprove: (id: string) => void;
  onOverride: (id: string, reason: string) => void;
}

export function FlagCard({ flag, onApprove, onOverride }: FlagCardProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState("");
  const resolved = flag.status !== "open";

  if (resolved) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={flag.severity} />
          <span className="line-through">{flag.type.replace(/_/g, " ")}</span>
          <span>— {flag.status}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={flag.severity} />
            <span className="font-medium">{flag.type.replace(/_/g, " ")}</span>
            {flag.lineIndex >= 0 && (
              <span className="text-muted-foreground">· {flag.cdtCode}</span>
            )}
          </div>
          <p>{flag.reason}</p>
          {flag.suggestedFix && (
            <p className="text-xs text-muted-foreground">→ {flag.suggestedFix}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onApprove(flag.id)}
            className="min-h-11 rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setShowOverride(true)}
            className="min-h-11 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Override…
          </button>
        </div>
      </div>

      {showOverride && (
        <div className="mt-4 space-y-2 rounded-md border bg-muted/30 p-3">
          <label className="block text-xs font-medium">Reason (required)</label>
          <textarea
            className="w-full rounded-md border bg-white p-2 text-sm"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Attachment sent via portal…"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!reason.trim()}
              onClick={() => {
                onOverride(flag.id, reason.trim());
                setShowOverride(false);
              }}
              className="rounded-md bg-foreground px-3 py-2 text-sm text-background disabled:opacity-40"
            >
              Confirm override
            </button>
            <button
              type="button"
              onClick={() => setShowOverride(false)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
