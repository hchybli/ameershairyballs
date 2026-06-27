# Backstop

**Dental insurance billing platform** — event-sourced, multi-tenant. Engineering handoff to **Bungaroo India**.

| | |
|---|---|
| **Repo** | [github.com/hchybli/ameershairyballs](https://github.com/hchybli/ameershairyballs) |
| **US team** | @hchybli, @ameerabouhouli — product, dental rules, review |
| **Engineering** | Bungaroo India — implementation |
| **Status** | Architecture + workstreams documented. Legacy prototype in `src/`. |

---

## Bungaroo — start here

1. **[docs/HANDOFF_BUNGAROO.md](./docs/HANDOFF_BUNGAROO.md)** — read first  
2. **[docs/architecture/WORKSTREAMS.md](./docs/architecture/WORKSTREAMS.md)** — pick WS-00 and go  
3. **[docs/architecture/LEGACY_REFERENCE.md](./docs/architecture/LEGACY_REFERENCE.md)** — port from `src/`  

---

## Architecture docs

| Doc | Purpose |
|-----|---------|
| [architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) | Six layers, principles, stack |
| [architecture/PHASE_1_SLICE.md](./docs/architecture/PHASE_1_SLICE.md) | Definition of done |
| [architecture/WORKSTREAMS.md](./docs/architecture/WORKSTREAMS.md) | WS-00 … WS-09 epics |
| [architecture/EVENT_CATALOG.md](./docs/architecture/EVENT_CATALOG.md) | Event types + JSON |
| [architecture/API_CONTRACTS.md](./docs/architecture/API_CONTRACTS.md) | Edge Functions |
| [architecture/DATA_MODEL.md](./docs/architecture/DATA_MODEL.md) | Tables + RLS |
| [architecture/PACKAGE_MAP.md](./docs/architecture/PACKAGE_MAP.md) | Monorepo packages |

---

## Legacy prototype (reference only)

```bash
npm install && npm run dev   # Next.js spike at localhost:3000
```

Do **not** build new features here. Target: Turborepo in `apps/` + `packages/`.

---

## Repo layout (target)

```
apps/operator     apps/owner
packages/core     packages/events     packages/agents
packages/integrations   packages/ui   …
supabase/migrations   supabase/functions
```

Each folder has a `README.md` with acceptance criteria.

---

## Security

Synthetic data only. No secrets in git. HIPAA BAAs required before real PHI.
