import type { FlagType, QueueRow, StoredClaim } from "@backstop/core";
import type { BackstopSupabaseClient } from "@backstop/db";

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export async function fetchWorkQueue(supabase: BackstopSupabaseClient): Promise<QueueRow[]> {
  const { data: flags, error } = await supabase
    .from("flags_open")
    .select(
      `
      id,
      claim_id,
      flag_type,
      severity,
      reason,
      claims_current!inner (
        external_claim_id,
        patient_ref,
        payer_name,
        updated_at
      )
    `,
    );

  if (error) {
    throw new Error(`queue query failed: ${error.message}`);
  }

  const byClaim = new Map<string, QueueRow & { claimId: string }>();
  const claimIds = new Set<string>();

  for (const flag of flags ?? []) {
    const claim = flag.claims_current as {
      external_claim_id: string;
      patient_ref: string;
      payer_name: string;
      updated_at: string;
    };

    claimIds.add(flag.claim_id);
    const key = claim.external_claim_id;
    const existing = byClaim.get(key);
    const severity = flag.severity ?? "low";

    if (!existing) {
      byClaim.set(key, {
        claimId: flag.claim_id,
        externalClaimId: claim.external_claim_id,
        patientRef: claim.patient_ref,
        payerName: claim.payer_name,
        feeTotal: 0,
        flagsOpen: 1,
        topFlagType: flag.flag_type,
        topFlagReason: flag.reason,
        topSeverity: severity,
        ingestedAt: claim.updated_at,
      });
      continue;
    }

    existing.flagsOpen += 1;
    const existingRank = SEVERITY_RANK[existing.topSeverity ?? "low"] ?? 0;
    const nextRank = SEVERITY_RANK[severity] ?? 0;
    if (nextRank > existingRank) {
      existing.topFlagType = flag.flag_type;
      existing.topFlagReason = flag.reason;
      existing.topSeverity = severity;
    }
  }

  if (claimIds.size > 0) {
    const { data: lines } = await supabase
      .from("claim_lines_current")
      .select("claim_id, fee_billed")
      .in("claim_id", [...claimIds]);

    const feeByClaim = new Map<string, number>();
    for (const line of lines ?? []) {
      feeByClaim.set(line.claim_id, (feeByClaim.get(line.claim_id) ?? 0) + Number(line.fee_billed));
    }

    for (const row of byClaim.values()) {
      row.feeTotal = feeByClaim.get(row.claimId) ?? 0;
    }
  }

  return [...byClaim.values()]
    .map(({ claimId: _claimId, ...row }) => row)
    .sort((a, b) => {
      const sa = SEVERITY_RANK[a.topSeverity ?? "low"] ?? 0;
      const sb = SEVERITY_RANK[b.topSeverity ?? "low"] ?? 0;
      return sb - sa;
    });
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

  const { data: openFlags } = await supabase
    .from("flags_open")
    .select("id, line_index, cdt_code, flag_type, severity, dollar_impact, reason, suggested_fix")
    .eq("claim_id", claim.id);

  const flags = (openFlags ?? []).map((flag) => ({
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

  const open = flags.filter((f) => f.status === "open");

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
        flagsOpen: open.length,
        highOrCritical: open.filter((f) => f.severity === "high" || f.severity === "critical").length,
        estimatedDollarAtRisk: open.reduce((sum, f) => sum + (f.dollarImpact ?? 0), 0),
      },
    },
    autoFixes: [],
    ingestedAt: claim.updated_at,
  };
}
