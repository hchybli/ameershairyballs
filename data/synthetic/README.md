# Synthetic sample data

**No real PHI.** Use only for local demo and tests.

| File | Purpose |
|------|---------|
| `sample-claims.csv` | 3 claims, 5 lines — triggers scrub flags on SRP, crown, buildup |
| `sample-outcomes.csv` | Payer responses for those 3 claims (paid / denied / downcoded) |

## Claims CSV columns

```
external_claim_id, patient_ref, payer_name, cdt_code, fee_billed, fee_allowed, tooth, quadrant
```

## Outcomes CSV columns (simplified 835/ERA)

```
external_claim_id, result, paid_amount, remark_code, remark_text
```

`result` must be: `paid`, `denied`, or `downcoded`
