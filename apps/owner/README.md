# @backstop/owner

**Layer:** L1 Surfaces — Owner Dashboard

## Purpose

Practice owner view: KPI command center (clean-claim rate, denial rate, dollars recovered), drill-down with filters, outcomes upload.

## Workstream

WS-08 — [docs/architecture/WORKSTREAMS.md](../../docs/architecture/WORKSTREAMS.md)

## UX spec

- [USER_FLOWS.md](../../docs/architecture/USER_FLOWS.md)
- [MEDIUM_BUILD.md](../../docs/architecture/MEDIUM_BUILD.md)

## Stack

Vite + React + `@backstop/ui` + `@backstop/analytics`

## Routes

| Route | Function |
|-------|----------|
| `/` | KPI dashboard + drill-down + outcomes upload |

## Acceptance criteria

- [x] KPI tiles — clean-claim rate, denial rate, dollars recovered
- [x] Drill-down filters: open flags / below target / all claims
- [x] KPI matches `analytics-kpi` API
- [x] Outcomes upload with `data/synthetic/sample-outcomes.csv`
- [x] No placeholder module tabs
