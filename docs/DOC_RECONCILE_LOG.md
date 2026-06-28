# Documentation reconcile log

**Date:** 2026-06-28  
**Branch:** `docs/strategy-and-reconcile`  
**Tip before branch:** `feature/bungaroo/WS-05-edge-functions` @ `c1334c3`

---

## Method

Read all `docs/**/*.md`, root `PROJECT_OVERVIEW.md`, `.cursor/rules/project.mdc`, and verified against repo reality (package.json workspaces, supabase migrations, edge functions, test scripts, git history WS-01–05).

**Principles applied:**

- Preserve intent; fix factual accuracy
- Scope language: **billing now, full PMS later** (not "billing only forever")
- Stack: **npm workspaces today** → Turborepo/pnpm target (WS-00)
- Backend: **Supabase Edge Functions live** — Express `apps/api` removed in WS-05

---

## Files created

| File | Purpose |
|------|---------|
| [STRATEGY.md](./STRATEGY.md) | North-star strategy (win condition, wedge, moat, agent fleet, kill criteria) |
| [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md) | Archy / Curve quarterly brief (2026-Q2) |
| [WEB_RADAR.md](./WEB_RADAR.md) | Dated web-sweep log per standing directive |
| DOC_RECONCILE_LOG.md | This file |

---

## Files updated (this PR)

| File | What was stale | Fix |
|------|----------------|-----|
| `.cursor/rules/project.mdc` | Turborepo/pnpm listed as current; missing SELF-VERIFY + WEB RADAR | STACK section split actual vs target; merged two directives; cross-linked STRATEGY + COMPETITIVE_BRIEF |
| [STATUS.md](./STATUS.md) | WS-00–05 "not started"; Express API; migration not applied | WS-01–05 done; edge functions; npm workspaces; demo auth |
| [LOCAL_DEV.md](./LOCAL_DEV.md) | Express API + in-memory store | Supabase + edge functions; Vite apps; seed + test commands |
| [BUILD_READINESS.md](./BUILD_READINESS.md) | "Ready to start WS-00"; Turborepo as current | Phase A spine complete; note WS-00 migration pending |
| [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md) | "Start WS-00"; legacy vs target table outdated | Current state WS-01–05; next WS-06/07/08 |
| [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) | Vision only; no strategy doc links | Link STRATEGY + COMPETITIVE_BRIEF; scope wording billing-now/PMS-later |
| [STRATEGY_REDTEAM.md](./STRATEGY_REDTEAM.md) | Counter 1 | Increment to 2 (no red-team this session) |

---

## Files reviewed — no change needed (accurate enough)

| File | Notes |
|------|-------|
| architecture/ARCHITECTURE.md | Target architecture still valid; LOCAL_DEV carries "today" delta |
| architecture/PHASE_1_SLICE.md | DoD still correct; implementation partially complete |
| architecture/WORKSTREAMS.md | Acceptance criteria still valid; STATUS tracks completion |
| architecture/USER_FLOWS.md, MEDIUM_BUILD.md | UX spec unchanged |
| architecture/EVENT_CATALOG.md, API_CONTRACTS.md, DATA_MODEL.md | Match implemented events |
| research/* | Domain reference; not implementation status |
| OPEN_QUESTIONS.md | Still open; no contradiction |
| FEATURE_ROADMAP.md | Stage framing aligns after PROJECT_OVERVIEW tweak |
| DEMO_WALKTHROUGH.md | Legacy flow doc — header note sufficient |
| DOC_MAINTENANCE.md | Process doc still valid |

---

## Known remaining doc debt (not blocking code chain)

| Item | Owner |
|------|-------|
| WORKSTREAMS.md checkboxes still `[ ]` — completion tracked in STATUS | Update when WS-06+ land |
| Turborepo migration (WS-00) — docs say "target" consistently | WS-00 PR |
| Edge deploy runbook in LOCAL_DEV (human Supabase CLI auth) | After first deploy doc |
| CURSOR_*.md session queues reference old stack | Low priority automation docs |

---

## Repo reality snapshot (2026-06-28)

```
Stack:     npm workspaces, TypeScript strict, Vite React SPAs
Backend:   Supabase Postgres + RLS + 5 Edge Functions
Packages:  events, handlers, api-client, agents, integrations, core, analytics (partial), db
Apps:      operator, owner (no apps/api)
Tests:     test, test:events, test:seed, test:handlers (all green at WS-05 tip)
Live DB:   ndgembdlqevybokxikkd (synthetic seed)
Legacy:    src/ Next.js — reference only, do not extend
```
