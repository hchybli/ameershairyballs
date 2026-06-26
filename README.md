# Backstop

**Pre-submission billing autopilot for small dental clinics** — Stage 1 of a larger dental software ecosystem.

| | |
|---|---|
| **Repo** | [github.com/hchybli/ameershairyballs](https://github.com/hchybli/ameershairyballs) |
| **Collaborators** | [@hchybli](https://github.com/hchybli), [@ameerabouhouli](https://github.com/ameerabouhouli) |
| **Status** | Phase 0 done. **Read [docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md) before building Phase 1.** Synthetic data only. |

## What this project does

Backstop sits on top of a clinic's existing PMS, checks every claim before submission, auto-fixes safe items, flags the rest, and captures payer outcomes.

**Source of truth (read both before building):**
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — vision, scope, stack, data model
- [docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md) — feature tiers, build order, denial drivers

## New here? Start here

1. **[docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md)** — **read first** — what we build, in what order, and why
2. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** — vision, scope, tech stack, data model
3. **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** — clone the repo, open it in Cursor
4. **[docs/VERIFY_SHARED_REPO.md](./docs/VERIFY_SHARED_REPO.md)** — confirm the shared repo works
5. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — how we branch, commit, and review together

## Docs map

| File | Purpose |
|------|---------|
| [docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md) | **Feature tiers, build order, denial drivers — co-source of truth** |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Vision, scope, tech stack, data model, PHI rules |
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Cursor + Git setup for beginners |
| [docs/PHASE_0.md](./docs/PHASE_0.md) | Run the Phase 0 app locally |
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

Before asking the AI to build something, attach both specs:

```
@PROJECT_OVERVIEW.md @docs/FEATURE_ROADMAP.md
Implement Phase 1a: CDT validation and audit-risk flags.
```

The AI also reads `.cursor/rules/project.mdc` automatically for project conventions.

## Security

- No real PHI in this repo, ever, until HIPAA BAAs are signed
- No secrets in git — use `.env` (gitignored)
- `outcomes` and `fixes` tables are append-only
