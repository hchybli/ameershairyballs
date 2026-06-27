# Event catalog

Append-only. All payloads include `tenant_id`. Projectors derive read models.

**Version:** `event_schema_version: 1` in payload until breaking change.

---

## Event types (Phase 1)

| Type | Emitted by | Trigger |
|------|------------|---------|
| `claim.ingested` | ingest-claims | CSV parsed successfully |
| `flag.raised` | scrub agent | Rule or LLM finds issue |
| `flag.approved` | gate-action | Operator accepts flag |
| `flag.overridden` | gate-action | Operator overrides (reason required) |
| `fix.applied` | gate-action or agent | Auto-fix or manual fix logged |
| `outcome.received` | ingest-outcomes | 835/ERA row processed |

---

## `claim.ingested`

```json
{
  "event_schema_version": 1,
  "tenant_id": "uuid",
  "clinic_id": "uuid",
  "external_claim_id": "SYN-CLM-001",
  "patient_ref": "SYN-PAT-001",
  "payer_name": "Delta Dental",
  "lines": [
    {
      "cdt_code": "D1110",
      "fee_billed": 125.0,
      "fee_allowed": 95.0,
      "tooth": null,
      "quadrant": null
    }
  ],
  "source": "csv_dentrix",
  "ingested_at": "2026-06-26T12:00:00Z"
}
```

**Projector:** upsert `claims_current`, insert `claim_lines_current`.

---

## `flag.raised`

```json
{
  "event_schema_version": 1,
  "tenant_id": "uuid",
  "claim_id": "uuid",
  "external_claim_id": "SYN-CLM-002",
  "line_index": 0,
  "cdt_code": "D4341",
  "flag_type": "missing_attachment",
  "severity": "high",
  "dollar_impact": 275.0,
  "reason": "SRP requires perio chart, radiograph, narrative.",
  "suggested_fix": "Attach documentation before submit.",
  "raised_by": "scrub_agent",
  "rule_id": "attachment.d4341"
}
```

**Projector:** insert `flags_open`.

---

## `flag.approved`

```json
{
  "event_schema_version": 1,
  "tenant_id": "uuid",
  "flag_id": "uuid",
  "claim_id": "uuid",
  "actor_id": "uuid",
  "actor_role": "operator"
}
```

**Projector:** move flag to `flags_resolved` with status `approved`.

---

## `flag.overridden`

```json
{
  "event_schema_version": 1,
  "tenant_id": "uuid",
  "flag_id": "uuid",
  "claim_id": "uuid",
  "actor_id": "uuid",
  "actor_role": "operator",
  "reason": "Attachment sent separately via portal; documented in chart."
}
```

**`reason` is required** — reject gate-action if empty.

**Projector:** move flag to `flags_resolved` with status `overridden`.

---

## `fix.applied`

```json
{
  "event_schema_version": 1,
  "tenant_id": "uuid",
  "claim_id": "uuid",
  "flag_id": "uuid | null",
  "auto": true,
  "description": "Normalized quadrant UR",
  "applied_by": "scrub_agent"
}
```

---

## `outcome.received`

```json
{
  "event_schema_version": 1,
  "tenant_id": "uuid",
  "external_claim_id": "SYN-CLM-002",
  "claim_id": "uuid",
  "result": "denied",
  "paid_amount": 0,
  "remark_code": "CO-97",
  "remark_text": "Benefit maximum reached",
  "source": "csv_835_simplified",
  "observed_at": "2026-06-26T15:00:00Z"
}
```

**Projector:**
- append `outcomes` (append-only table)
- upsert `payer_intelligence` per line CDT on claim

---

## Idempotency

- `claim.ingested`: dedupe on `(tenant_id, external_claim_id, source_file_hash)` if re-upload  
- `outcome.received`: allow multiple per claim (appeals); include `observed_at` in uniqueness if needed  

Document idempotency keys in Edge Function implementation.
