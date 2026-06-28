/**
 * Synthetic seed — no real PHI.
 * Creates demo tenant, clinic, owner + operator users, and loads fixtures via events.
 *
 * Usage: npm run seed
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServiceClient } from "../packages/db/src/server.ts";
import { parseClaimsCsv } from "../packages/integrations/src/adapters/csv-dentrix.ts";

const ROOT = resolve(import.meta.dirname ?? ".", "..");

const DEMO = {
  tenantName: "Synthetic Demo Tenant",
  clinicName: "Sunrise Dental (Synthetic)",
  pmsType: "dentrix",
  owner: {
    email: "owner@demo.backstop.local",
    password: "demo-owner-2026!",
    role: "owner" as const,
  },
  operator: {
    email: "operator@demo.backstop.local",
    password: "demo-operator-2026!",
    role: "operator" as const,
  },
};

interface ClaimIngestedPayload {
  event_schema_version: number;
  tenant_id: string;
  clinic_id: string;
  external_claim_id: string;
  patient_ref: string;
  payer_name: string;
  lines: Array<{
    cdt_code: string;
    fee_billed: number;
    fee_allowed: number | null;
    tooth: string | null;
    quadrant: string | null;
  }>;
  source: string;
  ingested_at: string;
}

interface OutcomeReceivedPayload {
  event_schema_version: number;
  tenant_id: string;
  external_claim_id: string;
  result: "paid" | "denied" | "downcoded";
  paid_amount: number;
  remark_code: string | null;
  remark_text: string | null;
  received_at: string;
}

function loadFixture(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function parseOutcomesCsv(csvText: string): OutcomeReceivedPayload[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const result = cols[idx.result]?.trim() as OutcomeReceivedPayload["result"];
    return {
      event_schema_version: 1,
      tenant_id: "",
      external_claim_id: cols[idx.external_claim_id]?.trim() ?? "",
      result,
      paid_amount: Number(cols[idx.paid_amount]?.trim() ?? 0),
      remark_code: cols[idx.remark_code]?.trim() || null,
      remark_text: cols[idx.remark_text]?.trim() || null,
      received_at: new Date().toISOString(),
    };
  });
}

async function projectClaimIngested(
  db: ReturnType<typeof createServiceClient>,
  tenantId: string,
  clinicId: string,
  eventId: string,
  payload: ClaimIngestedPayload,
) {
  const { data: claim, error: claimError } = await db
    .from("claims_current")
    .upsert(
      {
        tenant_id: tenantId,
        clinic_id: clinicId,
        external_claim_id: payload.external_claim_id,
        patient_ref: payload.patient_ref,
        payer_name: payload.payer_name,
        status: "ingested",
        last_event_id: eventId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,external_claim_id" },
    )
    .select("id")
    .single();

  if (claimError || !claim) {
    throw new Error(`Failed to project claim ${payload.external_claim_id}: ${claimError?.message}`);
  }

  await db.from("claim_lines_current").delete().eq("claim_id", claim.id);

  const lineRows = payload.lines.map((line, lineIndex) => ({
    claim_id: claim.id,
    line_index: lineIndex,
    cdt_code: line.cdt_code,
    fee_billed: line.fee_billed,
    fee_allowed: line.fee_allowed,
    tooth: line.tooth,
    quadrant: line.quadrant,
  }));

  const { error: linesError } = await db.from("claim_lines_current").insert(lineRows);
  if (linesError) {
    throw new Error(`Failed to project lines for ${payload.external_claim_id}: ${linesError.message}`);
  }

  return claim.id;
}

async function projectOutcomeReceived(
  db: ReturnType<typeof createServiceClient>,
  tenantId: string,
  eventId: string,
  payload: OutcomeReceivedPayload,
) {
  const { data: claim, error: claimLookupError } = await db
    .from("claims_current")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("external_claim_id", payload.external_claim_id)
    .maybeSingle();

  if (claimLookupError || !claim) {
    throw new Error(
      `Cannot project outcome for ${payload.external_claim_id}: ${claimLookupError?.message ?? "claim not found"}`,
    );
  }

  const { error } = await db.from("outcomes").insert({
    tenant_id: tenantId,
    claim_id: claim.id,
    result: payload.result,
    paid_amount: payload.paid_amount,
    remark_code: payload.remark_code,
    remark_text: payload.remark_text,
    source_event_id: eventId,
  });

  if (error) {
    throw new Error(`Failed to project outcome for ${payload.external_claim_id}: ${error.message}`);
  }
}

async function ensureAuthUser(
  db: ReturnType<typeof createServiceClient>,
  email: string,
  password: string,
  tenantId: string,
  clinicId: string,
  role: "owner" | "operator",
) {
  const { data: listed, error: listError } = await db.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existing = listed.users.find((u) => u.email === email);
  if (existing) {
    const { error: updateError } = await db.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { tenant_id: tenantId, clinic_id: clinicId, role },
    });
    if (updateError) {
      throw new Error(`Failed to update ${email}: ${updateError.message}`);
    }
    return existing.id;
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { tenant_id: tenantId, clinic_id: clinicId, role },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create ${email}: ${error?.message}`);
  }

  return data.user.id;
}

async function main() {
  const db = createServiceClient();

  console.log("Seeding synthetic demo tenant…");

  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .upsert({ name: DEMO.tenantName }, { onConflict: "id", ignoreDuplicates: false })
    .select("id")
    .maybeSingle();

  let tenantId = tenant?.id;

  if (!tenantId) {
    const { data: existingTenant } = await db
      .from("tenants")
      .select("id")
      .eq("name", DEMO.tenantName)
      .maybeSingle();
    tenantId = existingTenant?.id;
  }

  if (!tenantId) {
    const { data: inserted, error } = await db
      .from("tenants")
      .insert({ name: DEMO.tenantName })
      .select("id")
      .single();
    if (error || !inserted) {
      throw new Error(`Failed to create tenant: ${error?.message}`);
    }
    tenantId = inserted.id;
  }

  let { data: clinic } = await db
    .from("clinics")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", DEMO.clinicName)
    .maybeSingle();

  if (!clinic) {
    const { data: inserted, error } = await db
      .from("clinics")
      .insert({
        tenant_id: tenantId,
        name: DEMO.clinicName,
        pms_type: DEMO.pmsType,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      throw new Error(`Failed to create clinic: ${error?.message}`);
    }
    clinic = inserted;
  }

  const clinicId = clinic.id;

  const ownerId = await ensureAuthUser(
    db,
    DEMO.owner.email,
    DEMO.owner.password,
    tenantId,
    clinicId,
    DEMO.owner.role,
  );
  const operatorId = await ensureAuthUser(
    db,
    DEMO.operator.email,
    DEMO.operator.password,
    tenantId,
    clinicId,
    DEMO.operator.role,
  );

  await db.from("clinic_members").upsert(
    [
      { user_id: ownerId, clinic_id: clinicId, role: DEMO.owner.role },
      { user_id: operatorId, clinic_id: clinicId, role: DEMO.operator.role },
    ],
    { onConflict: "user_id,clinic_id" },
  );

  const claimsCsv = loadFixture("data/synthetic/sample-claims.csv");
  const parsed = parseClaimsCsv(claimsCsv);
  if (parsed.errors.length > 0) {
    throw new Error(`Claims CSV errors: ${parsed.errors.join("; ")}`);
  }

  for (const claim of parsed.claims) {
    const payload: ClaimIngestedPayload = {
      event_schema_version: 1,
      tenant_id: tenantId,
      clinic_id: clinicId,
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
      source: "csv_dentrix",
      ingested_at: new Date().toISOString(),
    };

    const { data: event, error: eventError } = await db
      .from("events")
      .insert({
        tenant_id: tenantId,
        type: "claim.ingested",
        payload,
        actor_id: operatorId,
      })
      .select("id")
      .single();

    if (eventError || !event) {
      throw new Error(`Failed to emit claim.ingested for ${claim.externalClaimId}: ${eventError?.message}`);
    }

    await projectClaimIngested(db, tenantId, clinicId, event.id, payload);
    console.log(`  claim.ingested → ${claim.externalClaimId}`);
  }

  const outcomesCsv = loadFixture("data/synthetic/sample-outcomes.csv");
  for (const row of parseOutcomesCsv(outcomesCsv)) {
    const payload: OutcomeReceivedPayload = { ...row, tenant_id: tenantId };
    const { data: event, error: eventError } = await db
      .from("events")
      .insert({
        tenant_id: tenantId,
        type: "outcome.received",
        payload,
        actor_id: ownerId,
      })
      .select("id")
      .single();

    if (eventError || !event) {
      throw new Error(`Failed to emit outcome.received for ${row.external_claim_id}: ${eventError?.message}`);
    }

    await projectOutcomeReceived(db, tenantId, event.id, payload);
    console.log(`  outcome.received → ${row.external_claim_id} (${row.result})`);
  }

  console.log("\nSeed complete (synthetic only).");
  console.log(`  Tenant:  ${tenantId}`);
  console.log(`  Clinic:  ${clinicId}`);
  console.log(`  Owner:   ${DEMO.owner.email} / ${DEMO.owner.password}`);
  console.log(`  Operator: ${DEMO.operator.email} / ${DEMO.operator.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
