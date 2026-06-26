import type { ParsedClaim, ParsedClaimLine } from "@/lib/types";
import {
  attachmentLabel,
  getRequiredAttachments,
} from "@/lib/rules/attachment-rules";
import {
  AUDIT_RISK_CDT_CODES,
  DEPRECATED_CDT_CODES,
  isCrownCode,
  isPerioMaintenance,
  isProphylaxis,
  QUADRANT_REQUIRED_CDT,
  TOOTH_REQUIRED_CDT,
  VALID_QUADRANTS,
} from "@/lib/rules/cdt-catalog";
import type { ClaimFlag, ScrubResult } from "@/lib/rules/types";

const FEE_LEAKAGE_THRESHOLD = 0.15; // flag when billed >15% below allowed

function flagId(externalClaimId: string, lineIndex: number, type: string): string {
  return `${externalClaimId}:${lineIndex}:${type}`;
}

function checkLine(
  claim: ParsedClaim,
  line: ParsedClaimLine,
  lineIndex: number,
): ClaimFlag[] {
  const flags: ClaimFlag[] = [];
  const { cdtCode, feeBilled, feeAllowed, tooth, quadrant } = line;
  const base = {
    externalClaimId: claim.externalClaimId,
    lineIndex,
    cdtCode,
    payerName: claim.payerName,
    status: "open" as const,
  };

  if (DEPRECATED_CDT_CODES.has(cdtCode)) {
    flags.push({
      ...base,
      id: flagId(claim.externalClaimId, lineIndex, "deprecated_cdt"),
      type: "deprecated_cdt",
      severity: "critical",
      dollarImpact: feeBilled,
      reason: `${cdtCode} is deprecated or inactive in the current CDT code set.`,
      autoFixable: false,
      suggestedFix: "Replace with the current CDT code for this procedure.",
    });
  }

  const needsTooth =
    TOOTH_REQUIRED_CDT.has(cdtCode) || isCrownCode(cdtCode);
  if (needsTooth && !tooth) {
    flags.push({
      ...base,
      id: flagId(claim.externalClaimId, lineIndex, "missing_tooth"),
      type: "missing_tooth",
      severity: "high",
      dollarImpact: feeBilled,
      reason: `${cdtCode} requires a tooth number — none provided.`,
      autoFixable: false,
      suggestedFix: "Add the treated tooth number (1–32) before submission.",
    });
  }

  if (QUADRANT_REQUIRED_CDT.has(cdtCode)) {
    const q = quadrant?.toUpperCase() ?? null;
    if (!q || !VALID_QUADRANTS.has(q)) {
      flags.push({
        ...base,
        id: flagId(claim.externalClaimId, lineIndex, "missing_quadrant"),
        type: "missing_quadrant",
        severity: "high",
        dollarImpact: feeBilled,
        reason: `${cdtCode} requires a quadrant (UR, UL, LR, LL) — got "${quadrant ?? ""}".`,
        autoFixable: quadrant ? true : false,
        suggestedFix: quadrant
          ? `Normalize quadrant to uppercase (e.g. "${quadrant.toUpperCase()}").`
          : "Add the quadrant where SRP was performed.",
      });
    }
  }

  if (AUDIT_RISK_CDT_CODES.has(cdtCode) || isCrownCode(cdtCode)) {
    flags.push({
      ...base,
      id: flagId(claim.externalClaimId, lineIndex, "audit_risk"),
      type: "audit_risk",
      severity: "medium",
      dollarImpact: feeBilled,
      reason: `${cdtCode} is an audit-magnet code — payers scrutinize documentation and medical necessity.`,
      autoFixable: false,
      suggestedFix: "Confirm attachments and narrative meet payer requirements before submitting.",
    });
  }

  const attachmentRule = getRequiredAttachments(cdtCode, claim.payerName);
  if (attachmentRule) {
    const missing = attachmentRule.required.map(attachmentLabel).join(", ");
    flags.push({
      ...base,
      id: flagId(claim.externalClaimId, lineIndex, "missing_attachment"),
      type: "missing_attachment",
      severity: "high",
      dollarImpact: feeBilled,
      reason: `${cdtCode} typically requires: ${missing}. No attachments indicated at ingest.`,
      autoFixable: false,
      suggestedFix: attachmentRule.note,
    });
  }

  if (feeAllowed !== null && feeAllowed > 0 && feeBilled < feeAllowed * (1 - FEE_LEAKAGE_THRESHOLD)) {
    const gap = feeAllowed - feeBilled;
    flags.push({
      ...base,
      id: flagId(claim.externalClaimId, lineIndex, "fee_leakage"),
      type: "fee_leakage",
      severity: "low",
      dollarImpact: gap,
      reason: `Fee billed ($${feeBilled.toFixed(2)}) is below contracted allowed ($${feeAllowed.toFixed(2)}) — possible undercollection.`,
      autoFixable: false,
      suggestedFix: "Review fee schedule; billing the allowed amount may recover leakage.",
    });
  }

  return flags;
}

function checkClaimLevel(claim: ParsedClaim): ClaimFlag[] {
  const flags: ClaimFlag[] = [];
  const hasPerioMaint = claim.lines.some((l) => isPerioMaintenance(l.cdtCode));
  const hasProphy = claim.lines.some((l) => isProphylaxis(l.cdtCode));

  if (hasPerioMaint && hasProphy) {
    const impact = claim.lines.reduce((s, l) => s + l.feeBilled, 0);
    flags.push({
      id: flagId(claim.externalClaimId, -1, "perio_prophy_conflict"),
      externalClaimId: claim.externalClaimId,
      lineIndex: -1,
      cdtCode: "D4910/D1110",
      payerName: claim.payerName,
      type: "perio_prophy_conflict",
      severity: "high",
      dollarImpact: impact,
      reason:
        "Claim includes both perio maintenance (D4910) and prophylaxis (D1110/D1120) — payers often deny one.",
      status: "open",
      autoFixable: false,
      suggestedFix: "Bill the appropriate maintenance code only; verify perio history.",
    });
  }

  return flags;
}

/** Apply safe auto-fixes (Phase 1b) — returns updated claim + fix log. */
export function applyAutoFixes(claim: ParsedClaim): {
  claim: ParsedClaim;
  fixes: string[];
} {
  const fixes: string[] = [];
  const lines = claim.lines.map((line) => {
    if (line.quadrant && QUADRANT_REQUIRED_CDT.has(line.cdtCode)) {
      const normalized = line.quadrant.toUpperCase();
      if (VALID_QUADRANTS.has(normalized) && normalized !== line.quadrant) {
        fixes.push(
          `${claim.externalClaimId} line ${line.cdtCode}: normalized quadrant "${line.quadrant}" → "${normalized}"`,
        );
        return { ...line, quadrant: normalized };
      }
    }
    return line;
  });

  return { claim: { ...claim, lines }, fixes };
}

export function scrubClaims(claims: ParsedClaim[]): ScrubResult {
  const flags: ClaimFlag[] = [];

  for (const claim of claims) {
    flags.push(...checkClaimLevel(claim));
    claim.lines.forEach((line, lineIndex) => {
      flags.push(...checkLine(claim, line, lineIndex));
    });
  }

  const openFlags = flags.filter((f) => f.status === "open");
  const highOrCritical = openFlags.filter(
    (f) => f.severity === "high" || f.severity === "critical",
  ).length;
  const estimatedDollarAtRisk = openFlags.reduce(
    (sum, f) => sum + (f.dollarImpact ?? 0),
    0,
  );

  return {
    flags,
    summary: {
      claimsChecked: claims.length,
      linesChecked: claims.reduce((s, c) => s + c.lines.length, 0),
      flagsOpen: openFlags.length,
      highOrCritical,
      estimatedDollarAtRisk,
    },
  };
}

export function scrubClaimsWithAutoFix(claims: ParsedClaim[]): ScrubResult & {
  autoFixes: string[];
  claims: ParsedClaim[];
} {
  const autoFixes: string[] = [];
  const fixedClaims = claims.map((claim) => {
    const { claim: fixed, fixes } = applyAutoFixes(claim);
    autoFixes.push(...fixes);
    return fixed;
  });

  const result = scrubClaims(fixedClaims);
  return { ...result, autoFixes, claims: fixedClaims };
}
