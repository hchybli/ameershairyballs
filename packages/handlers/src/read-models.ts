import type { FlagType, QueueRow, StoredClaim } from "@backstop/core";
import type { BackstopSupabaseClient } from "@backstop/db";

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export async function fetchWorkQueue(supabase: BackstopSupabaseClient): Promise<QueueRow[]> {
  const { data: flags, error: flagsError } = await supabase
    .from("flags_open")
    .select("id, claim_id, flag_type, severity, dollar_impact, reason");

  if (flagsError) {
    throw new Error(`queue query failed: ${flagsError.message}`);
  }

  if (!flags?.length) {
    return [];
  }

  const claimIds = [...new Set(flags.map((flag) => flag.claim_id))];
  const { data: claims, error: claimsError } = await supabase
    .from("claims_current")
    .select("id, external_claim_id, patient_ref, payer_name, updated_at")
    .in("id", claimIds);

  if (claimsError) {
    throw new Error(`queue claims query failed: ${claimsError.message}`);
  }

  const claimById = new Map((claims ?? []).map((claim) => [claim.id, claim]));

  const byClaim = new Map<string, QueueRow & { claimId: string }>();
  const visibleClaimIds = new Set<string>();

  for (const flag of flags) {
    const claim = claimById.get(flag.claim_id);
    if (!claim) {
      continue;
    }

    visibleClaimIds.add(flag.claim_id);
    const key = claim.external_claim_id;
    const existing = byClaim.get(key);
    const severity = flag.severity ?? "low";

    const impact = flag.dollar_impact === null ? 0 : Number(flag.dollar_impact);

    if (!existing) {
      byClaim.set(key, {
        claimId: flag.claim_id,
        externalClaimId: claim.external_claim_id,
        patientRef: claim.patient_ref,
        payerName: claim.payer_name,
        feeTotal: 0,
        dollarImpactAtRisk: impact,
        priorityScore: 0,
        flagsOpen: 1,
        topFlagType: flag.flag_type,
        topFlagReason: flag.reason,
        topSeverity: severity,
        ingestedAt: claim.updated_at,
      });
      continue;
    }

    existing.flagsOpen += 1;
    existing.dollarImpactAtRisk += impact;
    const existingRank = SEVERITY_RANK[existing.topSeverity ?? "low"] ?? 0;
    const nextRank = SEVERITY_RANK[severity] ?? 0;
    if (nextRank > existingRank) {
      existing.topFlagType = flag.flag_type;
      existing.topFlagReason = flag.reason;
      existing.topSeverity = severity;
    }
  }

  if (visibleClaimIds.size > 0) {
    const { data: lines } = await supabase
      .from("claim_lines_current")
      .select("claim_id, fee_billed")
      .in("claim_id", [...visibleClaimIds]);

    const feeByClaim = new Map<string, number>();
    for (const line of lines ?? []) {
      feeByClaim.set(line.claim_id, (feeByClaim.get(line.claim_id) ?? 0) + Number(line.fee_billed));
    }

    for (const row of byClaim.values()) {
      row.feeTotal = feeByClaim.get(row.claimId) ?? 0;
    }
  }

  return [...byClaim.values()]
    .map(({ claimId: _claimId, ...row }) => {
      const urgency = SEVERITY_RANK[row.topSeverity ?? "low"] ?? 1;
      const dollars = Math.max(row.dollarImpactAtRisk, row.feeTotal * 0.1, 1);
      return { ...row, priorityScore: dollars * urgency };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function fetchClaimDetail(
  supabase: BackstopSupabaseClient,
  externalClaimId: string,
): Promise<StoredClaim | null> {
  const { data: claim, error } = await supabase
    .from("claims_current")
    .select("id, external_claim_id, patient_ref, payer_name, updated_at")
    .eq("external_claim_id", externalClaimId)
    .maybeSingle();

  if (error || !claim) {
    return null;
  }

  const { data: lines } = await supabase
    .from("claim_lines_current")
    .select("line_index, cdt_code, fee_billed, fee_allowed, tooth, quadrant")
    .eq("claim_id", claim.id)
    .order("line_index");

  const [{ data: openFlags }, { data: resolvedFlags }] = await Promise.all([
    supabase
      .from("flags_open")
      .select("id, line_index, cdt_code, flag_type, severity, dollar_impact, reason, suggested_fix")
      .eq("claim_id", claim.id),
    supabase
      .from("flags_resolved")
      .select("id, flag_type, severity, status, resolution_reason")
      .eq("claim_id", claim.id)
      .order("resolved_at", { ascending: false }),
  ]);

  const open = (openFlags ?? []).map((flag) => ({
    id: flag.id,
    externalClaimId: claim.external_claim_id,
    lineIndex: flag.line_index ?? -1,
    cdtCode: flag.cdt_code ?? "",
    payerName: claim.payer_name,
    type: flag.flag_type as FlagType,
    severity: flag.severity as StoredClaim["scrub"]["flags"][number]["severity"],
    dollarImpact: flag.dollar_impact === null ? null : Number(flag.dollar_impact),
    reason: flag.reason,
    status: "open" as const,
    autoFixable: false,
    suggestedFix: flag.suggested_fix ?? undefined,
  }));

  const resolved = (resolvedFlags ?? []).map((flag) => ({
    id: flag.id,
    externalClaimId: claim.external_claim_id,
    lineIndex: -1,
    cdtCode: "",
    payerName: claim.payer_name,
    type: flag.flag_type as FlagType,
    severity: flag.severity as StoredClaim["scrub"]["flags"][number]["severity"],
    dollarImpact: null,
    reason: flag.resolution_reason ?? `Resolved (${flag.status})`,
    status: flag.status as StoredClaim["scrub"]["flags"][number]["status"],
    autoFixable: false,
    overrideReason: flag.status === "overridden" ? flag.resolution_reason ?? undefined : undefined,
  }));

  const flags = [...open, ...resolved];
  const openOnly = open;

  const appliedFixes = resolved
    .filter((f) => f.status === "approved")
    .map((f) => `${f.type.replace(/_/g, " ")} — approved`);

  return {
    externalClaimId: claim.external_claim_id,
    patientRef: claim.patient_ref,
    payerName: claim.payer_name,
    lines: (lines ?? []).map((line) => ({
      cdtCode: line.cdt_code,
      feeBilled: Number(line.fee_billed),
      feeAllowed: line.fee_allowed === null ? null : Number(line.fee_allowed),
      tooth: line.tooth,
      quadrant: line.quadrant,
    })),
    scrub: {
      flags,
      summary: {
        claimsChecked: 1,
        linesChecked: lines?.length ?? 0,
        flagsOpen: openOnly.length,
        highOrCritical: openOnly.filter((f) => f.severity === "high" || f.severity === "critical")
          .length,
        estimatedDollarAtRisk: openOnly.reduce((sum, f) => sum + (f.dollarImpact ?? 0), 0),
      },
    },
    autoFixes: appliedFixes,
    ingestedAt: claim.updated_at,
  };
}
