import { NextResponse } from "next/server";
import { parseOutcomesCsv } from "@/lib/csv/parse-outcomes-csv";
import type { OutcomeIngestResponse } from "@/lib/outcomes/types";
import { getKnownClaimIds, recordOutcomes } from "@/lib/store/demo-store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing CSV file in form field 'file'." }, { status: 400 });
  }

  const csvText = await file.text();
  const parsed = parseOutcomesCsv(csvText);

  if (parsed.outcomes.length === 0) {
    return NextResponse.json(
      { error: "No valid outcomes parsed.", errors: parsed.errors },
      { status: 400 },
    );
  }

  const knownClaims = getKnownClaimIds();
  const warnings: string[] = [];

  if (knownClaims.size === 0) {
    warnings.push("No claims ingested yet — ingest claims first for dashboard linkage.");
  }

  for (const outcome of parsed.outcomes) {
    if (knownClaims.size > 0 && !knownClaims.has(outcome.externalClaimId)) {
      warnings.push(
        `Outcome for ${outcome.externalClaimId} has no matching ingested claim.`,
      );
    }
  }

  const outcomesIngested = recordOutcomes(parsed.outcomes);

  const response: OutcomeIngestResponse = {
    outcomesIngested,
    errors: parsed.errors,
    warnings,
    message: `Recorded ${outcomesIngested} outcome(s) from payer response.`,
  };

  return NextResponse.json(response);
}
