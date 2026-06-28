# @backstop/store

In-memory demo store used by `apps/api` (Express) during Phase 1 prototyping.

**Status:** Deprecated — replaced by `@backstop/events` + Supabase read models.

WS-05 will remove this package and point `apps/operator` / `apps/owner` at Supabase Edge Functions instead of the Express API shim.

Do not add new features here.
