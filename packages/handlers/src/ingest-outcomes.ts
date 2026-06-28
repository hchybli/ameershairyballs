import type { BackstopServiceClient } from "@backstop/db";
import { BillingEventType, emit, outcomeReceivedDedupeKey } from "@backstop/events";
import { parseOutcomesCsv } from "@backstop/integrations";
import type { HandlerAuth } from "./types.js";

export interface IngestOutcomesResult {
  outcomes_recorded: number;
  intelligence_rows_updated: number;
  warnings: string[];
  errors: string[];
  message: string;
}

export async function handleIngestOutcomes(
  db: BackstopServiceClient,
  auth: HandlerAuth,
  csvText: string,
): Promise<
  | { ok: true; data: IngestOutcomesResult }
  | { ok: false; status: number; error: string; errors?: string[] }
> {
  const parsed = parseOutcomesCsv(csvText);
  if (parsed.outcomes.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "No valid outcomes parsed.",
      errors: parsed.errors,
    };
  }

  const { data: claims } = await db
    .from("claims_current")
    .select("external_claim_id, clinic_id")
    .eq("tenant_id", auth.tenantId);

  const claimByExternal = new Map(
    (claims ?? []).map((row) => [row.external_claim_id, row.clinic_id] as const),
  );

  const warnings: string[] = [];
  if (claimByExternal.size === 0) {
    warnings.push("No claims ingested yet — ingest claims first.");
  }

  let outcomesRecorded = 0;
  const receivedAt = new Date().toISOString();

  for (const outcome of parsed.outcomes) {
    if (claimByExternal.size > 0 && !claimByExternal.has(outcome.externalClaimId)) {
      warnings.push(`Outcome for ${outcome.externalClaimId} has no matching claim.`);
    }

    const clinicId = claimByExternal.get(outcome.externalClaimId) ?? auth.clinicId;
    const dedupeKey = outcomeReceivedDedupeKey(auth.tenantId, outcome.externalClaimId);

    const result = await emit(db, {
      tenantId: auth.tenantId,
      clinicId,
      type: BillingEventType.OutcomeReceived,
      actorId: auth.userId,
      dedupeKey,
      payload: {
        external_claim_id: outcome.externalClaimId,
        result: outcome.result,
        paid_amount: outcome.paidAmount,
        remark_code: outcome.remarkCode,
        remark_text: outcome.remarkText,
        received_at: receivedAt,
      },
    });

    if (result.created) {
      outcomesRecorded += 1;
    }
  }

  const { count } = await db
    .from("payer_intelligence")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", auth.tenantId);

  return {
    ok: true,
    data: {
      outcomes_recorded: outcomesRecorded,
      intelligence_rows_updated: count ?? 0,
      warnings,
      errors: parsed.errors,
      message: `Recorded ${outcomesRecorded} outcome(s).`,
    },
  };
}
