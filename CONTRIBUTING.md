# Contributing

**US team:** @hchybli, @ameerabouhouli  
**Engineering:** Bungaroo India (offshore)  
**Handoff doc:** [docs/HANDOFF_BUNGAROO.md](./docs/HANDOFF_BUNGAROO.md)

---

## Before you code

1. [docs/HANDOFF_BUNGAROO.md](./docs/HANDOFF_BUNGAROO.md) — start here
2. [docs/architecture/WORKSTREAMS.md](./docs/architecture/WORKSTREAMS.md) — pick your epic
3. [docs/architecture/LEGACY_REFERENCE.md](./docs/architecture/LEGACY_REFERENCE.md) — if porting from `src/`

**Do not add features to the legacy Next.js app (`src/`).** New work goes in `apps/` and `packages/`.

---

## Git workflow (distributed)

```
main
 └── feature/bungaroo/WS-03-csv-adapters
 └── feature/bungaroo/WS-06-operator-ui
```

### Branch naming

```
feature/bungaroo/<workstream-id>-<short-description>
```

Example: `feature/bungaroo/WS-04-scrub-agent`

### Commits

```
WS-04: Port attachment rules from legacy scrub engine
```

### Pull requests

1. PR title includes workstream ID: `WS-06: Operator claim detail page`
2. Description links acceptance criteria checkboxes from WORKSTREAMS.md
3. US team reviews all merges to `main`
4. Squash-merge preferred

---

## Code quality

| Requirement | Where |
|-------------|-------|
| TypeScript `strict` | All packages |
| Unit tests | Scrub rules, adapters, projectors, KPI |
| No `service_role` in client | `packages/auth` |
| RLS on tenant tables | `supabase/migrations/` |

---

## Ownership (update as team assigns)

| Workstream | Area | Owner |
|------------|------|-------|
| WS-00–01 | Monorepo, DB, RLS | Bungaroo lead |
| WS-02–05 | Events, agents, Edge Functions | Bungaroo backend |
| WS-06, WS-08 | Operator + Owner apps | Bungaroo frontend |
| WS-04 rules review | Dental CDT rules | US team |
| Product spec | Architecture docs | US team |

---

## Synthetic data only

No real PHI until HIPAA BAAs. Use `scripts/seed-synthetic.ts` (WS-01) and `data/synthetic/`.

---

## Questions?

- Scope → [docs/architecture/PHASE_1_SLICE.md](./docs/architecture/PHASE_1_SLICE.md)
- Product → [docs/OPEN_QUESTIONS.md](./docs/OPEN_QUESTIONS.md)
