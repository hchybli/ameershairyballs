import { createHash } from "node:crypto";
import type { createServiceClient } from "../packages/db/src/server.ts";

export type ServiceClient = ReturnType<typeof createServiceClient>;

/** Deterministic UUID v5-style id from a natural dedupe key (append-only safe). */
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

export interface EmitEventResult {
  id: string;
  created: boolean;
}

/** Insert event once; re-runs with the same dedupe key are no-ops. */
export async function emitEventIdempotent(
  db: ServiceClient,
  args: {
    tenantId: string;
    type: string;
    dedupeKey: string;
    payload: Record<string, unknown>;
    actorId: string | null;
  },
): Promise<EmitEventResult> {
  const id = deterministicEventId(args.dedupeKey);
  const payload = {
    ...args.payload,
    dedupe_key: args.dedupeKey,
    event_schema_version: 1,
  };

  const { data: existing, error: lookupError } = await db
    .from("events")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Event lookup failed (${args.dedupeKey}): ${lookupError.message}`);
  }

  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data, error } = await db
    .from("events")
    .insert({
      id,
      tenant_id: args.tenantId,
      type: args.type,
      payload,
      actor_id: args.actorId,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Event insert failed (${args.dedupeKey}): ${error?.message}`);
  }

  return { id: data.id, created: true };
}

export interface TableCounts {
  tenants: number;
  clinics: number;
  clinic_members: number;
  events: number;
  claims_current: number;
  claim_lines_current: number;
  outcomes: number;
}

export async function fetchTableCounts(db: ServiceClient): Promise<TableCounts> {
  const tables = [
    "tenants",
    "clinics",
    "clinic_members",
    "events",
    "claims_current",
    "claim_lines_current",
    "outcomes",
  ] as const;

  const counts = {} as TableCounts;

  for (const table of tables) {
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
    if (error) {
      throw new Error(`Count failed for ${table}: ${error.message}`);
    }
    counts[table] = count ?? 0;
  }

  return counts;
}
