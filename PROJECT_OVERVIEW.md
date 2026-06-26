# PROJECT_OVERVIEW.md

**Working name:** Backstop (placeholder — replace)  
**Status:** pre-build / spec. No real PHI in repo yet.  
**This doc is the source of truth. Keep it current.**

## Vision

Build the full software ecosystem for dentistry. Staged:

- **Stage 1 — now:** Dental billing. Cover every dental billing workflow we can. Start with small / independent clinics. Goal: accumulate the proprietary claims → payer → outcome data moat.
- **Stage 2 — full clinic software.** Expand outward from billing into the rest of a clinic's software needs (full revenue cycle, then all-in-one).
- **Stage 3 — enterprise / hospital.** Unified all-in-one operating layer over an organization's clinical + financial data (Palantir-like).
- **Stage 4 — ambient.** In-office sensors + dictation capture. Cover every software need in the clinic.

Throughout: agentic AI executes the workflows; architecture built to hyperscale (multi-tenant, scales across thousands of clinics).

The billing data moat (Stage 1) is the asset the rest is built on. More clinics → more CDT × payer × outcome coverage → smarter agents → defensible position.

## Current scope

This repo builds **Stage 1 only**: small-clinic dental billing. Stages 2–4 are direction, not the current build. **Do not build ahead of scope.**

## What we're building (now)

A pre-submission billing autopilot for small / independent dental clinics. Sits on top of the clinic's existing PMS, checks every claim before submission, auto-fixes safe items, flags the rest, captures outcomes.

**User:** a dentist or one front-desk/admin person.  
**Constraint:** simple, mostly automatic, no review queue to manage.

## Build list (what the software does)

1. **Ingest claims** — claims + line items from the clinic. Day 1: CSV/file export from their PMS. Later: Open Dental API / clearinghouse feeds.
2. **Pre-submission checks** — per claim line:
   - Missing/required attachment (radiograph, perio chart, narrative)
   - Wrong or miscoded CDT code
   - Frequency / eligibility issues
   - Leakage (undercoding, unbilled procedures, under-collecting vs. fee schedule)
   - Audit-risk codes (D4341/D4342, D4910 vs D1110, D2950)
3. **Auto-fix + flag** — auto-fix safe items (log every fix); surface high-stakes/ambiguous items for one-tap human approval.
4. **Submit** — send clean claim, or hand back to clinic's flow. (Decision pending — see [docs/OPEN_QUESTIONS.md](./docs/OPEN_QUESTIONS.md).)
5. **Outcome capture** — read 835/ERA (paid / denied / downcoded); record it.
6. **Dashboard** — flagged, fixed, paid, money recovered.

## Core loop

```
Claim built in clinic's PMS
  → INGEST (CSV day 1)
  → CHECK (agents: attachments, codes, frequency, leakage, audit risk)
  → AUTO-FIX safe items + FLAG the rest (one-tap OK)
  → SUBMIT clean claim
  → CAPTURE outcome (835: paid / denied / downcoded)
  → LEARN (outcomes sharpen the next check)
```

## Dental basics (ground truth — dental ≠ medical)

| Term | Meaning |
|------|---------|
| **CDT** | ADA dental code set (D####). NOT CPT or ICD-10. |
| **837D** | Dental claim out (X12 EDI). |
| **835 / ERA** | Payer response back (paid/denied/adjusted). |
| **Attachment** | X-rays, perio charts, narratives; sent via Vyne / DentalXChange. |
| **Fee schedule** | Payer's contracted amount per code. Under-collecting = leakage. |
| **Downcode** | Payer pays for a cheaper procedure than billed. |

**Audit-magnet codes:** D4341/D4342 (scaling & root planing), D4910 vs D1110 (perio maintenance vs cleaning), D2950 (core buildup).

## Tech stack (confirm before building)

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Next.js server actions / API routes + worker for EDI parsing
- **DB:** Supabase (Postgres) — HIPAA BAA before any real data, RLS on
- **AI:** Anthropic API — Sonnet for judgment, Haiku for extraction/classification
- **EDI:** X12 837D / 835 parsing
- **Hosting / infra:** AWS. Email: Resend
- **Architecture:** multi-tenant from day one

## Data model (rough)

```
clinics     (id, name, pms_type)
claims      (id, clinic_id, patient_ref, payer_id, status, submitted_at)
claim_lines (id, claim_id, cdt_code, fee_billed, fee_allowed, tooth, quadrant)
payers      (id, name, edi_payer_id)
cdt_rules   (id, cdt_code, rule_type, params)
attachments (id, claim_id, type, status)
flags       (id, claim_line_id, type, severity, dollar_impact, reason, status)
fixes       (id, flag_id, applied_by, auto, reason, created_at)  -- append-only
outcomes    (id, claim_id, result, paid_amount, observed_at)    -- append-only
```

- `outcomes` and `fixes`: append-only. Never edit/delete.
- Minimal PHI — store a patient reference, nothing more than a flag needs.

## Build phases

| Phase | Deliverable |
|-------|-------------|
| **0** | Repo, schema, CSV ingest, synthetic data only |
| **1 (MVP)** | Ingest CSV → rule checks → auto-fix + flag UI |
| **2** | Outcome capture (835) + dashboard |
| **3** | Agentic AI checks (narrative adequacy, code-vs-notes); tune auto-fix |
| **4** | Integrations (Open Dental API, clearinghouse submission) |

## Out of scope (Stage 1)

Charting, scheduling, imaging bridges, recare, patient comms, sensors, dictation. Not a PMS yet.

## PHI & security (hard rules)

- No real PHI in repo, git history, fixtures, screenshots, or AI prompts until signed Supabase + AWS HIPAA BAAs + clinic agreements. **Synthetic data only** until then.
- No secrets/keys in repo — use `.env` (gitignored).
- Supabase RLS on from day one; no service-role keys in client code.
- `outcomes`/`fixes` append-only; never hard-delete claim data.
- If unsure whether something is PHI, treat it as PHI.

## Working in Cursor

- `@PROJECT_OVERVIEW.md` in chat before generating.
- Rules live in `.cursor/rules/project.mdc`.
- Before a feature, have the AI state which part of this doc it implements.

## Open questions

See [docs/OPEN_QUESTIONS.md](./docs/OPEN_QUESTIONS.md).
