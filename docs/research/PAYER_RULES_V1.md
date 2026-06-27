# Payer rules v1 — starter pack

**Status:** Ported from legacy `src/lib/rules/`. US team reviews before production.  
**Workstream:** WS-04 — `packages/agents/src/scrub/rules/`  
**Payers in synthetic data:** Delta Dental, MetLife Dental, Cigna Dental

---

## Attachment rules (base — all payers)

| CDT | Required attachments | Severity if missing |
|-----|---------------------|---------------------|
| D4341 | perio_chart, radiograph, narrative | high |
| D4342 | perio_chart, radiograph, narrative | high |
| D4910 | perio_chart | high |
| D2950 | radiograph, narrative | high |
| D2740 | radiograph | high |
| D9999 | narrative | high |
| Crown codes (D27xx) | radiograph | high |

Source: `attachment-rules.ts` → `BASE_ATTACHMENT_RULES`.

---

## Payer-specific overrides (v1)

| Payer | CDT | Extra required | Note |
|-------|-----|----------------|------|
| Delta Dental | D2740 | narrative | Crown over existing restoration |
| MetLife Dental | — | — | No overrides in v1 starter |
| Cigna Dental | D4341 | narrative | Detailed SRP narrative |

Normalization: payer name compared lowercase trimmed (`"delta dental"`, etc.).

---

## Non-attachment rules (from scrub engine)

| Rule | flag_type | Severity | Trigger |
|------|-----------|----------|---------|
| Deprecated CDT | `deprecated_cdt` | critical | Code in deprecated set |
| Missing tooth | `missing_tooth` | high | Crown/buildup without tooth |
| Missing quadrant | `missing_quadrant` | high | SRP without UR/UL/LR/LL |
| Audit risk | `audit_risk` | medium | D4341, D4342, D4910, D2950 |
| Fee leakage | `fee_leakage` | medium | Billed >15% below allowed |
| Perio/prophy conflict | `perio_prophy_conflict` | high | D4910 + D1110 same claim |

Full mapping: [FLAG_TAXONOMY.md](./FLAG_TAXONOMY.md).

---

## Outcome learning (Phase 1)

When `outcome.received` events exist, scrub reads `payer_intelligence` before raising duplicate flags.

Example: if Delta denied D4341 for missing narrative twice, intel may lower false-positive rate or raise confidence.

---

## US review checklist

- [ ] Delta D2740 narrative rule confirmed  
- [ ] Cigna D4341 narrative rule confirmed  
- [ ] MetLife — any SRP-specific requirements?  
- [ ] Frequency rules (D1110 every 6 months) — Phase 2  
- [ ] Provider address validation — needs PMS fields not in Phase 1 CSV  

---

## Related

- Legacy implementation: `src/lib/rules/attachment-rules.ts`, `scrub-claim.ts`  
- Event shape: `flag.raised` in [EVENT_CATALOG.md](../architecture/EVENT_CATALOG.md)  
- Competitor context: provider address rejections in [USER_FLOWS.md](../architecture/USER_FLOWS.md)
