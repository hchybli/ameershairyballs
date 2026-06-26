import { NextResponse } from "next/server";
import { parseClaimsCsv } from "@/lib/csv/parse-claims-csv";
import { saveClaimsToSupabase } from "@/lib/ingest/save-claims";
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

  const linesIngested = parsed.claims.reduce((sum, c) => sum + c.lines.length, 0);
  const shouldSave = saveToDb && isSupabaseConfigured();

  if (shouldSave) {
    try {
      const saved = await saveClaimsToSupabase(clinicName, parsed.claims);
      const response: IngestResponse = {
        mode: "saved",
        clinicName,
        claimsIngested: saved.claimsSaved,
        linesIngested: saved.linesSaved,
        claims: parsed.claims,
        errors: parsed.errors,
        message: `Saved ${saved.claimsSaved} claim(s) and ${saved.linesSaved} line(s) to Supabase.`,
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
    claimsIngested: parsed.claims.length,
    linesIngested,
    claims: parsed.claims,
    errors: parsed.errors,
    message: isSupabaseConfigured()
      ? "Parsed successfully (preview mode). Send save=true to persist."
      : "Parsed successfully. Add Supabase env vars and send save=true to persist.",
  };

  return NextResponse.json(response);
}
