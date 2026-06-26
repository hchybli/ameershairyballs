import type { ParsedClaim } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface SaveClaimsResult {
  clinicId: string;
  claimsSaved: number;
  linesSaved: number;
}

export async function saveClaimsToSupabase(
  clinicName: string,
  claims: ParsedClaim[],
): Promise<SaveClaimsResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .upsert({ name: clinicName, pms_type: "csv_export" }, { onConflict: "name" })
    .select("id")
    .single();

  if (clinicError || !clinic) {
    throw new Error(clinicError?.message ?? "Failed to upsert clinic.");
  }

  let claimsSaved = 0;
  let linesSaved = 0;

  for (const claim of claims) {
    const { data: payer, error: payerError } = await supabase
      .from("payers")
      .upsert({ name: claim.payerName }, { onConflict: "name" })
      .select("id")
      .single();

    if (payerError || !payer) {
      throw new Error(payerError?.message ?? `Failed to upsert payer ${claim.payerName}.`);
    }

    const { data: savedClaim, error: claimError } = await supabase
      .from("claims")
      .insert({
        clinic_id: clinic.id,
        patient_ref: claim.patientRef,
        payer_id: payer.id,
        external_claim_id: claim.externalClaimId,
        status: "ingested",
      })
      .select("id")
      .single();

    if (claimError || !savedClaim) {
      throw new Error(claimError?.message ?? `Failed to save claim ${claim.externalClaimId}.`);
    }

    const lineRows = claim.lines.map((line) => ({
      claim_id: savedClaim.id,
      cdt_code: line.cdtCode,
      fee_billed: line.feeBilled,
      fee_allowed: line.feeAllowed,
      tooth: line.tooth,
      quadrant: line.quadrant,
    }));

    const { error: linesError } = await supabase.from("claim_lines").insert(lineRows);
    if (linesError) {
      throw new Error(linesError.message);
    }

    claimsSaved += 1;
    linesSaved += claim.lines.length;
  }

  return { clinicId: clinic.id, claimsSaved, linesSaved };
}
