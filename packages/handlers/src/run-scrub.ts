import { scrubClaimsWithAutoFix } from "@backstop/agents";
import type { ParsedClaim } from "@backstop/core";
import type { BackstopServiceClient } from "@backstop/db";
import { BillingEventType, emit, flagRaisedDedupeKey } from "@backstop/events";
import type { HandlerAuth } from "./types";

export interface RunScrubInput {
  claimIds: string[];
  useLlm?: boolean;
}

export async function handleRunScrub(
  db: BackstopServiceClient,
  auth: HandlerAuth,
  input: RunScrubInput,
): Promise<
  | { ok: true; data: { flags_raised: number; event_ids: string[] } }
  | { ok: false; status: number; error: string }
> {
  if (input.useLlm) {
    return { ok: false, status: 501, error: "LLM scrub not enabled in Phase 1." };
  }

  if (input.claimIds.length === 0) {
    return { ok: false, status: 400, error: "claim_ids required." };
  }

  const { data: claims, error } = await db
    .from("claims_current")
    .select("id, external_claim_id, patient_ref, payer_name, clinic_id")
    .eq("tenant_id", auth.tenantId)
    .in("id", input.claimIds);

  if (error || !claims?.length) {
    return { ok: false, status: 404, error: "Claims not found." };
  }

  const parsedClaims: ParsedClaim[] = [];

  for (const claim of claims) {
    const { data: lines, error: linesError } = await db
      .from("claim_lines_current")
      .select("line_index, cdt_code, fee_billed, fee_allowed, tooth, quadrant")
      .eq("claim_id", claim.id)
      .order("line_index");

    if (linesError) {
      return { ok: false, status: 500, error: linesError.message };
    }

    parsedClaims.push({
      externalClaimId: claim.external_claim_id,
      patientRef: claim.patient_ref,
      payerName: claim.payer_name,
      lines: (lines ?? []).map((line) => ({
        cdtCode: line.cdt_code,
        feeBilled: Number(line.fee_billed),
        feeAllowed: line.fee_allowed === null ? null : Number(line.fee_allowed),
        tooth: line.tooth,
        quadrant: line.quadrant,
      })),
    });
  }

  const { flags } = scrubClaimsWithAutoFix(parsedClaims);
  const eventIds: string[] = [];
  let flagsRaised = 0;

  for (const flag of flags) {
    const claim = claims.find((c) => c.external_claim_id === flag.externalClaimId);
    if (!claim) continue;

    const dedupeKey = flagRaisedDedupeKey(
      auth.tenantId,
      flag.externalClaimId,
      flag.lineIndex >= 0 ? flag.lineIndex : null,
      flag.type,
    );

    const result = await emit(db, {
      tenantId: auth.tenantId,
      clinicId: claim.clinic_id,
      type: BillingEventType.FlagRaised,
      actorId: auth.userId,
      dedupeKey,
      payload: {
        external_claim_id: flag.externalClaimId,
        line_index: flag.lineIndex >= 0 ? flag.lineIndex : null,
        cdt_code: flag.cdtCode,
        flag_type: flag.type,
        severity: flag.severity,
        dollar_impact: flag.dollarImpact,
        reason: flag.reason,
        suggested_fix: flag.suggestedFix ?? null,
        raised_by: "rules",
        rule_id: flag.type,
      },
    });

    if (result.created) {
      flagsRaised += 1;
    }
    eventIds.push(result.id);
  }

  return { ok: true, data: { flags_raised: flagsRaised, event_ids: eventIds } };
}
