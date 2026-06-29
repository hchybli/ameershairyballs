# Backstop

Pre-submission dental insurance billing platform. **Synthetic data only** until HIPAA BAAs.

**Stack:** npm workspaces · TypeScript strict · Vite React SPAs · Supabase (Postgres, Auth, Edge Functions, RLS) · event-sourced read models.

---

## Quick start

```bash
npm install
cp .env.example .env   # fill Supabase URL + keys
npm run seed
npm run dev            # operator :5173 + owner :5174
npm run verify         # full self-check before shipping
npm run demo:e2e       # Phase 1 E2E playbook (add -- --auto for headless)
```

| App | URL | Demo login |
|-----|-----|------------|
| Operator | http://localhost:5173 | `operator@demo.backstop.local` / `demo-operator-2026!` |
| Owner | http://localhost:5174 | `owner@demo.backstop.local` / `demo-owner-2026!` |

Sign in via browser: `npx tsx --env-file=.env scripts/dev-sign-in.ts`

Full guide: [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md)

---

## Documentation

| Need | Doc |
|------|-----|
| **Status & what's next** | [docs/STATUS.md](docs/STATUS.md) |
| **Local dev & deploy** | [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) |
| **Product vision** | [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) · [docs/STRATEGY.md](docs/STRATEGY.md) |
| **Architecture & workstreams** | [docs/architecture/README.md](docs/architecture/README.md) |
| **Offshore handoff** | [docs/HANDOFF_BUNGAROO.md](docs/HANDOFF_BUNGAROO.md) |
| **Open decisions** | [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) |
| **Synthetic fixtures** | [data/synthetic/README.md](data/synthetic/README.md) |

---

## Repo layout

```
apps/operator     Work queue + claim gate + agent panels
apps/owner        KPI command center + drill-down
packages/*        Domain, events, agents, handlers, UI
supabase/         Migrations + edge functions
src/              Legacy Next.js — **deprecated** (see src/README.md)
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Branch prefix: `feature/bungaroo/WS-XX-description`.
