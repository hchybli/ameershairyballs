import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildPayerScorecards } from "./scorecard.ts";
import type { PayerIntelRow } from "./types.ts";

describe("payer scorecards", () => {
  test("aggregates CDT rows per payer", () => {
    const rows: PayerIntelRow[] = [
      {
        payerName: "Delta Dental",
        cdtCode: "D1110",
        sampleSize: 10,
        paidCount: 7,
        deniedCount: 2,
        downcodedCount: 1,
        avgPaidAmount: 95,
        commonRemarkCodes: ["N130"],
        updatedAt: "2026-06-28T12:00:00Z",
      },
      {
        payerName: "Delta Dental",
        cdtCode: "D4341",
        sampleSize: 5,
        paidCount: 2,
        deniedCount: 3,
        downcodedCount: 0,
        avgPaidAmount: 180,
        commonRemarkCodes: ["N657", "N130"],
        updatedAt: "2026-06-28T12:00:00Z",
      },
    ];

    const cards = buildPayerScorecards(rows);
    assert.equal(cards.length, 1);
    assert.equal(cards[0]!.payerName, "Delta Dental");
    assert.equal(cards[0]!.sampleSize, 15);
    assert.equal(cards[0]!.denialRate, 33.3);
    assert.equal(cards[0]!.cdtCodesTracked, 2);
    assert.ok(cards[0]!.topDenialReasons.includes("N130"));
  });
});
