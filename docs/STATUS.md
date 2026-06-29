# Project status

**Last updated:** 2026-06-29  
**Phase:** 1 vertical slice **merged to `main`** (`40683a6`)  
**Strategy:** [STRATEGY.md](./STRATEGY.md) · **Competitors:** [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md)

---

## Summary

| Area | Status |
|------|--------|
| Backend spine (WS-01–05) | **Done** — events, scrub, 7 edge functions, RLS + seed |
| Intelligence + analytics (WS-07) | **Done** — `payer_intelligence`, KPI, payer scorecards |
| Operator app (WS-06) | **Done** — work queue, claim gate, eligibility + denial panels |
| Owner app (WS-08) | **Done** — KPI, drill-down filters, outcomes upload |
| Agent fleet (WS-AGENTS-00→02) | **Done** — merged to `main` |
| E2E demo (WS-09) | **Done** — `npm run demo:e2e` |
| Monorepo (WS-00) | **Not started** — npm workspaces today; Turborepo + pnpm later |
| Legacy Next.js (`src/`) | **Deprecated** — see `src/README.md` |

---

## Workstreams

| ID | Name | Status | Notes |
|----|------|--------|-------|
| WS-00 | Monorepo + CI | not started | Turborepo + pnpm migration |
| WS-01 | DB + RLS + seed | **done** | Migrations 002–006 |
| WS-02 | Events spine | **done** | |
| WS-03 | CSV adapters | **done** | |
| WS-04 | Scrub agent | **done** | |
| WS-05 | Edge Functions | **done** | 7 functions |
| WS-06 | Operator app | **done** | |
| WS-07 | Intelligence + analytics | **done** | |
| WS-08 | Owner app | **done** | |
| WS-09 | E2E + legacy retirement | **done** | `demo-e2e.sh`, `src/README.md` |
| WS-AGENTS-00 | Agent framework | **done** | |
| WS-AGENTS-01 | Eligibility agent | **done** | |
| WS-AGENTS-02 | Denial prediction | **done** | |
| WS-AGENTS-03 | History import | not started | De-identified Vyne exports |

---

## Edge functions (live)

`ingest-claims` · `run-scrub` · `gate-action` · `ingest-outcomes` · `analytics-kpi` · `check-eligibility` · `predict-denial`

---

## Demo

```bash
npm run seed
npm run dev
npm run demo:e2e              # playbook
npm run demo:e2e -- --auto    # headless API path
npx tsx --env-file=.env scripts/dev-sign-in.ts
```

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@demo.backstop.local` | `demo-owner-2026!` |
| Operator | `operator@demo.backstop.local` | `demo-operator-2026!` |

Demo claims: **SYN-CLM-002** (denial risk) · **SYN-CLM-003** (eligibility + flags)

---

## What's next

1. **WS-AGENTS-03** — `history.imported` when de-identified Vyne reports arrive
2. **WS-00** — Turborepo + pnpm (optional)
3. Remove legacy `src/` after US sign-off

---

## Doc map

| Need | Doc |
|------|-----|
| All docs | [README.md](./README.md) |
| Local dev | [LOCAL_DEV.md](./LOCAL_DEV.md) |
| Bungaroo onboarding | [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md) |
