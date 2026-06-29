import { runEligibilityAgent } from "@backstop/agents";
import type { BackstopServiceClient } from "@backstop/db";
import { replay } from "@backstop/events";
import type { HandlerAuth } from "./types.ts";

export interface CheckEligibilityInput {
  patient_ref: string;
  payer_name: string;
  external_claim_id?: string;
  procedure_codes?: string[];
}

export async function handleCheckEligibility(
  db: BackstopServiceClient,
  auth: HandlerAuth,
  input: CheckEligibilityInput,
): Promise<
  | {
      ok: true;
      data: {
        active: boolean;
        alerts: Array<{ code: string; severity: string; message: string }>;
        annual_max_remaining: number;
        deductible_remaining: number;
        coverage_summary: string | null;
        checked_at: string;
        flags_raised: number;
        event_id: string;
      };
    }
  | { ok: false; status: number; error: string }
> {
  if (!input.patient_ref || !input.payer_name) {
    return { ok: false, status: 400, error: "patient_ref and payer_name required." };
  }

  const result = await runEligibilityAgent(db, {
    tenantId: auth.tenantId,
    clinicId: auth.clinicId,
    userId: auth.userId,
  }, {
    patientRef: input.patient_ref,
    payerName: input.payer_name,
    externalClaimId: input.external_claim_id,
    procedureCodes: input.procedure_codes,
  });

  await replay(db);

  return {
    ok: true,
    data: {
      active: result.breakdown.active,
      alerts: result.alerts.map((a) => ({
        code: a.code,
        severity: a.severity,
        message: a.message,
      })),
      annual_max_remaining: result.breakdown.annual_max_remaining,
      deductible_remaining: result.breakdown.deductible_remaining,
      coverage_summary: Object.entries(result.breakdown.coverage_by_category)
        .slice(0, 2)
        .map(([cat, pct]) => `${cat} ${pct}%`)
        .join(" · ") || null,
      checked_at: new Date().toISOString(),
      flags_raised: result.flags_raised,
      event_id: result.event_id,
    },
  };
}
