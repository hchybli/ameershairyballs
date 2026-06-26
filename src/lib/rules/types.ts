/** Claim scrubbing types — Phase 1a/1b */

export type FlagSeverity = "low" | "medium" | "high" | "critical";

export type FlagType =
  | "deprecated_cdt"
  | "missing_tooth"
  | "missing_quadrant"
  | "audit_risk"
  | "missing_attachment"
  | "fee_leakage"
  | "perio_prophy_conflict";

export type FlagStatus = "open" | "approved" | "dismissed";

export type AttachmentKind = "radiograph" | "perio_chart" | "narrative";

export interface ClaimFlag {
  id: string;
  externalClaimId: string;
  lineIndex: number;
  cdtCode: string;
  payerName: string;
  type: FlagType;
  severity: FlagSeverity;
  dollarImpact: number | null;
  reason: string;
  status: FlagStatus;
  autoFixable: boolean;
  suggestedFix?: string;
}

export interface ScrubSummary {
  claimsChecked: number;
  linesChecked: number;
  flagsOpen: number;
  highOrCritical: number;
  estimatedDollarAtRisk: number;
}

export interface ScrubResult {
  flags: ClaimFlag[];
  summary: ScrubSummary;
}
