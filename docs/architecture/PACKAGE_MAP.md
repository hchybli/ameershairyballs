# Package map

Dependency direction: **apps → packages** (never packages importing apps).

---

## Apps

| Package | Description | Depends on |
|---------|-------------|------------|
| `apps/operator` | Gate UI: work queue, claim action view, upload, approve/override | `ui`, `auth`, `core` |
| `apps/owner` | KPI dashboard + drill-down | `ui`, `auth`, `analytics` |

---

## Packages

| Package | Description | Depends on | Owner (P1) |
|---------|-------------|------------|------------|
| `packages/ui` | shadcn, Tailwind preset, shared components | — | Bungaroo FE |
| `packages/core` | Canonical types: Claim, Flag, Outcome, Tenant | — | Bungaroo BE |
| `packages/events` | emit, projectors, replay | `core`, `db` | Bungaroo BE |
| `packages/db` | Supabase client helpers, generated types | — | Bungaroo BE |
| `packages/auth` | Tenant from JWT, RBAC roles | `db` | Bungaroo BE |
| `packages/integrations` | `IngestAdapter`, CSV implementations | `core` | Bungaroo BE |
| `packages/agents` | Scrub orchestrator, rules, LLM | `core`, `events`, `tools`, `intelligence` | Bungaroo BE |
| `packages/tools` | Agent function-calling surface | `core`, `events`, `db` | Bungaroo BE |
| `packages/intelligence` | payer_intelligence read/write | `core`, `db` | Bungaroo BE |
| `packages/analytics` | KPI engine, drill-down | `core`, `events`, `db` | Bungaroo BE |
| `packages/edi` | **STUB** — X12 interfaces only | `core` | US spec / P2 |

---

## Dependency diagram

```
apps/operator ──► ui, auth, core
apps/owner    ──► ui, auth, analytics

packages/agents ──► tools, intelligence, events, core
packages/tools  ──► events, db, core
packages/analytics ──► events, intelligence, core
packages/events ──► db, core
packages/integrations ──► core
packages/intelligence ──► db, core
packages/auth ──► db
```

---

## Public API conventions

- Each package exports from `src/index.ts` only  
- No deep imports (`@backstop/agents/src/scrub/rules`) from apps — use package root  
- Package name in `package.json`: `@backstop/core`, `@backstop/events`, etc.

---

## Stub packages (create README + empty export)

These exist so the monorepo graph is complete; implement in later phases:

| Package | Phase |
|---------|-------|
| `packages/edi` | 2 |
| Dentrix live adapter in `integrations` | 4 |
| Clearinghouse adapter | 4 |

---

## File placement rules

| If you're building… | Put it in… |
|---------------------|------------|
| CDT validation rule | `packages/agents/src/scrub/rules/` |
| CSV column parsing | `packages/integrations/src/adapters/` |
| Supabase migration | `supabase/migrations/` |
| Edge Function HTTP handler | `supabase/functions/<name>/index.ts` |
| React page | `apps/operator` or `apps/owner` |
| Shared button/card | `packages/ui` |
| KPI formula | `packages/analytics` |
