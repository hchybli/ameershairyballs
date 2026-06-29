/**
 * Live click-through: same HTTP path as operator/owner SPAs (edge functions + RLS).
 * Usage: npx tsx --env-file=.env --test scripts/clickthrough.test.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test, before } from "node:test";
import { createBrowserClient, isBrowserClientConfigured } from "../packages/db/src/client.ts";
import { fetchWorkQueue } from "../packages/handlers/src/read-models.ts";
import { runSeed } from "./seed-synthetic.ts";

const ROOT = process.cwd();
const CLAIMS_CSV = join(ROOT, "data/synthetic/sample-claims.csv");
const OUTCOMES_CSV = join(ROOT, "data/synthetic/sample-outcomes.csv");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

const CREDENTIALS = {
  operator: { email: "operator@demo.backstop.local", password: "demo-operator-2026!" },
  owner: { email: "owner@demo.backstop.local", password: "demo-owner-2026!" },
};

function skipIfNoEnv(): boolean {
  return !isBrowserClientConfigured() || !SUPABASE_URL || !ANON_KEY;
}

async function signIn(email: string, password: string) {
  const client = createBrowserClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message}`);
  }
  return { client, session: data.session, user: data.user };
}

async function callEdge(accessToken: string, name: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("apikey", ANON_KEY);
  return fetch(`${SUPABASE_URL}/functions/v1/${name}`, { ...init, headers });
}

describe("click-through (live edge + RLS)", { skip: skipIfNoEnv() }, () => {
  let operatorClinicId = "";

  before(async () => {
    await runSeed();
  });

  test("CORS: browser-origin requests get ACAO on auth errors", async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/analytics-kpi`, {
      method: "GET",
      headers: {
        Origin: "http://localhost:5173",
        apikey: ANON_KEY,
      },
    });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
  });

  test("operator: upload claims → work queue shows flagged claims", async () => {
    const { client, session, user } = await signIn(
      CREDENTIALS.operator.email,
      CREDENTIALS.operator.password,
    );
    const meta = user.app_metadata as { clinic_id?: string };
    operatorClinicId = meta.clinic_id ?? "";
    assert.ok(operatorClinicId, "operator missing clinic_id in app_metadata");

    const queueBefore = await fetchWorkQueue(client);
    console.log("  work queue before upload:", queueBefore.length, "claim(s)");

    const body = new FormData();
    body.append("file", new Blob([readFileSync(CLAIMS_CSV)], { type: "text/csv" }), "sample-claims.csv");
    body.append("clinic_id", operatorClinicId);

    const res = await callEdge(session.access_token, "ingest-claims", { method: "POST", body });
    const data = await res.json();
    console.log("  ingest-claims status:", res.status, "body:", JSON.stringify(data));

    assert.equal(res.status, 200, data.error ?? `HTTP ${res.status}`);
    assert.equal(data.claims_ingested, 3, data.message);
    assert.equal(data.flags_found, 6, `expected 6 scrub flags, got: ${JSON.stringify(data)}`);
    assert.ok(data.flags_open >= 4, `expected >=4 open flags, got ${data.flags_open}: ${data.message}`);
    assert.ok(data.claims_on_queue >= 2, data.message);

    const queueAfter = await fetchWorkQueue(client);
    console.log(
      "  work queue after upload:",
      queueAfter.length,
      "claim(s):",
      queueAfter.map((r) => r.externalClaimId).join(", "),
    );

    assert.ok(queueAfter.length >= 2, `work queue empty after upload (got ${queueAfter.length})`);
    const ids = new Set(queueAfter.map((r) => r.externalClaimId));
    assert.ok(ids.has("SYN-CLM-002"), "queue must include SYN-CLM-002");
    assert.ok(ids.has("SYN-CLM-003"), "queue must include SYN-CLM-003");

    await client.auth.signOut();
  });

  test("owner: dashboard KPI loads; outcomes upload is idempotent with clear message", async () => {
    const { client, session } = await signIn(CREDENTIALS.owner.email, CREDENTIALS.owner.password);

    const kpiRes = await callEdge(session.access_token, "analytics-kpi");
    const kpi = await kpiRes.json();
    console.log("  analytics-kpi status:", kpiRes.status);

    assert.equal(kpiRes.status, 200, kpi.error ?? `HTTP ${kpiRes.status}`);
    assert.ok(kpi.claimsIngested >= 5, `claimsIngested=${kpi.claimsIngested}`);
    assert.ok(kpi.outcomesRecorded >= 5, `outcomesRecorded=${kpi.outcomesRecorded}`);
    assert.ok(typeof kpi.cleanClaimRate === "number");
    assert.ok(Array.isArray(kpi.payerScorecards) && kpi.payerScorecards.length > 0);

    const body = new FormData();
    body.append(
      "file",
      new Blob([readFileSync(OUTCOMES_CSV)], { type: "text/csv" }),
      "sample-outcomes.csv",
    );

    const outRes = await callEdge(session.access_token, "ingest-outcomes", { method: "POST", body });
    const outData = await outRes.json();
    console.log("  ingest-outcomes status:", outRes.status, "body:", JSON.stringify(outData));

    assert.equal(outRes.status, 200, outData.error ?? `HTTP ${outRes.status}`);
    assert.ok(outData.outcomes_total >= 5, outData.message);
    assert.match(outData.message ?? "", /total outcome/i);

    const kpiRes2 = await callEdge(session.access_token, "analytics-kpi");
    assert.equal(kpiRes2.status, 200);
    const kpi2 = await kpiRes2.json();
    assert.equal(kpi2.outcomesRecorded, kpi.outcomesRecorded, "KPI outcomes should unchanged on idempotent upload");

    await client.auth.signOut();
  });

  test("operator: eligibility + denial agents on SYN-CLM-003", async () => {
    const { session } = await signIn(CREDENTIALS.operator.email, CREDENTIALS.operator.password);

    const eligRes = await callEdge(session.access_token, "check-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_ref: "SYN-PAT-003",
        payer_name: "Cigna Dental",
        external_claim_id: "SYN-CLM-003",
        procedure_codes: ["D2950", "D2740"],
      }),
    });
    const elig = await eligRes.json();
    console.log("  check-eligibility status:", eligRes.status);
    assert.equal(eligRes.status, 200, elig.error ?? `HTTP ${eligRes.status}`);
    assert.ok(
      elig.active === true && Array.isArray(elig.alerts) && elig.alerts.length > 0,
      JSON.stringify(elig),
    );

    const predictRes = await callEdge(session.access_token, "predict-denial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        external_claim_id: "SYN-CLM-003",
        payer_name: "Cigna Dental",
        lines: [
          { line_index: 0, cdt_code: "D2950", fee_billed: 350 },
          { line_index: 1, cdt_code: "D2740", fee_billed: 1200 },
        ],
      }),
    });
    const predict = await predictRes.json();
    console.log("  predict-denial status:", predictRes.status);
    assert.equal(predictRes.status, 200, predict.error ?? `HTTP ${predictRes.status}`);
    assert.ok(Array.isArray(predict.lines) && predict.lines.length > 0, JSON.stringify(predict));
  });
});

describe("click-through (env missing)", { skip: !skipIfNoEnv() }, () => {
  test("skipped", () => assert.ok(true));
});
