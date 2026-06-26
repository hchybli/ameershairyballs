/** CDT reference data for rule checks — synthetic / rule-based only */

/** Codes removed or replaced in recent CDT cycles (sample set for Phase 1a). */
export const DEPRECATED_CDT_CODES = new Set([
  "D1351", // inactivated — use current sealant codes per CDT annual update
]);

/** Most-audited and high-documentation CDT codes. */
export const AUDIT_RISK_CDT_CODES = new Set([
  "D4341",
  "D4342",
  "D4910",
  "D2950",
  "D2740",
  "D2750",
  "D2790",
  "D9999",
]);

/** Procedures that must specify a tooth number (1–32). */
export const TOOTH_REQUIRED_CDT = new Set([
  "D0220",
  "D0230",
  "D2740",
  "D2750",
  "D2790",
  "D2950",
  "D3310",
  "D3320",
  "D3330",
]);

/** SRP codes that should include a quadrant (UR, UL, LR, LL). */
export const QUADRANT_REQUIRED_CDT = new Set(["D4341", "D4342"]);

export const VALID_QUADRANTS = new Set(["UR", "UL", "LR", "LL"]);

/** Crown procedure family prefix check */
export function isCrownCode(cdtCode: string): boolean {
  return /^D27[0-9]{2}$/.test(cdtCode);
}

export function isPerioMaintenance(cdtCode: string): boolean {
  return cdtCode === "D4910";
}

export function isProphylaxis(cdtCode: string): boolean {
  return cdtCode === "D1110" || cdtCode === "D1120";
}
