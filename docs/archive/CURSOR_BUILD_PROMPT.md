# CURSOR_BUILD_PROMPT.md

Paste the block below into Cursor's agent chat to kick off the build. It gives the full
platform as context, then scopes you to ONE vertical slice so the AI builds in the right
shape without sprawling. Read `PROJECT_OVERVIEW.md` first; this prompt assumes it.

---

```text
# MISSION

You are building Backstop, an all-in-one insurance-billing platform for dental clinics.
It runs the clinic's insurance billing end to end: it sits on top of the clinic's PMS
(Dentrix first), and combines, in ONE system, what today takes three vendors —
claim submission + attachments (like Vyne), AR/denial automation + analytics (like
InsideDesk), and a conversational analyst on top (Jarvis). Delivered as software +
a managed billing service. The durable asset is proprietary data: a CDT-code × payer ×
outcome graph that makes every claim smarter than the last.

The platform is SIX layers. Agents are ONE slice of one layer — do not treat this as
"an agent app." The layers:
  L1 Surfaces        Operator Workspace · Biller Console · Owner Dashboard · Patient Pay · Jarvis
  L2 Orchestration   Governance Gate · Worklist engine · Agent fleet
  L3 Domain services claims · eligibility · attachments · coding · denials/appeals · AR · payments
  L4 Integration     Dentrix sync · clearinghouse gateway · payment processor · 835 ingest
  L5 Data platform   Event log (truth+audit) · Payer Intelligence (moat) · Analytics/KPI engine
  L6 Foundation      Multi-tenant · Auth/RBAC · RLS · Jobs · Observability · Config

# YOUR TASK RIGHT NOW — PHASE 1 VERTICAL SLICE ONLY

Do NOT build the whole platform. Build ONE thin slice that pierces every layer using
SYNTHETIC data only — no Dentrix API, no clearinghouse, no payments, no real PHI. The
slice proves the architecture end to end:

  1. INGEST   — load a synthetic Dentrix-export CSV of claims into a canonical claim model.
  2. EVENTS   — emit `claim.ingested` events to an append-only event log; derive state from events.
  3. AGENT    — one Scrub/Coding agent (Claude) reviews each claim line and raises flags
                (wrong CDT, missing-attachment-required, frequency, leakage). Rules first,
                LLM judgment for the ambiguous calls.
  4. GATE     — Operator Workspace UI: show flags, let a user approve / fix / override
                (override requires a reason). Every action emits an event.
  5. OUTCOMES — ingest a synthetic 835/ERA, emit `outcome.received` events (paid/denied/
                downcoded), and seed the payer_intelligence table from them.
  6. ANALYTICS— Owner Dashboard with ONE live KPI tile (clean-claim rate OR dollars flagged),
                computed from events, drill-down to the underlying claims.
  7. JARVIS   — a chat panel that answers ONE question type in plain language from the
                event/analytics data (e.g. "why was this claim flagged?" or "what's my
                denial rate?") with the data behind the answer.

When this slice runs end to end on synthetic data, Phase 1 is done. Stop and demo.

# STACK (locked — do not substitute)

- Monorepo (Turborepo). TypeScript strict everywhere.
- Frontend: React (Vite) + Tailwind + shadcn/ui, mobile-first. NO Next.js — plain React SPA.
- Backend: Supabase Edge Functions (Deno/TS) for app/API logic; AWS (Lambda/Fargate) for
  agent jobs, EDI parsing, and background workers. Supabase + AWS are the backbone.
- DB / Auth: Supabase (Postgres, Auth, Storage). Multi-tenant + Row-Level Security ON from
  the first migration. Tenant-scoped auth.
- AI: Anthropic API — Claude Sonnet for judgment (scrub, narrative, Jarvis), Haiku for
  cheap extraction/classification. Tier by task to control cost/latency.
- Hosting: AWS (frontend via S3/CloudFront; compute via Lambda/Fargate) + Supabase managed.
- Email: Resend (later).

# ARCHITECTURE PRINCIPLES (non-negotiable)

- EVENT-SOURCED. The append-only event log is the source of truth, the audit trail, AND
  the learning data. Never UPDATE domain rows in place — emit events, derive current state.
  `outcomes` and `overrides/fixes` are append-only. Auto-fixes are logged like overrides.
- MULTI-TENANT from line one. Every table has a tenant/clinic scope; RLS enforces it.
  No service-role keys in client code.
- ADAPTER PATTERN for all of L4. Ingestion sources (CSV, Dentrix, clearinghouse) and
  payment processors sit behind interfaces so they swap without a rewrite. In Phase 1
  only the CSV ingest adapter exists, but code to the interface.
- AGENTS EMIT EVENTS, they never mutate state directly. They call shared tools
  (query_claims, query_payer_intelligence, compute_kpi) via function-calling.
- INSIGHT → ACTION. Analytics is never read-only: every number drills to its claims and
  Jarvis can offer the next action. Build the dashboard and Jarvis against the same
  event log the agents write to — one brain, two altitudes.
- PAYER INTELLIGENCE is derived from outcomes and is the moat. Agents retrieve from it
  before deciding; the outcome loop writes back to it. Build the seed in Phase 1.

# REPO STRUCTURE TO CREATE

/apps
  /operator        # front-desk: the gate UI                 ← build now
  /owner           # analytics dashboard: 1 KPI tile + Jarvis ← build now
/packages
  /ui              # shared shadcn design system              ← build now
  /core            # canonical claim model + shared types     ← build now
  /events          # emit / replay / derive-state             ← build now
  /agents          # orchestrator + scrub agent               ← build now (1 agent)
  /tools           # agent function-calling tools             ← build now
  /analytics       # KPI engine (1 metric)                    ← build now
  /intelligence    # payer-intelligence seed                  ← build now
  /auth            # multi-tenant + RBAC                       ← build now
  /db              # schema · migrations · RLS                 ← build now
  /edi             # 837D/835/275/277 parsing                 ← stub only, Phase 2
  /integrations    # dentrix · clearinghouse · payments       ← do NOT build yet
/supabase          # migrations · edge functions

# CONVENTIONS

- Domain vocab everywhere (DB, API, UI): clinics, claims, claim_lines, cdt_code, payer,
  flag, fix/override, outcome, event, payer_intelligence.
- Dental uses CDT (D####) and 837D — NEVER CPT or ICD-10.
- Tests are required for the scrub rules and (later) the EDI parser — that's where
  correctness equals money.
- Small, meaningful commits. Update PROJECT_OVERVIEW.md in the same PR when architecture changes.

# HARD GUARDRAILS (never violate)

- NO real PHI in the repo, git history, fixtures, screenshots, or AI prompts. Synthetic
  data ONLY until signed Supabase + AWS HIPAA BAAs exist. Generate fake patients/claims.
- NO secrets/keys in the repo — use .env (gitignored).
- SCAFFOLD the full practice-OS module structure (shells + contracts + READMEs for
  scheduling/clinical/imaging/comms/patients), but DO NOT IMPLEMENT non-billing modules —
  a separate dev team fills those. Define their boundaries; don't write their logic.
- IMPLEMENT only the billing slice now (ingest, scrub agent, gate, outcomes, eligibility,
  analytics, ledger, Jarvis). Other agents/integrations beyond this are scaffold-only.
- If a request would IMPLEMENT a non-billing module, STOP and flag it (scaffolding it is fine).

# HOW TO WORK

1. First, restate the Phase 1 slice back to me and propose the file/package plan. Wait for OK.
2. Build foundation first: monorepo, db schema + RLS, event log, canonical model — the
   thin spine — before any UI.
3. Then build the slice in order: ingest → events → scrub agent → gate UI → outcomes →
   1 KPI → Jarvis. Keep each step runnable.
4. Use synthetic data throughout. Provide a seed script that generates fake claims + a
   fake 835 so the whole loop can run locally.
5. Before adding anything not in the slice, ask.

# DEFINITION OF DONE (Phase 1)

A synthetic Dentrix-export CSV ingests → the scrub agent flags issues → a user resolves
them in the Operator Workspace → events are written → a synthetic 835 posts outcomes and
seeds payer intelligence → the Owner Dashboard shows one live KPI tile with drill-down →
Jarvis answers one question about the data. All multi-tenant, RLS-enforced, no real PHI.
```

---

## How to use this

1. Make sure `PROJECT_OVERVIEW.md` is in the repo first — this prompt references it.
2. Paste the fenced block into Cursor's agent chat (or save it as `.cursor/rules/build.mdc`
   and let it apply on every generation).
3. Let it restate the plan back before it writes code — correct any misunderstanding there.
4. When the Phase 1 slice runs end to end on synthetic data, that's the milestone. Then
   come back and we scope Phase 2 (the EDI parser + first real integration).
