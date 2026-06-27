# Project status

**Last updated:** 2026-06-26  
**Phase:** 1 vertical slice — **pre-build organization complete**  
**Updated by:** US team (doc + UX wiring pass)

---

## Summary

| Area | Status |
|------|--------|
| Product vision | Documented |
| Architecture + workstreams | **Done** |
| UX flows (Vyne / InsideDesk) | **Done** — [USER_FLOWS.md](./architecture/USER_FLOWS.md) |
| Medium build spec | **Done** — aligned with USER_FLOWS |
| Domain research (starter) | **Done** — [research/](./research/README.md) |
| Build readiness checklist | **Done** — [BUILD_READINESS.md](./BUILD_READINESS.md) |
| Legacy Next.js prototype | **Done** — reference only (`src/`) |
| Turborepo monorepo | Not started (WS-00) — **ready to start** |
| Event-sourced DB | Migration written, not applied (WS-01) |
| Operator app | Not started (WS-06) — UX locked |
| Owner app | Not started (WS-08) — UX locked |

---

## Workstreams

| ID | Name | Status | Owner | Notes |
|----|------|--------|-------|-------|
| WS-00 | Monorepo + CI | not started | Bungaroo | **Start here** |
| WS-01 | DB + RLS + seed | not started | Bungaroo | |
| WS-02 | Events spine | not started | Bungaroo | |
| WS-03 | Core + CSV adapters | not started | Bungaroo | Synthetic CSV locked |
| WS-04 | Scrub agent | not started | Bungaroo | US reviews rules |
| WS-05 | Edge Functions | not started | Bungaroo | |
| WS-06 | Operator app | not started | Bungaroo | Spec: USER_FLOWS + MEDIUM_BUILD |
| WS-07 | Analytics + intelligence | not started | Bungaroo | |
| WS-08 | Owner app | not started | Bungaroo | Single KPI locked |
| WS-09 | E2E + legacy retirement | not started | Bungaroo | |

---

## Doc map (quick links)

| Need | Doc |
|------|-----|
| Start building | [BUILD_READINESS.md](./BUILD_READINESS.md) |
| Bungaroo onboarding | [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md) |
| What screens look like | [MEDIUM_BUILD.md](./architecture/MEDIUM_BUILD.md) + [canvas](../canvases/backstop-phase1-build.canvas.tsx) |
| Why we designed it this way | [USER_FLOWS.md](./architecture/USER_FLOWS.md) |
| Payer / CDT rules | [research/PAYER_RULES_V1.md](./research/PAYER_RULES_V1.md) |

---

## Demo

| Demo | How |
|------|-----|
| Legacy (now) | `npm run dev` → upload `data/synthetic/sample-claims.csv` |
| Target (Phase 1) | `scripts/demo-e2e.sh` (WS-09) |
| Visual preview | [Canvas: Phase 1 build](/Users/ameerabouhouli/.cursor/projects/Users-ameerabouhouli-ameershairyballs-ameershairyballs/canvases/backstop-phase1-build.canvas.tsx) |

---

## Open decisions

See [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md). Does **not** block WS-00–WS-05.

---

## How to update this file

Every PR that completes or starts a workstream must update the table above. See [DOC_MAINTENANCE.md](./DOC_MAINTENANCE.md).
