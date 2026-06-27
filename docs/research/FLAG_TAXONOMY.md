# Flag taxonomy — types, severity, competitor mapping

**Purpose:** Single reference for `flag_type` values in events, UI labels, and scrub rules.  
**Event field:** `flag.raised.payload.flag_type` — see [EVENT_CATALOG.md](../architecture/EVENT_CATALOG.md)  
**Workstreams:** WS-04 (scrub), WS-06 (operator UI)

---

## Flag types (Phase 1)

| flag_type | Severity default | Rule source | Operator sees |
|-----------|------------------|-------------|---------------|
| `deprecated_cdt` | critical | cdt-catalog | "Code inactive — replace CDT" |
| `missing_tooth` | high | scrub-claim | "Tooth number required" |
| `missing_quadrant` | high | scrub-claim | "Quadrant required (UR/UL/LR/LL)" |
| `missing_attachment` | high | attachment-rules | Attachment kinds listed |
| `audit_risk` | medium | cdt-catalog | "Audit-magnet code" |
| `fee_leakage` | medium | scrub-claim | "Billed well below allowed" |
| `perio_prophy_conflict` | high | scrub-claim | "Perio maintenance + prophy same claim" |

Phase 2+ (not in Phase 1 scrub): `frequency_violation`, `provider_mismatch`, `eligibility_expired`.

---

## Severity ordering (UI)

Display and queue sort order:

```
critical → high → medium → low
```

Queue row badge uses **highest open severity** on that claim. Claim action view header shows **primary blocker** (highest severity flag reason).

---

## Competitor pain → Backstop flag (from USER_FLOWS)

| Competitor pattern | Example | Backstop flag / UX |
|--------------------|---------|-------------------|
| Vyne rejection in Status Description column | "Entity's Street Address" | Future: `provider_mismatch` — P2 needs provider fields in ingest |
| Vyne rejected claim, reason not on default tab | Hidden in Procedures tab | Primary blocker banner on claim action view |
| InsideDesk repeated portal credential errors | Same error 5× in history | P1.5: tenant-level blocker banner (not per-claim) |
| InsideDesk empty Workflow Status | Dead UI column | Gate states from events only — no empty columns |
| Missing attachment (implicit) | Resend without fix | `missing_attachment` + Approve/Override |

---

## UI components

| Element | Maps to |
|---------|---------|
| Queue "top flag summary" | Highest severity open `flag_type` + short reason |
| `FlagCard` | One open flag — severity pill, type, reason, suggested_fix, actions |
| Primary blocker banner | Copy of highest-severity flag `reason` |
| Override modal | `flag.overridden` event — `reason` required |

Port `FlagCard` from `src/components/claim-flags.tsx`.

---

## Event payload example

```json
{
  "flag_type": "missing_attachment",
  "severity": "high",
  "rule_id": "attachment.d4341",
  "reason": "SRP requires perio chart, radiograph, narrative.",
  "suggested_fix": "Attach documentation before submit."
}
```

---

## Related

- [USER_FLOWS.md](../architecture/USER_FLOWS.md) — interaction rules  
- [PAYER_RULES_V1.md](./PAYER_RULES_V1.md) — attachment rules  
- [MEDIUM_BUILD.md](../architecture/MEDIUM_BUILD.md) — FlagCard wireframes
