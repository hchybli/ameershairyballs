# @backstop/operator

**Layer:** L1 Surfaces — Operator Workspace (Governance Gate UI)

## Purpose

Front-desk / operator app: upload Dentrix CSV, review scrub flags, approve or override (reason required).

## Workstream

WS-06 — see [docs/architecture/WORKSTREAMS.md](../../docs/architecture/WORKSTREAMS.md)

## Stack

Vite + React + TypeScript + Tailwind + `@backstop/ui`

## Routes (planned)

| Route | Function |
|-------|----------|
| `/` | Upload CSV |
| `/claims/:id` | Flag list + gate actions |

## API

Calls Supabase Edge Functions — [API_CONTRACTS.md](../../docs/architecture/API_CONTRACTS.md)

## Acceptance criteria

- [ ] Mobile-first layout
- [ ] Override blocked without reason
- [ ] E2E with `data/synthetic/sample-claims.csv`
