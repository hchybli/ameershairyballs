# Local development

Backstop Phase 1 runs on **Supabase** (Postgres + Auth + Edge Functions) with **Vite React** operator and owner apps. Legacy Next.js in `src/` is reference only.

**Strategy context:** [STRATEGY.md](./STRATEGY.md)

---

## Prerequisites

- Node 20+
- `.env` at repo root (see `.env.example`) with Supabase URL + anon key
- Supabase CLI for migrations / edge deploy (optional for read-only UI against remote)

---

## Quick start

```bash
npm install
npm run seed          # synthetic tenants + claims (requires .env)
npm run dev:operator  # http://localhost:5173
npm run dev:owner     # http://localhost:5174
```

Or both SPAs: `npm run dev`

### Demo credentials (synthetic)

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@demo.backstop.local` | `demo-owner-2026!` |
| Operator | `operator@demo.backstop.local` | `demo-operator-2026!` |
| Isolation test | `operator@isolation.backstop.local` | `demo-isolation-2026!` |

### Demo flow

1. **Operator** `/upload` — upload `data/synthetic/sample-claims.csv`
2. **Work queue** `/` — open claim → Approve / Override (reason required)
3. **Owner** `/` — clean-claim rate KPI + upload `data/synthetic/sample-outcomes.csv`

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

Local Deno check (must pass before deploy — same resolver as Supabase remote bundler):

```bash
npm run check:edge
```

Manual equivalent:

```bash
cd supabase/functions
for fn in ingest-claims run-scrub gate-action ingest-outcomes analytics-kpi; do
  deno check --config=deno.json --import-map=deno.json "$fn/index.ts"
done
```

Deploy (human — requires Supabase CLI login):

```bash
npm run predeploy:edge   # guardrail — must pass first
supabase functions deploy ingest-claims run-scrub gate-action ingest-outcomes analytics-kpi \
  --project-ref ndgembdlqevybokxikkd
```

---

## Monorepo layout

```
apps/operator       Vite React — work queue, claim gate, upload
apps/owner          Vite React — KPI dashboard
packages/events     Event spine + projectors
packages/handlers   Edge handler logic + browser read-models
packages/api-client Edge function fetch helper
packages/agents     Scrub rules
packages/integrations  CSV parsers
packages/db         Supabase client helpers
packages/analytics  KPI calculations
packages/ui         Shared design system (WS-06)
packages/intelligence  Payer moat (WS-07)
supabase/functions  Edge function entrypoints
```

**Note:** `apps/api` (Express) was removed in WS-05.

---

## Tests

```bash
npm run test           # unit: parsers, scrub, projectors
npm run test:events    # replay integration
npm run test:seed      # RLS + idempotent seed
npm run test:handlers  # handler integration
npm run build:apps     # Vite production build
```

---

## Legacy Next.js prototype

```bash
npm run dev:legacy   # http://localhost:3000
```

See [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md). Do not add features here.

---

## What's next

- WS-06: `@backstop/ui` + operator polish
- WS-08: Owner KPI command center
- WS-07: `@backstop/intelligence` payer scorecards

See [BUILD_READINESS.md](./BUILD_READINESS.md) and [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md).
