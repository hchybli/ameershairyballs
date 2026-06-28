import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseClaimsCsv } from "./csv-dentrix.js";

describe("parseClaimsCsv", () => {
  it("parses the synthetic sample CSV into grouped claims", () => {
    const csv = readFileSync(
      join(process.cwd(), "data/synthetic/sample-claims.csv"),
      "utf8",
    );
    const result = parseClaimsCsv(csv);

    assert.equal(result.errors.length, 0);
    assert.equal(result.claims.length, 3);
    assert.equal(result.claims[0]?.lines.length, 2);
    assert.equal(result.claims[0]?.lines[0]?.cdtCode, "D1110");
  });

  it("rejects invalid CDT codes", () => {
    const csv = `external_claim_id,patient_ref,payer_name,cdt_code,fee_billed
SYN-1,SYN-PAT-1,Delta,99213,100`;
    const result = parseClaimsCsv(csv);
    assert.ok(result.errors.some((e) => e.includes("invalid CDT")));
    assert.equal(result.claims.length, 0);
  });
});
