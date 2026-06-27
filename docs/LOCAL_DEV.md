# Local development

## React apps (rough draft — US team)

Vite + React operator/owner apps with a local Express API. This is the path forward; legacy Next.js in `src/` is reference only.

### Quick start

```bash
npm install

# Terminal 1 — API (port 3001)
npm run dev:api

# Terminal 2 — Operator (port 5173)
npm run dev:operator

# Terminal 3 — Owner (port 5174)
npm run dev:owner
```

Or run all three: `npm run dev` (backgrounds API + both SPAs).

### Demo flow

1. **Operator** http://localhost:5173/upload — upload `data/synthetic/sample-claims.csv`
2. **Work queue** http://localhost:5173 — open a claim, **Approve** or **Override** (reason required)
3. **Owner** http://localhost:5174 — clean-claim rate KPI + upload `data/synthetic/sample-outcomes.csv`

### API endpoints (local)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/queue` | Work queue rows |
| GET | `/api/claims/:id` | Claim + flags |
| POST | `/api/ingest-claims` | CSV upload (multipart `file`) |
| POST | `/api/gate-action` | Approve / override flag |
| POST | `/api/ingest-outcomes` | 835 CSV upload |
| GET | `/api/analytics-kpi` | Clean-claim rate |

### Monorepo layout

```
apps/api          Express API (in-memory store for now)
apps/operator     Vite React — work queue, claim gate, upload
apps/owner        Vite React — KPI dashboard
packages/core     Shared types
packages/agents   Scrub rules (ported from src/)
packages/integrations  CSV parsers
packages/store    In-memory store + gate actions
packages/analytics     KPI calculation
```

---

## Legacy Next.js prototype

```bash
npm run dev:legacy   # http://localhost:3000
npm test             # 8 tests on legacy parsers/rules
```

See [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md) for the old flow.

---

## Supabase (later)

Rough draft uses in-memory store. Target: `supabase/migrations/002_event_sourced_schema.sql` + Edge Functions per [architecture/API_CONTRACTS.md](./architecture/API_CONTRACTS.md).

---

## What's next

- Wire Supabase events + RLS (replace in-memory store)
- Port remaining tests into `packages/agents`
- Bungaroo handoff when ready — see [BUILD_READINESS.md](./BUILD_READINESS.md)
