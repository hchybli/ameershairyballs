# Dentrix export format — Phase 1 CSV adapter

**Status:** Synthetic schema **locked** for Phase 1. Real Dentrix column names **pending** design partner export.  
**Adapter:** `packages/integrations/src/adapters/csv-dentrix.ts` (port from `src/lib/csv/parse-claims-csv.ts`)  
**Workstream:** WS-03

---

## Phase 1 canonical format (synthetic)

One row per **claim line**. Rows sharing `external_claim_id` group into one claim.

### Required columns

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| `external_claim_id` | string | `SYN-CLM-001` | PMS claim id or internal ref |
| `patient_ref` | string | `SYN-PAT-001` | De-identified patient ref — no PHI in repo |
| `payer_name` | string | `Delta Dental` | Normalized in scrub for payer rules |
| `cdt_code` | string | `D4341` | Must match `^D\d{4}$` |
| `fee_billed` | number | `275.00` | Office fee |

### Optional columns

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| `fee_allowed` | number | `220.00` | Used for fee-leakage check |
| `tooth` | string | `14` | Required for crown/buildup codes |
| `quadrant` | UR/UL/LR/LL | `UR` | Required for SRP codes |

### Sample file

`data/synthetic/sample-claims.csv` — 3 claims, 5 lines.

---

## Parser behavior (locked)

1. Header row required; headers normalized to `snake_case` lowercase  
2. Missing required column → parse error, no partial ingest  
3. Invalid CDT → row error  
4. Group lines by `external_claim_id`  
5. Emit canonical claim model → `claim.ingested` event  

Port tests from `src/lib/csv/parse-claims-csv.test.ts` must pass unchanged.

---

## Real Dentrix export (TBD)

Dentrix exports vary by report type (e.g. Outstanding Claims, Insurance Aging). US team will provide **one real export** from design partner clinic.

### Mapping checklist (fill when export arrives)

| Dentrix column (TBD) | Canonical field | Transform |
|---------------------|-------------------|-----------|
| | `external_claim_id` | |
| | `patient_ref` | Hash or internal id — no names in dev |
| | `payer_name` | |
| | `cdt_code` | Strip spaces, uppercase |
| | `fee_billed` | Parse currency |
| | `tooth` | |
| | `quadrant` | Map to UR/UL/LR/LL |

### Adapter strategy

```
CsvDentrixIngestAdapter
  ├── parseSyntheticFormat()   ← Phase 1 (current)
  └── parseDentrixExport()     ← Phase 1.5 when mapping known
```

Do not block WS-03 on real export — synthetic format is sufficient for E2E.

---

## Related

- [PAYER_RULES_V1.md](./PAYER_RULES_V1.md) — scrub uses payer_name from this CSV  
- [LEGACY_REFERENCE.md](../architecture/LEGACY_REFERENCE.md) — port path  
- [API_CONTRACTS.md](../architecture/API_CONTRACTS.md) — `ingest-claims` endpoint
