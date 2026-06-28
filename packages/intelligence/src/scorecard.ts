import type { PayerIntelRow, PayerScorecard } from "./types";

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Aggregate CDT-level intel rows into per-payer scorecards. */
export function buildPayerScorecards(rows: PayerIntelRow[]): PayerScorecard[] {
  const byPayer = new Map<string, PayerIntelRow[]>();

  for (const row of rows) {
    const list = byPayer.get(row.payerName) ?? [];
    list.push(row);
    byPayer.set(row.payerName, list);
  }

  return [...byPayer.entries()]
    .map(([payerName, payerRows]) => {
      const sampleSize = payerRows.reduce((s, r) => s + r.sampleSize, 0);
      const denied = payerRows.reduce((s, r) => s + r.deniedCount, 0);
      const downcoded = payerRows.reduce((s, r) => s + r.downcodedCount, 0);

      const remarkCounts = new Map<string, number>();
      for (const row of payerRows) {
        for (const code of row.commonRemarkCodes) {
          remarkCounts.set(code, (remarkCounts.get(code) ?? 0) + row.deniedCount);
        }
      }

      const topDenialReasons = [...remarkCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([code]) => code);

      const paidAmounts = payerRows
        .map((r) => r.avgPaidAmount)
        .filter((v): v is number => v != null && v > 0);
      const avgPaidAmount =
        paidAmounts.length === 0
          ? null
          : Math.round((paidAmounts.reduce((s, v) => s + v, 0) / paidAmounts.length) * 100) / 100;

      return {
        payerName,
        sampleSize,
        denialRate: pct(denied, sampleSize),
        downcodeFrequency: pct(downcoded, sampleSize),
        avgDaysToPay: null,
        avgPaidAmount,
        topDenialReasons,
        cdtCodesTracked: payerRows.length,
      };
    })
    .sort((a, b) => b.sampleSize - a.sampleSize);
}
