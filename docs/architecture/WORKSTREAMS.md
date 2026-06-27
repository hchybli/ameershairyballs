# Workstreams — Bungaroo Phase 1

Each workstream = 1 epic ≈ 1–3 PRs. Link PRs as `WS-XX` in title.

---

## WS-00 — Monorepo foundation

**Owner:** Bungaroo lead  
**Depends on:** —

### Tasks
- [ ] Init Turborepo + pnpm workspaces at repo root
- [ ] Shared `tsconfig` base, ESLint, Prettier
- [ ] CI: `turbo run build lint test` on PR
- [ ] `.env.example` for all apps/packages
- [ ] Document `pnpm install && pnpm dev` in `docs/LOCAL_DEV.md`

### Acceptance
- `pnpm build` passes with empty package stubs
- CI green on `main`

---

## WS-01 — Database + RLS + seed

**Owner:** Bungaroo backend  
**Depends on:** WS-00

### Tasks
- [ ] Apply `supabase/migrations/002_event_sourced_schema.sql`
- [ ] RLS policies: tenant A cannot read tenant B (test with 2 tenants)
- [ ] `scripts/seed-synthetic.ts` — fake tenant, clinic, claims fixture paths
- [ ] Generate TypeScript types (`supabase gen types`)

### Acceptance
- Migration idempotent on fresh DB
- RLS test script or documented manual test
- Seed runs without real PHI

---

## WS-02 — Events spine (`packages/events`)

**Owner:** Bungaroo backend  
**Depends on:** WS-01

### Tasks
- [ ] Event types per [EVENT_CATALOG.md](./EVENT_CATALOG.md)
- [ ] `emitEvent(tenantId, type, payload, actorId?)`
- [ ] Projectors: `claims_current`, `flags_open`
- [ ] `replayEvents(claimId)` for audit UI later

### Acceptance
- Unit tests: emit → project → read model matches expected state
- Append-only enforced (no UPDATE on events)

---

## WS-03 — Core + integrations (`packages/core`, `packages/integrations`)

**Owner:** Bungaroo backend  
**Depends on:** WS-00

### Tasks
- [ ] Canonical claim model in `packages/core`
- [ ] Port `parse-claims-csv.ts` → `CsvDentrixIngestAdapter`
- [ ] Port `parse-outcomes-csv.ts` → `Csv835OutcomeAdapter`
- [ ] Port unit tests

### Acceptance
- Same synthetic CSVs parse identically to legacy
- Adapter implements `IngestAdapter` interface

---

## WS-04 — Scrub agent (`packages/agents`, `packages/tools`)

**Owner:** Bungaroo backend + US review for rules  
**Depends on:** WS-02, WS-03

### Tasks
- [ ] Port rules from `src/lib/rules/` (cdt-catalog, attachment-rules, scrub-claim)
- [ ] `tools/query-claims`, `tools/emit-flag`, `tools/query-payer-intelligence`
- [ ] Sonnet integration for ambiguous lines only (config flag to disable LLM in CI)
- [ ] Orchestrator: rules → intel → LLM → emit events

### Acceptance
- All legacy scrub tests pass in new package
- Agent never writes to DB except via `emitEvent`
- CI runs without Anthropic key (rules-only mode)

---

## WS-05 — Edge Functions (`supabase/functions`)

**Owner:** Bungaroo backend  
**Depends on:** WS-02, WS-03, WS-04

### Tasks
- [ ] `ingest-claims` — CSV upload → canonical → `claim.ingested`
- [ ] `run-scrub` — invoke agent → `flag.raised`
- [ ] `gate-action` — approve/override → events (override requires reason)
- [ ] `ingest-outcomes` — 835 CSV → `outcome.received` + intelligence upsert
- [ ] `analytics-kpi` — clean-claim rate + drill-down

See [API_CONTRACTS.md](./API_CONTRACTS.md).

### Acceptance
- Each function has integration test against local Supabase
- Auth: JWT carries `tenant_id`

---

## WS-06 — Operator app (`apps/operator`)

**Owner:** Bungaroo frontend  
**Depends on:** WS-05, `packages/ui`  
**UX spec:** [USER_FLOWS.md](./USER_FLOWS.md)

### Tasks
- [ ] Vite + React + Tailwind + shadcn
- [ ] **Work queue** as default route `/` (compact rows: patient, payer, DOS, $, top flag, severity)
- [ ] **Claim action view** `/claims/:id` — flag cards, header primary blocker, no entity tabs
- [ ] Upload CSV at `/upload` (secondary); post-upload redirect to queue
- [ ] Approve / Override (modal with required reason)
- [ ] Mobile-first layout (≥44px touch targets on gate actions)

### Acceptance
- E2E: upload sample-claims → queue shows claims → open claim → approve one → event in DB
- Matches legacy flag semantics
- Default landing is work queue, not upload
- All open flags visible without tab navigation
- ≥10 queue rows visible at 1080p

---

## WS-07 — Intelligence + analytics (`packages/intelligence`, `packages/analytics`)

**Owner:** Bungaroo backend  
**Depends on:** WS-02, WS-05

### Tasks
- [ ] On `outcome.received`: upsert `payer_intelligence`
- [ ] `computeCleanClaimRate(tenantId, dateRange?)`
- [ ] Drill-down: KPI → claim IDs → events

### Acceptance
- Seed outcomes change KPI predictably
- Unit tests for KPI math

---

## WS-08 — Owner app (`apps/owner`)

**Owner:** Bungaroo frontend  
**Depends on:** WS-07, `packages/ui`  
**UX spec:** [USER_FLOWS.md](./USER_FLOWS.md)

### Tasks
- [ ] KPI tile (live from API) — **single metric**, clean-claim rate
- [ ] Drill-down table → claim ids (+ optional link to operator claim view)
- [ ] Shared auth with operator app
- [ ] No empty placeholder charts or module tabs (IQ/Assist split)

### Acceptance
- After full seed flow, KPI displays correct %
- Click row → see claim id (detail page optional P1)
- Dashboard is one screen: KPI + drill-down only

---

## WS-09 — E2E + legacy retirement (optional in P1)

**Owner:** Bungaroo lead  
**Depends on:** WS-06, WS-08

### Tasks
- [ ] `scripts/demo-e2e.sh` documents full loop
- [ ] Mark `src/` deprecated in README
- [ ] Remove or archive Next.js app after US sign-off

---

## Workstream dependency graph

```
WS-00 ─┬─ WS-01 ─ WS-02 ─ WS-04 ─ WS-05 ─┬─ WS-06
       │         └─ WS-03 ──────────────┘   └─ WS-07 ─ WS-08
       └─ packages/ui (parallel)
```
