# Synthetic sample data

**No real PHI.** Use only for local demo and tests.

## Fixture files

| File | Clinic | Claims |
|------|--------|--------|
| `sample-claims.csv` | Sunrise Dental (Tenant A) | SYN-CLM-001..003 |
| `sample-outcomes.csv` | Sunrise Dental | outcomes for Sunrise claims |
| `sample-claims-lakeside.csv` | Lakeside Dental (Tenant A) | SYN-CLM-L01..L02 |
| `sample-outcomes-lakeside.csv` | Lakeside Dental | outcomes for Lakeside claims |
| `sample-claims-isolation.csv` | Ridge Dental (Tenant B) | SYN-CLM-ISO-001 |
| `sample-outcomes-isolation.csv` | Ridge Dental | outcome for isolation claim |

## Seed shape (`npm run seed`)

- **Tenant A** — `Synthetic Demo Tenant`
  - **Sunrise Dental** — 3 claims (operator assigned here)
  - **Lakeside Dental** — 2 claims (operator cannot see)
  - **Owner** — `owner@demo.backstop.local` — both clinics
  - **Operator** — `operator@demo.backstop.local` — Sunrise only
- **Tenant B** — `Synthetic Isolation Tenant`
  - **Ridge Dental** — 1 claim
  - **Operator** — `operator@isolation.backstop.local` — for cross-tenant RLS tests

Seed is **idempotent** — re-running produces no duplicate events/outcomes.

## CSV columns

Claims:
```
external_claim_id, patient_ref, payer_name, cdt_code, fee_billed, fee_allowed, tooth, quadrant
```

Outcomes:
```
external_claim_id, result, paid_amount, remark_code, remark_text
```

`result` must be: `paid`, `denied`, or `downcoded`
