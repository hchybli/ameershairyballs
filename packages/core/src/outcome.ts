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

export interface StoredOutcome extends ParsedOutcome {
  observedAt: string;
}
