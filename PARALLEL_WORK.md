# Parallel work (independent of main WS chain)

Run these in **separate agent sessions** on the branches noted. Do not block the backend spine on them.

---

## Marketing / showcase site

**Branch:** `feature/bungaroo/marketing-site` (off `main`)

**Prompt:**

> Build or refine the public marketing/showcase site only. Do not touch `apps/operator`, `apps/owner`, `supabase/functions`, or legacy `src/` billing app. Synthetic copy only, no PHI.

---

## WS-00 Turborepo migration

**Branch:** `feature/bungaroo/WS-00-monorepo` (off latest `main` or integration branch)

**Prompt:**

> Migrate npm workspaces to Turborepo + pnpm per WORKSTREAMS WS-00. Preserve all test scripts and Supabase edge deploy path. Self-verify full test suite + build:apps.

---

## WS-09 E2E demo script

**Branch:** `feature/bungaroo/WS-09-e2e` (off WS-07 tip)

**Prompt:**

> Add `scripts/demo-e2e.sh` documenting upload → scrub → gate → outcomes → KPI flow on synthetic credentials. Mark `src/` deprecated in README.
