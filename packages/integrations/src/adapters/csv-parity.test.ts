import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseClaimsCsv as legacyParseClaimsCsv } from "../../../../src/lib/csv/parse-claims-csv.ts";
import { parseOutcomesCsv as legacyParseOutcomesCsv } from "../../../../src/lib/csv/parse-outcomes-csv.ts";
import { parseClaimsCsv } from "./csv-dentrix.ts";
import { parseOutcomesCsv } from "./csv-835.ts";

describe("CSV parser parity (legacy vs @backstop/integrations)", () => {
  it("parseClaimsCsv matches legacy on synthetic sample", () => {
    const csv = readFileSync(
      join(process.cwd(), "data/synthetic/sample-claims.csv"),
      "utf8",
    );

    const legacy = legacyParseClaimsCsv(csv);
    const ported = parseClaimsCsv(csv);

    assert.deepEqual(ported, legacy);
  });

  it("parseOutcomesCsv matches legacy on synthetic sample", () => {
    const csv = readFileSync(
      join(process.cwd(), "data/synthetic/sample-outcomes.csv"),
      "utf8",
    );

    const legacy = legacyParseOutcomesCsv(csv);
    const ported = parseOutcomesCsv(csv);

    assert.deepEqual(ported, legacy);
  });
});
