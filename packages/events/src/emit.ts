import type { BackstopServiceClient } from "@backstop/db";
import { deterministicEventId } from "./idempotency";
import type { EmitInput, EmitResult, StoredEvent } from "./types";
import { foldEvents, projectEvent } from "./projectors/index";
import { applyProjectedState, applySingleEventProjection } from "./apply";
import { toStoredEvent } from "./projectors/state";

export async function emit(db: BackstopServiceClient, input: EmitInput): Promise<EmitResult> {
  const dedupeKey = input.dedupeKey;
  const id = dedupeKey ? deterministicEventId(dedupeKey) : crypto.randomUUID();
  const payload = {
    ...input.payload,
    clinic_id: input.clinicId,
    tenant_id: input.tenantId,
    event_schema_version: 1,
    ...(dedupeKey ? { dedupe_key: dedupeKey } : {}),
  };

  if (dedupeKey) {
    const { data: existing } = await db.from("events").select("id").eq("id", id).maybeSingle();
    if (existing) {
      return { id: existing.id, created: false };
    }
  }

  const { data, error } = await db
    .from("events")
    .insert({
      id,
      tenant_id: input.tenantId,
      type: input.type,
      payload,
      actor_id: input.actorId ?? null,
    })
    .select("id, tenant_id, type, payload, actor_id, created_at")
    .single();

  if (error || !data) {
    throw new Error(`emit failed (${input.type}): ${error?.message}`);
  }

  const stored = toStoredEvent({
    ...data,
    payload: data.payload as Record<string, unknown>,
  });

  await applySingleEventProjection(db, stored);

  return { id: data.id, created: true };
}

export async function loadAllEvents(db: BackstopServiceClient): Promise<StoredEvent[]> {
  const { data, error } = await db
    .from("events")
    .select("id, tenant_id, type, payload, actor_id, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`loadAllEvents failed: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    toStoredEvent({ ...row, payload: row.payload as Record<string, unknown> }),
  );
}

/** Rebuild ALL read models from the append-only log. */
export async function replay(db: BackstopServiceClient): Promise<void> {
  const events = await loadAllEvents(db);
  const state = foldEvents(events);
  await applyProjectedState(db, state);
}

/** Rebuild read models for events related to one claim (by external_claim_id or claim uuid). */
export async function deriveState(
  db: BackstopServiceClient,
  tenantId: string,
  entityId: string,
): Promise<ReturnType<typeof foldEvents>> {
  const events = await loadAllEvents(db);
  const related = events.filter((e) => {
    const p = e.payload;
    if (p.claim_id === entityId) return true;
    if (p.external_claim_id === entityId && p.tenant_id === tenantId) return true;
    if (e.tenant_id !== tenantId) return false;
    return false;
  });

  return foldEvents(related);
}

export { projectEvent, foldEvents } from "./projectors/index";
