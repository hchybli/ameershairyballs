# Build readiness — Phase 1 checklist

**Purpose:** Locked decisions and verification gates for Phase 1.  
**Last updated:** 2026-06-29  
**Living status:** [STATUS.md](./STATUS.md)

---

## Phase 1 spine — complete

| Workstream | Status |
|------------|--------|
| WS-01 DB + RLS + seed | Done |
| WS-02 Events spine | Done |
| WS-03 CSV adapters | Done |
| WS-04 Scrub agent | Done |
| WS-05 Edge Functions (7) | Done |
| WS-06 Operator app | Done |
| WS-07 Intelligence + analytics | Done |
| WS-08 Owner app | Done |
| WS-AGENTS-00→02 Agent fleet | Done (PR pending merge) |

---

## UX decisions (locked)

From [USER_FLOWS.md](./architecture/USER_FLOWS.md):

| Decision | Choice |
|----------|--------|
| Operator default home | Work queue (`/`) |
| Claim detail | Single action view — flag cards, agent panels, no entity tabs |
| Upload | Secondary route `/upload` |
| Owner dashboard | Clean-claim rate KPI + drill-down filters |
| Override | Reason required |
| Phase 1 submit | Out of scope — gate only |

---

## Technical decisions (locked)

| Decision | Choice |
|----------|--------|
| Monorepo | **npm workspaces** (Turborepo + pnpm = WS-00, not started) |
| Frontend | Vite React SPA — not Next.js for new code |
| Backend | Supabase Postgres + Auth + Edge Functions + RLS |
| State | Append-only events + projectors |
| Scrub | Rules → payer_intelligence → Sonnet (ambiguous only) |
| Eligibility (Phase 1) | Synthetic Onederful-shaped adapter; live Vyne later |
| Denial prediction | Moat-first from `payer_intelligence`; LLM for reason text only |
| Apps | `apps/operator` + `apps/owner` |
| Legacy `src/` | Do not extend |

---

## Verification (run before every merge)

```bash
npm run verify
```

Includes: edge import check, build, unit tests, smoke (handlers + RLS), click-through.

---

## Still open (production, not Phase 1 build)

| Item | Doc |
|------|-----|
| Project name, pricing, design partner | [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) |
| Submit vs hand-back (Phase 4) | [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) |
| Payer rule sign-off | [research/PAYER_RULES_V1.md](./research/PAYER_RULES_V1.md) |
| Real Dentrix column validation | Design partner clinic |

---

## Optional next workstreams

| ID | What |
|----|------|
| WS-09 | E2E demo script + legacy retirement |
| WS-00 | Turborepo + pnpm |
| history.imported | Warm moat from de-identified Vyne exports |

See [PARALLEL_WORK.md](../PARALLEL_WORK.md) for independent branches.
