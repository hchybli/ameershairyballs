/**
 * Integration: emit + replay against live Supabase.
 * Usage: npm run test:events
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createServiceClient, isServiceClientConfigured } from "../packages/db/src/server.ts";
import { replay, loadAllEvents } from "../packages/events/src/emit.ts";
import { fetchTableCounts } from "./seed-lib.ts";
import { runSeed } from "./seed-synthetic.ts";

const skip = !isServiceClientConfigured();

describe("WS-02 events spine (live)", { skip }, () => {
  test("replay reproduces clean baseline read models", async () => {
    const db = createServiceClient();
    await runSeed();

    const before = await fetchTableCounts(db);
    assert.ok(before.events >= 12);
    assert.ok(before.claims_current >= 6, `expected seeded claims (got ${before.claims_current})`);
    assert.ok(before.outcomes >= 6, `expected seeded outcomes (got ${before.outcomes})`);

    await replay(db);

    const after = await fetchTableCounts(db);
    assert.deepEqual(after, before);

    const { data: tenant } = await db
      .from("tenants")
      .select("id")
      .eq("name", "Synthetic Demo Tenant")
      .single();
    assert.ok(tenant);

    const events = await loadAllEvents(db);
    const demoEvents = events.filter((e) => e.tenant_id === tenant.id);
    assert.ok(demoEvents.length >= 12);
    const types = demoEvents.reduce(
      (acc, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    assert.ok(types["claim.ingested"] >= 5);
    assert.ok(types["outcome.received"] >= 5);
    assert.ok(types["flag.raised"] >= 6);
  });

  test("double seed produces no duplicate events", async () => {
    const db = createServiceClient();
    const first = await fetchTableCounts(db);
    await runSeed();
    const second = await fetchTableCounts(db);
    assert.deepEqual(second, first);
  });
});
