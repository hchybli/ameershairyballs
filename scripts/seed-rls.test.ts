/**
 * Integration tests: seed idempotency + tenant/clinic RLS isolation.
 * Requires live Supabase (.env) — skipped when not configured.
 *
 * Usage: npm run test:seed
 */
import { strict as assert } from "node:assert";
import { test, describe, before } from "node:test";
import { fetchTableCounts } from "./seed-lib.ts";
import { runSeed } from "./seed-synthetic.ts";
import { createServiceClient, isServiceClientConfigured } from "../packages/db/src/server.ts";
import { createBrowserClient, isBrowserClientConfigured } from "../packages/db/src/client.ts";

const CREDENTIALS = {
  owner: { email: "owner@demo.backstop.local", password: "demo-owner-2026!" },
  operator: { email: "operator@demo.backstop.local", password: "demo-operator-2026!" },
  isolationOperator: {
    email: "operator@isolation.backstop.local",
    password: "demo-isolation-2026!",
  },
};

const SUNRISE_CLAIM_IDS = new Set(["SYN-CLM-001", "SYN-CLM-002", "SYN-CLM-003"]);
const LAKESIDE_CLAIM_IDS = new Set(["SYN-CLM-L01", "SYN-CLM-L02"]);
const ISOLATION_CLAIM_IDS = new Set(["SYN-CLM-ISO-001"]);

function skipIfNoEnv(): boolean {
  return !isServiceClientConfigured() || !isBrowserClientConfigured();
}

async function signInClient(email: string, password: string) {
  const client = createBrowserClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  }
  return client;
}

async function fetchVisibleClaimIds(client: ReturnType<typeof createBrowserClient>) {
  const { data, error } = await client.from("claims_current").select("external_claim_id");
  if (error) {
    throw new Error(`claims_current query failed: ${error.message}`);
  }
  return new Set((data ?? []).map((row) => row.external_claim_id));
}

describe("WS-01b seed + RLS", { skip: skipIfNoEnv() }, () => {
  before(async () => {
    await runSeed();
  });

  test("re-running seed produces identical row counts (no duplicates)", async () => {
    const db = createServiceClient();
    const before = await fetchTableCounts(db);

    await runSeed();

    const after = await fetchTableCounts(db);
    assert.deepEqual(after, before, "table counts must be unchanged after second seed run");
  });

  test("tenant isolation: isolation operator cannot read tenant A claims", async () => {
    const client = await signInClient(
      CREDENTIALS.isolationOperator.email,
      CREDENTIALS.isolationOperator.password,
    );

    const visible = await fetchVisibleClaimIds(client);
    for (const id of SUNRISE_CLAIM_IDS) {
      assert.equal(visible.has(id), false, `isolation user must not see tenant A claim ${id}`);
    }
    for (const id of LAKESIDE_CLAIM_IDS) {
      assert.equal(visible.has(id), false, `isolation user must not see tenant A claim ${id}`);
    }

    assert.equal(visible.has("SYN-CLM-ISO-001"), true, "isolation user sees own tenant claim");
    await client.auth.signOut();
  });

  test("clinic isolation: sunrise operator cannot read lakeside claims in same tenant", async () => {
    const client = await signInClient(
      CREDENTIALS.operator.email,
      CREDENTIALS.operator.password,
    );

    const visible = await fetchVisibleClaimIds(client);
    for (const id of SUNRISE_CLAIM_IDS) {
      assert.equal(visible.has(id), true, `sunrise operator must see ${id}`);
    }
    for (const id of LAKESIDE_CLAIM_IDS) {
      assert.equal(visible.has(id), false, `sunrise operator must not see lakeside claim ${id}`);
    }

    await client.auth.signOut();
  });

  test("owner sees all clinics within tenant A", async () => {
    const client = await signInClient(CREDENTIALS.owner.email, CREDENTIALS.owner.password);

    const visible = await fetchVisibleClaimIds(client);
    for (const id of SUNRISE_CLAIM_IDS) {
      assert.equal(visible.has(id), true, `owner must see sunrise claim ${id}`);
    }
    for (const id of LAKESIDE_CLAIM_IDS) {
      assert.equal(visible.has(id), true, `owner must see lakeside claim ${id}`);
    }
    for (const id of ISOLATION_CLAIM_IDS) {
      assert.equal(visible.has(id), false, `owner must not see tenant B claim ${id}`);
    }

    await client.auth.signOut();
  });
});

describe("WS-01b seed + RLS (env missing)", { skip: !skipIfNoEnv() }, () => {
  test("skipped — configure .env with Supabase keys to run integration tests", () => {
    assert.ok(true);
  });
});
