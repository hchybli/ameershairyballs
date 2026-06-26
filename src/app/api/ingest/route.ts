import { NextResponse } from "next/server";
import { parseClaimsCsv } from "@/lib/csv/parse-claims-csv";
import { saveClaimsToSupabase } from "@/lib/ingest/save-claims";
import { scrubClaimsWithAutoFix } from "@/lib/rules/scrub-claim";
import { groupAutoFixesByClaim, splitScrubByClaim } from "@/lib/rules/scrub-utils";
import { recordClaims } from "@/lib/store/demo-store";
import type { IngestResponse } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const DEFAULT_CLINIC = "Synthetic Demo Clinic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const clinicName = (formData.get("clinicName") as string | null)?.trim() || DEFAULT_CLINIC;
  const saveToDb = formData.get("save") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing CSV file in form field 'file'." }, { status: 400 });
  }

  const csvText = await file.text();
  const parsed = parseClaimsCsv(csvText);

  if (parsed.claims.length === 0) {
    return NextResponse.json(
      {
        error: "No valid claims parsed.",
        errors: parsed.errors,
      },
      { status: 400 },
    );
  }

  const { flags, summary, autoFixes, claims: fixedClaims } = scrubClaimsWithAutoFix(parsed.claims);
  const scrub = { flags, summary };

  recordClaims(
    fixedClaims,
    splitScrubByClaim(fixedClaims, scrub),
    groupAutoFixesByClaim(fixedClaims, autoFixes),
  );

  const linesIngested = fixedClaims.reduce((sum, c) => sum + c.lines.length, 0);
  const shouldSave = saveToDb && isSupabaseConfigured();

  const scrubMessage =
    summary.flagsOpen === 0
      ? "All lines passed pre-submission checks."
      : `${summary.flagsOpen} flag(s) found (${summary.highOrCritical} high/critical) — ~$${summary.estimatedDollarAtRisk.toFixed(0)} at risk.`;

  if (shouldSave) {
    try {
      const saved = await saveClaimsToSupabase(clinicName, fixedClaims);
      const response: IngestResponse = {
        mode: "saved",
        clinicName,
        claimsIngested: saved.claimsSaved,
        linesIngested: saved.linesSaved,
        claims: fixedClaims,
        errors: parsed.errors,
        scrub,
        autoFixes,
        message: `Saved ${saved.claimsSaved} claim(s). ${scrubMessage}`,
      };
      return NextResponse.json(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save to Supabase.";
      return NextResponse.json({ error: message, errors: parsed.errors }, { status: 500 });
    }
  }

  const response: IngestResponse = {
    mode: "preview",
    clinicName,
    claimsIngested: fixedClaims.length,
    linesIngested,
    claims: fixedClaims,
    errors: parsed.errors,
    scrub,
    autoFixes,
    message: `Parsed ${fixedClaims.length} claim(s). ${scrubMessage}`,
  };

  return NextResponse.json(response);
}
