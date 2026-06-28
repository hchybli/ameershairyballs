/**
 * Synthetic seed — no real PHI.
 * Idempotent: safe to re-run (deterministic event ids + dedupe keys).
 *
 * Shape:
 * - Tenant A "Synthetic Demo Tenant": Sunrise Dental + Lakeside Dental
 * - Owner sees both clinics; operator assigned to Sunrise only
 * - Tenant B "Synthetic Isolation Tenant": Ridge Dental (cross-tenant RLS tests)
 *
 * Usage: npm run seed
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createServiceClient } from "../packages/db/src/server.ts";
import { parseClaimsCsv } from "../packages/integrations/src/adapters/csv-dentrix.ts";
import {
  BillingEventType,
  claimIngestedDedupeKey,
  emit,
  outcomeReceivedDedupeKey,
  replay,
} from "../packages/events/src/index.ts";
import type { ServiceClient } from "./seed-lib.ts";

const ROOT = resolve(import.meta.dirname ?? ".", "..");

const CREDENTIALS = {
  owner: { email: "owner@demo.backstop.local", password: "demo-owner-2026!" },
  operator: { email: "operator@demo.backstop.local", password: "demo-operator-2026!" },
  isolationOperator: {
    email: "operator@isolation.backstop.local",
    password: "demo-isolation-2026!",
  },
};

const TENANT_A = {
  name: "Synthetic Demo Tenant",
  clinics: [
    {
      name: "Sunrise Dental",
      slug: "sunrise",
      pmsType: "dentrix",
      claimsFile: "data/synthetic/sample-claims.csv",
      outcomesFile: "data/synthetic/sample-outcomes.csv",
    },
    {
      name: "Lakeside Dental",
      slug: "lakeside",
      pmsType: "dentrix",
      claimsFile: "data/synthetic/sample-claims-lakeside.csv",
      outcomesFile: "data/synthetic/sample-outcomes-lakeside.csv",
    },
  ],
};

const TENANT_B = {
  name: "Synthetic Isolation Tenant",
  clinics: [
    {
      name: "Ridge Dental",
      slug: "ridge",
      pmsType: "dentrix",
      claimsFile: "data/synthetic/sample-claims-isolation.csv",
      outcomesFile: "data/synthetic/sample-outcomes-isolation.csv",
    },
  ],
};

function loadFixture(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function parseOutcomesCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const result = cols[idx.result]?.trim() as "paid" | "denied" | "downcoded";
    return {
      external_claim_id: cols[idx.external_claim_id]?.trim() ?? "",
      result,
      paid_amount: Number(cols[idx.paid_amount]?.trim() ?? 0),
      remark_code: cols[idx.remark_code]?.trim() || null,
      remark_text: cols[idx.remark_text]?.trim() || null,
      received_at: "2026-06-28T12:00:00.000Z",
    };
  });
}

async function ensureTenant(db: ServiceClient, name: string): Promise<string> {
  const { data: existing } = await db.from("tenants").select("id").eq("name", name).maybeSingle();
  if (existing) {
    return existing.id;
  }

  const { data, error } = await db.from("tenants").insert({ name }).select("id").single();
  if (error || !data) {
    throw new Error(`Failed to create tenant ${name}: ${error?.message}`);
  }
  return data.id;
}

async function ensureClinic(
  db: ServiceClient,
  tenantId: string,
  name: string,
  pmsType: string,
): Promise<string> {
  const { data: existing } = await db
    .from("clinics")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await db
    .from("clinics")
    .insert({ tenant_id: tenantId, name, pms_type: pmsType })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create clinic ${name}: ${error?.message}`);
  }
  return data.id;
}

async function ensureAuthUser(
  db: ServiceClient,
  email: string,
  password: string,
  tenantId: string,
  primaryClinicId: string,
  role: "owner" | "operator",
): Promise<string> {
  const { data: listed, error: listError } = await db.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existing = listed.users.find((u) => u.email === email);
  if (existing) {
    const { error: updateError } = await db.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { tenant_id: tenantId, clinic_id: primaryClinicId, role },
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
    app_metadata: { tenant_id: tenantId, clinic_id: primaryClinicId, role },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create ${email}: ${error?.message}`);
  }

  return data.user.id;
}

async function ensureClinicMember(
  db: ServiceClient,
  userId: string,
  clinicId: string,
  role: string,
): Promise<void> {
  const { error } = await db.from("clinic_members").upsert(
    { user_id: userId, clinic_id: clinicId, role },
    { onConflict: "user_id,clinic_id" },
  );
  if (error) {
    throw new Error(`Failed to upsert clinic_member: ${error.message}`);
  }
}

async function seedClinicFixtures(
  db: ServiceClient,
  tenantId: string,
  clinicId: string,
  claimsFile: string,
  outcomesFile: string,
  actorId: string,
  outcomeActorId: string,
) {
  const claimsCsv = loadFixture(claimsFile);
  const parsed = parseClaimsCsv(claimsCsv);
  if (parsed.errors.length > 0) {
    throw new Error(`Claims CSV errors in ${claimsFile}: ${parsed.errors.join("; ")}`);
  }

  for (const claim of parsed.claims) {
    const dedupeKey = claimIngestedDedupeKey(tenantId, clinicId, claim.externalClaimId);
    const { created } = await emit(db, {
      tenantId,
      clinicId,
      type: BillingEventType.ClaimIngested,
      dedupeKey,
      actorId,
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
        source: "csv_dentrix",
        ingested_at: "2026-06-28T12:00:00.000Z",
      },
    });
    console.log(
      `  claim.ingested → ${claim.externalClaimId} (${created ? "created" : "skipped"})`,
    );
  }

  const outcomesCsv = loadFixture(outcomesFile);
  for (const row of parseOutcomesCsv(outcomesCsv)) {
    const dedupeKey = outcomeReceivedDedupeKey(tenantId, row.external_claim_id);
    const { created } = await emit(db, {
      tenantId,
      clinicId,
      type: BillingEventType.OutcomeReceived,
      dedupeKey,
      actorId: outcomeActorId,
      payload: {
        external_claim_id: row.external_claim_id,
        result: row.result,
        paid_amount: row.paid_amount,
        remark_code: row.remark_code,
        remark_text: row.remark_text,
        received_at: row.received_at,
      },
    });
    console.log(
      `  outcome.received → ${row.external_claim_id} (${row.result}, ${created ? "created" : "skipped"})`,
    );
  }
}

export async function runSeed(): Promise<void> {
  const db = createServiceClient();

  console.log("Seeding synthetic tenants (idempotent)…\n");

  // ── Tenant A: two clinics ───────────────────────────────────────────────────
  const tenantAId = await ensureTenant(db, TENANT_A.name);
  const clinicIds: Record<string, string> = {};

  for (const clinic of TENANT_A.clinics) {
    clinicIds[clinic.slug] = await ensureClinic(db, tenantAId, clinic.name, clinic.pmsType);
  }

  const ownerId = await ensureAuthUser(
    db,
    CREDENTIALS.owner.email,
    CREDENTIALS.owner.password,
    tenantAId,
    clinicIds.sunrise,
    "owner",
  );
  const operatorId = await ensureAuthUser(
    db,
    CREDENTIALS.operator.email,
    CREDENTIALS.operator.password,
    tenantAId,
    clinicIds.sunrise,
    "operator",
  );

  // Owner: both clinics; operator: Sunrise only
  await ensureClinicMember(db, ownerId, clinicIds.sunrise, "owner");
  await ensureClinicMember(db, ownerId, clinicIds.lakeside, "owner");
  await ensureClinicMember(db, operatorId, clinicIds.sunrise, "operator");

  console.log(`Tenant A: ${TENANT_A.name} (${tenantAId})`);
  for (const clinic of TENANT_A.clinics) {
    console.log(`  Clinic: ${clinic.name} (${clinicIds[clinic.slug]})`);
    await seedClinicFixtures(
      db,
      tenantAId,
      clinicIds[clinic.slug],
      clinic.claimsFile,
      clinic.outcomesFile,
      operatorId,
      ownerId,
    );
  }

  // ── Tenant B: isolation tenant ──────────────────────────────────────────────
  const tenantBId = await ensureTenant(db, TENANT_B.name);
  const ridgeClinic = TENANT_B.clinics[0];
  const ridgeClinicId = await ensureClinic(db, tenantBId, ridgeClinic.name, ridgeClinic.pmsType);

  const isolationOperatorId = await ensureAuthUser(
    db,
    CREDENTIALS.isolationOperator.email,
    CREDENTIALS.isolationOperator.password,
    tenantBId,
    ridgeClinicId,
    "operator",
  );
  await ensureClinicMember(db, isolationOperatorId, ridgeClinicId, "operator");

  console.log(`\nTenant B: ${TENANT_B.name} (${tenantBId})`);
  console.log(`  Clinic: ${ridgeClinic.name} (${ridgeClinicId})`);
  await seedClinicFixtures(
    db,
    tenantBId,
    ridgeClinicId,
    ridgeClinic.claimsFile,
    ridgeClinic.outcomesFile,
    isolationOperatorId,
    isolationOperatorId,
  );

  console.log("\nSeed complete (synthetic only).");
  console.log(`  Owner:              ${CREDENTIALS.owner.email} / ${CREDENTIALS.owner.password}`);
  console.log(`  Operator (Sunrise): ${CREDENTIALS.operator.email} / ${CREDENTIALS.operator.password}`);
  console.log(
    `  Isolation operator: ${CREDENTIALS.isolationOperator.email} / ${CREDENTIALS.isolationOperator.password}`,
  );

  await replay(db);
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runSeed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
