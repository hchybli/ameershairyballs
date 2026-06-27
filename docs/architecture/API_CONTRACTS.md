# API contracts — Supabase Edge Functions

**Auth:** `Authorization: Bearer <supabase_jwt>`  
**Tenant:** derived from JWT `app_metadata.tenant_id` — never trust client-sent tenant id.

**Content-Type:** `multipart/form-data` for CSV uploads; `application/json` for actions.

---

## `POST /functions/v1/ingest-claims`

Upload Dentrix-export CSV.

**Request:** `multipart/form-data`
- `file` — CSV file
- `clinic_id` — uuid (must belong to tenant)

**Response 200:**
```json
{
  "claims_ingested": 3,
  "lines_ingested": 5,
  "event_ids": ["uuid", "..."],
  "errors": []
}
```

**Errors:** 400 parse failure, 401 unauth, 403 clinic not in tenant

---

## `POST /functions/v1/run-scrub`

Run scrub agent on claim(s).

**Request:**
```json
{
  "claim_ids": ["uuid"],
  "use_llm": true
}
```

**Response 200:**
```json
{
  "flags_raised": 4,
  "event_ids": ["uuid"]
}
```

---

## `POST /functions/v1/gate-action`

Operator approve or override.

**Request:**
```json
{
  "flag_id": "uuid",
  "action": "approve" | "override",
  "reason": "required when action is override"
}
```

**Response 200:**
```json
{
  "event_id": "uuid",
  "status": "approved" | "overridden"
}
```

**Errors:** 400 if override without reason

---

## `POST /functions/v1/ingest-outcomes`

Upload simplified 835/ERA CSV.

**Request:** `multipart/form-data` — `file`

**Response 200:**
```json
{
  "outcomes_recorded": 3,
  "intelligence_rows_updated": 5,
  "warnings": ["Outcome for X has no matching claim"],
  "errors": []
}
```

---

## `GET /functions/v1/analytics-kpi?metric=clean_claim_rate&from=&to=`

**Response 200:**
```json
{
  "metric": "clean_claim_rate",
  "value": 0.67,
  "numerator": 2,
  "denominator": 3,
  "drill_down": [
    {
      "claim_id": "uuid",
      "external_claim_id": "SYN-CLM-001",
      "clean": true,
      "high_critical_flags": 0
    }
  ]
}
```

---

## Error envelope (all functions)

```json
{
  "error": "human readable",
  "code": "PARSE_ERROR | FORBIDDEN | VALIDATION",
  "details": {}
}
```

---

## Local invocation

```bash
supabase functions serve ingest-claims --env-file .env.local
curl -X POST http://localhost:54321/functions/v1/ingest-claims \
  -H "Authorization: Bearer $JWT" \
  -F "file=@data/synthetic/sample-claims.csv" \
  -F "clinic_id=$CLINIC_ID"
```
