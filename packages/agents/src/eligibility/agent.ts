import type { EligibilityAdapter } from "@backstop/integrations";
import { SyntheticOnederfulAdapter } from "@backstop/integrations";
import type { BackstopServiceClient } from "@backstop/db";
import { eligibilityCheckedDedupeKey, replay } from "@backstop/events";
import { emitEventTool, raiseFlagTool, type ToolContext } from "@backstop/tools";
import { analyzeEligibility, type EligibilityAlert } from "./analyze.ts";

export const ELIGIBILITY_AGENT_ID = "eligibility_agent";

export interface RunEligibilityInput {
  patientRef: string;
  payerName: string;
  externalClaimId?: string;
  procedureCodes?: string[];
  adapter?: EligibilityAdapter;
}

export interface EligibilityRunResult {
  breakdown: Awaited<ReturnType<EligibilityAdapter["check"]>>;
  alerts: EligibilityAlert[];
  event_id: string;
  flags_raised: number;
}

export async function runEligibilityAgent(
  db: BackstopServiceClient,
  auth: { tenantId: string; clinicId: string; userId: string | null },
  input: RunEligibilityInput,
): Promise<EligibilityRunResult> {
  const adapter = input.adapter ?? new SyntheticOnederfulAdapter();
  const breakdown = await adapter.check({
    patientRef: input.patientRef,
    payerName: input.payerName,
    procedureCodes: input.procedureCodes,
  });
  const alerts = analyzeEligibility(breakdown, input.procedureCodes ?? []);
  const checkedAt = new Date().toISOString();

  const ctx: ToolContext = {
    db,
    tenantId: auth.tenantId,
    clinicId: auth.clinicId,
    actorId: auth.userId,
    agentId: ELIGIBILITY_AGENT_ID,
  };

  const dedupeKey = eligibilityCheckedDedupeKey(
    auth.tenantId,
    auth.clinicId,
    input.patientRef,
    input.payerName,
  );

  const emitResult = await emitEventTool.execute(ctx, {
    type: "eligibility.checked",
    dedupe_key: dedupeKey,
    payload: {
      patient_ref: input.patientRef,
      payer_name: input.payerName,
      external_claim_id: input.externalClaimId ?? null,
      active: breakdown.active,
      annual_max: breakdown.annual_max,
      annual_max_remaining: breakdown.annual_max_remaining,
      deductible: breakdown.deductible,
      deductible_remaining: breakdown.deductible_remaining,
      coverage_by_category: breakdown.coverage_by_category,
      frequency_limits: breakdown.frequency_limits,
      waiting_periods: breakdown.waiting_periods,
      cob: breakdown.cob,
      network_status: breakdown.network_status,
      alerts: alerts.map((a) => a.code),
      source: adapter.name,
      checked_at: checkedAt,
    },
  });

  let flagsRaised = 0;
  if (input.externalClaimId) {
    for (const alert of alerts) {
      const flagResult = await raiseFlagTool.execute(ctx, {
        external_claim_id: input.externalClaimId,
        line_index: null,
        cdt_code: alert.procedure ?? null,
        flag_type: alert.code,
        severity: alert.severity,
        dollar_impact: null,
        reason: alert.message,
        suggested_fix: "Resolve coverage issue before proceeding with treatment.",
        raised_by: ELIGIBILITY_AGENT_ID,
        rule_id: alert.code,
      });
      if (flagResult.created) {
        flagsRaised += 1;
      }
    }
  }

  await replay(db);

  return {
    breakdown,
    alerts,
    event_id: emitResult.event_id,
    flags_raised: flagsRaised,
  };
}
