export interface ClaimFlag {
  id: string;
  externalClaimId: string;
  lineIndex: number;
  cdtCode: string;
  payerName: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  dollarImpact: number | null;
  reason: string;
  status: string;
  suggestedFix?: string;
}

export interface QueueRow {
  externalClaimId: string;
  patientRef: string;
  payerName: string;
  feeTotal: number;
  flagsOpen: number;
  topFlagType: string | null;
  topFlagReason: string | null;
  topSeverity: string | null;
  ingestedAt: string;
}

export interface StoredClaim {
  externalClaimId: string;
  patientRef: string;
  payerName: string;
  lines: Array<{
    cdtCode: string;
    feeBilled: number;
    tooth: string | null;
    quadrant: string | null;
  }>;
  scrub: {
    flags: ClaimFlag[];
    summary: {
      flagsOpen: number;
      highOrCritical: number;
      estimatedDollarAtRisk: number;
    };
  };
  autoFixes: string[];
}
