import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildKpiBundle,
  computeDenialRate,
  computeDollarsRecovered,
  isClaimClean,
} from "./index.ts";
import type { StoredClaim } from "@backstop/core";

const baseClaim = (flags: StoredClaim["scrub"]["flags"]): StoredClaim => ({
  externalClaimId: "SYN-1",
  patientRef: "P1",
  payerName: "Delta",
  lines: [],
  scrub: {
    flags,
    summary: {
      claimsChecked: 1,
      linesChecked: 0,
      flagsOpen: flags.filter((f) => f.status === "open").length,
      highOrCritical: 0,
      estimatedDollarAtRisk: 0,
    },
  },
  autoFixes: [],
  ingestedAt: "2026-06-28T12:00:00Z",
});

describe("analytics KPI", () => {
  test("isClaimClean ignores low/medium open flags", () => {
    assert.equal(
      isClaimClean(
        baseClaim([
          {
            id: "f1",
            externalClaimId: "SYN-1",
            lineIndex: 0,
            cdtCode: "D1110",
            payerName: "Delta",
            type: "audit_risk",
            severity: "medium",
            dollarImpact: null,
            reason: "x",
            status: "open",
            autoFixable: false,
          },
        ]),
      ),
      true,
    );
  });

  test("denial rate and dollars recovered from outcomes", () => {
    const outcomes = [
      { result: "paid" as const, paidAmount: 100 },
      { result: "denied" as const, paidAmount: 0 },
      { result: "downcoded" as const, paidAmount: 80 },
    ];
    assert.deepEqual(computeDenialRate(outcomes), {
      denialRate: 33.3,
      outcomesRecorded: 3,
      outcomesDenied: 1,
    });
    assert.equal(computeDollarsRecovered(outcomes), 180);
  });

  test("buildKpiBundle merges claim and outcome metrics", () => {
    const bundle = buildKpiBundle(
      [baseClaim([])],
      [{ result: "paid", paidAmount: 250 }],
    );
    assert.equal(bundle.cleanClaimRate, 100);
    assert.equal(bundle.dollarsRecovered, 250);
    assert.equal(bundle.outcomesRecorded, 1);
  });
});
