import type { OutcomeParseResult, OutcomeResult, ParsedOutcome } from "@backstop/core";

/**
 * Simplified ERA/835 export (one row per claim outcome).
 * Full X12 835 parsing comes in a later phase.
 *
 * Columns: external_claim_id, result, paid_amount, remark_code, remark_text
 */
const REQUIRED_COLUMNS = ["external_claim_id", "result", "paid_amount"] as const;

const VALID_RESULTS = new Set<OutcomeResult>(["paid", "denied", "downcoded"]);

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

export function parseOutcomesCsv(csvText: string): OutcomeParseResult {
  const errors: string[] = [];
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      outcomes: [],
      errors: ["CSV must include a header row and at least one data row."],
      rowCount: 0,
    };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return {
      outcomes: [],
      errors: [`Missing required columns: ${missing.join(", ")}`],
      rowCount: 0,
    };
  }

  const colIndex = Object.fromEntries(headers.map((h, i) => [h, i]));
  const outcomes: ParsedOutcome[] = [];

  for (let rowNum = 2; rowNum <= lines.length; rowNum++) {
    const row = parseCsvLine(lines[rowNum - 1]);
    const get = (col: string) => row[colIndex[col]]?.trim() ?? "";

    const externalClaimId = get("external_claim_id");
    const resultRaw = get("result").toLowerCase();
    const paidAmountRaw = get("paid_amount");
    const remarkCode = get("remark_code") || null;
    const remarkText = get("remark_text") || null;

    if (!externalClaimId || !resultRaw || paidAmountRaw === "") {
      errors.push(`Row ${rowNum}: missing required field(s).`);
      continue;
    }

    if (!VALID_RESULTS.has(resultRaw as OutcomeResult)) {
      errors.push(
        `Row ${rowNum}: invalid result "${resultRaw}" (expected paid, denied, or downcoded).`,
      );
      continue;
    }

    const paidAmount = Number(paidAmountRaw);
    if (Number.isNaN(paidAmount) || paidAmount < 0) {
      errors.push(`Row ${rowNum}: invalid paid_amount "${paidAmountRaw}".`);
      continue;
    }

    outcomes.push({
      externalClaimId,
      result: resultRaw as OutcomeResult,
      paidAmount,
      remarkCode,
      remarkText,
    });
  }

  return { outcomes, errors, rowCount: lines.length - 1 };
}
