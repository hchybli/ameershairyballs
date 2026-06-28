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
    assert.equal(before.events, 12);
    assert.equal(before.claims_current, 6);
    assert.equal(before.outcomes, 6);

    await replay(db);

    const after = await fetchTableCounts(db);
    assert.deepEqual(after, before);

    const events = await loadAllEvents(db);
    assert.equal(events.length, 12);
    const types = events.reduce(
      (acc, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    assert.equal(types["claim.ingested"], 6);
    assert.equal(types["outcome.received"], 6);
  });

  test("double seed produces no duplicate events", async () => {
    const db = createServiceClient();
    const first = await fetchTableCounts(db);
    await runSeed();
    const second = await fetchTableCounts(db);
    assert.deepEqual(second, first);
  });
});
