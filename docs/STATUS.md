# Project status

**Last updated:** 2026-06-28  
**Phase:** 1 in progress — Supabase spine + React apps  
**Strategy:** [STRATEGY.md](./STRATEGY.md) · **Competitors:** [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md)

---

## Summary

| Area | Status |
|------|--------|
| Product vision + strategy | **Done** — [STRATEGY.md](./STRATEGY.md), [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) |
| Architecture + workstreams | **Done** — [WORKSTREAMS.md](./architecture/WORKSTREAMS.md) |
| Backend spine (WS-01–05) | **Done** — events, scrub, edge functions, RLS + seed |
| Monorepo | **npm workspaces** (Turborepo/pnpm = WS-00 target) |
| Operator app | **Rough draft** — wired to Supabase; WS-06 polish pending |
| Owner app | **Rough draft** — KPI stub; WS-08 pending |
| Intelligence moat (WS-07) | **Stub** — projector + scorecard next |
| Legacy Next.js | Reference only (`src/`) — do not extend |

---

## Workstreams

| ID | Name | Status | Notes |
|----|------|--------|-------|
| WS-00 | Monorepo + CI | not started | Turborepo + pnpm migration |
| WS-01 | DB + RLS + seed | **done** | Migrations 002–003, idempotent seed, RLS tests |
| WS-02 | Events spine | **done** | `@backstop/events` emit + projectors + replay |
| WS-03 | CSV adapters | **done** | `@backstop/integrations` + parity tests |
| WS-04 | Scrub agent | **done** | `@backstop/agents` rules engine |
| WS-05 | Edge Functions | **done** | 5 functions; Express API removed |
| WS-06 | Operator app | **done** | `@backstop/ui` + ranked worklist + gate polish |
| WS-07 | Intelligence + analytics | **done** | `@backstop/intelligence` scorecards + avg_paid fix |
| WS-08 | Owner app | **done** | KPI command center + payer scorecard |
| WS-09 | E2E + legacy retirement | not started | |

---

## Doc map

| Need | Doc |
|------|-----|
| North star | [STRATEGY.md](./STRATEGY.md) |
| Competitors | [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md) |
| Local dev | [LOCAL_DEV.md](./LOCAL_DEV.md) |
| Bungaroo onboarding | [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md) |
| Reconcile history | [DOC_RECONCILE_LOG.md](./DOC_RECONCILE_LOG.md) |

---

## Demo

| Demo | How |
|------|-----|
| **React apps** | `npm run dev:operator` + `npm run dev:owner` — see [LOCAL_DEV.md](./LOCAL_DEV.md) |
| **Synthetic auth** | `owner@demo.backstop.local` / `demo-owner-2026!`, `operator@demo.backstop.local` / `demo-operator-2026!` |
| Legacy Next.js | `npm run dev:legacy` — reference only |

---

## Open decisions

[OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md)
