# Domain research

**Purpose:** Dental billing ground truth for scrub rules, CSV adapters, and flag taxonomy.  
**Audience:** Bungaroo (implementation), US team (review and extend).

| Document | Status | Used by |
|----------|--------|---------|
| [DENTRIX_EXPORT_FORMAT.md](./DENTRIX_EXPORT_FORMAT.md) | Synthetic schema locked; real export TBD | WS-03 |
| [PAYER_RULES_V1.md](./PAYER_RULES_V1.md) | Starter pack from legacy rules | WS-04 |
| [FLAG_TAXONOMY.md](./FLAG_TAXONOMY.md) | Mapped to events + competitor pain points | WS-04, WS-06 |

**When to update:** New payer rule, new CDT check, or real Dentrix export received from design partner. Same PR as code change per [DOC_MAINTENANCE.md](../DOC_MAINTENANCE.md).
