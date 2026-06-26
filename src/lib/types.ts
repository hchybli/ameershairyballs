/** Domain types for Backstop Stage 1 — dental billing */

export type {
  ClaimFlag,
  FlagSeverity,
  FlagType,
  ScrubResult,
} from "@/lib/rules/types";

import type { ScrubResult } from "@/lib/rules/types";

export type ClaimStatus =
  | "ingested"
  | "checking"
  | "ready"
  | "submitted"
  | "paid"
  | "denied";

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

export interface IngestResponse {
  mode: "preview" | "saved";
  clinicName: string;
  claimsIngested: number;
  linesIngested: number;
  claims: ParsedClaim[];
  errors: string[];
  message: string;
  scrub: ScrubResult;
  autoFixes: string[];
}
