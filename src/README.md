# Legacy Next.js prototype — deprecated

**Do not add features here.** Phase 1 apps live in `apps/operator` and `apps/owner`.

This tree is a reference port for scrub rules and early UI experiments. New work uses:

- Vite React SPAs + `@backstop/ui`
- Supabase Edge Functions via `@backstop/api-client`
- Event-sourced read models in `packages/events`

To run for comparison only:

```bash
npm run dev:legacy   # http://localhost:3000
```

Retirement tracked in [docs/architecture/WORKSTREAMS.md](../docs/architecture/WORKSTREAMS.md) WS-09.
