# Data model — event-sourced (target)

**Migration file:** `supabase/migrations/002_event_sourced_schema.sql`  
**Replaces:** CRUD-style `001_initial_schema.sql` for new development (do not merge 001 + 002 blindly — 002 is greenfield).

---

## Entity overview

```
tenants
  └── clinics
  └── users (via Supabase auth + clinic_members)

events (append-only) ──► projectors ──► claims_current, claim_lines_current,
                                        flags_open, flags_resolved

outcomes (append-only)
payer_intelligence (derived from outcomes, upserted)
```

---

## Core tables

### `tenants`
| Column | Type |
|--------|------|
| id | uuid PK |
| name | text |
| created_at | timestamptz |

### `clinics`
| Column | Type |
|--------|------|
| id | uuid PK |
| tenant_id | uuid FK → tenants |
| name | text |
| pms_type | text (`dentrix`, `open_dental`, …) |

### `clinic_members`
| Column | Type |
|--------|------|
| user_id | uuid FK → auth.users |
| clinic_id | uuid FK |
| role | text (`operator`, `owner`, `biller`) |

### `events` (append-only — source of truth)
| Column | Type |
|--------|------|
| id | uuid PK |
| tenant_id | uuid FK |
| type | text |
| payload | jsonb |
| actor_id | uuid nullable |
| created_at | timestamptz |

**No UPDATE or DELETE on events.**

### `claims_current` (read model)
| Column | Type |
|--------|------|
| id | uuid PK |
| tenant_id | uuid |
| clinic_id | uuid |
| external_claim_id | text |
| patient_ref | text |
| payer_name | text |
| status | text |
| last_event_id | uuid |
| updated_at | timestamptz |

Unique: `(tenant_id, external_claim_id)`

### `claim_lines_current`
| Column | Type |
|--------|------|
| id | uuid PK |
| claim_id | uuid FK |
| line_index | int |
| cdt_code | text |
| fee_billed | numeric |
| fee_allowed | numeric nullable |
| tooth | text nullable |
| quadrant | text nullable |

### `flags_open` / `flags_resolved`
| Column | Type |
|--------|------|
| id | uuid PK |
| tenant_id | uuid |
| claim_id | uuid |
| flag_type | text |
| severity | text |
| dollar_impact | numeric nullable |
| reason | text |
| status | text (`open`, `approved`, `overridden`) |
| resolution_event_id | uuid nullable |

### `outcomes` (append-only)
| Column | Type |
|--------|------|
| id | uuid PK |
| tenant_id | uuid |
| claim_id | uuid |
| result | text |
| paid_amount | numeric |
| remark_code | text nullable |
| observed_at | timestamptz |
| source_event_id | uuid |

### `payer_intelligence`
| Column | Type |
|--------|------|
| id | uuid PK |
| tenant_id | uuid |
| payer_name | text |
| cdt_code | text |
| sample_size | int |
| paid_count | int |
| denied_count | int |
| downcoded_count | int |
| avg_paid_amount | numeric nullable |
| common_remark_codes | jsonb |
| updated_at | timestamptz |

Unique: `(tenant_id, payer_name, cdt_code)`

---

## RLS pattern

```sql
-- Example: events readable by tenant members only
create policy "tenant_isolation" on events
  for all using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );
```

Apply same pattern to all tenant-scoped tables.

---

## Indexes

- `events(tenant_id, created_at desc)`  
- `events(tenant_id, type)`  
- `claims_current(tenant_id, external_claim_id)`  
- `payer_intelligence(tenant_id, payer_name, cdt_code)`  
