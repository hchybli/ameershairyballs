import type { CsvParseResult, ParsedClaim, ParsedClaimLine } from "@backstop/core";

/**
 * Expected CSV columns (one row per claim line):
 * external_claim_id, patient_ref, payer_name, cdt_code, fee_billed, fee_allowed, tooth, quadrant
 *
 * Rows with the same external_claim_id are grouped into one claim.
 */
const REQUIRED_COLUMNS = [
  "external_claim_id",
  "patient_ref",
  "payer_name",
  "cdt_code",
  "fee_billed",
] as const;

const CDT_PATTERN = /^D\d{4}$/;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

export function parseClaimsCsv(csvText: string): CsvParseResult {
  const errors: string[] = [];
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { claims: [], errors: ["CSV must include a header row and at least one data row."], rowCount: 0 };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return {
      claims: [],
      errors: [`Missing required columns: ${missing.join(", ")}`],
      rowCount: 0,
    };
  }

  const colIndex = Object.fromEntries(headers.map((h, i) => [h, i]));
  const claimMap = new Map<string, ParsedClaim>();

  for (let rowNum = 2; rowNum <= lines.length; rowNum++) {
    const row = parseCsvLine(lines[rowNum - 1]);
    const get = (col: string) => row[colIndex[col]]?.trim() ?? "";

    const externalClaimId = get("external_claim_id");
    const patientRef = get("patient_ref");
    const payerName = get("payer_name");
    const cdtCode = get("cdt_code").toUpperCase();
    const feeBilledRaw = get("fee_billed");
    const feeAllowedRaw = get("fee_allowed");
    const tooth = get("tooth") || null;
    const quadrant = get("quadrant") || null;

    if (!externalClaimId || !patientRef || !payerName || !cdtCode || !feeBilledRaw) {
      errors.push(`Row ${rowNum}: missing required field(s).`);
      continue;
    }

    if (!CDT_PATTERN.test(cdtCode)) {
      errors.push(`Row ${rowNum}: invalid CDT code "${cdtCode}" (expected D####).`);
      continue;
    }

    const feeBilled = Number(feeBilledRaw);
    if (Number.isNaN(feeBilled) || feeBilled < 0) {
      errors.push(`Row ${rowNum}: invalid fee_billed "${feeBilledRaw}".`);
      continue;
    }

    let feeAllowed: number | null = null;
    if (feeAllowedRaw) {
      feeAllowed = Number(feeAllowedRaw);
      if (Number.isNaN(feeAllowed) || feeAllowed < 0) {
        errors.push(`Row ${rowNum}: invalid fee_allowed "${feeAllowedRaw}".`);
        continue;
      }
    }

    const claimLine: ParsedClaimLine = {
      cdtCode,
      feeBilled,
      feeAllowed,
      tooth,
      quadrant,
    };

    const existing = claimMap.get(externalClaimId);
    if (!existing) {
      claimMap.set(externalClaimId, {
        externalClaimId,
        patientRef,
        payerName,
        lines: [claimLine],
      });
      continue;
    }

    if (existing.patientRef !== patientRef || existing.payerName !== payerName) {
      errors.push(
        `Row ${rowNum}: claim ${externalClaimId} has conflicting patient_ref or payer_name.`,
      );
      continue;
    }

    existing.lines.push(claimLine);
  }

  return {
    claims: Array.from(claimMap.values()),
    errors,
    rowCount: lines.length - 1,
  };
}
