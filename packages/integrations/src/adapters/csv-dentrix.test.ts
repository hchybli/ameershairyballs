import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scrubClaims } from "../../../agents/src/scrub/engine.ts";
import { parseClaimsCsv } from "./csv-dentrix.ts";

const SAMPLE_CLAIMS = join(process.cwd(), "data/synthetic/sample-claims.csv");

describe("parseClaimsCsv", () => {
  it("parses the synthetic sample CSV into grouped claims", () => {
    const csv = readFileSync(SAMPLE_CLAIMS, "utf8");
    const result = parseClaimsCsv(csv);

    assert.equal(result.errors.length, 0);
    assert.equal(result.claims.length, 3);
    assert.equal(result.claims[0]?.lines.length, 2);
    assert.equal(result.claims[0]?.lines[0]?.cdtCode, "D1110");
  });

  it("smoke: sample-claims.csv yields 3 claims and expected scrub flags", () => {
    const csv = readFileSync(SAMPLE_CLAIMS, "utf8");
    const parsed = parseClaimsCsv(csv);

    assert.equal(parsed.errors.length, 0, parsed.errors.join("; "));
    assert.equal(parsed.claims.length, 3);
    assert.equal(parsed.rowCount, 5);

    const ids = parsed.claims.map((c) => c.externalClaimId).sort();
    assert.deepEqual(ids, ["SYN-CLM-001", "SYN-CLM-002", "SYN-CLM-003"]);

    const { flags } = scrubClaims(parsed.claims);
    assert.equal(flags.length, 6);

    assert.ok(flags.some((f) => f.externalClaimId === "SYN-CLM-002" && f.type === "audit_risk"));
    assert.ok(flags.some((f) => f.externalClaimId === "SYN-CLM-002" && f.type === "missing_attachment"));
    assert.ok(flags.some((f) => f.externalClaimId === "SYN-CLM-003" && f.cdtCode === "D2950"));
    assert.ok(flags.some((f) => f.externalClaimId === "SYN-CLM-003" && f.cdtCode === "D2740"));
    assert.equal(
      flags.filter((f) => f.externalClaimId === "SYN-CLM-001").length,
      0,
      "SYN-CLM-001 should be the cleaner prophy claim",
    );
  });

  it("skips a Dentrix export title row before the header", () => {
    const csv = `Dentrix Export Sheet
external_claim_id,patient_ref,payer_name,cdt_code,fee_billed,fee_allowed,tooth,quadrant
SYN-CLM-001,SYN-PAT-001,Delta Dental,D1110,125.00,95.00,,`;
    const result = parseClaimsCsv(csv);

    assert.equal(result.errors.length, 0);
    assert.equal(result.claims.length, 1);
    assert.equal(result.claims[0]?.externalClaimId, "SYN-CLM-001");
  });

  it("parses semicolon-delimited exports", () => {
    const csv = `external_claim_id;patient_ref;payer_name;cdt_code;fee_billed;fee_allowed;tooth;quadrant
SYN-CLM-001;SYN-PAT-001;Delta Dental;D1110;125.00;95.00;;`;
    const result = parseClaimsCsv(csv);

    assert.equal(result.errors.length, 0);
    assert.equal(result.claims.length, 1);
  });

  it("rejects invalid CDT codes", () => {
    const csv = `external_claim_id,patient_ref,payer_name,cdt_code,fee_billed
SYN-1,SYN-PAT-1,Delta,99213,100`;
    const result = parseClaimsCsv(csv);
    assert.ok(result.errors.some((e) => e.includes("invalid CDT")));
    assert.equal(result.claims.length, 0);
  });

  it("hints when an outcomes CSV is uploaded by mistake", () => {
    const csv = readFileSync(join(process.cwd(), "data/synthetic/sample-outcomes.csv"), "utf8");
    const result = parseClaimsCsv(csv);

    assert.equal(result.claims.length, 0);
    assert.ok(result.errors.some((e) => e.includes("outcomes CSV")));
  });
});
