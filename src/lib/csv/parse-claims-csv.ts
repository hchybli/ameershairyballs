import type { CsvParseResult, ParsedClaim, ParsedClaimLine } from "@/lib/types";

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

const HEADER_ALIASES: Record<string, string> = {
  claim_id: "external_claim_id",
  claim_number: "external_claim_id",
  claim_num: "external_claim_id",
  patient_id: "patient_ref",
  patient: "patient_ref",
  patient_reference: "patient_ref",
  payer: "payer_name",
  insurance: "payer_name",
  insurance_name: "payer_name",
  insurance_carrier: "payer_name",
  procedure_code: "cdt_code",
  procedure: "cdt_code",
  ada_code: "cdt_code",
  code: "cdt_code",
  cdt: "cdt_code",
  billed: "fee_billed",
  fee: "fee_billed",
  amount: "fee_billed",
  billed_amount: "fee_billed",
  allowed: "fee_allowed",
  allowed_amount: "fee_allowed",
  tooth_number: "tooth",
  tooth_num: "tooth",
};

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function canonicalHeader(header: string): string {
  const normalized = normalizeHeader(header);
  return HEADER_ALIASES[normalized] ?? normalized;
}

function detectDelimiter(line: string): "," | ";" | "\t" {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char in counts) {
      counts[char as keyof typeof counts] += 1;
    }
  }

  if (counts[";"] > counts[","] && counts[";"] >= counts["\t"]) {
    return ";";
  }
  if (counts["\t"] > counts[","] && counts["\t"] >= counts[";"]) {
    return "\t";
  }
  return ",";
}

function parseCsvLine(line: string, delimiter = ","): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function parseMoney(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const cleaned = trimmed.replace(/^\$/, "").replace(/,/g, "");
  const value = Number(cleaned);
  if (Number.isNaN(value) || value < 0) {
    return null;
  }
  return value;
}

function findHeaderRow(lines: string[]): {
  headerIndex: number;
  delimiter: "," | ";" | "\t";
  colIndex: Record<string, number>;
} | null {
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const delimiter = detectDelimiter(lines[i]);
    const headers = parseCsvLine(lines[i], delimiter).map(canonicalHeader);
    const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
    if (missing.length > 0) {
      continue;
    }

    const colIndex: Record<string, number> = {};
    for (let idx = 0; idx < headers.length; idx++) {
      const header = headers[idx];
      if (header && !(header in colIndex)) {
        colIndex[header] = idx;
      }
    }
    return { headerIndex: i, delimiter, colIndex };
  }
  return null;
}

function wrongFileHint(lines: string[]): string | null {
  const first = parseCsvLine(lines[0], detectDelimiter(lines[0])).map(canonicalHeader);
  if (first.includes("result") && first.includes("paid_amount") && !first.includes("cdt_code")) {
    return "This looks like an outcomes CSV — use sample-claims.csv for claim upload.";
  }
  return null;
}

export function parseClaimsCsv(csvText: string): CsvParseResult {
  const errors: string[] = [];
  const lines = stripBom(csvText)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { claims: [], errors: ["CSV must include a header row and at least one data row."], rowCount: 0 };
  }

  const header = findHeaderRow(lines);
  if (!header) {
    const hint = wrongFileHint(lines);
    return {
      claims: [],
      errors: [
        `Missing required columns: ${REQUIRED_COLUMNS.join(", ")}`,
        ...(hint ? [hint] : []),
      ],
      rowCount: 0,
    };
  }

  const { headerIndex, delimiter, colIndex } = header;
  const claimMap = new Map<string, ParsedClaim>();

  for (let rowNum = headerIndex + 2; rowNum <= lines.length; rowNum++) {
    const row = parseCsvLine(lines[rowNum - 1], delimiter);
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

    const feeBilled = parseMoney(feeBilledRaw);
    if (feeBilled === null) {
      errors.push(`Row ${rowNum}: invalid fee_billed "${feeBilledRaw}".`);
      continue;
    }

    let feeAllowed: number | null = null;
    if (feeAllowedRaw) {
      feeAllowed = parseMoney(feeAllowedRaw);
      if (feeAllowed === null) {
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
    rowCount: lines.length - headerIndex - 1,
  };
}
