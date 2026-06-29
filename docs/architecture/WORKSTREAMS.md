# Workstreams — Bungaroo Phase 1

Each workstream = 1 epic ≈ 1–3 PRs. Link PRs as `WS-XX` in title.  
**Completion tracked in** [STATUS.md](../STATUS.md).

---

## WS-00 — Monorepo foundation

**Status:** not started  
**Owner:** Bungaroo lead  
**Depends on:** —

### Tasks
- [ ] Init Turborepo + pnpm workspaces at repo root
- [ ] Shared `tsconfig` base, ESLint, Prettier
- [ ] CI: `turbo run build lint test` on PR
- [ ] Document `pnpm install && pnpm dev` in `docs/LOCAL_DEV.md`

### Acceptance
- `pnpm build` passes
- CI green on `main`

---

## WS-01 — Database + RLS + seed

**Status:** done  
**Owner:** Bungaroo backend  
**Depends on:** —

### Tasks
- [x] Apply event-sourced schema migrations (002–006)
- [x] RLS: tenant + clinic isolation
- [x] `scripts/seed-synthetic.ts` — idempotent synthetic seed
- [x] RLS integration tests

### Acceptance
- [x] Migration idempotent on fresh DB
- [x] RLS tests pass
- [x] Seed runs without real PHI

---

## WS-02 — Events spine (`packages/events`)

**Status:** done  
**Depends on:** WS-01

### Tasks
- [x] Event types per [EVENT_CATALOG.md](./EVENT_CATALOG.md)
- [x] `emit()` with dedupe keys
- [x] Projectors: `claims_current`, `flags_open`, eligibility, prediction
- [x] `replay()` for read models

### Acceptance
- [x] Unit tests: emit → project → read model
- [x] Append-only enforced

---

## WS-03 — Core + integrations

**Status:** done  
**Depends on:** —

### Tasks
- [x] Canonical claim model in `packages/core`
- [x] CSV claims + outcomes adapters
- [x] Unit tests

### Acceptance
- [x] Synthetic CSVs parse identically to legacy

---

## WS-04 — Scrub agent

**Status:** done  
**Depends on:** WS-02, WS-03

### Tasks
- [x] Port rules from `src/lib/rules/`
- [x] `@backstop/tools` — query-claims, raise-flag, query-payer-intelligence
- [ ] Sonnet for ambiguous lines only (rules-only mode in CI today)

### Acceptance
- [x] Legacy scrub tests pass
- [x] Agent emits via events only

---

## WS-05 — Edge Functions

**Status:** done  
**Depends on:** WS-02, WS-03, WS-04

### Tasks
- [x] `ingest-claims`
- [x] `run-scrub`
- [x] `gate-action`
- [x] `ingest-outcomes`
- [x] `analytics-kpi`
- [x] `check-eligibility`
- [x] `predict-denial`

See [API_CONTRACTS.md](./API_CONTRACTS.md).

### Acceptance
- [x] Smoke + click-through tests against live Supabase
- [x] Auth: JWT carries `tenant_id`

---

## WS-06 — Operator app

**Status:** done  
**Depends on:** WS-05, `packages/ui`  
**UX spec:** [USER_FLOWS.md](./USER_FLOWS.md)

### Tasks
- [x] Vite + React + Tailwind + `@backstop/ui`
- [x] Work queue default route `/`
- [x] Claim action view `/claims/:id` — flags + agent panels
- [x] Upload CSV at `/upload`
- [x] Approve / Override (reason required)

### Acceptance
- [x] E2E: upload → queue → claim → approve
- [x] Work queue default landing

---

## WS-07 — Intelligence + analytics

**Status:** done  
**Depends on:** WS-02, WS-05

### Tasks
- [x] On `outcome.received`: upsert `payer_intelligence`
- [x] `computeCleanClaimRate` + drill-down bundles
- [x] Payer scorecards on owner dashboard

### Acceptance
- [x] Seed outcomes change KPI predictably
- [x] Unit tests for KPI math

---

## WS-08 — Owner app

**Status:** done  
**Depends on:** WS-07, `packages/ui`  
**UX spec:** [USER_FLOWS.md](./USER_FLOWS.md)

### Tasks
- [x] KPI tiles (clean-claim rate, denial rate, dollars recovered)
- [x] Drill-down with filters (open flags / below target / all claims)
- [x] Shared auth with operator
- [x] Outcomes upload on dashboard

### Acceptance
- [x] KPI matches `analytics-kpi` API
- [x] No placeholder module tabs

---

## WS-09 — E2E + legacy retirement

**Status:** done  
**Depends on:** WS-06, WS-08

### Tasks
- [x] `scripts/demo-e2e.sh` documents full loop (+ `--auto` headless path)
- [x] Mark `src/` deprecated (`src/README.md`, root README)
- [ ] Remove or archive Next.js app after US sign-off

---

## WS-AGENTS-00 — Agent framework

**Status:** done  
**Depends on:** WS-04

### Tasks
- [x] `@backstop/tools` registry + contracts
- [x] `AgentRunner` orchestration pattern
- [x] Scrub agent refactored to tool-based emit

### Acceptance
- [x] Agents never write DB directly
- [x] Tool contract tests pass

---

## WS-AGENTS-01 — Eligibility agent

**Status:** done  
**Depends on:** WS-AGENTS-00

### Tasks
- [x] Synthetic Onederful-shaped adapter + fixtures
- [x] `eligibility.checked` event + `eligibility_current` read model
- [x] `check-eligibility` edge function
- [x] `EligibilityPanel` on claim detail

### Acceptance
- [x] SYN-PAT-003 / Cigna shows benefit exhausted in UI
- [x] Migration 005 applied

---

## WS-AGENTS-02 — Denial prediction

**Status:** done  
**Depends on:** WS-AGENTS-00, WS-07

### Tasks
- [x] Moat-first `scoreDenialRisk()` from `payer_intelligence`
- [x] `prediction.scored` event + `denial_risk` flags
- [x] `predict-denial` edge function
- [x] `DenialRiskPanel` on claim detail

### Acceptance
- [x] SYN-CLM-002 shows high denial risk for D4341
- [x] Migration 006 applied

---

## WS-AGENTS-03 — History import (future)

**Status:** not started  
**Depends on:** WS-07

### Tasks
- [ ] `history.imported` event from de-identified Vyne/InsideDesk exports
- [ ] Warm-start `payer_intelligence` without PHI in repo

### Acceptance
- [ ] Import is idempotent per tenant
- [ ] No PHI in git

---

## Dependency graph

```
WS-01 ─ WS-02 ─ WS-04 ─ WS-05 ─┬─ WS-06
         └─ WS-03 ─────────────┘  └─ WS-07 ─ WS-08
                                    └─ WS-AGENTS-00 ─┬─ WS-AGENTS-01
                                                       └─ WS-AGENTS-02
WS-00 (Turborepo) — parallel, optional
WS-09 — after merge to main
```
