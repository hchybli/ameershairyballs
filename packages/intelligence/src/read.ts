import type { BackstopServiceClient } from "@backstop/db";
import type { PayerIntelRow } from "./types";

export async function readPayerIntelligence(
  db: BackstopServiceClient,
  tenantId: string,
): Promise<PayerIntelRow[]> {
  const { data, error } = await db
    .from("payer_intelligence")
    .select(
      "payer_name, cdt_code, sample_size, paid_count, denied_count, downcoded_count, avg_paid_amount, common_remark_codes, updated_at",
    )
    .eq("tenant_id", tenantId)
    .order("payer_name");

  if (error) {
    throw new Error(`payer_intelligence read failed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    payerName: row.payer_name,
    cdtCode: row.cdt_code,
    sampleSize: row.sample_size,
    paidCount: row.paid_count,
    deniedCount: row.denied_count,
    downcodedCount: row.downcoded_count,
    avgPaidAmount: row.avg_paid_amount === null ? null : Number(row.avg_paid_amount),
    commonRemarkCodes: Array.isArray(row.common_remark_codes)
      ? (row.common_remark_codes as string[])
      : [],
    updatedAt: row.updated_at,
  }));
}
