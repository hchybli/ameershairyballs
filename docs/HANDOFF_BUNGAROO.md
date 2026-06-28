# Handoff guide — Bungaroo India engineering

**Audience:** Offshore dev team taking Backstop from architecture → production  
**Owners (US):** @hchybli, @ameerabouhouli — product, dental domain, final review  
**Status:** WS-01–05 complete — start WS-06 / WS-07 / WS-08  
**Strategy:** [STRATEGY.md](./STRATEGY.md) · [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md)

---

## Start here (read in order)

| # | Document | Time | Purpose |
|---|----------|------|---------|
| 0 | [BUILD_READINESS.md](./BUILD_READINESS.md) | 5 min | **Can we start?** Checklist + build order |
| 1 | [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) | 15 min | Vision, guardrails, dental domain |
| 1b | [STRATEGY.md](./STRATEGY.md) | 10 min | North star, wedge, moat, kill criteria |
| 1c | [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md) | 10 min | Archy / Curve (quarterly) |
| 2 | [architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | 30 min | Six layers, principles, stack |
| 3 | [architecture/PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md) | 15 min | **What to build now** — definition of done |
| 4 | [architecture/WORKSTREAMS.md](./architecture/WORKSTREAMS.md) | 20 min | Epics, owners, acceptance criteria |
| 5 | [architecture/USER_FLOWS.md](./architecture/USER_FLOWS.md) | 20 min | **Why** — work-queue-first vs Vyne/InsideDesk |
| 6 | [architecture/MEDIUM_BUILD.md](./architecture/MEDIUM_BUILD.md) | 20 min | **What** — screens, components, APIs |
| 7 | [architecture/PACKAGE_MAP.md](./architecture/PACKAGE_MAP.md) | 15 min | Monorepo packages and dependencies |
| 8 | [architecture/EVENT_CATALOG.md](./architecture/EVENT_CATALOG.md) | 15 min | Event types + JSON schemas |
| 9 | [research/README.md](./research/README.md) | 10 min | Dentrix CSV, payer rules, flag types |
| 10 | [architecture/LEGACY_REFERENCE.md](./architecture/LEGACY_REFERENCE.md) | 10 min | Port from existing `src/` code |
| 11 | [DOC_MAINTENANCE.md](./DOC_MAINTENANCE.md) | 5 min | Which docs to update per PR |
| 12 | [STATUS.md](./STATUS.md) | 2 min | Living workstream dashboard |

---

## Current repo state vs target

| | **Now (Phase 1 in progress)** | **Target (Phase 1 complete)** |
|---|------------------------------|------------------------------|
| **App** | Vite React `apps/operator` + `apps/owner` | Same + `@backstop/ui` polish |
| **State** | Append-only `events` + projectors (Supabase) | + `@backstop/intelligence` moat |
| **Scrub** | `@backstop/agents` rules engine | + eligibility agent |
| **DB** | Migrations 002–003 + RLS + idempotent seed | Stable |
| **API** | 5 Supabase Edge Functions | Same |
| **Monorepo** | npm workspaces | Turborepo + pnpm (WS-00) |

**Do not extend the Next.js app for new features.** Port logic into packages, then retire `src/`.

---

## Phase 1 definition of done

A reviewer (US team) can run end-to-end on **synthetic data only**:

1. Upload synthetic Dentrix CSV → `claim.ingested` events  
2. Scrub agent raises `flag.raised` events (rules + optional LLM)  
3. Operator resolves flags in UI (approve / override with reason) → gate events  
4. Upload synthetic 835 CSV → `outcome.received` → `payer_intelligence` updated  
5. Owner dashboard shows **one KPI** (clean-claim rate) with drill-down  
6. Multi-tenant RLS enforced; no real PHI in repo  

**Out of scope for Phase 1:** Jarvis chat, Dentrix live API, clearinghouse submit, payments, second+ agents, full X12 parser.

---

## Build order

**Phase A (start now):** WS-00 → WS-05, WS-07 — backend spine, no UI dependency  
**Phase B:** WS-06, WS-08 — follow USER_FLOWS + MEDIUM_BUILD  
**Phase C:** WS-09 — E2E + retire legacy  

Details: [BUILD_READINESS.md](./BUILD_READINESS.md)

---

## Git workflow (distributed team)

```
main
 └── feature/bungaroo/WS-01-events-spine
 └── feature/bungaroo/WS-03-scrub-agent
```

- Branch prefix: `feature/bungaroo/<workstream-id>-<short-name>`  
- One workstream per PR when possible  
- PR description must link: workstream ID + acceptance criteria checkbox  
- US team reviews all PRs to `main`  
- Commit messages: `WS-03: Add scrub rules port from legacy`

---

## Environment & access (US team provisions)

| Item | Who sets up |
|------|-------------|
| GitHub repo access | @hchybli |
| Supabase project (dev) | US team |
| AWS dev account / IAM | US team |
| Anthropic API key (dev) | US team → `.env` only, never git |
| Resend | Later |

Copy `.env.example` → `.env.local`. **Never commit secrets.**

---

## Communication

- **Spec questions** → comment on PR or `docs/OPEN_QUESTIONS.md`  
- **Scope creep** → stop and ask US team; do not build ahead of [PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md)  
- **Dental / CDT questions** → tag US team; see [research/PAYER_RULES_V1.md](./research/PAYER_RULES_V1.md)  

---

## Quality bar

- TypeScript `strict` everywhere  
- Tests required for: scrub rules, event projectors, CSV adapters, KPI calculation  
- No `any` in domain packages  
- RLS on every tenant table from first migration  

---

## Questions before coding?

Open a PR that only updates `docs/OPEN_QUESTIONS.md` or comment on the relevant workstream in [WORKSTREAMS.md](./architecture/WORKSTREAMS.md).
