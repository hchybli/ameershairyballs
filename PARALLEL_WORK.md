# Parallel work (independent of WS-02–WS-05 chain)

Run these in **separate agent sessions** on the branches noted. Do not block the backend spine on them.

---

## UI polish (`packages/ui` + operator/owner styling)

**Branch:** `feature/bungaroo/WS-06-operator-ui` (off `feature/bungaroo/WS-05-edge-functions` when merged)

**Prompt:**

> Read `docs/architecture/USER_FLOWS.md` and `docs/architecture/WORKSTREAMS.md` WS-06. Improve operator work queue, claim detail, and owner dashboard using shared components in `packages/ui`. Do not change Edge Function contracts or event types. Verify login + queue + gate-action against live Supabase demo users.

---

## Marketing / showcase site

**Branch:** `feature/bungaroo/marketing-site` (off `main`)

**Prompt:**

> Build or refine the public marketing/showcase site only. Do not touch `apps/operator`, `apps/owner`, `supabase/functions`, or legacy `src/` billing app. Synthetic copy only, no PHI.
