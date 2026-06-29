# Project status

**Last updated:** 2026-06-29  
**Phase:** 1 — vertical slice **shipped** (pending agent-fleet PR merge)  
**Strategy:** [STRATEGY.md](./STRATEGY.md) · **Competitors:** [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md)

---

## Summary

| Area | Status |
|------|--------|
| Backend spine (WS-01–05) | **Done** — events, scrub, 7 edge functions, RLS + seed |
| Intelligence + analytics (WS-07) | **Done** — `payer_intelligence`, KPI, payer scorecards |
| Operator app (WS-06) | **Done** — work queue, claim gate, eligibility + denial panels |
| Owner app (WS-08) | **Done** — KPI, drill-down filters, outcomes upload |
| Agent fleet (WS-AGENTS-00→02) | **Done** — on branch `feature/bungaroo/WS-AGENTS-02-denial-prediction` (PR pending) |
| Monorepo (WS-00) | **Not started** — npm workspaces today; Turborepo + pnpm later |
| E2E + legacy retirement (WS-09) | **Not started** |
| Legacy Next.js (`src/`) | Reference only — do not extend |

---

## Workstreams

| ID | Name | Status | Notes |
|----|------|--------|-------|
| WS-00 | Monorepo + CI | not started | Turborepo + pnpm migration |
| WS-01 | DB + RLS + seed | **done** | Migrations 002–006, idempotent seed |
| WS-02 | Events spine | **done** | `@backstop/events` emit + projectors + replay |
| WS-03 | CSV adapters | **done** | `@backstop/integrations` |
| WS-04 | Scrub agent | **done** | `@backstop/agents` rules engine |
| WS-05 | Edge Functions | **done** | 7 functions deployed |
| WS-06 | Operator app | **done** | `@backstop/ui` + work queue + gate |
| WS-07 | Intelligence + analytics | **done** | Scorecards + clean-claim rate |
| WS-08 | Owner app | **done** | KPI + drill-down + filters |
| WS-09 | E2E + legacy retirement | not started | |
| WS-AGENTS-00 | Agent framework | **done** | `@backstop/tools`, `AgentRunner` |
| WS-AGENTS-01 | Eligibility agent | **done** | Synthetic Onederful adapter |
| WS-AGENTS-02 | Denial prediction | **done** | Moat-first from `payer_intelligence` |

---

## Edge functions (live)

`ingest-claims` · `run-scrub` · `gate-action` · `ingest-outcomes` · `analytics-kpi` · `check-eligibility` · `predict-denial`

---

## Demo

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@demo.backstop.local` | `demo-owner-2026!` |
| Operator (Sunrise) | `operator@demo.backstop.local` | `demo-operator-2026!` |

```bash
npm run dev
npx tsx --env-file=.env scripts/dev-sign-in.ts
```

Demo claims: **SYN-CLM-002** (denial risk) · **SYN-CLM-003** (eligibility + flags)

---

## What's next

1. Merge agent-fleet PR to `main`
2. **WS-09** — `scripts/demo-e2e.sh`, deprecate `src/` in README
3. **history.imported** — when de-identified Vyne reports arrive (warm moat seed)
4. **WS-00** — Turborepo + pnpm (optional parallel)

---

## Doc map

| Need | Doc |
|------|-----|
| All docs | [README.md](./README.md) |
| Local dev | [LOCAL_DEV.md](./LOCAL_DEV.md) |
| Bungaroo onboarding | [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md) |
| Open decisions | [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) |
