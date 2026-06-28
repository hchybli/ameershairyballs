import { scrubClaimsWithAutoFix } from "@backstop/agents";
import type { BackstopServiceClient } from "@backstop/db";
import {
  BillingEventType,
  claimIngestedDedupeKey,
  emit,
  flagRaisedDedupeKey,
} from "@backstop/events";
import { parseClaimsCsv } from "@backstop/integrations";
import { assertClinicAccess } from "./clinic-access";
import type { HandlerAuth } from "./types";

export interface IngestClaimsInput {
  csvText: string;
  clinicId: string;
}

export interface IngestClaimsResult {
  claims_ingested: number;
  lines_ingested: number;
  flags_raised: number;
  event_ids: string[];
  errors: string[];
  message: string;
}

export async function handleIngestClaims(
  db: BackstopServiceClient,
  auth: HandlerAuth,
  input: IngestClaimsInput,
): Promise<{ ok: true; data: IngestClaimsResult } | { ok: false; status: number; error: string; errors?: string[] }> {
  const access = await assertClinicAccess(db, auth, input.clinicId);
  if (!access.ok) {
    return { ok: false, status: 403, error: access.error };
  }

  const parsed = parseClaimsCsv(input.csvText);
  if (parsed.claims.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "No valid claims parsed.",
      errors: parsed.errors,
    };
  }

  const eventIds: string[] = [];
  const ingestedAt = new Date().toISOString();

  for (const claim of parsed.claims) {
    const dedupeKey = claimIngestedDedupeKey(auth.tenantId, input.clinicId, claim.externalClaimId);
    const result = await emit(db, {
      tenantId: auth.tenantId,
      clinicId: input.clinicId,
      type: BillingEventType.ClaimIngested,
      actorId: auth.userId,
      dedupeKey,
      payload: {
        external_claim_id: claim.externalClaimId,
        patient_ref: claim.patientRef,
        payer_name: claim.payerName,
        lines: claim.lines.map((line) => ({
          cdt_code: line.cdtCode,
          fee_billed: line.feeBilled,
          fee_allowed: line.feeAllowed,
          tooth: line.tooth,
          quadrant: line.quadrant,
        })),
        source: "csv_upload",
        ingested_at: ingestedAt,
      },
    });
    eventIds.push(result.id);
  }

  const { flags, claims: fixedClaims } = scrubClaimsWithAutoFix(parsed.claims);
  let flagsRaised = 0;

  for (const flag of flags) {
    const dedupeKey = flagRaisedDedupeKey(
      auth.tenantId,
      flag.externalClaimId,
      flag.lineIndex >= 0 ? flag.lineIndex : null,
      flag.type,
    );
    const result = await emit(db, {
      tenantId: auth.tenantId,
      clinicId: input.clinicId,
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

  const linesIngested = fixedClaims.reduce((sum, claim) => sum + claim.lines.length, 0);

  return {
    ok: true,
    data: {
      claims_ingested: parsed.claims.length,
      lines_ingested: linesIngested,
      flags_raised: flagsRaised,
      event_ids: eventIds,
      errors: parsed.errors,
      message: `Ingested ${parsed.claims.length} claim(s), ${flagsRaised} flag(s) raised.`,
    },
  };
}
