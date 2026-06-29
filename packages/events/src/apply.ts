import type { BackstopServiceClient } from "@backstop/db";
import type { StoredEvent } from "./types.ts";
import { projectEvent } from "./projectors/index.ts";
import type { ProjectedState } from "./projectors/state.ts";
import { toStoredEvent } from "./projectors/state.ts";

const READ_MODEL_TABLES = [
  "claim_lines_current",
  "flags_open",
  "flags_resolved",
  "outcomes",
  "payer_intelligence",
  "eligibility_current",
  "claims_current",
] as const;

async function clearReadModels(db: BackstopServiceClient): Promise<void> {
  for (const table of READ_MODEL_TABLES) {
    if (table === "claim_lines_current") {
      const { error } = await db.from(table).delete().gte("line_index", 0);
      if (error) throw new Error(`clear ${table}: ${error.message}`);
    } else if (table === "eligibility_current") {
      const { error } = await db.from(table).delete().gte("patient_ref", "");
      if (error) throw new Error(`clear ${table}: ${error.message}`);
    } else {
      const { error } = await db.from(table).delete().gte("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw new Error(`clear ${table}: ${error.message}`);
    }
  }
}

async function writeProjectedState(db: BackstopServiceClient, state: ProjectedState): Promise<void> {
  for (const claim of state.claims.values()) {
    const { error } = await db.from("claims_current").upsert(
      {
        id: claim.id,
        tenant_id: claim.tenant_id,
        clinic_id: claim.clinic_id,
        external_claim_id: claim.external_claim_id,
        patient_ref: claim.patient_ref,
        payer_name: claim.payer_name,
        status: claim.status,
        last_event_id: claim.last_event_id,
        updated_at: claim.updated_at,
      },
      { onConflict: "tenant_id,external_claim_id" },
    );
    if (error) throw new Error(`write claim: ${error.message}`);
  }

  for (const [claimId, lines] of state.claimLines) {
    await db.from("claim_lines_current").delete().eq("claim_id", claimId);
    if (lines.length === 0) continue;
    const { error } = await db.from("claim_lines_current").insert(lines);
    if (error) throw new Error(`write claim lines: ${error.message}`);
  }

  if (state.flagsOpen.size > 0) {
    const { error } = await db.from("flags_open").insert(Array.from(state.flagsOpen.values()));
    if (error) throw new Error(`write flags_open: ${error.message}`);
  }

  if (state.flagsResolved.length > 0) {
    const { error } = await db.from("flags_resolved").insert(state.flagsResolved);
    if (error) throw new Error(`write flags_resolved: ${error.message}`);
  }

  if (state.outcomes.length > 0) {
    const { error } = await db.from("outcomes").insert(state.outcomes);
    if (error) throw new Error(`write outcomes: ${error.message}`);
  }

  for (const intel of state.payerIntelligence.values()) {
    const { error } = await db.from("payer_intelligence").upsert(
      {
        tenant_id: intel.tenant_id,
        payer_name: intel.payer_name,
        cdt_code: intel.cdt_code,
        sample_size: intel.sample_size,
        paid_count: intel.paid_count,
        denied_count: intel.denied_count,
        downcoded_count: intel.downcoded_count,
        avg_paid_amount: intel.avg_paid_amount,
        common_remark_codes: intel.common_remark_codes,
        prediction_count: intel.prediction_count,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,payer_name,cdt_code" },
    );
    if (error) throw new Error(`write payer_intelligence: ${error.message}`);
  }

  for (const row of state.eligibility.values()) {
    const { error } = await db.from("eligibility_current").upsert(
      {
        id: row.id,
        tenant_id: row.tenant_id,
        clinic_id: row.clinic_id,
        patient_ref: row.patient_ref,
        payer_name: row.payer_name,
        active: row.active,
        checked_at: row.checked_at,
        annual_max_remaining: row.annual_max_remaining,
        deductible_remaining: row.deductible_remaining,
        breakdown: JSON.parse(JSON.stringify(row.breakdown)),
        alerts: row.alerts,
        source_event_id: row.source_event_id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,clinic_id,patient_ref,payer_name" },
    );
    if (error) throw new Error(`write eligibility_current: ${error.message}`);
  }
}

export async function applyProjectedState(
  db: BackstopServiceClient,
  state: ProjectedState,
): Promise<void> {
  await clearReadModels(db);
  await writeProjectedState(db, state);
}

/** Incremental apply after a single new event (used by emit). */
export async function applySingleEventProjection(
  db: BackstopServiceClient,
  _event: StoredEvent,
): Promise<void> {
  const { data: allEvents, error } = await db
    .from("events")
    .select("id, tenant_id, type, payload, actor_id, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`load events for projection: ${error.message}`);

  const { foldEvents } = await import("./projectors/index.ts");
  const state = foldEvents(
    (allEvents ?? []).map((row) =>
      toStoredEvent({ ...row, payload: row.payload as Record<string, unknown> }),
    ),
  );

  await applyProjectedState(db, state);
}

export { clearReadModels, writeProjectedState };
