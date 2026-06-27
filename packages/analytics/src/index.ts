import type { StoredClaim } from "@backstop/core";

const HIGH_SEVERITIES = new Set(["high", "critical"]);

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
      drillDown: [] as Array<{
        externalClaimId: string;
        patientRef: string;
        payerName: string;
        flagsOpen: number;
        clean: boolean;
        lastEvent: string;
      }>,
    };
  }

  const drillDown = claims.map((c) => {
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

  const claimsClean = drillDown.filter((r) => r.clean).length;

  return {
    cleanClaimRate: Math.round((claimsClean / claims.length) * 1000) / 10,
    claimsIngested: claims.length,
    claimsClean,
    claimsWithOpenFlags: drillDown.filter((r) => r.flagsOpen > 0).length,
    drillDown: drillDown.filter((r) => !r.clean),
  };
}
