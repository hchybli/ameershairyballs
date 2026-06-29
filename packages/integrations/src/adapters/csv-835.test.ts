import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseOutcomesCsv } from "./csv-835.ts";

describe("parseOutcomesCsv", () => {
  it("parses the synthetic sample outcomes CSV", () => {
    const csv = readFileSync(
      join(process.cwd(), "data/synthetic/sample-outcomes.csv"),
      "utf8",
    );
    const result = parseOutcomesCsv(csv);

    assert.equal(result.errors.length, 0);
    assert.equal(result.outcomes.length, 3);
    assert.equal(result.outcomes[0]?.result, "paid");
    assert.equal(result.outcomes[1]?.result, "denied");
    assert.equal(result.outcomes[2]?.result, "downcoded");
  });

  it("rejects invalid result values", () => {
    const csv = `external_claim_id,result,paid_amount
SYN-1,partial,100`;
    const result = parseOutcomesCsv(csv);
    assert.equal(result.outcomes.length, 0);
    assert.ok(result.errors.length > 0);
  });
});
