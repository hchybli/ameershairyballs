# Contributing

This repo is shared between **@hchybli** and **@ameerabouhouli**. These conventions keep us aligned and avoid stepping on each other's work.

## Before you code

1. Read [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — vision, scope, PHI rules
2. Read [docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md) — feature tiers and build order
3. Check open decisions in the roadmap **Decisions** table
4. In Cursor, attach `@PROJECT_OVERVIEW.md` and `@docs/FEATURE_ROADMAP.md` when asking the AI to implement something

## Git workflow

We use a simple trunk-based flow while the repo is small:

```
main          ← stable; always deployable (once we have an app)
  └── feature/your-name/short-description
```

### Starting work

```bash
git checkout main
git pull origin main
git checkout -b feature/ameer/csv-ingest-schema
```

Use your GitHub username in the branch name so it's obvious who owns it.

### Committing

- Write clear commit messages: what changed and why
- One logical change per commit when possible
- Never commit `.env`, real PHI, or API keys

```bash
git add .
git commit -m "Add Supabase schema for clinics and claims tables"
git push -u origin feature/ameer/csv-ingest-schema
```

### Pull requests

1. Push your branch to GitHub
2. Open a PR against `main`
3. Tag the other collaborator for review
4. Squash-merge when approved (keeps history clean while we're pre-1.0)

On GitHub: **Pull requests → New pull request → compare across forks/branches → Create**

## Who does what (starting point)

| Area | Owner (initial) | Notes |
|------|-----------------|-------|
| Product spec | Both | Update `PROJECT_OVERVIEW.md` together |
| Repo / infra setup | TBD | First person to scaffold Next.js owns it |
| Supabase schema | TBD | Coordinate before merging migrations |
| Frontend UI | TBD | shadcn/ui components |
| EDI / billing rules | TBD | CDT domain knowledge |

Update this table as you divide work. The point is to **talk before two people build the same thing**.

## Cursor tips for collaboration

- **Share context:** both of you should have the same `.cursor/rules/` files (they're in git)
- **Reference files in chat:** `@PROJECT_OVERVIEW.md`, `@src/...` — the AI reads what you attach
- **Don't fight the AI on scope:** if it suggests charting or scheduling, that's Stage 2+ — point it back to the overview

## Synthetic data only

All fixtures, seed data, and test patients must be fake until HIPAA BAAs are signed. Use made-up names, fake member IDs, and synthetic CDT lines.

## Questions?

Add open decisions to [docs/OPEN_QUESTIONS.md](./docs/OPEN_QUESTIONS.md) rather than leaving them only in chat.
