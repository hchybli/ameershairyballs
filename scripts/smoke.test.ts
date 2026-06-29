/**
 * Headless synthetic E2E smoke — same handler path as deployed edge functions.
 * Requires live Supabase (.env). Skipped when not configured.
 *
 * Usage: npm run smoke
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test, before } from "node:test";
import { parseClaimsCsv } from "../packages/integrations/src/adapters/csv-dentrix.ts";
import { parseOutcomesCsv } from "../packages/integrations/src/adapters/csv-835.ts";
import { scrubClaims } from "../packages/agents/src/scrub/engine.ts";
import {
  handleAnalyticsKpi,
  handleIngestClaims,
  handleIngestOutcomes,
  fetchWorkQueue,
} from "../packages/handlers/src/index.ts";
import { createServiceClient, isServiceClientConfigured } from "../packages/db/src/server.ts";
import { createBrowserClient, isBrowserClientConfigured } from "../packages/db/src/client.ts";
import { runSeed } from "./seed-synthetic.ts";
import { loadAllEvents } from "../packages/events/src/emit.ts";

const ROOT = process.cwd();
const CLAIMS_CSV = join(ROOT, "data/synthetic/sample-claims.csv");
const OUTCOMES_CSV = join(ROOT, "data/synthetic/sample-outcomes.csv");

const SUNRISE_CLAIM_IDS = ["SYN-CLM-001", "SYN-CLM-002", "SYN-CLM-003"] as const;
const LAKESIDE_CLAIM_IDS = ["SYN-CLM-L01", "SYN-CLM-L02"] as const;

const CREDENTIALS = {
  operator: { email: "operator@demo.backstop.local", password: "demo-operator-2026!" },
  owner: { email: "owner@demo.backstop.local", password: "demo-owner-2026!" },
};

function skipIfNoEnv(): boolean {
  return !isServiceClientConfigured() || !isBrowserClientConfigured();
}

async function signIn(email: string, password: string) {
  const client = createBrowserClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  }
  return client;
}

function flagSignature(externalClaimId: string, lineIndex: number, type: string, cdtCode: string): string {
  return `${externalClaimId}:${lineIndex}:${type}:${cdtCode}`;
}

describe("smoke — synthetic E2E (live handlers + RLS)", { skip: skipIfNoEnv() }, () => {
  let tenantId = "";
  let sunriseClinicId = "";
  let ownerUserId = "";
  let operatorUserId = "";

  before(async () => {
    await runSeed();

    const db = createServiceClient();
    const { data: tenant } = await db
      .from("tenants")
      .select("id")
      .eq("name", "Synthetic Demo Tenant")
      .single();
    if (!tenant) throw new Error("Seed tenant missing — run npm run seed");

    tenantId = tenant.id;

    const { data: clinic } = await db
      .from("clinics")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", "Sunrise Dental")
      .single();
    if (!clinic) throw new Error("Sunrise clinic missing — run npm run seed");

    sunriseClinicId = clinic.id;

    const { data: users, error } = await db.auth.admin.listUsers();
    if (error) throw error;

    const owner = users.users.find((u) => u.email === CREDENTIALS.owner.email);
    const operator = users.users.find((u) => u.email === CREDENTIALS.operator.email);
    if (!owner || !operator) throw new Error("Seed users missing — run npm run seed");

    ownerUserId = owner.id;
    operatorUserId = operator.id;
  });

  test("adapter: sample-claims.csv → 3 claims, 6 scrub flags", () => {
    const parsed = parseClaimsCsv(readFileSync(CLAIMS_CSV, "utf8"));
    assert.equal(parsed.errors.length, 0, parsed.errors.join("; "));
    assert.equal(parsed.claims.length, 3);

    const { flags } = scrubClaims(parsed.claims);
    assert.equal(flags.length, 6);
    assert.equal(flags.filter((f) => f.externalClaimId === "SYN-CLM-001").length, 0);

    const clm2 = flags.filter((f) => f.externalClaimId === "SYN-CLM-002");
    assert.equal(clm2.length, 2);
    assert.ok(clm2.some((f) => f.type === "audit_risk" && f.cdtCode === "D4341"));
    assert.ok(clm2.some((f) => f.type === "missing_attachment" && f.cdtCode === "D4341"));

    const clm3 = flags.filter((f) => f.externalClaimId === "SYN-CLM-003");
    assert.equal(clm3.length, 4);
    for (const code of ["D2950", "D2740"] as const) {
      assert.ok(clm3.some((f) => f.type === "audit_risk" && f.cdtCode === code));
      assert.ok(clm3.some((f) => f.type === "missing_attachment" && f.cdtCode === code));
    }
  });

  test("handler: ingest-claims + replay → sunrise flags (ingest-claims EF path)", async () => {
    const db = createServiceClient();
    const csv = readFileSync(CLAIMS_CSV, "utf8");
    const auth = {
      userId: operatorUserId,
      tenantId,
      clinicId: sunriseClinicId,
      role: "operator" as const,
    };

    const parsed = parseClaimsCsv(csv);
    const expectedFlags = scrubClaims(parsed.claims).flags;

    const ingest = await handleIngestClaims(db, auth, { csvText: csv, clinicId: sunriseClinicId });
    assert.equal(ingest.ok, true, !ingest.ok ? ingest.error : undefined);
    if (ingest.ok) {
      assert.equal(ingest.data.claims_ingested, 3);
      assert.equal(ingest.data.errors.length, 0);
      assert.equal(ingest.data.flags_found, expectedFlags.length);
      assert.ok(ingest.data.flags_open >= 4, `expected open flags on queue (got ${ingest.data.flags_open})`);
      assert.ok(ingest.data.claims_on_queue >= 2);
    }

    const events = await loadAllEvents(db);
    const raised = events.filter(
      (e) =>
        e.type === "flag.raised" &&
        typeof e.payload.external_claim_id === "string" &&
        (SUNRISE_CLAIM_IDS as readonly string[]).includes(e.payload.external_claim_id),
    );
    assert.equal(
      raised.length,
      expectedFlags.length,
      `expected ${expectedFlags.length} flag.raised events for Sunrise claims`,
    );

    const { data: openFlags, error } = await db
      .from("flags_open")
      .select("flag_type, cdt_code, line_index, claims_current!inner(external_claim_id, clinic_id)")
      .eq("tenant_id", tenantId)
      .eq("claims_current.clinic_id", sunriseClinicId);

    assert.equal(error, null, error?.message);
    assert.ok(
      (openFlags?.length ?? 0) >= 4,
      `expected at least 4 open flags on Sunrise claims (got ${openFlags?.length ?? 0})`,
    );

    const openSigs = new Set(
      (openFlags ?? []).map((row) => {
        const claim = row.claims_current as { external_claim_id: string };
        return flagSignature(
          claim.external_claim_id,
          row.line_index ?? 0,
          row.flag_type,
          row.cdt_code,
        );
      }),
    );

    for (const claimId of ["SYN-CLM-002", "SYN-CLM-003"] as const) {
      assert.ok(
        [...openSigs].some((sig) => sig.startsWith(`${claimId}:`)),
        `expected open flags on ${claimId}`,
      );
    }

    assert.ok(openSigs.has(flagSignature("SYN-CLM-002", 0, "audit_risk", "D4341")));
    assert.ok(openSigs.has(flagSignature("SYN-CLM-002", 0, "missing_attachment", "D4341")));
    assert.ok(openSigs.has(flagSignature("SYN-CLM-003", 0, "audit_risk", "D2950")));
    assert.ok(openSigs.has(flagSignature("SYN-CLM-003", 1, "audit_risk", "D2740")));
  });

  test("handler: idempotent re-upload keeps work queue populated", async () => {
    const db = createServiceClient();
    const csv = readFileSync(CLAIMS_CSV, "utf8");
    const auth = {
      userId: operatorUserId,
      tenantId,
      clinicId: sunriseClinicId,
      role: "operator" as const,
    };

    const first = await handleIngestClaims(db, auth, { csvText: csv, clinicId: sunriseClinicId });
    assert.equal(first.ok, true, !first.ok ? first.error : undefined);
    const openBefore = first.ok ? first.data.flags_open : 0;
    assert.ok(openBefore >= 4, `expected open flags before re-upload (got ${openBefore})`);

    const second = await handleIngestClaims(db, auth, { csvText: csv, clinicId: sunriseClinicId });
    assert.equal(second.ok, true, !second.ok ? second.error : undefined);
    if (second.ok) {
      assert.equal(second.data.flags_raised, 0, "re-upload should not create duplicate flag events");
      assert.equal(second.data.flags_found, 6);
      assert.equal(second.data.flags_open, openBefore, "re-upload must rebuild read models, not leave queue empty");
    }

    const client = await signIn(CREDENTIALS.operator.email, CREDENTIALS.operator.password);
    const queue = await fetchWorkQueue(client);
    assert.ok(queue.length >= 2, `operator queue must show flagged claims (got ${queue.length})`);
    await client.auth.signOut();
  });

  test("RLS: operator work queue is Sunrise-only (no Lakeside / tenant B)", async () => {
    const client = await signIn(CREDENTIALS.operator.email, CREDENTIALS.operator.password);
    const queue = await fetchWorkQueue(client);
    const visibleClaimIds = new Set(queue.map((row) => row.externalClaimId));

    for (const id of SUNRISE_CLAIM_IDS) {
      if (id === "SYN-CLM-001") continue;
      assert.ok(visibleClaimIds.has(id), `operator queue must include flagged claim ${id}`);
    }
    assert.equal(visibleClaimIds.has("SYN-CLM-001"), false);

    for (const id of LAKESIDE_CLAIM_IDS) {
      assert.equal(visibleClaimIds.has(id), false, `operator must not see lakeside claim ${id}`);
    }

    const { data: claims, error } = await client.from("claims_current").select("external_claim_id");
    assert.equal(error, null, error?.message);
    const allVisible = new Set((claims ?? []).map((r) => r.external_claim_id));
    for (const id of SUNRISE_CLAIM_IDS) {
      assert.ok(allVisible.has(id), `operator must see sunrise claim ${id}`);
    }
    for (const id of LAKESIDE_CLAIM_IDS) {
      assert.equal(allVisible.has(id), false, `operator must not see lakeside claim ${id}`);
    }

    await client.auth.signOut();
  });

  test("adapter + handler: sample-outcomes.csv includes SYN-CLM-003 downcode", async () => {
    const parsed = parseOutcomesCsv(readFileSync(OUTCOMES_CSV, "utf8"));
    assert.equal(parsed.errors.length, 0);
    const downcoded = parsed.outcomes.find((o) => o.externalClaimId === "SYN-CLM-003");
    assert.equal(downcoded?.result, "downcoded");
    assert.equal(downcoded?.paidAmount, 850);
    assert.equal(downcoded?.remarkCode, "CO-45");

    const db = createServiceClient();
    const ingest = await handleIngestOutcomes(db, {
      userId: ownerUserId,
      tenantId,
      clinicId: sunriseClinicId,
      role: "owner",
    }, readFileSync(OUTCOMES_CSV, "utf8"));

    assert.equal(ingest.ok, true, !ingest.ok ? ingest.error : undefined);
    if (ingest.ok) {
      assert.equal(ingest.data.outcomes_in_file, parsed.outcomes.length);
      assert.ok(ingest.data.outcomes_total >= parsed.outcomes.length);
    }

    const { data: rows, error } = await db
      .from("outcomes")
      .select("result, paid_amount, remark_code, claims_current!inner(external_claim_id)")
      .eq("tenant_id", tenantId)
      .eq("claims_current.external_claim_id", "SYN-CLM-003");

    assert.equal(error, null, error?.message);
    assert.equal(rows?.length, 1);
    assert.equal(rows?.[0]?.result, "downcoded");
    assert.equal(Number(rows?.[0]?.paid_amount), 850);
    assert.equal(rows?.[0]?.remark_code, "CO-45");
  });

  test("handler: owner analytics-kpi payer scorecards (analytics-kpi EF path)", async () => {
    const db = createServiceClient();
    const kpi = await handleAnalyticsKpi(db, {
      userId: ownerUserId,
      tenantId,
      clinicId: sunriseClinicId,
      role: "owner",
    });

    assert.equal(kpi.metric, "clean_claim_rate");
    assert.ok(kpi.claimsIngested >= 5);
    assert.equal(kpi.outcomesRecorded, 5);
    assert.equal(kpi.outcomesDenied, 2);
    assert.equal(kpi.denialRate, 40);

    const cards = new Map(kpi.payerScorecards.map((c) => [c.payerName, c]));

    const delta = cards.get("Delta Dental");
    assert.ok(delta);
    assert.equal(delta.sampleSize, 2);
    assert.equal(delta.denialRate, 0);
    assert.equal(delta.downcodeFrequency, 0);

    const metlife = cards.get("MetLife Dental");
    assert.ok(metlife);
    assert.equal(metlife.sampleSize, 1);
    assert.equal(metlife.denialRate, 100);
    assert.ok(metlife.topDenialReasons.includes("CO-97"));

    const cigna = cards.get("Cigna Dental");
    assert.ok(cigna);
    assert.equal(cigna.sampleSize, 2);
    assert.equal(cigna.downcodeFrequency, 100);
    assert.ok(cigna.topDenialReasons.includes("CO-45"));

    const aetna = cards.get("Aetna Dental");
    assert.ok(aetna);
    assert.equal(aetna.sampleSize, 1);
    assert.equal(aetna.denialRate, 0);

    const guardian = cards.get("Guardian");
    assert.ok(guardian);
    assert.equal(guardian.sampleSize, 1);
    assert.equal(guardian.denialRate, 100);
    assert.ok(guardian.topDenialReasons.includes("CO-50"));
  });
});

describe("smoke (env missing)", { skip: !skipIfNoEnv() }, () => {
  test("skipped — configure .env with Supabase keys", () => {
    assert.ok(true);
  });
});
