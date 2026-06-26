# Backstop

**Pre-submission billing autopilot for small dental clinics** — Stage 1 of a larger dental software ecosystem.

| | |
|---|---|
| **Repo** | [github.com/hchybli/ameershairyballs](https://github.com/hchybli/ameershairyballs) |
| **Collaborators** | [@hchybli](https://github.com/hchybli), [@ameerabouhouli](https://github.com/ameerabouhouli) |
| **Status** | **Phases 0–2 done** (ingest, scrub, flags, dashboard). [Review guide](./docs/DEMO_WALKTHROUGH.md) for @hchybli. Synthetic data only. |

## What this project does

Backstop sits on top of a clinic's existing PMS, checks every claim before submission, auto-fixes safe items, flags the rest, and captures payer outcomes.

**Source of truth (read both before building):**
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — vision, scope, stack, data model
- [docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md) — feature tiers, build order, denial drivers

## @hchybli — review this build

1. `git pull origin main && npm install && npm run dev`
2. Follow **[docs/DEMO_WALKTHROUGH.md](./docs/DEMO_WALKTHROUGH.md)** (~5 min)
3. Comment on [roadmap decisions](./docs/FEATURE_ROADMAP.md#decisions-resolve-before-phase-1)

## New here? Start here

1. **[docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md)** — what we build and in what order
2. **[docs/DEMO_WALKTHROUGH.md](./docs/DEMO_WALKTHROUGH.md)** — hands-on demo
3. **[docs/LOCAL_DEV.md](./docs/LOCAL_DEV.md)** — install, run, test
4. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** — vision and constraints
5. **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** — Cursor + Git for beginners

## Docs map

| File | Purpose |
|------|---------|
| [docs/FEATURE_ROADMAP.md](./docs/FEATURE_ROADMAP.md) | Feature tiers, build order — co-source of truth |
| [docs/DEMO_WALKTHROUGH.md](./docs/DEMO_WALKTHROUGH.md) | **Partner review guide** |
| [docs/LOCAL_DEV.md](./docs/LOCAL_DEV.md) | Run app + tests locally |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Vision, scope, PHI rules |
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Cursor onboarding |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Collaboration workflow |

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000 — ingest claims
                 # http://localhost:3000/dashboard — outcomes + metrics
npm test         # 8 tests
```

**Demo files:** `data/synthetic/sample-claims.csv` + `sample-outcomes.csv`

## Working in Cursor

```
@PROJECT_OVERVIEW.md @docs/FEATURE_ROADMAP.md
Implement Phase 3: payer rule pack for Delta Dental.
```

## Security

- No real PHI until HIPAA BAAs are signed
- No secrets in git — use `.env.local` (gitignored)
- `outcomes` and `fixes` are append-only
