import { readPayerIntelligence } from "@backstop/intelligence";
import type { BackstopServiceClient } from "@backstop/db";
import { predictionScoredDedupeKey } from "@backstop/events";
import { emitEventTool, raiseFlagTool, type ToolContext } from "@backstop/tools";
import { scoreDenialRisk } from "./scorer.ts";

export const DENIAL_PREDICTION_AGENT_ID = "denial_prediction_agent";

export interface RunDenialPredictionInput {
  externalClaimId: string;
  payerName: string;
  lines: Array<{ lineIndex: number; cdtCode: string; feeBilled: number }>;
}

export async function runDenialPredictionAgent(
  db: BackstopServiceClient,
  auth: { tenantId: string; clinicId: string; userId: string | null },
  input: RunDenialPredictionInput,
) {
  const intel = await readPayerIntelligence(db, auth.tenantId);
  const scored = scoreDenialRisk(input.payerName, input.lines, intel);
  const checkedAt = new Date().toISOString();

  const ctx: ToolContext = {
    db,
    tenantId: auth.tenantId,
    clinicId: auth.clinicId,
    actorId: auth.userId,
    agentId: DENIAL_PREDICTION_AGENT_ID,
  };

  const emitResult = await emitEventTool.execute(ctx, {
    type: "prediction.scored",
    dedupe_key: predictionScoredDedupeKey(auth.tenantId, input.externalClaimId),
    payload: {
      external_claim_id: input.externalClaimId,
      payer_name: input.payerName,
      claim_risk_score: scored.claimRiskScore,
      lines: scored.lines.map((line) => ({
        line_index: line.lineIndex,
        cdt_code: line.cdtCode,
        risk_score: line.riskScore,
        denial_rate: line.denialRate,
        sample_size: line.sampleSize,
        reasons: line.reasons,
        recommended_fix: line.recommendedFix,
      })),
      scored_at: checkedAt,
    },
  });

  let flagsRaised = 0;
  for (const line of scored.lines) {
    const flagResult = await raiseFlagTool.execute(ctx, {
      external_claim_id: input.externalClaimId,
      line_index: line.lineIndex,
      cdt_code: line.cdtCode,
      flag_type: "denial_risk",
      severity: line.riskScore >= 70 ? "high" : "medium",
      dollar_impact: null,
      reason: line.reasons.join(" "),
      suggested_fix: line.recommendedFix,
      raised_by: DENIAL_PREDICTION_AGENT_ID,
      rule_id: `moat.${line.cdtCode}`,
    });
    if (flagResult.created) {
      flagsRaised += 1;
    }
  }

  return {
    ...scored,
    event_id: emitResult.event_id,
    flags_raised: flagsRaised,
  };
}
