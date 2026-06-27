# Handoff guide — Bungaroo India engineering

**Audience:** Offshore dev team taking Backstop from architecture → production  
**Owners (US):** @hchybli, @ameerabouhouli — product, dental domain, final review  
**Status:** Architecture locked for Phase 1 slice; legacy prototype in `src/` is **reference only**

---

## Start here (read in order)

| # | Document | Time | Purpose |
|---|----------|------|---------|
| 1 | [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) | 15 min | Vision, guardrails, dental domain |
| 2 | [architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | 30 min | Six layers, principles, stack |
| 3 | [architecture/PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md) | 15 min | **What to build now** — definition of done |
| 4 | [architecture/WORKSTREAMS.md](./architecture/WORKSTREAMS.md) | 20 min | Epics, owners, acceptance criteria |
| 5 | [architecture/PACKAGE_MAP.md](./architecture/PACKAGE_MAP.md) | 15 min | Monorepo packages and dependencies |
| 6 | [architecture/EVENT_CATALOG.md](./architecture/EVENT_CATALOG.md) | 15 min | Event types + JSON schemas |
| 7 | [architecture/LEGACY_REFERENCE.md](./architecture/LEGACY_REFERENCE.md) | 10 min | Port from existing `src/` code |

---

## Current repo state vs target

| | **Now (legacy)** | **Target (Phase 1)** |
|---|------------------|----------------------|
| **App** | Next.js 14 monolith in `src/` | Turborepo: `apps/operator` + `apps/owner` (Vite React SPA) |
| **State** | In-memory demo store | Append-only `events` + read-model projectors |
| **Scrub** | Rule engine in `src/lib/rules/` | `packages/agents` — rules first, Sonnet for ambiguous only |
| **DB** | `supabase/migrations/001_*` (CRUD-style) | `002_event_sourced_schema.sql` + RLS |
| **Deploy** | `npm run dev` locally | Supabase + AWS (see architecture doc) |

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
- **Dental / CDT questions** → tag US team; do not guess payer rules  

---

## Quality bar

- TypeScript `strict` everywhere  
- Tests required for: scrub rules, event projectors, CSV adapters, KPI calculation  
- No `any` in domain packages  
- RLS on every tenant table from first migration  

---

## Questions before coding?

Open a PR that only updates `docs/OPEN_QUESTIONS.md` or comment on the relevant workstream in [WORKSTREAMS.md](./architecture/WORKSTREAMS.md).
