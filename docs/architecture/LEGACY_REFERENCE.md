# Legacy Next.js prototype — porting guide

**Path:** `src/` (root Next.js 14 app)  
**Status:** Reference implementation — **do not add features here**

The US team built a working spike to validate dental rules and UX. Bungaroo ports this into the Turborepo packages.

---

## Port map

| Legacy file | Target | Notes |
|-------------|--------|-------|
| `src/lib/csv/parse-claims-csv.ts` | `packages/integrations/src/adapters/csv-dentrix.ts` | Keep tests identical |
| `src/lib/csv/parse-claims-csv.test.ts` | `packages/integrations/src/adapters/csv-dentrix.test.ts` | |
| `src/lib/csv/parse-outcomes-csv.ts` | `packages/integrations/src/adapters/csv-835.ts` | |
| `src/lib/csv/parse-outcomes-csv.test.ts` | `packages/integrations/src/adapters/csv-835.test.ts` | |
| `src/lib/rules/cdt-catalog.ts` | `packages/agents/src/scrub/rules/cdt-catalog.ts` | |
| `src/lib/rules/attachment-rules.ts` | `packages/agents/src/scrub/rules/attachment-rules.ts` | |
| `src/lib/rules/scrub-claim.ts` | `packages/agents/src/scrub/rules/engine.ts` | Split emit: return flags → agent emits events |
| `src/lib/rules/scrub-claim.test.ts` | `packages/agents/src/scrub/rules/engine.test.ts` | Must pass |
| `src/lib/rules/types.ts` | `packages/core/src/flag.ts` | Align with event catalog |
| `src/lib/types.ts` | `packages/core/src/claim.ts` | Add tenant_id fields |
| `src/components/claim-flags.tsx` | `packages/ui/src/flag-card.tsx` | Primary UI pattern — see [USER_FLOWS.md](./USER_FLOWS.md) |
| `src/components/claim-upload.tsx` | `apps/operator` pages | Secondary route `/upload`, not home |
| `src/components/dashboard-view.tsx` | `apps/owner` pages | |
| `data/synthetic/*.csv` | `scripts/fixtures/` or keep `data/synthetic/` | |

---

## Do NOT port

| Legacy | Why |
|--------|-----|
| `src/lib/store/demo-store.ts` | Replaced by events + projectors |
| `src/lib/ingest/save-claims.ts` | Replaced by ingest EF + events |
| `src/app/api/*` | Replaced by Supabase Edge Functions |
| In-memory flag dismiss | Replace with `flag.approved` events |

---

## Behavioral reference

Run legacy app for expected flag output:

```bash
npm install
npm run dev
# Upload data/synthetic/sample-claims.csv
```

New scrub agent should produce **equivalent flags** for the same CSV (event format differs).

---

## Retirement

After WS-09 sign-off:
1. Move `src/` to `archive/legacy-next` or delete
2. Remove root Next.js deps from package.json
3. Update README to Turborepo commands only
