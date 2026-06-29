import { runDenialPredictionAgent } from "@backstop/agents";
import type { BackstopServiceClient } from "@backstop/db";
import type { HandlerAuth } from "./types.ts";

export interface PredictDenialInput {
  external_claim_id: string;
  payer_name: string;
  lines: Array<{ line_index: number; cdt_code: string; fee_billed: number }>;
}

export async function handlePredictDenial(
  db: BackstopServiceClient,
  auth: HandlerAuth,
  input: PredictDenialInput,
): Promise<
  | {
      ok: true;
      data: {
        claim_risk_score: number;
        lines: Array<{
          line_index: number;
          cdt_code: string;
          risk_score: number;
          denial_rate: number;
          reasons: string[];
          recommended_fix: string;
        }>;
        flags_raised: number;
        event_id: string;
      };
    }
  | { ok: false; status: number; error: string }
> {
  if (!input.external_claim_id || !input.payer_name || !input.lines?.length) {
    return {
      ok: false,
      status: 400,
      error: "external_claim_id, payer_name, and lines are required.",
    };
  }

  const result = await runDenialPredictionAgent(db, auth, {
    externalClaimId: input.external_claim_id,
    payerName: input.payer_name,
    lines: input.lines.map((line) => ({
      lineIndex: line.line_index,
      cdtCode: line.cdt_code,
      feeBilled: line.fee_billed,
    })),
  });

  return {
    ok: true,
    data: {
      claim_risk_score: result.claimRiskScore,
      lines: result.lines.map((line) => ({
        line_index: line.lineIndex,
        cdt_code: line.cdtCode,
        risk_score: line.riskScore,
        denial_rate: line.denialRate,
        reasons: line.reasons,
        recommended_fix: line.recommendedFix,
      })),
      flags_raised: result.flags_raised,
      event_id: result.event_id,
    },
  };
}
