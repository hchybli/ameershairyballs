# Local development

Backstop Phase 1 runs on **Supabase** (Postgres + Auth + Edge Functions) with **Vite React** operator and owner apps. Legacy Next.js in `src/` is reference only.

**Strategy context:** [STRATEGY.md](./STRATEGY.md)

---

## One-command workflows

| Command | What it does |
|---------|----------------|
| `npm run dev` | Kill stale Vite processes, then start **operator** (`:5173`) + **owner** (`:5174`) together |
| `npm run verify` | Full self-check (edge imports + deno ×5, build, all tests, **smoke**) — fails on first error |
| `npm run smoke` | Headless synthetic E2E (handlers + RLS + scorecards; requires `.env`) |
| `npm run deploy:edge` | Run `predeploy:edge`, then deploy all **7** edge functions to `ndgembdlqevybokxikkd` (requires `supabase login`) |
| `npm run demo:e2e` | Print Phase 1 E2E playbook; `-- --auto` runs seed + clickthrough |
| `npm run seed` | Load synthetic tenants + claims (requires `.env`) |

Individual scripts still available: `dev:operator`, `dev:owner`, `check:edge`, `build:apps`, `test`, `test:events`, `test:seed`, `test:handlers`, `fix:edge-imports`.

---

## Prerequisites

- Node 20+
- `.env` at repo root (see `.env.example`) with Supabase URL + anon key
- [Supabase CLI](https://supabase.com/docs/guides/cli) for edge deploy (`supabase login` once)
- Deno (for `check:edge` / `verify`)

---

## Quick start

```bash
npm install
npm run seed          # synthetic tenants + claims (requires .env)
npm run dev           # operator http://localhost:5173 + owner http://localhost:5174
```

Before shipping edge function changes:

```bash
npm run verify        # full green/red self-check
npm run deploy:edge   # after verify passes; needs supabase login
```

### Demo credentials (synthetic)

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@demo.backstop.local` | `demo-owner-2026!` |
| Operator | `operator@demo.backstop.local` | `demo-operator-2026!` |
| Isolation test | `operator@isolation.backstop.local` | `demo-isolation-2026!` |

### Demo flow

1. **Operator** `/upload` — upload `data/synthetic/sample-claims.csv`
2. **Work queue** `/` — open **SYN-CLM-002** or **SYN-CLM-003**
3. **Claim detail** — eligibility + denial panels load; Approve / Override flags
4. **Owner** `/` — KPI tiles + drill-down filters (Open flags / All claims)
5. **Owner** — upload `data/synthetic/sample-outcomes.csv`

Sign in: `npx tsx --env-file=.env scripts/dev-sign-in.ts`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **Failed to fetch** on upload/KPI | Use `npm run dev` (ports **5173** / **5174** only). Close tabs on old ports (5175+). After edge CORS changes run `npm run deploy:edge`. |
| **Invalid token** | Click **Sign out** in the app header, or clear `sb-*` keys in browser localStorage, then sign in again. |
| Upload succeeds but **work queue empty** | Re-upload is idempotent — run `npm run seed` to reset demo flags, or upload a fresh CSV. Handlers call `replay()` to refresh read models. |
| Owner dashboard **unchanged** after outcomes upload | Outcomes may already exist from seed (idempotent). Message explains count; KPI still refreshes. |
| Stale Vite / wrong port | `npm run dev` kills ports 5173–5178 before starting. |

---

## API surface (Supabase Edge Functions)

Apps call edge functions via `@backstop/api-client` (JWT from Supabase Auth).

| Function | Purpose |
|----------|---------|
| `ingest-claims` | CSV → `claim.ingested` |
| `run-scrub` | Scrub agent → `flag.raised` |
| `gate-action` | Approve / override → gate events |
| `ingest-outcomes` | 835 CSV → `outcome.received` + intelligence |
| `analytics-kpi` | Clean-claim rate + drill-down |
| `check-eligibility` | Eligibility agent → `eligibility.checked` |
| `predict-denial` | Denial prediction → `prediction.scored` |

`npm run check:edge` validates all seven functions.

Manual deno check:

```bash
cd supabase/functions
for fn in ingest-claims run-scrub gate-action ingest-outcomes analytics-kpi; do
  deno check --config=deno.json --import-map=deno.json "$fn/index.ts"
done
```

---

## Monorepo layout

```
apps/operator       Vite React — work queue, claim gate, upload (port 5173)
apps/owner          Vite React — KPI dashboard (port 5174)
packages/events     Event spine + projectors
packages/handlers   Edge handler logic + browser read-models
packages/api-client Edge function fetch helper
packages/agents     Scrub + eligibility + denial prediction agents
packages/tools      Agent tool registry
packages/integrations  CSV parsers
packages/db         Supabase client helpers
packages/analytics  KPI calculations
packages/ui         Shared design system
packages/intelligence  Payer moat
supabase/functions  Edge function entrypoints
```

**Note:** `apps/api` (Express) was removed in WS-05.

---

## Legacy Next.js prototype

```bash
npm run dev:legacy   # http://localhost:3000 — reference only
```

Do not add features. Demo walkthrough archived in [archive/DEMO_WALKTHROUGH.md](./archive/DEMO_WALKTHROUGH.md).

---

## What's next

See [STATUS.md](./STATUS.md), [BUILD_READINESS.md](./BUILD_READINESS.md), and [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md).
