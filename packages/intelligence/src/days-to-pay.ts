import type { BackstopServiceClient } from "@backstop/db";

/** Approximate days from claim update to outcome observed_at, grouped by payer. */
export async function readAvgDaysToPayByPayer(
  db: BackstopServiceClient,
  tenantId: string,
): Promise<Map<string, number>> {
  const { data, error } = await db
    .from("outcomes")
    .select("observed_at, claims_current!inner(payer_name, updated_at)")
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(`days-to-pay query failed: ${error.message}`);
  }

  const sums = new Map<string, { totalDays: number; count: number }>();

  for (const row of data ?? []) {
    const claim = row.claims_current as { payer_name: string; updated_at: string };
    const observed = new Date(row.observed_at).getTime();
    const updated = new Date(claim.updated_at).getTime();
    const days = Math.max(0, (observed - updated) / (1000 * 60 * 60 * 24));
    const entry = sums.get(claim.payer_name) ?? { totalDays: 0, count: 0 };
    entry.totalDays += days;
    entry.count += 1;
    sums.set(claim.payer_name, entry);
  }

  const result = new Map<string, number>();
  for (const [payer, { totalDays, count }] of sums) {
    if (count > 0) {
      result.set(payer, Math.round((totalDays / count) * 10) / 10);
    }
  }
  return result;
}
