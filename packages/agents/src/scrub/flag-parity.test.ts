import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ClaimFlag } from "@backstop/core";
import { parseClaimsCsv as legacyParseClaimsCsv } from "../../../../src/lib/csv/parse-claims-csv.ts";
import { scrubClaims as legacyScrubClaims } from "../../../../src/lib/rules/scrub-claim.ts";
import { parseClaimsCsv } from "@backstop/integrations";
import { scrubClaims } from "./engine.ts";

function flagSignature(flag: ClaimFlag): string {
  return [
    flag.id,
    flag.type,
    flag.externalClaimId,
    flag.lineIndex,
    flag.cdtCode,
    flag.severity,
    flag.dollarImpact ?? "",
    flag.reason,
  ].join("|");
}

function sortedSignatures(flags: ClaimFlag[]): string[] {
  return flags.map(flagSignature).sort();
}

describe("scrub flag parity (legacy vs @backstop/agents)", () => {
  it("produces identical flags on synthetic sample claims CSV", () => {
    const csv = readFileSync(
      join(process.cwd(), "data/synthetic/sample-claims.csv"),
      "utf8",
    );

    const legacy = legacyScrubClaims(legacyParseClaimsCsv(csv).claims);
    const ported = scrubClaims(parseClaimsCsv(csv).claims);

    assert.deepEqual(sortedSignatures(ported.flags), sortedSignatures(legacy.flags));
    assert.deepEqual(ported.summary, legacy.summary);
  });
});
