import type { PayerIntelRow } from "@backstop/intelligence";

export interface DenialLineRisk {
  lineIndex: number;
  cdtCode: string;
  riskScore: number;
  denialRate: number;
  sampleSize: number;
  reasons: string[];
  recommendedFix: string;
}

export interface DenialRiskResult {
  claimRiskScore: number;
  lines: DenialLineRisk[];
}

const HIGH_RISK_THRESHOLD = 40;
const MIN_SAMPLE = 1;

export function scoreDenialRisk(
  payerName: string,
  lines: Array<{ lineIndex: number; cdtCode: string; feeBilled: number }>,
  intel: PayerIntelRow[],
): DenialRiskResult {
  const payerRows = intel.filter((r) => r.payerName === payerName);
  const lineRisks: DenialLineRisk[] = [];

  for (const line of lines) {
    const row = payerRows.find((r) => r.cdtCode === line.cdtCode);
    if (!row || row.sampleSize < MIN_SAMPLE) {
      continue;
    }

    const denialRate = Math.round((row.deniedCount / row.sampleSize) * 1000) / 10;
    const downcodeRate = Math.round((row.downcodedCount / row.sampleSize) * 1000) / 10;
    const riskScore = Math.min(100, Math.round(denialRate + downcodeRate * 0.5));

    const remarkHint =
      row.commonRemarkCodes.length > 0
        ? row.commonRemarkCodes.slice(0, 2).join(", ")
        : "historical denials";

    const reasons = [
      `${payerName} denied ${line.cdtCode} ${denialRate}% of the time (${row.deniedCount}/${row.sampleSize} outcomes).`,
    ];
    if (row.commonRemarkCodes.length > 0) {
      reasons.push(`Top denial codes: ${remarkHint}.`);
    }

    let recommendedFix = "Review documentation and payer rules before submission.";
    if (denialRate >= 50 && line.cdtCode.startsWith("D434")) {
      recommendedFix = "Attach perio charting and radiographs — this payer often denies without them.";
    } else if (downcodeRate >= 30) {
      recommendedFix = "Verify alternate benefit language; payer frequently downcodes this CDT.";
    }

    if (riskScore >= HIGH_RISK_THRESHOLD) {
      lineRisks.push({
        lineIndex: line.lineIndex,
        cdtCode: line.cdtCode,
        riskScore,
        denialRate,
        sampleSize: row.sampleSize,
        reasons,
        recommendedFix,
      });
    }
  }

  const claimRiskScore =
    lineRisks.length === 0
      ? 0
      : Math.round(lineRisks.reduce((s, l) => s + l.riskScore, 0) / lineRisks.length);

  return { claimRiskScore, lines: lineRisks };
}
