# Feature roadmap

> **Build truth:** For implementation, use [BUILD_READINESS.md](./BUILD_READINESS.md), [architecture/](./architecture/README.md), and [USER_FLOWS.md](./architecture/USER_FLOWS.md). This doc is product vision and phase history.

**Status:** Product vision (with [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md))  
**Last updated:** 2026-06-26  
**Read this for why we build what we build.** Implementation specs live in `docs/architecture/`.

---

## What Backstop is (and is not)

**Backstop is a pre-submission billing autopilot** — a layer on top of the clinic's existing PMS (Open Dental, Dentrix, Eaglesoft). It does not replace charting, scheduling, or patient billing.

| We own | PMS / clearinghouse already owns |
|--------|----------------------------------|
| Pre-submission claim scrubbing | Scheduling, charting, imaging |
| Auto-fix safe errors + flag risky ones | Treatment documentation at chairside |
| Outcome capture (835/ERA) + learning | Primary claim build in PMS |
| Dashboard: flagged, fixed, paid, $ recovered | Patient payments, AR collections, GL |

**Positioning for small clinics:** Keep your PMS. Backstop watches claims before they leave, fixes what it safely can, flags what needs a human tap, and learns what each payer actually pays.

---

## The dental revenue cycle (context)

Every dental billing product touches some version of this loop. Backstop focuses on the **bold** stages.

| # | Stage | What happens | Backstop? |
|---|-------|----------------|-----------|
| 1 | Scheduling | Book appointment | No — PMS |
| 2 | Eligibility | Verify coverage, benefits, frequency (270/271) | Later hook (Tier B) |
| 3 | Treatment + coding | Dentist performs work; CDT codes assigned | No — PMS |
| 4 | Claim build | Demographics, tooth/surface, fees, attachments | Ingest from PMS (CSV → API) |
| 5 | **Pre-submission scrub** | Catch errors before send | **Yes — core product** |
| 6 | Submit | 837D → clearinghouse → payer | Phase 4 (or hand back clean claim) |
| 7 | **Outcome capture** | 835/ERA: paid, denied, downcoded | **Yes — Phase 2** |
| 8 | Follow-up | Appeals, AR, patient balance | Partial — resubmit helper only |

---

## Top denial drivers (what we build checks for)

Industry data consistently ranks these as the most preventable. Our rule engine should target them in priority order.

| Priority | Problem | Backstop check |
|----------|---------|----------------|
| P0 | Missing attachments (X-ray, perio chart, narrative) | CDT + payer rule flags |
| P0 | Wrong / outdated / invalid CDT code | Format + deprecation rules |
| P0 | Audit-risk codes without documentation | D4341, D4342, D4910/D1110, D2950, crowns |
| P1 | Frequency limits (e.g. prophy every 6 months) | Payer rules DB |
| P1 | Missing tooth / surface / quadrant | Structural validation |
| P1 | Fee schedule leakage (undercoding, under-collecting) | Fee vs allowed comparison |
| P2 | Bundling / unbundling errors | Payer-specific rules |
| P2 | Eligibility / inactive coverage | Eligibility hook (Tier B) |
| P2 | COB errors (wrong primary insurance) | Eligibility data |
| P2 | Timely filing exceeded | Date-of-service tracking |
| P2 | Prior auth missing | Pre-treatment flag by CDT + payer |
| P3 | Payer-specific rules not in CDT manual | **Long-term moat** — learned from outcomes |

**Key insight:** Generic scrubbing catches obvious errors. **Payer-specific rules** (what Delta requires for D2740 vs what MetLife requires) separate ~10% first-pass rejection from ~2%. That specificity is the data moat.

### High-risk CDT codes (always extra scrutiny)

| Code | Procedure | Typical payer demands |
|------|-----------|----------------------|
| D4341 / D4342 | Scaling & root planing (SRP) | Perio chart, radiographs, narrative |
| D4910 vs D1110 | Perio maintenance vs prophy | SRP history, charting |
| D2950 | Core buildup | Narrative, often pre-op X-ray |
| D2740+ | Crowns | Radiographs; narrative if prior restoration |
| D9999 / by-report | Unlisted procedure | Strong narrative required |

---

## Feature tiers

### Tier A — Must have (MVP)

Non-negotiable for "pre-submission autopilot." Maps to Phase 1–2 in [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

| # | Feature | Status | Phase |
|---|---------|--------|-------|
| A1 | Claim ingest (CSV; PMS API later) | **Done** | 0 |
| A2 | Claim scrubbing engine — CDT validation, tooth/quadrant, audit-risk codes | **Done** | 1a |
| A3 | Attachment requirement flags (by CDT + payer) | **Done** | 1a |
| A4 | Frequency / eligibility warnings (when data available) | Not started | 1b |
| A5 | Fee vs allowed leakage detection | **Done** | 1b |
| A6 | Auto-fix safe items (logged, append-only) | **Partial** — quadrant normalize | 1b |
| A7 | Flag UI — severity, dollar impact, one-tap approve (no review queue) | **Done** | 1b |
| A8 | Outcome capture — parse 835/ERA, record paid/denied/downcoded | **Done** — simplified CSV | 2a |
| A9 | Dashboard — flagged, fixed, paid, dollars recovered | **Done** — v1 | 2b |

### Tier B — Should have (v1, still Stage 1)

Needed to be credible against Dentrix Claims Manager, iDentalSoft, DentalXChange.

| # | Feature | Phase |
|---|---------|-------|
| B1 | Payer rule library (Delta, MetLife, Cigna first) | 2–3 |
| B2 | Bundling rules (codes that can't be billed separately) | 3 |
| B3 | Timely filing alerts | 2 |
| B4 | Duplicate claim detection | 2 |
| B5 | Pre-auth required flag (rule-based) | 3 |
| B6 | Batch claim list — filter by payer, status, flag | 2 |
| B7 | Resubmit helper — EOB reason code + suggested fix | 3 |
| B8 | Basic eligibility hook (270/271 or manual benefit snapshot) | 3–4 |

### Tier C — Moat builders (differentiation)

| # | Feature | Phase |
|---|---------|-------|
| C1 | AI narrative adequacy ("does this note support D4341?") | 3 |
| C2 | Code-vs-clinical-notes mismatch detection | 3 |
| C3 | Denial prediction before submit (from historical outcomes) | 3 |
| C4 | Payer-specific learning — outcomes sharpen rules per clinic × payer × CDT | 3+ |
| C5 | Clearinghouse submit — DentalXChange / Vyne attachments + 837D | 4 |
| C6 | Open Dental API integration | 4 |
| C7 | Performance pricing telemetry ($ recovered vs baseline) | 4+ |

### Tier D — Out of scope (Stage 2+)

Do not build in Stage 1. See [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

- Charting, scheduling, imaging bridges
- Patient texting / recare
- Full patient billing / payment plans
- General ledger / accounting
- Staff payroll, inventory

---

## Build order (agreed sequence)

Do not skip ahead. Each phase should be demoable before the next starts.

```
✅ Phase 0   Repo, schema, CSV ingest, synthetic data          [DONE]
✅ Phase 1a  Rule engine (CDT, audit-risk, attachment rules)   [DONE]
✅ Phase 1b  Auto-fix + flag UI (one screen, one-tap approve)   [DONE — v1]
✅ Phase 2a  835/ERA ingest + outcomes table                   [DONE — simplified CSV]
✅ Phase 2b  Dashboard ($ flagged, denial rate, top flags)     [DONE — v1]
→  Phase 3    Payer rule packs + AI narrative / code-vs-notes checks
→  Phase 4    Open Dental + clearinghouse submit
```

**Phase 1a is next.** No new UI polish or integrations until scrubbing works on ingested claims.

---

## Decisions (resolve before Phase 1)

| # | Question | Recommendation | Decision |
|---|----------|----------------|----------|
| 1 | Submit claims ourselves vs hand clean claim back to clinic? | Start with **hand back** — lower compliance burden; add submit in Phase 4 | Open |
| 2 | Which 3 payers for v1 rule packs? | Delta Dental, MetLife, Cigna (~60% of small-clinic volume) | Open |
| 3 | Which auto-fixes are safe without human approval? | Typos, missing tooth on posterior crown, fee rounding — **not** CDT code changes | Open |
| 4 | First dashboard "wow" metric? | **$ flagged before submit** + **denial rate trend** | Open |
| 5 | Who owns Phase 1a (rule engine)? | TBD | Open |

Update the **Decision** column when agreed. Move settled answers into [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) if they change scope.

---

## How this doc relates to PROJECT_OVERVIEW.md

| Doc | Owns |
|-----|------|
| [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) | Vision, Stage 1 scope, tech stack, data model, PHI rules, build phase names |
| **FEATURE_ROADMAP.md** (this file) | Feature tiers, denial drivers, build order, product positioning, pre-build decisions |

Both are source of truth. In Cursor, attach both before generating:

```
@PROJECT_OVERVIEW.md @docs/FEATURE_ROADMAP.md
Implement Phase 1a: CDT validation and audit-risk flag rules.
```

---

## For @hchybli — read before we build

1. Read [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) (vision + constraints)
2. Read this file (what we're building and in what order)
3. Comment on the **Decisions** table above — especially submit vs hand-back and v1 payers
4. Reply when ready; Phase 1a starts after both agree
