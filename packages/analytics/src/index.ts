import type { StoredClaim } from "@backstop/core";

const HIGH_SEVERITIES = new Set(["high", "critical"]);

export interface OutcomeRow {
  result: "paid" | "denied" | "downcoded";
  paidAmount: number;
  externalClaimId?: string;
  payerName?: string;
}

export interface DrillDownRow {
  externalClaimId: string;
  patientRef: string;
  payerName: string;
  flagsOpen: number;
  clean: boolean;
  lastEvent: string;
}

export interface KpiBundle {
  cleanClaimRate: number;
  claimsIngested: number;
  claimsClean: number;
  claimsWithOpenFlags: number;
  denialRate: number;
  outcomesRecorded: number;
  outcomesDenied: number;
  dollarsRecovered: number;
  drillDown: DrillDownRow[];
  allClaimsDrillDown: DrillDownRow[];
  openFlagsDrillDown: DrillDownRow[];
}

export function isClaimClean(claim: StoredClaim): boolean {
  const open = claim.scrub.flags.filter((f) => f.status === "open");
  return !open.some((f) => HIGH_SEVERITIES.has(f.severity));
}

export function computeCleanClaimRate(claims: StoredClaim[]) {
  if (claims.length === 0) {
    return {
      cleanClaimRate: 0,
      claimsIngested: 0,
      claimsClean: 0,
      claimsWithOpenFlags: 0,
      drillDown: [] as DrillDownRow[],
      allClaimsDrillDown: [] as DrillDownRow[],
      openFlagsDrillDown: [] as DrillDownRow[],
    };
  }

  const allClaimsDrillDown = claims.map((c) => {
    const open = c.scrub.flags.filter((f) => f.status === "open");
    return {
      externalClaimId: c.externalClaimId,
      patientRef: c.patientRef,
      payerName: c.payerName,
      flagsOpen: open.length,
      clean: isClaimClean(c),
      lastEvent: open.length > 0 ? "flag.raised" : "gate.passed",
    };
  });

  const claimsClean = allClaimsDrillDown.filter((r) => r.clean).length;

  return {
    cleanClaimRate: Math.round((claimsClean / claims.length) * 1000) / 10,
    claimsIngested: claims.length,
    claimsClean,
    claimsWithOpenFlags: allClaimsDrillDown.filter((r) => r.flagsOpen > 0).length,
    drillDown: allClaimsDrillDown.filter((r) => !r.clean),
    allClaimsDrillDown,
    openFlagsDrillDown: allClaimsDrillDown.filter((r) => r.flagsOpen > 0),
  };
}

export function computeDenialRate(outcomes: OutcomeRow[]): {
  denialRate: number;
  outcomesRecorded: number;
  outcomesDenied: number;
} {
  if (outcomes.length === 0) {
    return { denialRate: 0, outcomesRecorded: 0, outcomesDenied: 0 };
  }
  const denied = outcomes.filter((o) => o.result === "denied").length;
  return {
    denialRate: Math.round((denied / outcomes.length) * 1000) / 10,
    outcomesRecorded: outcomes.length,
    outcomesDenied: denied,
  };
}

export function computeDollarsRecovered(outcomes: OutcomeRow[]): number {
  return outcomes
    .filter((o) => o.result === "paid" || o.result === "downcoded")
    .reduce((sum, o) => sum + o.paidAmount, 0);
}

export function buildKpiBundle(
  claims: StoredClaim[],
  outcomes: OutcomeRow[],
): KpiBundle {
  const clean = computeCleanClaimRate(claims);
  const denial = computeDenialRate(outcomes);
  return {
    ...clean,
    ...denial,
    dollarsRecovered: computeDollarsRecovered(outcomes),
  };
}
