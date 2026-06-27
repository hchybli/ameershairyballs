# Synthetic seed fixtures

Starter test data for the Phase 1 vertical slice. **All data is fake — no real PHI.**
Drop these in `/packages/integrations/ingest/fixtures` (or wherever B1 expects them).

## Files
- `dentrix_export_claims.csv` — Dentrix-style claim export. Feed to the CSV ingest adapter (B1).
- `era_835.json` — parsed remittance (ERA) matching the claims above. Feed to the outcome loop (B4).
  Use this now; the raw X12 parser is Phase 2.
- `eligibility_271.json` — Onederful-style benefit breakdowns. Feed to the eligibility agent (B4).
- `sample_835.x12` — tiny raw X12 835 for later EDI-parser testing (Phase 2). Not needed for the slice.
- `generate.py` — the generator. Re-run to regenerate / extend the set.

## Built-in test scenarios (each claim exercises a specific path)
| Claim | Scenario | What it tests |
|-------|----------|---------------|
| CLM-5001 | clean paid | the happy path end to end |
| CLM-5002 | D4341 **denied — missing perio chart** | attachment agent + denial → appeal loop |
| CLM-5003 | D2740 **downcoded** to D2750 (alternate benefit) | downcode detection + payer intelligence |
| CLM-5004 | D2391 **underpaid** vs contracted rate | underpayment detection (found money) |
| CLM-5005 | D1110 **frequency denial** | frequency rules + eligibility cross-check |
| CLM-5006/7/8 | clean paid | volume for KPI tiles |

## Eligibility scenarios
- PT-1002: Cigna requires a perio chart for D4341 (drives the attachment alert).
- PT-1003: dual coverage → coordinate benefits.
- PT-1004: out-of-network → higher patient responsibility.
- PT-1005: **cleaning frequency exceeded + annual max nearly gone** → "caught before the chair" alert.

These mirror the click-through demo (Track C) so the demo and the real build tell the same story.
