# Handoff guide — Bungaroo India engineering

**Audience:** Offshore dev team  
**US owners:** @hchybli, @ameerabouhouli — product, dental domain, final review  
**Status:** Phase 1 vertical slice **complete** — agent fleet PR pending merge  
**Strategy:** [STRATEGY.md](./STRATEGY.md)

---

## Start here (read in order)

| # | Document | Time | Purpose |
|---|----------|------|---------|
| 0 | [STATUS.md](./STATUS.md) | 2 min | **What's done / what's next** |
| 1 | [LOCAL_DEV.md](./LOCAL_DEV.md) | 10 min | Run apps, seed, verify, deploy |
| 2 | [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) | 15 min | Vision, guardrails, dental domain |
| 3 | [STRATEGY.md](./STRATEGY.md) | 10 min | North star, wedge, moat |
| 4 | [architecture/PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md) | 15 min | Phase 1 definition of done |
| 5 | [architecture/WORKSTREAMS.md](./architecture/WORKSTREAMS.md) | 20 min | Epics + acceptance criteria |
| 6 | [architecture/USER_FLOWS.md](./architecture/USER_FLOWS.md) | 20 min | UX flows (locked) |
| 7 | [architecture/MEDIUM_BUILD.md](./architecture/MEDIUM_BUILD.md) | 20 min | Screens, components, APIs |
| 8 | [DOC_MAINTENANCE.md](./DOC_MAINTENANCE.md) | 5 min | Update docs with every PR |

Full index: [docs/README.md](./README.md)

---

## Current repo state

| | **Now** | **Do not build yet** |
|---|---------|----------------------|
| **Apps** | Vite `apps/operator` + `apps/owner` | Legacy Next.js `src/` |
| **State** | Append-only events + projectors | Direct DB mutation from agents |
| **Scrub** | Rules engine + `@backstop/tools` | — |
| **Agents** | Eligibility + denial prediction (synthetic) | Live Vyne OAuth, Jarvis |
| **DB** | Migrations 002–006 + RLS | Real PHI |
| **API** | 7 Supabase Edge Functions | Express `apps/api` (removed) |
| **Monorepo** | npm workspaces | Turborepo + pnpm (WS-00) |

---

## Phase 1 definition of done

A reviewer can run end-to-end on **synthetic data only**:

1. Upload Dentrix CSV → `claim.ingested`
2. Scrub raises `flag.raised` (rules)
3. Operator resolves flags (approve / override with reason)
4. Eligibility + denial agents run on claim detail
5. Upload 835 CSV → `outcome.received` → `payer_intelligence` updated
6. Owner dashboard shows clean-claim rate + drill-down
7. Multi-tenant RLS enforced

**Out of scope:** Jarvis, Dentrix live API, clearinghouse submit, payments, PMS features.

---

## Git workflow

```
main
 └── feature/bungaroo/WS-XX-short-name
```

- Branch prefix: `feature/bungaroo/<workstream-id>-<short-name>`
- One workstream per PR when possible
- PR links workstream ID + acceptance criteria
- Run `npm run verify` before every PR

---

## Quality bar

- TypeScript `strict`
- Tests for scrub rules, projectors, adapters, KPI math
- RLS on every tenant table
- No real PHI, no secrets in git
- Agents emit events via tools — never direct DB writes

---

## Questions

[OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) · comment on PR · tag US team for dental/CDT questions
