# @backstop/owner

**Layer:** L1 Surfaces — Owner Dashboard

## Purpose

Practice owner view: **one KPI** (clean-claim rate), drill-down to claims. No secondary modules or empty charts.

## Workstream

WS-08 — see [docs/architecture/WORKSTREAMS.md](../../docs/architecture/WORKSTREAMS.md)

## UX spec

- [USER_FLOWS.md](../../docs/architecture/USER_FLOWS.md) — owner flow, wireframe
- [MEDIUM_BUILD.md](../../docs/architecture/MEDIUM_BUILD.md) — screen W1, component tree

## Stack

Vite + React + `@backstop/ui` + `@backstop/analytics`

## Routes

| Route | Function |
|-------|----------|
| `/` | KPI dashboard + drill-down + outcomes upload |
| `/claims` | Drill-down list (optional split from `/`) |
| `/claims/:id` | Event timeline (optional P1) |

## Acceptance criteria

- [ ] Single KPI tile — clean-claim rate only
- [ ] KPI matches `analytics-kpi` API
- [ ] Drill-down lists claims with flag count + last event
- [ ] No empty placeholder charts or IQ/Assist-style module tabs
- [ ] Outcomes upload works with `data/synthetic/sample-outcomes.csv`
