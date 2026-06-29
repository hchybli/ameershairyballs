import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { SYNTHETIC_ELIGIBILITY_FIXTURES } from "@backstop/integrations";
import { analyzeEligibility } from "./analyze.ts";

describe("eligibility analyze", () => {
  it("flags SYN-PAT-003 frequency + benefit exhausted (PT-1005 scenario)", () => {
    const breakdown = SYNTHETIC_ELIGIBILITY_FIXTURES["SYN-PAT-003|Cigna Dental"];
    const alerts = analyzeEligibility(breakdown, ["D1110"]);
    const codes = alerts.map((a) => a.code);
    assert.ok(codes.includes("eligibility_frequency_exceeded"));
    assert.ok(codes.includes("eligibility_benefit_exhausted"));
  });

  it("clean patient has no critical alerts", () => {
    const breakdown = SYNTHETIC_ELIGIBILITY_FIXTURES["SYN-PAT-001|Delta Dental"];
    const alerts = analyzeEligibility(breakdown, ["D1110"]);
    assert.equal(alerts.length, 0);
  });
});
