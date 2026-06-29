# CURSOR_SESSION_QUEUE.md  (v2 — real-customer direction)

Ordered Cursor prompts for the tandem build. Each fenced block is one prompt — paste it,
let the agent finish + commit, then run the next. Assumes `PROJECT_OVERVIEW.md` and
`CURSOR_BUILD_PROMPT.md` are in the repo.

## Locked context (real situation)
- **Customers:** two clinics on **Dentrix (PMS) + Vyne (claims/clearinghouse) + InsideDesk (AR/analytics)**. History is exportable.
- **PMS:** Dentrix-first (export-bridge now; Dentrix Developer Program write-back is a priority).
- **Eligibility/claims data:** ride **Vyne / Onederful API** behind an adapter (lowest friction — clinics already have it). Route claim transport through a neutral clearinghouse later; keep it swappable.
- **Wedge:** integrate on top → **displace InsideDesk first** (your prevention + payer-intelligence + Jarvis beats their analytics) → absorb Vyne over time → one all-in-one platform.
- **Moat seed:** backfill payer-intelligence from the clinics' **real Vyne/InsideDesk history** (warm start). Synthetic now; real data after BAAs.
- **Competitor:** Archy (all-in-one PMS, shallow billing, requires PMS replacement). You win on billing depth + integrate-don't-replace + managed service + seeded data moat.
- **Stack:** React (Vite) + Tailwind + shadcn, Supabase + AWS. No Next.js. Multi-tenant + RLS + event-sourced from line one. Synthetic data only until BAAs.
- **Scaffold the FULL practice OS now; implement BILLING only.** A Bangalore dev team will fill in the other modules. So: every module's package/shell/boundary + contract exists from the start (scaffold-everything), but only billing-related modules are implemented now. Non-billing modules are clean, documented empty shells (interface + README + reserved event namespace + canonical stubs) — NOT implemented here. The goal is a stable contract a parallel team builds against; foundation correctness > speed, because errors replicate across every module.

## ⚠️ There is older code on `main` from a previous direction
Run **R0 first** — it reconciles existing code before anything is scaffolded. Do not let any
prompt blindly scaffold over what's there.

## Branch strategy (two people, one repo)
- Keep `main` stable. Create `dev` as the integration branch off `main`.
- Ameer: feature branches off `dev` (`recon/*`, `foundation/*`, `slice/*`). Friend: `demo/*`.
- PR into `dev`; merge `dev` → `main` only when a milestone is green. Never both push `main`.

---

# R0 — REPO RECONCILIATION (run first, Ameer)

```text
Read PROJECT_OVERVIEW.md and CURSOR_BUILD_PROMPT.md.

This repo already has code on main from an EARLIER, different direction. Do NOT delete it or scaffold over it. First, take inventory and reconcile.

Do:
1. Inventory the repo: actual folder structure, the stack/frameworks actually in use, what builds and runs, and a one-line purpose for each significant module.
2. Produce a RECONCILIATION REPORT (as docs/RECONCILIATION.md) classifying every significant file/module as:
   - KEEP — fits the new direction as-is
   - REFACTOR — salvageable; note what must move/change to fit the target structure in CURSOR_BUILD_PROMPT.md
   - RETIRE — conflicts with or is obsolete under the new direction
3. Map the KEEP/REFACTOR items onto the target monorepo structure (apps/operator, apps/owner, packages/*).
4. Propose a migration + branch plan: what moves where, in what order, on which branches.

Constraint: this is React (Vite) + Tailwind + shadcn, Supabase + AWS, NO Next.js. If existing code uses Next.js or another stack, flag it in the report and propose the migration path rather than silently rewriting.

STOP after writing docs/RECONCILIATION.md and the plan. Do not change code yet — show me the report first.
```

---

# TRACK A — FOUNDATION SPINE (Ameer, after R0 is approved)

> Each A-prompt should reuse anything marked KEEP/REFACTOR in R0 rather than rebuild it.

## A1 — Monorepo + shared design system

```text
Read the docs and docs/RECONCILIATION.md. Establish the monorepo foundation, reusing KEEP/REFACTOR code from the reconciliation. NO product features yet.

Scaffold the FULL practice-OS monorepo now, but only wire up the platform/billing pieces. Non-billing modules are created as clean empty shells (folder + index.ts contract + README describing the module's responsibility, the canonical entities it owns, and its reserved event namespace) for the Bangalore team to fill later. Do NOT implement non-billing modules.

Build:
- Turborepo + pnpm workspaces, TypeScript strict. Reuse KEEP/REFACTOR code from reconciliation.
- Apps (Vite + React + Tailwind, NO Next.js):
  - /apps/operator, /apps/owner — implemented later (Track B).
  - /apps/clinical, /apps/admin — SHELLS only (empty app + README contract).
- Platform packages (implemented across Tracks A/B):
  - /packages/ui (design system: Tailwind tokens + shadcn, mobile-first — surface #FAFAF7, navy #1C2A3A, terracotta #C55A2D, success #2E7D5B, warn #C9A227, danger #B3402F; humanist sans; tabular numerals)
  - /packages/core (canonical types, A2), /packages/db (A2), /packages/events (A3), /packages/auth (A4)
- Billing modules (implemented in Track B): /packages/billing-ingest, /packages/agents, /packages/tools, /packages/analytics, /packages/intelligence, /packages/integrations, /packages/ledger
- ALL-IN-ONE module SHELLS (scaffold now, do NOT implement — for the dev team):
  /packages/scheduling, /packages/clinical, /packages/imaging, /packages/comms, /packages/patients
  Each shell = index.ts exporting a typed contract + README.md (responsibility, owned canonical entities, reserved event namespace e.g. `schedule.*`, dependencies on the spine). No business logic.
- Shared eslint/prettier/tsconfig base; .env.example (gitignored .env). A root ARCHITECTURE.md listing every module, its status (implemented | shell), and its contract — the map the dev team picks up from.

DONE WHEN: `pnpm dev` runs the operator/owner shells importing a shared <Button> from @app/ui; every module folder exists with its README contract; ARCHITECTURE.md lists all modules + statuses; lint clean.
```

## A2 — Supabase schema, multi-tenant, RLS, canonical model

```text
Read the docs. Build the data foundation in /packages/db and /packages/core.

This schema must SEED THE ALL-IN-ONE platform, not just billing. We build billing first, but the foundation has to expand into a full practice OS (to beat Archy) without re-migration. So include minimal future-module stubs now, and namespace events by domain.

Build:
- Supabase Postgres migrations, every table tenant-scoped by clinic_id.
  BILLING (populated now): payers, eligibility_checks, claims, claim_lines(cdt_code, tooth, quadrant, fee_billed, fee_allowed), attachments, flags, fixes(append-only), outcomes(append-only), payer_intelligence(derived), import_batches(provenance), ledger_transactions(derived from events — every entry traces to its source event for built-in auditability).
  ALL-IN-ONE STUBS (defined now, lightly populated later — so we never re-migrate): patients, providers, appointments, treatment_plans, clinical_notes, imaging_refs, communications.
  PLATFORM: clinics, users, user_roles(operator|owner|biller|admin), events(append-only, the universal spine).
- events.type is DOMAIN-NAMESPACED: billing.* fires now; reserve clinical.* / schedule.* / comms.* for later modules. Every future module emits to THIS log (one trunk, not bolted-on silos — this is the architectural edge over Archy + free in-app audit on every module).
- A derived `patient_timeline` view that folds ALL of a patient's events into one chronological record (the backbone of the all-in-one).
- RLS ON for every table, scoped by clinic_id via auth context. No service-role keys client-side.
- /packages/core: TS types + zod schemas — the canonical model the platform imports.

Guardrails: outcomes/fixes/events/ledger_transactions append-only; patients holds a reference + minimal fields only; the all-in-one stubs exist but stay minimal until their module ships.

DONE WHEN: migrations apply, RLS blocks cross-tenant reads in a test, /packages/core compiles against the schema.
```

## A3 — Event log (the spine)

```text
Read the docs. Build /packages/events — the append-only event log (source of truth + audit + learning data).

Build:
- emit(event) → immutable {id, clinic_id, type, payload, actor, created_at}.
- Event types: claim.ingested, eligibility.checked, flag.raised, fix.applied{auto:bool}, claim.approved, claim.submitted, outcome.received, history.imported.
- deriveState(entityId) folds events into current state; replay() rebuilds derived tables.
- Tests: emit→derive yields correct state; events never mutate.

DONE WHEN: a scripted event sequence for one claim derives the correct final state; tests pass.
```

## A4 — Auth + tenant context + RBAC

```text
Read the docs. Build /packages/auth and wire both apps.

Build:
- Supabase Auth with clinic_id + role on the session (operator|owner|biller|admin).
- React tenant context exposing current clinic + role; scopes all queries.
- Route guards: operator app = operator/biller/admin; owner app = owner/admin.
- Dev seed: 1 clinic + 1 owner + 1 operator.

DONE WHEN: operator user lands in /apps/operator scoped to its clinic; owner in /apps/owner; cross-tenant access impossible.
```

---

# TRACK B — WORKING VERTICAL SLICE + MOAT SEED (Ameer, after A)

## B1 — Synthetic seed + Dentrix CSV ingestion adapter

```text
Read the docs. Build /packages/integrations/ingest with an ADAPTER interface; first adapter: Dentrix-export CSV → canonical claims/claim_lines, emitting claim.ingested.

Use the provided fixtures in /seed (dentrix_export_claims.csv, era_835.json, eligibility_271.json) — they're already Dentrix/Onederful-shaped. Also port /seed/generate.py as the synthetic generator. NO real PHI.
CLI: `seed` and `ingest <csv>`.

DONE WHEN: `seed` then `ingest` loads the fixture claims via events, visible through deriveState.
```

## B2 — Agent framework + Scrub/Coding agent

```text
Read the docs. Build /packages/agents (orchestrator + workers) and /packages/tools (function-calling), then the first agent.

Build:
- Orchestrator routing a claim to specialist agents; agents are Claude calls (Sonnet judgment, Haiku extraction) with tools.
- Tools (read or event-emitting only — agents NEVER mutate state): query_claims, query_payer_intelligence, raise_flag(→flag.raised), compute_kpi.
- Scrub/Coding agent: per line, check CDT validity, frequency, missing-attachment-required, leakage (under-collecting vs fee schedule). Rules for deterministic checks; Claude for ambiguous. Output flags {type, severity, dollar_impact, reason} as events.

DONE WHEN: scrub over seeded claims produces sensible flags (as events) with dollar impacts — including the D4341 missing-perio-chart case in the fixtures.
```

## B3 — Operator Workspace (the gate)

```text
Read the docs. Build the gate UI in /apps/operator using @app/ui.

Build:
- Worklist ranked by dollar_impact × urgency (next-best-action on top).
- Claim detail: lines + agent flags + auto-fixes already applied.
- Gate actions: Approve / Fix / Override(reason required) — each emits an event. After approval, emit claim.submitted (simulated).
- Mobile-first; minimal taps.

DONE WHEN: an operator resolves every flag on a claim via the gate and the worklist updates — all event-driven.
```

## B4 — Outcome loop + Eligibility agent (Vyne/Onederful-shaped)

```text
Read the docs. Build the outcome loop and the eligibility agent (highest-ROI feature — first-class).

Build:
- Outcome loop in /packages/integrations: ingest era_835.json, match remittance lines to claims, emit outcome.received{result, paid_amount}, update payer_intelligence (CDT×payer×outcome, attachment + narrative patterns).
- Eligibility agent: consume eligibility_271.json (Onederful v2 schema) → full benefit breakdown (active, annual max, deductible, coverage % by category, frequency limits, waiting periods, COB). Emit eligibility.checked. Surface "coverage problem before the chair" alerts (lapsed, frequency-exceeded, benefit-exhausted, out-of-network).
- Insurance-card OCR stub: card image → member ID + payer via Haiku vision → prefill the check.

Build the eligibility adapter interface so a real VyneOnederfulAdapter (OAuth2 REST) drops in later; the fixtures already match its schema.
Roadmap comments only (do NOT build): multi-touchpoint re-verification; AI voice payer calls.

DONE WHEN: ingesting the 835 posts outcomes and grows payer_intelligence; an eligibility check returns a structured breakdown and flags the PT-1005 frequency/benefit-exhausted problem.
```

## B5 — Analytics/KPI engine + Owner Dashboard

```text
Read the docs. Build /packages/analytics and the Owner Dashboard in /apps/owner using @app/ui.

Build:
- KPI engine from the event log: clean-claim rate (north-star), first-pass acceptance, denial rate (by payer/code), net collection rate, AR aging, charge lag, dollars flagged, dollars recovered/protected.
- Dashboard: KPI command center (tiles: metric/target/trend/color; hero = dollars recovered); revenue-leak radar ($-ranked: undercoded, underpaid-vs-fee-schedule, denials-not-appealed, nearing 90-day cliff); payer scorecard (per payer: denial rate, days-to-pay, downcode freq, top denial reasons — from payer_intelligence). Every number drills to its claims.

DONE WHEN: live KPIs render from seeded data; clicking the denial-rate tile drills to the denied claims.
```

## B6 — Jarvis (conversational analyst)

```text
Read the docs. Build Jarvis — a chat panel in both apps, Claude (Sonnet) + the shared tools.

Build:
- Panel component in @app/ui; mounted in /apps/owner (analyst) and /apps/operator (tactical).
- Answers plain-language questions from events + analytics + payer_intelligence, ALWAYS returning the underlying claims, and OFFERING a next action routed through the agents/gate (events only).
- Owner: "why did Delta collections drop?", "denial rate by payer?". Operator: "what attachment does Cigna need for this D4341?" (the fixtures support this exact answer).

DONE WHEN: Jarvis answers the owner "denial rate by payer" and the operator "attachment for this code" questions from real data, each with an offered action. (This is your answer to Archy's "Ask Archy" — go deeper: action, not just reporting.)
```

## B7 — Historical import (the moat seeder)

```text
Read the docs. Build the historical backfill that warms the payer-intelligence graph from the clinics' existing Vyne/InsideDesk data — the unfair advantage Archy can't match.

Build:
- /packages/integrations/history: importers for (a) Vyne/Onederful ERA history (API or CSV export) and (b) InsideDesk claim/denial CSV export → map to canonical outcomes → emit history.imported events → build payer_intelligence so denial-prediction starts WARM, not empty.
- import_batches provenance (source, date range, row counts) for auditability.
- Idempotent re-imports (no double-counting). Synthetic sample now; structure for real exports.

Guardrail: real exports contain PHI — synthetic only until BAAs are signed. Build the pipeline now; flip to real data post-BAA.

DONE WHEN: importing a synthetic historical export backfills payer_intelligence and the denial-prediction signal measurably improves vs. a cold start.
```

---

# TRACK C — INTERACTIVE CLICK-THROUGH DEMO + SITE (Friend, parallel)

## C1 — Interactive product walkthrough (hero asset)

```text
Read PROJECT_OVERVIEW.md. Build a STANDALONE interactive click-through demo on canned synthetic data — guided, clickable, NO backend, embeddable. Marketing asset AND design north star.

Vite + React + Tailwind + shadcn; if @app/ui exists import it, else use tokens: surface #FAFAF7, navy #1C2A3A, terracotta #C55A2D, success #2E7D5B; humanist sans; tabular numerals. Mobile-first, polished.

Guided tour, lead with eligibility:
  1. ELIGIBILITY: patient booked → auto-verify → full benefit breakdown → flag a problem before the visit ("frequency limit: cleaning not covered until Sept"). Emphasize "caught before the chair."
  2. CLEAN CLAIM: claim built → agents auto-fix safe issues → flag one → one-tap approve ("3 fixed, 1 needs you").
  3. SUBMIT + TRACK live status.
  4. OUTCOME: comes back PAID → auto-posted.
  5. OWNER DASHBOARD: KPI tiles (clean-claim rate; dollars recovered as hero), payer scorecard, leak radar.
  6. JARVIS: "why did Delta collections drop?" → answers with data + offers to draft appeals.

Canned fixtures (mirror /seed so demo and real build tell the same story). Include restart + skip-to-dashboard. Make it feel real and fast.

DONE WHEN: a visitor clicks all 6 steps start-to-finish on any screen size, no backend.
```

## C2 — Marketing site shell + positioning (vs Archy)

```text
Read PROJECT_OVERVIEW.md. Build the marketing site shell (Vite + React + Tailwind, same design system) with the C1 demo embedded as the centerpiece.

Build:
- Hero: run your dental insurance billing end to end — get claims out clean and get paid. CTA → the demo.
- Sections: the problem (denials, leakage, 10–20 hrs/week verification); how it works (verify → prevent → submit → recover → analyze); why different — ONE deep RCM loop on top of the PMS you already use (no rip-and-replace), vs. juggling Vyne + InsideDesk or migrating your whole practice to a new PMS; software + managed service; pro-practice (we earn when you collect more); pricing teaser (below incumbents). "Request access" stub form.

Positioning guardrail: differentiate on billing DEPTH + integrate-don't-replace + managed service. No compliance/financial guarantees, no real customer names/PHI.

DONE WHEN: site renders responsively with the demo embedded and positioning in place.
```

---

# LOCKED DECISIONS (recorded)
- Dentrix-first (export-bridge now; DDP write-back priority).
- Ride Vyne/Onederful for eligibility behind an adapter; neutral clearinghouse for claim transport later.
- Integrate-first → displace InsideDesk → absorb Vyne → all-in-one.
- Seed payer-intelligence from real Vyne/InsideDesk history (post-BAA); pipeline built now on synthetic.
- Position vs Archy on depth + no-migration + managed service + seeded moat.

# STILL OPEN
- BAAs (Supabase + AWS + clinic) before any real PHI/history import.
- Clearinghouse pick for transport when you absorb Vyne (DentalXChange vs Stedi).
- Entity/state pricing structure (fee-splitting; get the healthcare attorney before contract #1).
