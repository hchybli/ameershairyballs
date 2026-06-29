import type { ScrubResult } from "./flag.ts";

export interface ParsedClaimLine {
  cdtCode: string;
  feeBilled: number;
  feeAllowed: number | null;
  tooth: string | null;
  quadrant: string | null;
}

export interface ParsedClaim {
  externalClaimId: string;
  patientRef: string;
  payerName: string;
  lines: ParsedClaimLine[];
}

export interface CsvParseResult {
  claims: ParsedClaim[];
  errors: string[];
  rowCount: number;
}

export interface StoredClaim {
  externalClaimId: string;
  patientRef: string;
  payerName: string;
  lines: ParsedClaimLine[];
  scrub: ScrubResult;
  autoFixes: string[];
  ingestedAt: string;
}

export interface QueueRow {
  externalClaimId: string;
  patientRef: string;
  payerName: string;
  feeTotal: number;
  dollarImpactAtRisk: number;
  /** dollarImpactAtRisk × severity weight — higher = work first */
  priorityScore: number;
  flagsOpen: number;
  topFlagType: string | null;
  topFlagReason: string | null;
  topSeverity: string | null;
  ingestedAt: string;
}
