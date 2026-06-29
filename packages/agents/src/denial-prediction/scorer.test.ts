import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import type { PayerIntelRow } from "@backstop/intelligence";
import { scoreDenialRisk } from "./scorer.ts";

const intel: PayerIntelRow[] = [
  {
    payerName: "MetLife Dental",
    cdtCode: "D4341",
    sampleSize: 10,
    paidCount: 2,
    deniedCount: 8,
    downcodedCount: 0,
    avgPaidAmount: 180,
    commonRemarkCodes: ["CO-97", "MISSING-ATTACH"],
    updatedAt: "2026-01-01",
  },
];

describe("denial prediction scorer", () => {
  it("scores high risk when payer denies CDT 80% of the time", () => {
    const result = scoreDenialRisk(
      "MetLife Dental",
      [{ lineIndex: 0, cdtCode: "D4341", feeBilled: 275 }],
      intel,
    );
    assert.equal(result.lines.length, 1);
    assert.ok(result.lines[0].riskScore >= 70);
    assert.match(result.lines[0].reasons[0], /80%/);
  });
});
