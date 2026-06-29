# @backstop/operator

**Layer:** L1 Surfaces — Operator Workspace (Governance Gate UI)

## Purpose

Front-desk / operator app: **work queue first**, resolve scrub flags, approve or override (reason required). Eligibility + denial agent panels on claim detail.

## Workstream

WS-06 — [docs/architecture/WORKSTREAMS.md](../../docs/architecture/WORKSTREAMS.md)

## UX spec

- [USER_FLOWS.md](../../docs/architecture/USER_FLOWS.md)
- [MEDIUM_BUILD.md](../../docs/architecture/MEDIUM_BUILD.md)

## Stack

Vite + React + TypeScript + Tailwind + `@backstop/ui`

## Routes

| Route | Function | Default? |
|-------|----------|----------|
| `/` | Work queue | **Yes** |
| `/claims/:id` | Claim action view — flags + agent panels | |
| `/upload` | CSV ingest | |

## API

Supabase Edge Functions — [API_CONTRACTS.md](../../docs/architecture/API_CONTRACTS.md)

## Acceptance criteria

- [x] Default route is work queue, not upload
- [x] All open flags visible without tab navigation
- [x] Override blocked without reason
- [x] Eligibility + denial panels on claim detail
- [x] E2E with `data/synthetic/sample-claims.csv`
