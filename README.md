# Backstop

**Pre-submission billing autopilot for small dental clinics** — Stage 1 of a larger dental software ecosystem.

| | |
|---|---|
| **Repo** | [github.com/hchybli/ameershairyballs](https://github.com/hchybli/ameershairyballs) |
| **Collaborators** | [@hchybli](https://github.com/hchybli), [@ameerabouhouli](https://github.com/ameerabouhouli) |
| **Status** | Pre-build — spec and docs only. No real PHI. Synthetic data only. |

## What this project does

Backstop sits on top of a clinic's existing PMS, checks every claim before submission, auto-fixes safe items, flags the rest, and captures payer outcomes. See [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for the full spec.

## New here? Start here

1. **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** — clone the repo, open it in Cursor, run your first chat with the AI
2. **[docs/VERIFY_SHARED_REPO.md](./docs/VERIFY_SHARED_REPO.md)** — quick checklist so both collaborators confirm the shared repo works
3. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — how we branch, commit, and review together
4. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** — source of truth for scope, stack, and data model

## Docs map

| File | Purpose |
|------|---------|
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Vision, scope, tech stack, data model, build phases |
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Cursor + Git setup for beginners |
| [docs/VERIFY_SHARED_REPO.md](./docs/VERIFY_SHARED_REPO.md) | Shared-repo smoke test (both collaborators) |
| [docs/OPEN_QUESTIONS.md](./docs/OPEN_QUESTIONS.md) | Decisions still to make |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Collaboration workflow |

## Tech stack (planned)

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui
- **Backend:** Next.js server actions / API routes + EDI worker
- **DB:** Supabase (Postgres), RLS from day one
- **AI:** Anthropic API (Sonnet + Haiku)
- **Hosting:** AWS

## Quick start (Phase 0)

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # CSV parser tests
```

See [docs/PHASE_0.md](./docs/PHASE_0.md) for Supabase setup and CSV upload instructions.

## Working in Cursor

Before asking the AI to build something, attach the spec:

```
@PROJECT_OVERVIEW.md implement Phase 0: CSV ingest schema
```

The AI also reads `.cursor/rules/project.mdc` automatically for project conventions.

## Security

- No real PHI in this repo, ever, until HIPAA BAAs are signed
- No secrets in git — use `.env` (gitignored)
- `outcomes` and `fixes` tables are append-only
