# CURSOR_AUTONOMOUS_RUN.md  — the single master prompt

One self-contained prompt. Paste the fenced block into Cursor **Agent** mode with **auto-run
enabled**, send it, and walk away. It has all our decisions baked in, runs unattended, never
stops to ask you anything, protects your partner's website, and can't damage anything because
it works additively on a throwaway branch and never pushes.

## Before you start (30 sec)
1. Cursor → **Agent** mode → **enable auto-run**.
2. (Helpful but optional) have `PROJECT_OVERVIEW.md`, `CURSOR_BUILD_PROMPT.md`,
   `CURSOR_SESSION_QUEUE.md`, and the `/seed` fixtures in the repo — the prompt uses them if
   present, but it's self-contained without them.
3. Paste, send, leave. Read `RUN_LOG.md` when you're back.

> It works through the task list until done or blocked, then writes the log and stops. One run
> will get through the foundation and into billing; if it doesn't finish everything, just paste
> "continue the run on the auto/foundation branch" when you're back. It's safe to re-run.

---

```text
# MASTER BUILD — run unattended, do all the work, never wait for my approval

You are building our company's product autonomously while I am away. Work through the TASK LIST
top to bottom. Do NOT stop to ask me anything. After each task: lint/typecheck, then COMMIT,
then continue to the next task. If a task is blocked, write the blocker into RUN_LOG.md and move
to the next INDEPENDENT task. Keep going until the list is complete or you are truly blocked,
then write the final RUN_LOG.md and stop. Never pause for confirmation.

If PROJECT_OVERVIEW.md, CURSOR_BUILD_PROMPT.md, CURSOR_SESSION_QUEUE.md, or /seed exist, read
and follow them. Everything you need is also below.

## ====== SAFETY (HARD RULES — this is unattended) ======
1. 🚨 PROTECT MY PARTNER'S WEBSITE. My partner built a marketing/showcase/demo website for our
   billing software. It may or may not be in the repo yet. If you find ANY app, folder, or files
   that look like a marketing site, landing page, showcase, demo, or web front-end you did not
   create (e.g. /apps/site, /apps/web, /apps/marketing, /apps/landing, /apps/demo, /website,
   /landing, /marketing, or anything with marketing/hero/pricing content): treat it as READ-ONLY
   and OFF-LIMITS. Never delete, move, rename, refactor, overwrite, or "retire" it, and never list
   it for retirement. Leave it byte-for-byte untouched.
2. Work ONLY on a new branch `auto/foundation` off the current branch. NEVER commit to, merge to,
   or check out `main`. NEVER push to remote. NEVER force-push. NEVER touch other branches.
3. ADDITIVE ONLY. Never delete, overwrite, move, or rename an existing file. Before creating any
   folder or file, check it does not already exist; if it exists, SKIP it and log it — never
   overwrite. Anything that "should" be retired gets LISTED in RUN_LOG.md for me, not touched.
4. NEVER run destructive/irreversible commands: no rm -rf, git reset --hard, git clean,
   git push (any), branch deletion, or any database drop/reset.
5. Synthetic data ONLY. No real PHI, no secrets, no .env values. Write Supabase migration files
   to disk but do NOT apply them to any live database and do NOT run anything needing real creds.
6. pnpm install + lint/format are fine. If a command needs creds/network you lack, skip + log.
7. Commit small after every task with a clear message so I can review and revert easily.

## ====== WHAT WE'RE BUILDING (context so you build the right thing) ======
An all-in-one dental insurance-billing platform that runs a clinic's insurance billing end to
end, sitting ON TOP of the clinic's existing PMS. We combine, in one system, what today takes
three vendors (claim submission/clearinghouse like Vyne, AR/analytics like InsideDesk, and a
conversational analyst), delivered as software + a managed service. Endgame: a full practice OS
better than Archy — won by nailing the financial core first (Archy's weakest area: ledger,
collections, reporting, audit, insurance edge cases) WITHOUT forcing a PMS migration, then
expanding module by module on ONE event-sourced spine.

Locked decisions:
- Customers: two clinics on Dentrix (PMS) + Vyne (claims) + InsideDesk (AR/analytics). Integrate
  on top; displace InsideDesk first; ride Vyne/Onederful for eligibility behind an adapter.
- Stack: monorepo (Turborepo + pnpm), React (Vite) + Tailwind + shadcn/ui, TypeScript strict,
  Supabase (Postgres/Auth/Storage) + AWS. NO Next.js. Mobile-first.
- Architecture: multi-tenant + Row-Level Security from line one; EVENT-SOURCED spine (append-only
  event log = source of truth + audit + learning data); agents EMIT events, never mutate state;
  an event-derived LEDGER with built-in audit (inverting Archy's hidden audit logs); a cross-
  module Jarvis that reads the whole log; payer-intelligence (CDT × payer × outcome) as the moat.
- SCAFFOLD the FULL practice OS now; IMPLEMENT BILLING only. A separate dev team fills the other
  modules. Non-billing modules = clean documented empty shells (folder + index.ts contract +
  README: responsibility, owned entities, reserved event namespace). Do NOT implement their logic.
- Design tokens (warm-clinical-minimal): surface #FAFAF7, navy #1C2A3A, terracotta #C55A2D,
  success #2E7D5B, warn #C9A227, danger #B3402F; humanist sans UI; tabular numerals for money.

## ====== TASK LIST ======
T0.  Create + switch to branch `auto/foundation` off the current branch.

T1.  RECONCILIATION (report only — change NO existing code; obey safety rule #1). Inventory the
     repo, classify each significant module KEEP/REFACTOR/RETIRE in docs/RECONCILIATION.md, map
     KEEP/REFACTOR onto the target structure. Explicitly note any marketing/showcase site as
     PROTECTED — do not retire it. Commit.

T2.  SCAFFOLD THE FULL PRACTICE OS (additive; never overwrite existing folders). Turborepo + pnpm.
     - Apps (Vite+React+Tailwind, NO Next.js): /apps/operator, /apps/owner (implemented later);
       /apps/clinical, /apps/admin (empty shells + README). If a target app folder already exists,
       skip + log (it may be my partner's site).
     - Platform packages: /packages/ui (design system: tokens above + shadcn), /packages/core,
       /packages/db, /packages/events, /packages/auth.
     - Billing module folders: /packages/billing-ingest, /packages/agents, /packages/tools,
       /packages/analytics, /packages/intelligence, /packages/integrations, /packages/ledger.
     - ALL-IN-ONE SHELLS (folder + index.ts typed contract + README, NO logic):
       /packages/scheduling, /packages/clinical, /packages/imaging, /packages/comms,
       /packages/patients.
     - Root ARCHITECTURE.md: every module + status (implemented | shell) + contract.
     - Shared eslint/prettier/tsconfig; .env.example (gitignored .env).
     Verify pnpm install succeeds and operator/owner import a shared <Button> from @app/ui. Commit.

T3.  CANONICAL SCHEMA + TYPES (write files; do NOT apply to a live DB). In /packages/db, Supabase
     migrations, every table tenant-scoped by clinic_id:
     billing: payers, eligibility_checks, claims, claim_lines, attachments, flags,
       fixes[append-only], outcomes[append-only], payer_intelligence[derived], import_batches,
       ledger_transactions[event-derived];
     all-in-one stubs: patients, providers, appointments, treatment_plans, clinical_notes,
       imaging_refs, communications;
     platform: clinics, users, user_roles(operator|owner|biller|admin), events[append-only spine].
     events.type domain-namespaced (billing.* now; clinical.*/schedule.*/comms.* reserved). Add a
     derived patient_timeline view. RLS ON everywhere, scoped by clinic_id. In /packages/core write
     matching TS types + zod schemas. Lint/typecheck. Commit.

T4.  EVENT LOG SPINE in /packages/events: emit(event){id,clinic_id,type,payload,actor,created_at};
     deriveState(entityId) folds events; replay(). Tests: emit→derive correct; events immutable. Commit.

T5.  AUTH in /packages/auth: Supabase Auth with clinic_id + role on session; React tenant context
     scoping queries; route guards (operator app = operator/biller/admin; owner = owner/admin);
     dev seed of 1 clinic + 1 owner + 1 operator. Commit.

T6.  INGEST in /packages/billing-ingest: adapter interface + CsvDentrixAdapter (Dentrix-export CSV
     → canonical claims/claim_lines, emit claim.ingested). Use /seed fixtures if present; else
     generate synthetic clinics/patients/payers/claims (incl. D4341/D4342/D4910/D1110/D2950) + a
     matching 835 + 271s. CLI: seed, ingest. NO real PHI. Commit.

T7.  AGENTS in /packages/agents + /packages/tools: orchestrator + worker pattern; tools (read or
     event-emitting only): query_claims, query_payer_intelligence, raise_flag(→flag.raised),
     compute_kpi. Scrub/Coding agent: per line check CDT validity, frequency, missing-attachment-
     required, leakage vs fee schedule; rules + Claude (Sonnet judgment / Haiku extraction);
     output flags{type,severity,dollar_impact,reason} as events. Commit.

T8.  OPERATOR WORKSPACE in /apps/operator (use @app/ui): worklist ranked by dollar_impact×urgency;
     claim detail with flags + auto-fixes; gate actions Approve/Fix/Override(reason) emitting
     events; emit claim.submitted (simulated). Mobile-first. Commit.

T9.  OUTCOME LOOP + ELIGIBILITY + LEDGER in /packages/integrations + /packages/ledger: ingest 835,
     match to claims, emit outcome.received, update payer_intelligence; eligibility agent consumes
     271 (Onederful-style) → full benefit breakdown + "problem before the chair" alerts; build an
     eligibility adapter interface so a real VyneOnederfulAdapter drops in later; insurance-card
     OCR stub (Haiku vision); event-derived ledger_transactions with drill-to-source audit. Commit.

T10. ANALYTICS in /packages/analytics + /apps/owner: KPI engine from the event log (clean-claim
     rate, first-pass, denial rate by payer/code, net collection, AR aging, charge lag, dollars
     flagged, dollars recovered). Owner Dashboard: KPI tiles (hero = dollars recovered), revenue-
     leak radar ($-ranked), payer scorecard (from payer_intelligence); every number drills to claims. Commit.

T11. JARVIS in @app/ui, mounted in /apps/owner (analyst) + /apps/operator (tactical): Claude +
     shared tools; answers plain-language questions from events+analytics+payer_intelligence,
     ALWAYS returns the underlying claims, and OFFERS a next action routed through agents/gate
     (events only). Commit.

T12. HISTORICAL IMPORT in /packages/integrations/history: importers for Vyne/Onederful ERA history
     and InsideDesk CSV → canonical outcomes → emit history.imported → backfill payer_intelligence
     (warm start). import_batches provenance; idempotent. Synthetic sample now; structured for real
     exports post-BAA. Commit.

T13. RUN_LOG.md: per-task summary (done/blocked/why), PROTECTED items left untouched (incl. any
     partner website found), RETIRE candidates LISTED not deleted, and exact next steps for me
     (apply migrations, review, merge). Final commit. Do NOT push. Stop.
```

---

## When you get back
1. `git checkout auto/foundation`, read **RUN_LOG.md**.
2. Confirm your partner's website is untouched (it will be — it was never modified).
3. Skim RECONCILIATION.md + ARCHITECTURE.md + the new packages.
4. Do the things it left for you on purpose: apply migrations, any retirements, merge to `dev`.
5. If it didn't finish, paste: "continue the run on the auto/foundation branch."
