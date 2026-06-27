# PROJECT_OVERVIEW.md

> **Working name:** `Backstop` (placeholder — replace)
> **Status:** pre-build / spec. No real PHI in repo yet.
> This doc is the source of truth. Keep it current.

---

## Vision

Build the full software ecosystem for dentistry. Staged:

- **Stage 1 — now: Dental billing.** Cover every dental billing workflow we can. Start with small / independent clinics. Goal: accumulate the proprietary claims → payer → outcome data moat.
- **Stage 2 — full clinic software.** Expand outward from billing into the rest of a clinic's software needs (full revenue cycle, then all-in-one).
- **Stage 3 — enterprise / hospital.** Unified all-in-one operating layer over an organization's clinical + financial data (Palantir-like).
- **Stage 4 — ambient.** In-office sensors + dictation capture. Cover every software need in the clinic.

**Throughout:** agentic AI executes the workflows; architecture built to hyperscale (multi-tenant, scales across thousands of clinics).

The billing data moat (Stage 1) is the asset the rest is built on. More clinics → more CDT × payer × outcome coverage → smarter agents → defensible position.

### Beating Archy (the all-in-one rival) — architectural, not feature-racing
The endgame is an all-in-one practice OS better than Archy. We don't get there by out-featuring a funded full PMS on day one — we get there by **winning the financial core first** (their weakest area: ledger, collections, reporting, audit, insurance edge cases) **without forcing a migration**, then expanding module by module on **one event-sourced spine**. Archy bolts modules together; we grow them from one trunk. To make the expansion additive (not a rebuild), Stage 1 plants these seeds now: a universal append-only event log namespaced by domain (`billing.*` now; `clinical.*` / `schedule.*` / `comms.*` reserved); minimal canonical stubs for the whole practice (patients, providers, appointments, treatment_plans, clinical_notes, imaging_refs, communications, ledger_transactions) so we never re-migrate our own data; an event-derived ledger with built-in audit (inverting Archy's hidden audit logs + confusing ledger); a unified patient_timeline; and a cross-module Jarvis that reads the whole log.

---

## Current scope

**Scaffold the full practice OS now; implement billing only.** Every module's boundary, shell, and contract exists from the start (a Bangalore dev team fills in the non-billing modules against a stable contract), but only billing-related modules are implemented here. Non-billing modules (scheduling, clinical, imaging, comms, patients) are clean, documented empty shells — defined, not built. Foundation correctness comes first, because errors replicate across every module the team builds on top.

---

## What we're building (now)

A pre-submission billing autopilot for small / independent dental clinics. Sits on top of the clinic's existing PMS, checks every claim before submission, auto-fixes safe items, flags the rest, captures outcomes.

User: a dentist or one front-desk/admin person. Constraint: simple, mostly automatic, no review queue to manage.

---

## Build list (what the software does)

1. **Ingest claims** — claims + line items from the clinic. Day 1: CSV/file export from their PMS. Later: Open Dental API / clearinghouse feeds.
2. **Pre-submission checks** — per claim line:
   - Missing/required attachment (radiograph, perio chart, narrative)
   - Wrong or miscoded CDT code
   - Frequency / eligibility issues
   - Leakage (undercoding, unbilled procedures, under-collecting vs. fee schedule)
   - Audit-risk codes (D4341/D4342, D4910 vs D1110, D2950)
3. **Auto-fix + flag** — auto-fix safe items (log every fix); surface high-stakes/ambiguous items for one-tap human approval.
4. **Submit** — send clean claim, or hand back to clinic's flow. (Decision pending — see Open Questions.)
5. **Outcome capture** — read 835/ERA (paid / denied / downcoded); record it.
6. **Dashboard** — flagged, fixed, paid, money recovered.

---

## Core loop

```text
Claim built in clinic's PMS
   → INGEST   (CSV day 1)
   → CHECK    (agents: attachments, codes, frequency, leakage, audit risk)
   → AUTO-FIX safe items  +  FLAG the rest (one-tap OK)
   → SUBMIT   clean claim
   → CAPTURE  outcome (835: paid / denied / downcoded)
   → LEARN    (outcomes sharpen the next check)
```

---

## Dental basics (ground truth — dental ≠ medical)

- **CDT** — ADA dental code set (`D####`). NOT CPT or ICD-10.
- **837D** — dental claim out (X12 EDI).
- **835 / ERA** — payer response back (paid/denied/adjusted).
- **Attachment** — x-rays, perio charts, narratives; sent via Vyne / DentalXChange.
- **Fee schedule** — payer's contracted amount per code. Under-collecting = leakage.
- **Downcode** — payer pays for a cheaper procedure than billed.
- **Audit-magnet codes:** D4341/D4342 (scaling & root planing, most-audited), D4910 vs D1110 (perio maintenance vs cleaning), D2950 (core buildup).

---

## Tech stack (confirm before building)

- **Frontend:** React (Vite) + TypeScript + Tailwind + shadcn/ui, mobile-first. No Next.js.
- **Backend:** Supabase Edge Functions for app/API logic + AWS (Lambda/Fargate) for agent jobs & EDI parsing
- **DB / Auth:** Supabase (Postgres, Auth, Storage) — HIPAA BAA before any real data, RLS on
- **AI:** Anthropic API — Sonnet for judgment, Haiku for extraction/classification; agentic execution
- **EDI:** X12 837D / 835 parsing
- **Hosting / infra:** AWS (frontend via S3/CloudFront, compute via Lambda/Fargate) + Supabase managed. **Email:** Resend
- **Architecture:** multi-tenant from day one (built to scale across clinics)

---

## Data model (rough)

```text
clinics      (id, name, pms_type)
claims       (id, clinic_id, patient_ref, payer_id, status, submitted_at)
claim_lines  (id, claim_id, cdt_code, fee_billed, fee_allowed, tooth, quadrant)
payers       (id, name, edi_payer_id)
cdt_rules    (id, cdt_code, rule_type, params)
attachments  (id, claim_id, type, status)
flags        (id, claim_line_id, type, severity, dollar_impact, reason, status)
fixes        (id, flag_id, applied_by, auto, reason, created_at)   -- append-only
outcomes     (id, claim_id, result, paid_amount, observed_at)      -- append-only
```

- `outcomes` and `fixes`: append-only. Never edit/delete.
- Minimal PHI — store a patient reference, nothing more than a flag needs.

---

## Build phases

- **Phase 0** — repo, schema, CSV ingest, synthetic data only.
- **Phase 1 (MVP)** — ingest CSV → rule checks → auto-fix + flag UI.
- **Phase 2** — outcome capture (835) + dashboard.
- **Phase 3** — agentic AI checks (narrative adequacy, code-vs-notes); tune auto-fix.
- **Phase 4** — integrations (Open Dental API, clearinghouse submission).

---

## Out of scope (Stage 1)

Charting, scheduling, imaging bridges, recare, patient comms, sensors, dictation. These are later stages. Not a PMS yet.

---

## PHI & security (hard rules)

- No real PHI in repo, git history, fixtures, screenshots, or AI prompts until signed Supabase + AWS HIPAA BAAs + clinic agreements. Synthetic data only until then.
- No secrets/keys in repo — use `.env` (gitignored).
- Supabase RLS on from day one; no service-role keys in client code.
- `outcomes`/`fixes` append-only; never hard-delete claim data.
- If unsure whether something is PHI, treat it as PHI.

---

## Working in Cursor

- `@PROJECT_OVERVIEW.md` in chat before generating.
- Add `.cursor/rules/project.mdc` (below).
- Before a feature, have the AI state which part of this doc it implements.

**`.cursor/rules/project.mdc`:**
```text
You are building Backstop, a pre-submission billing autopilot for small dental clinics.
Current scope is dental billing only (Stage 1 of a larger ecosystem). Read PROJECT_OVERVIEW.md.

ALWAYS:
- TypeScript (strict), React (Vite), Tailwind, shadcn/ui, Supabase (Postgres), AWS. No Next.js.
- Domain vocab: claims, claim_lines, cdt_code, payer, flag, fix, outcome.
- Dental uses CDT (D####) and 837D — NOT CPT or ICD-10.
- outcomes and fixes are append-only.
- Multi-tenant; one front-desk person is the user. Auto-fix safe items; flag the rest.

NEVER:
- Real PHI, secrets, or keys in repo/fixtures/prompts. Synthetic data only.
- IMPLEMENT non-billing modules (charting/scheduling/imaging/comms): scaffold their shells + contracts, but the dev team fills them. Don't write their business logic.
- A feature that doesn't help get a claim paid clean (within billing). Flag scope creep.
```

---

## Open questions

- [ ] Real project name (replace `Backstop`).
- [ ] Stack sign-off.
- [ ] Submit ourselves vs. hand clean claim back.
- [ ] Which auto-fixes are safe without a human.
- [ ] Pricing — flat monthly + performance kicker: numbers.
- [ ] First clinic to build against.
