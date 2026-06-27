import type { ParsedClaim, ScrubResult } from "@backstop/core";

export function splitScrubByClaim(claims: ParsedClaim[], scrub: ScrubResult): Map<string, ScrubResult> {
  const map = new Map<string, ScrubResult>();

  for (const claim of claims) {
    const flags = scrub.flags.filter((f) => f.externalClaimId === claim.externalClaimId);
    const openFlags = flags.filter((f) => f.status === "open");
    map.set(claim.externalClaimId, {
      flags,
      summary: {
        claimsChecked: 1,
        linesChecked: claim.lines.length,
        flagsOpen: openFlags.length,
        highOrCritical: openFlags.filter(
          (f) => f.severity === "high" || f.severity === "critical",
        ).length,
        estimatedDollarAtRisk: openFlags.reduce((s, f) => s + (f.dollarImpact ?? 0), 0),
      },
    });
  }

  return map;
}

export function groupAutoFixesByClaim(
  claims: ParsedClaim[],
  autoFixes: string[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const claim of claims) {
    map.set(
      claim.externalClaimId,
      autoFixes.filter((fix) => fix.startsWith(claim.externalClaimId)),
    );
  }
  return map;
}
