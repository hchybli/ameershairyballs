# Parallel work (independent branches)

Work that does **not** block merge of Phase 1 to `main`. Run in separate agent sessions.

---

## WS-00 — Turborepo migration

**Branch:** `feature/bungaroo/WS-00-monorepo` (off `main`)

Migrate npm workspaces → Turborepo + pnpm per [WORKSTREAMS.md](./architecture/WORKSTREAMS.md) WS-00. Preserve `npm run verify` and `deploy:edge`.

---

## WS-09 — E2E demo script

**Branch:** `feature/bungaroo/WS-09-e2e` (off `main`)

Add `scripts/demo-e2e.sh` documenting upload → scrub → gate → agents → outcomes → KPI. Mark `src/` deprecated.

---

## WS-AGENTS-03 — History import

**Branch:** `feature/bungaroo/WS-AGENTS-03-history-import` (off `main`)

`history.imported` from de-identified Vyne/InsideDesk exports → warm `payer_intelligence`. **No PHI in repo.**

---

## Marketing site (optional)

**Branch:** `feature/bungaroo/marketing-site`

Public showcase only. Do not touch `apps/operator`, `apps/owner`, or `supabase/functions`.
