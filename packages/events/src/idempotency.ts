import { createHash } from "node:crypto";

/** Deterministic UUID from a natural dedupe key (append-only safe). */
export function deterministicEventId(dedupeKey: string): string {
  const hash = createHash("sha256").update(`backstop:event:${dedupeKey}`).digest("hex");
  const variant = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${variant}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

export function claimIngestedDedupeKey(
  tenantId: string,
  clinicId: string,
  externalClaimId: string,
): string {
  return `${tenantId}:claim.ingested:${clinicId}:${externalClaimId}`;
}

export function outcomeReceivedDedupeKey(tenantId: string, externalClaimId: string): string {
  return `${tenantId}:outcome.received:${externalClaimId}`;
}

export function deterministicClaimId(tenantId: string, externalClaimId: string): string {
  return deterministicEventId(`${tenantId}:claim:${externalClaimId}`);
}

export function eligibilityCheckedDedupeKey(
  tenantId: string,
  clinicId: string,
  patientRef: string,
  payerName: string,
): string {
  return `${tenantId}:eligibility.checked:${clinicId}:${patientRef}:${payerName}`;
}

export function predictionScoredDedupeKey(tenantId: string, externalClaimId: string): string {
  return `${tenantId}:prediction.scored:${externalClaimId}`;
}

export function flagRaisedDedupeKey(
  tenantId: string,
  externalClaimId: string,
  lineIndex: number | null,
  flagType: string,
): string {
  return `${tenantId}:flag.raised:${externalClaimId}:${lineIndex ?? "claim"}:${flagType}`;
}
