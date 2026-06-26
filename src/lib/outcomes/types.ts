/** Parsed payer response (835/ERA simplified for Phase 2a — synthetic CSV, not full X12 yet). */

export type OutcomeResult = "paid" | "denied" | "downcoded";

export interface ParsedOutcome {
  externalClaimId: string;
  result: OutcomeResult;
  paidAmount: number;
  remarkCode: string | null;
  remarkText: string | null;
}

export interface OutcomeParseResult {
  outcomes: ParsedOutcome[];
  errors: string[];
  rowCount: number;
}

export interface OutcomeIngestResponse {
  outcomesIngested: number;
  errors: string[];
  warnings: string[];
  message: string;
}
