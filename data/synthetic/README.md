# Synthetic sample data

**No real PHI.** Use only for local demo and tests.

| File | Purpose |
|------|---------|
| `sample-claims.csv` | 3 claims, 5 lines — triggers scrub flags on SRP, crown, buildup |
| `sample-outcomes.csv` | Payer responses for those 3 claims (paid / denied / downcoded) |

## Claims CSV columns

Canonical Phase 1 format — see [docs/research/DENTRIX_EXPORT_FORMAT.md](../docs/research/DENTRIX_EXPORT_FORMAT.md).

```
external_claim_id, patient_ref, payer_name, cdt_code, fee_billed, fee_allowed, tooth, quadrant
```

## Outcomes CSV columns (simplified 835/ERA)

```
external_claim_id, result, paid_amount, remark_code, remark_text
```

`result` must be: `paid`, `denied`, or `downcoded`

## Expected demo behavior

After upload + scrub:

| Claim | Payer | Notable flags |
|-------|-------|---------------|
| SYN-CLM-001 | Delta Dental | Low severity (prophy) |
| SYN-CLM-002 | MetLife Dental | SRP attachment flags (high) |
| SYN-CLM-003 | Cigna Dental | Buildup + crown flags |

Owner KPI on full loop with outcomes: **67%** clean-claim rate.
