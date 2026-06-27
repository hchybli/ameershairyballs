# Phase 1 vertical slice (optimized for handoff)

**Goal:** Prove architecture end-to-end on synthetic data. **Not** the full platform.

US product decision: **optimize for dental billing correctness and handoff clarity**, not maximum microservices on day one.

---

## In scope

| Step | Deliverable | Layer |
|------|-------------|-------|
| 1 | Synthetic Dentrix CSV → canonical claim model | L3, L4 |
| 2 | `claim.ingested` events + projectors | L5 |
| 3 | Scrub agent: rules first, Sonnet for ambiguous lines only | L2, L3 |
| 4 | Operator UI: approve / override (reason required) | L1, L2 |
| 5 | Synthetic 835 CSV → `outcome.received` + intelligence seed | L3, L4, L5 |
| 6 | Owner dashboard: **one KPI** — clean-claim rate + drill-down | L1, L5 |

## Out of scope (do not build)

- Jarvis chat (Phase 1.5)  
- Dentrix live API, clearinghouse, payments  
- Biller Console, patient portal  
- Extra agents beyond Scrub  
- Full X12 835 parser (`packages/edi` = interfaces only)  
- PMS features (charting, scheduling, etc.)

---

## KPI definition (locked for Phase 1)

**Clean-claim rate**

```
claims with zero high/critical open flags at gate approval
─────────────────────────────────────────────────────────
                    total claims ingested
```

Drill-down: list claim IDs + link to event timeline.

Alternative KPI ($ flagged) documented in analytics package but **not** Phase 1 default.

---

## Scrub pipeline (locked)

```
1. Deterministic rules (ALL lines)     ← port from src/lib/rules/
2. payer_intelligence lookup           ← if prior outcomes exist
3. Claude Sonnet (ambiguous ONLY)      ← narrative, edge cases
4. emit flag.raised via tools          ← never direct DB write
```

**Tests required:** every rule in `packages/agents` must have unit tests (port existing tests).

---

## Single-app option vs two apps

**Phase 1:** Two apps (`operator`, `owner`) per target architecture — shared `packages/ui` and `packages/auth` to limit duplication.

If schedule pressure: merge into one Vite app with `/workspace` and `/dashboard` routes. Document choice in PR; default is two apps.

---

## Definition of done (checklist)

- [ ] Turborepo builds all packages  
- [ ] `002_event_sourced_schema.sql` applied; RLS tested with two synthetic tenants  
- [ ] Seed script generates claims + 835  
- [ ] Ingest → events → projected claim visible in DB  
- [ ] Scrub runs; flags appear in Operator UI  
- [ ] Override without reason is rejected  
- [ ] Outcomes update `payer_intelligence`  
- [ ] Owner KPI matches manual calculation on seed data  
- [ ] 8+ legacy rule tests still pass (ported)  
- [ ] `docs/` updated if API/event shape changes  
- [ ] US team demo recorded or walkthrough doc updated  

---

## Build order (for Bungaroo)

```
WS-00  Monorepo scaffold + CI
WS-01  DB migrations + RLS + seed
WS-02  packages/core + packages/events
WS-03  packages/integrations (CSV adapters)
WS-04  packages/agents (scrub)
WS-05  Supabase Edge Functions (ingest, scrub, gate, outcomes)
WS-06  apps/operator
WS-07  packages/analytics + packages/intelligence
WS-08  apps/owner
WS-09  E2E demo script + retire legacy path (optional)
```

Details: [WORKSTREAMS.md](./WORKSTREAMS.md)
