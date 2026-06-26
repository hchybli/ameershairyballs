import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseClaimsCsv } from "../csv/parse-claims-csv";
import { scrubClaims } from "../rules/scrub-claim";

describe("scrubClaims (Phase 1a)", () => {
  it("flags audit-risk and missing attachments on sample claims", () => {
    const csv = readFileSync(
      join(process.cwd(), "data/synthetic/sample-claims.csv"),
      "utf8",
    );
    const { claims } = parseClaimsCsv(csv);
    const { flags, summary } = scrubClaims(claims);

    assert.ok(summary.flagsOpen > 0);
    assert.ok(flags.some((f) => f.type === "audit_risk" && f.cdtCode === "D4341"));
    assert.ok(flags.some((f) => f.type === "missing_attachment" && f.cdtCode === "D4341"));
    assert.ok(flags.some((f) => f.type === "missing_attachment" && f.cdtCode === "D2950"));
  });

  it("flags perio maintenance vs prophy on same claim", () => {
    const { flags } = scrubClaims([
      {
        externalClaimId: "X-1",
        patientRef: "SYN-PAT-9",
        payerName: "Delta Dental",
        lines: [
          { cdtCode: "D4910", feeBilled: 120, feeAllowed: 100, tooth: null, quadrant: null },
          { cdtCode: "D1110", feeBilled: 95, feeAllowed: 80, tooth: null, quadrant: null },
        ],
      },
    ]);

    assert.ok(flags.some((f) => f.type === "perio_prophy_conflict"));
  });

  it("flags missing tooth on crown codes", () => {
    const { flags } = scrubClaims([
      {
        externalClaimId: "X-2",
        patientRef: "SYN-PAT-9",
        payerName: "Cigna Dental",
        lines: [{ cdtCode: "D2740", feeBilled: 1000, feeAllowed: 900, tooth: null, quadrant: null }],
      },
    ]);

    assert.ok(flags.some((f) => f.type === "missing_tooth"));
  });

  it("flags fee leakage when billed well below allowed", () => {
    const { flags } = scrubClaims([
      {
        externalClaimId: "X-3",
        patientRef: "SYN-PAT-9",
        payerName: "Delta Dental",
        lines: [{ cdtCode: "D1110", feeBilled: 50, feeAllowed: 100, tooth: null, quadrant: null }],
      },
    ]);

    assert.ok(flags.some((f) => f.type === "fee_leakage"));
  });
});
