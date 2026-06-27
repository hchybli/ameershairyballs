# @backstop/operator

**Layer:** L1 Surfaces — Operator Workspace (Governance Gate UI)

## Purpose

Front-desk / operator app: **work queue first**, resolve scrub flags, approve or override (reason required). CSV upload is secondary.

## Workstream

WS-06 — see [docs/architecture/WORKSTREAMS.md](../../docs/architecture/WORKSTREAMS.md)

## UX spec

- [USER_FLOWS.md](../../docs/architecture/USER_FLOWS.md) — flows, wireframes, interaction rules
- [MEDIUM_BUILD.md](../../docs/architecture/MEDIUM_BUILD.md) — screens O1–O3, component tree, APIs

## Stack

Vite + React + TypeScript + Tailwind + shadcn + `@backstop/ui`

## Routes

| Route | Function | Default? |
|-------|----------|----------|
| `/` | Work queue — compact claim rows with top flag | **Yes** |
| `/claims/:id` | Claim action view — flag cards, primary blocker | |
| `/upload` | CSV ingest → redirect to queue | |
| `/outcomes/upload` | 835 ingest (optional P1) | |

## API

Calls Supabase Edge Functions — [API_CONTRACTS.md](../../docs/architecture/API_CONTRACTS.md)

## Acceptance criteria

- [ ] Default route is work queue, not upload
- [ ] ≥10 queue rows visible at 1080p
- [ ] All open flags visible without tab navigation
- [ ] Primary blocker in claim header
- [ ] Override blocked without reason
- [ ] Mobile-first — ≥44px touch targets on gate actions
- [ ] E2E with `data/synthetic/sample-claims.csv`
