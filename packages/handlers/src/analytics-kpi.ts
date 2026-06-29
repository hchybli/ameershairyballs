import { buildKpiBundle } from "@backstop/analytics";
import { buildPayerScorecards, readAvgDaysToPayByPayer, readPayerIntelligence } from "@backstop/intelligence";
import type { FlagType, StoredClaim } from "@backstop/core";
import type { BackstopServiceClient } from "@backstop/db";
import type { HandlerAuth } from "./types.ts";

export async function handleAnalyticsKpi(db: BackstopServiceClient, auth: HandlerAuth) {
  const { data: claims, error: claimsError } = await db
    .from("claims_current")
    .select("id, external_claim_id, patient_ref, payer_name, updated_at")
    .eq("tenant_id", auth.tenantId);

  if (claimsError) {
    throw new Error(`claims query failed: ${claimsError.message}`);
  }

  const claimIds = (claims ?? []).map((c) => c.id);
  const flagsByClaim = new Map<string, Array<{ severity: string; status: string }>>();

  if (claimIds.length > 0) {
    const { data: flags, error: flagsError } = await db
      .from("flags_open")
      .select("claim_id, severity")
      .eq("tenant_id", auth.tenantId)
      .in("claim_id", claimIds);

    if (flagsError) {
      throw new Error(`flags query failed: ${flagsError.message}`);
    }

    for (const flag of flags ?? []) {
      const list = flagsByClaim.get(flag.claim_id) ?? [];
      list.push({ severity: flag.severity, status: "open" });
      flagsByClaim.set(flag.claim_id, list);
    }
  }

  const storedClaims: StoredClaim[] = (claims ?? []).map((claim) => {
    const openFlags = (flagsByClaim.get(claim.id) ?? []).map((flag, index) => ({
      id: `${claim.id}:${index}`,
      externalClaimId: claim.external_claim_id,
      lineIndex: index,
      cdtCode: "",
      payerName: claim.payer_name,
      type: "audit_risk" as FlagType,
      severity: flag.severity as StoredClaim["scrub"]["flags"][number]["severity"],
      dollarImpact: null,
      reason: "",
      status: "open" as const,
      autoFixable: false,
    }));

    return {
      externalClaimId: claim.external_claim_id,
      patientRef: claim.patient_ref,
      payerName: claim.payer_name,
      lines: [],
      scrub: {
        flags: openFlags,
        summary: {
          claimsChecked: 1,
          linesChecked: 0,
          flagsOpen: openFlags.length,
          highOrCritical: openFlags.filter((f) => f.severity === "high" || f.severity === "critical")
            .length,
          estimatedDollarAtRisk: 0,
        },
      },
      autoFixes: [],
      ingestedAt: claim.updated_at,
    };
  });

  const { data: outcomeRows, error: outcomesError } = await db
    .from("outcomes")
    .select("result, paid_amount, claim_id, claims_current(external_claim_id, payer_name)")
    .eq("tenant_id", auth.tenantId);

  if (outcomesError) {
    throw new Error(`outcomes query failed: ${outcomesError.message}`);
  }

  const outcomes = (outcomeRows ?? []).map((row) => {
    const claim = row.claims_current as { external_claim_id: string; payer_name: string } | null;
    return {
      result: row.result as "paid" | "denied" | "downcoded",
      paidAmount: Number(row.paid_amount),
      externalClaimId: claim?.external_claim_id,
      payerName: claim?.payer_name,
    };
  });

  const kpi = buildKpiBundle(storedClaims, outcomes);

  const intelRows = await readPayerIntelligence(db, auth.tenantId);
  const daysToPay = await readAvgDaysToPayByPayer(db, auth.tenantId);
  const payerScorecards = buildPayerScorecards(intelRows).map((card) => ({
    ...card,
    avgDaysToPay: daysToPay.get(card.payerName) ?? card.avgDaysToPay,
  }));

  return {
    metric: "clean_claim_rate",
    value: kpi.cleanClaimRate / 100,
    numerator: kpi.claimsClean,
    denominator: kpi.claimsIngested,
    cleanClaimRate: kpi.cleanClaimRate,
    claimsIngested: kpi.claimsIngested,
    claimsClean: kpi.claimsClean,
    claimsWithOpenFlags: kpi.claimsWithOpenFlags,
    denialRate: kpi.denialRate,
    outcomesRecorded: kpi.outcomesRecorded,
    outcomesDenied: kpi.outcomesDenied,
    dollarsRecovered: kpi.dollarsRecovered,
    drillDown: kpi.drillDown,
    openFlagsDrillDown: kpi.openFlagsDrillDown,
    allClaimsDrillDown: kpi.allClaimsDrillDown,
    payerScorecards,
  };
}
