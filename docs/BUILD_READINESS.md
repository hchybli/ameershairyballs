# Build readiness — pre-implementation checklist

**Purpose:** Checklist for Phase 1 delivery. Backend spine (WS-01–05) is **complete**; UI + intelligence next.  
**Last updated:** 2026-06-28  
**Strategy:** [STRATEGY.md](./STRATEGY.md) · **Status:** [STATUS.md](./STATUS.md)

---

## Doc system (complete)

| Item | Doc | Status |
|------|-----|--------|
| Offshore onboarding | [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md) | Done |
| Platform architecture | [architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | Done |
| Phase 1 scope | [architecture/PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md) | Done |
| Workstreams WS-00–09 | [architecture/WORKSTREAMS.md](./architecture/WORKSTREAMS.md) | Done |
| Events + APIs + schema | EVENT_CATALOG, API_CONTRACTS, DATA_MODEL | Done |
| UX flows (Vyne/InsideDesk) | [architecture/USER_FLOWS.md](./architecture/USER_FLOWS.md) | Done |
| Screen build spec | [architecture/MEDIUM_BUILD.md](./architecture/MEDIUM_BUILD.md) | Done |
| Legacy port map | [architecture/LEGACY_REFERENCE.md](./architecture/LEGACY_REFERENCE.md) | Done |
| Doc maintenance rules | [DOC_MAINTENANCE.md](./DOC_MAINTENANCE.md) | Done |
| Living status | [STATUS.md](./STATUS.md) | Done |
| Domain research | [research/](./research/README.md) | Starter pack done |

---

## UX decisions (locked)

From competitive review ([USER_FLOWS.md](./architecture/USER_FLOWS.md)):

| Decision | Choice |
|----------|--------|
| Operator default home | Work queue (`/`) |
| Claim detail layout | Single action view — flag cards, no entity tabs |
| Upload placement | Secondary route `/upload` |
| Owner dashboard | One KPI — clean-claim rate + drill-down |
| Override | Reason required (audit) |
| Queue density | ≥10 rows at 1080p |
| Phase 1 submit/resend | Out of scope — gate only |

---

## Technical decisions (locked)

| Decision | Choice |
|----------|--------|
| Monorepo | **npm workspaces today** → Turborepo + pnpm (WS-00) |
| Frontend | Vite React SPA (not Next.js for new code) |
| Backend | Supabase Postgres + Auth + Edge Functions + RLS |
| State | Append-only events + projectors (CQRS-lite) |
| Phase 1 KPI | Clean-claim rate |
| Scrub pipeline | Rules → payer_intelligence → Sonnet (ambiguous only) |
| Apps | `apps/operator` + `apps/owner` |
| Legacy `src/` | Port and retire — do not extend |

---

## Build order (current)

```
Done — Phase A spine
  WS-01  DB + RLS + seed
  WS-02  packages/events
  WS-03  packages/integrations (CSV adapters)
  WS-04  packages/agents (scrub rules)
  WS-05  Edge Functions

Next — Phase B/C
  WS-06  apps/operator + packages/ui
  WS-08  apps/owner (KPI command center)
  WS-07  packages/intelligence (moat)
  WS-00  Turborepo + pnpm (can parallelize)
  WS-09  E2E demo + legacy retirement
```

---

## US team — still needed before production

| Item | Blocks | Owner |
|------|--------|-------|
| Design partner clinic | Real Dentrix CSV column validation | US |
| Supabase dev project + env vars | Bungaroo local dev | US |
| Anthropic API key (dev) | LLM scrub in dev | US |
| Submit vs hand-back decision | Phase 4 scope only — not P1 | US |
| Payer rule sign-off | WS-04 review | US |
| Project name / repo rename | Branding only | US |

Track in [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md).

---

## Verification before WS-06 UI

- [ ] WS-05 Edge Functions pass integration tests
- [ ] Sample CSV produces same flags as legacy (`npm test` in agents package)
- [ ] `gate-action` rejects override without reason
- [ ] Bungaroo read HANDOFF + USER_FLOWS + MEDIUM_BUILD

---

## First PR template (WS-00)

```markdown
## Workstream
WS-00 — Monorepo foundation

## Acceptance
- [ ] pnpm build passes
- [ ] CI green
- [ ] LOCAL_DEV.md updated

## Docs
- [ ] STATUS.md updated
```

See [DOC_MAINTENANCE.md](./DOC_MAINTENANCE.md) for full PR checklist.
