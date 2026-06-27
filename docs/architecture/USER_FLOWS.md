# User flows — competitive research & Backstop design

**Status:** Locked for Phase 1 UI (WS-06, WS-08)  
**Sources:** Vyne Trellis, InsideDesk InsideAssist (field screenshots, June 2026)  
**Audience:** Bungaroo frontend, US product review

---

## Executive summary

Vyne and InsideDesk are **clearinghouse / AR-service consoles** built around tables, tabs, and module silos. Operators spend time **finding** work, **hunting** for denial reasons across tabs, and **re-entering** the same fixes across duplicate forms.

Backstop wins by being **work-queue first**, **action-centric**, and **outcome-linked** — not another insurance portal skin.

| Principle | Vyne / InsideDesk pattern | Backstop pattern |
|-----------|---------------------------|------------------|
| Entry point | Feature nav (Insurance → Claims → Sent) | **Today's queue** — flags blocking submission |
| Claim detail | 5+ tabs (Patient, Provider, Procedures…) | **Single action view** — status, flags, fix, timeline |
| Denial / rejection | Status icon + reason buried in table or tab | **Reason + fix path above the fold** |
| Repeated errors | Same portal credential error logged 5× over 4 days | **Deduped blockers** at tenant/clinic level |
| List density | Tall card rows (~5 visible) or noisy column filters | **Compact worklist** — patient, payer, $, age, top flag |
| Workflow | Empty "Workflow Status" / "Last Worked" columns | **Gate states** tied to events (open → approved → overridden) |
| Owner view | Mixed into operator queues or separate IQ module | **One KPI** (clean-claim rate) with drill-down |
| Upsell | Marketing carousels on Payments, Forms | **No interstitials** on core paths (Phase 1) |

---

## Competitor pain points (evidence)

### Vyne Trellis

**Claims list**
- Deep nav: Insurance → Claims → Sent → filter Accepted/Rejected.
- Column-level search icons on every header add noise.
- Rejection reason (`Entity's Street Address`) lives in **Status Description** — not scannable at a glance.
- Large security banner consumes vertical space before data.

**Claim detail (rejected)**
- Status shows red **Rejected** but **no reason on the default tab** (Claim Receipt).
- Critical context split across **Patient · Procedures · Provider · Attachments · Claim Receipt**.
- Billing vs treating provider fields **duplicated** with no "same as billing" pattern; empty Provider ID not highlighted as the likely fix.
- Primary CTA is **Resend Claim** with no guided fix — encourages resubmitting broken data.

**Reference / ancillary screens**
- Carrier List: 860 rows, low actionability — lookup table, not workflow.
- Eligibility: summary cards all **0** with plain "No data" — no next step.
- Payments / Forms: **marketing interstitials** ("Upgrade Now", Affirm carousel) block the nav item the user clicked.

### InsideDesk InsideAssist

**Queue navigation**
- Two-tier sidebar: status buckets (OPEN 379, PAYOR PORTAL ISSUES 136) **plus** saved views (CLAIM PAID IN FULL, DENIALS).
- Overlapping mental models — users must learn which dimension matters.

**Claims list**
- Card-style rows repeat labels (`$ Submit`, `Submission Date`) — **~5 rows visible** for 14 claims.
- **Last Worked** and **Workflow Status** empty everywhere — workflow UI exists but isn't driving behavior.
- Payor Portal Issues view shows **loading spinner** with 0 results — performance erodes trust.

**Claim detail**
- Five-column grid (Insurance, Subscriber, Submission, Payment, Posting) — flat, hard to scan.
- **Paid Zero** outcome in a small corner notification while $0.00 sits mid-grid.
- Actions scattered: **Launch Portal**, **Start InsideDial**, **Add Note** (disabled until note typed) — no single resolution path.

**Claim response history**
- Identical credential error **repeated daily** (06/23–06/26) with no grouping, escalation, or tenant-level blocker banner.

---

## Personas & surfaces (Backstop)

| Persona | App | Job to be done | Phase |
|---------|-----|----------------|-------|
| **Operator** (front desk / biller) | `apps/operator` | Clear flags, approve overrides, get claims submission-ready | P1 |
| **Owner** (dentist / practice manager) | `apps/owner` | See clean-claim rate, drill to problem claims | P1 |
| **Biller** (AR specialist) | Biller Console* | Denial worklists, appeals, portal follow-up | P2+ |
| **Patient** | Patient Pay* | Balance, pay link | P3+ |

\* Not Phase 1 — design patterns below still apply when built.

---

## Recommended flows

### Flow 1 — Operator daily loop (Phase 1 core)

```
Login → Work queue (default home)
  → Sort/filter: severity, age, payer
  → Open claim → Action view
  → Resolve each flag (approve / override + reason)
  → Claim moves to "Ready" when no open high/critical flags
```

**Default home = work queue**, not upload page and not a feature sidebar.

| Step | Screen | Key UX |
|------|--------|--------|
| 1 | **Work queue** | Rows: patient, payer, DOS, submitted $, AR age, **top flag summary**, severity badge, claim id |
| 2 | **Claim action view** | Header: status + **primary blocker** (if any). Body: flag cards with rule text, suggested fix, Approve / Override |
| 3 | **Override modal** | Reason required (audit). Show flag rule id + CDT line context |
| 4 | **Ready state** | Clear empty flags → visual "gate passed" — event `flag.approved` / all cleared |

**Anti-patterns to avoid:** Tab per entity (Patient / Provider / …). Show context **inline on flag cards** (e.g. provider address flag links to the field value).

### Flow 2 — Ingest (secondary entry)

```
Upload CSV (header action or /upload)
  → Parse summary (# claims, # lines, errors)
  → Confirm → scrub runs
  → Redirect to work queue with new items highlighted
```

Upload is **batch input**, not the home screen. After ingest, operator returns to the queue.

### Flow 3 — Owner check-in (Phase 1)

```
Login → Dashboard
  → KPI tile: clean-claim rate (period selector)
  → Drill-down table: claim id, flag count, last event, link to operator view
```

**One metric, one drill path.** No IQ/Assist module split.

### Flow 4 — Outcome feedback loop (Phase 1 backend, light UI)

```
835 CSV ingest (operator or admin)
  → outcome.received events
  → payer_intelligence updated
  → Scrub agent reads intel on next run (fewer false flags over time)
```

Phase 1 UI: optional "Outcomes uploaded" toast + count. Full outcome timeline on claim = P1.5.

### Flow 5 — Tenant blockers (Phase 1.5 / P2 pattern)

When the same root cause affects many claims (portal credentials, missing NPI):

```
Detect repeated failure class across claims
  → Surface ONE clinic-level blocker banner
  → "Fix credentials" CTA → settings
  → Suppress per-claim duplicate log entries (collapse in timeline)
```

InsideDesk's repeated credential errors are the template for what **not** to do.

---

## Information architecture

### Operator app (`apps/operator`)

```
/                     → Work queue (default)
/claims/:id           → Claim action view
/upload               → CSV ingest
/outcomes/upload      → 835 ingest (P1)
/settings             → Clinic context (minimal P1)
```

**No** Insurance / Payments / Engagement silos. Operator scope = **pre-submission gate only**.

### Owner app (`apps/owner`)

```
/                     → KPI dashboard
/claims               → Drill-down list
/claims/:id           → Summary + link to operator (optional P1)
```

### Navigation model

| Vyne / InsideDesk | Backstop |
|-------------------|----------|
| Left sidebar by product module | **Top bar**: queue · upload · (settings) |
| Status in sidebar + filters in main | **Queue filters** in one bar: severity, payer, age, search |
| Tabs inside claim | **Scroll sections**: Flags (primary) → Claim summary → Event timeline |

---

## Claim action view (wireframe)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back    Patient · Payer · DOS · $143    [2 flags open]    │
├─────────────────────────────────────────────────────────────┤
│ ⚠ PRIMARY: Provider address rejected by payer               │
│    "Entity's Street Address" — fix billing provider zip       │
├─────────────────────────────────────────────────────────────┤
│ FLAG CARDS (ordered: critical → high → medium)              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CRITICAL · attachment · D4341 line 1                    │ │
│ │ SRP requires perio chart + radiograph                   │ │
│ │ [Approve]  [Override…]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HIGH · provider · claim-level                           │ │
│ │ Billing address may not match payer directory           │ │
│ │ Current: 10500 S Roberts Rd, Palos Hills IL 60465       │ │
│ │ [Approve]  [Override…]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Claim summary (collapsed by default)          [Expand ▼]    │
│ Event timeline (audit)                        [Expand ▼]    │
└─────────────────────────────────────────────────────────────┘
```

**Resend / submit** is out of Phase 1 scope — when added (P4), it becomes the CTA **only after** gate passes.

---

## Work queue (wireframe)

```
┌─────────────────────────────────────────────────────────────┐
│ Backstop Operator          [Upload CSV]     user · clinic ▼ │
├─────────────────────────────────────────────────────────────┤
│ Work queue · 12 open flags across 8 claims                  │
│ [Severity ▼] [Payer ▼] [AR age ▼]  🔍 Search patient/payer │
├─────────────────────────────────────────────────────────────┤
│ ● CRITICAL  Smith · Delta · 06/12  $890  Attachment·SRP   │
│ ● HIGH      Jones · Humana · 06/15  $143  Provider addr   │
│ ○ MEDIUM    Lee · MetLife · 06/18  $220  Frequency D1110  │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Density target:** 12–15 rows visible on 1080p (not 5). Use compact table or thin list rows — not InsideDesk card rows.

---

## Owner dashboard (wireframe)

```
┌─────────────────────────────────────────────────────────────┐
│ Clean-claim rate                    Last 30 days ▼          │
│                                                             │
│              87.5%                                          │
│         ████████████░░░                                     │
│                                                             │
│ 42 claims ingested · 37 passed gate · 5 with open flags   │
├─────────────────────────────────────────────────────────────┤
│ Claims below target                          [Export]       │
│ claim_id    patient   payer      flags   last_event         │
│ clm_abc…    Smith     Delta      2       flag.raised        │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Interaction rules (locked)

| Rule | Rationale |
|------|-----------|
| **Reason required on override** | Audit + learning signal; already in event catalog |
| **Flags sorted by severity** | Operator tackles blockers first |
| **One primary blocker in header** | Vyne hides rejection reason in table/tab |
| **No empty workflow columns** | Don't ship InsideDesk-style dead UI |
| **No marketing on core paths** | Payments/forms upsell walls erode trust |
| **Mobile-first operator** | Approve/override from phone between patients |
| **Event timeline on claim** | Replace repetitive "response history" modals |
| **Keyboard shortcuts (P1.5)** | `j/k` navigate queue, `a` approve, `o` override |

---

## Phase mapping

| Flow / screen | Phase | Workstream |
|---------------|-------|------------|
| Work queue | P1 | WS-06 |
| Claim action view + override | P1 | WS-06 |
| CSV upload | P1 | WS-06 |
| Owner KPI + drill-down | P1 | WS-08 |
| Event timeline on claim | P1.5 | WS-06 extension |
| Tenant blocker banner | P1.5 | WS-05 + WS-06 |
| Denial / AR worklist | P2 | Biller Console |
| Eligibility hook | P2 | Tier B per FEATURE_ROADMAP |
| Submit / resend | P4 | Clearinghouse integration |

---

## Acceptance criteria additions (WS-06 / WS-08)

### WS-06 — Operator

- [ ] Default route `/` is work queue, not upload
- [ ] Queue shows ≥10 rows at 1080p without scrolling (compact layout)
- [ ] Claim detail shows **all open flags** without tab navigation
- [ ] Highest-severity flag summarized in page header
- [ ] Override modal blocks submit without reason
- [ ] After CSV upload, user lands on queue with new claims visible
- [ ] Touch targets ≥44px for Approve / Override (mobile)

### WS-08 — Owner

- [ ] Dashboard loads to single KPI — no secondary modules
- [ ] Drill-down row links to claim id (operator deep link optional)
- [ ] No empty placeholder charts or zero-state cards without copy

---

## References

- [MEDIUM_BUILD.md](./MEDIUM_BUILD.md) — screen specs, component trees, API tables
- [BUILD_READINESS.md](../BUILD_READINESS.md) — pre-build checklist
- [research/FLAG_TAXONOMY.md](../research/FLAG_TAXONOMY.md) — flag types + competitor mapping
- [ARCHITECTURE.md](./ARCHITECTURE.md) — L1 surfaces
- [PHASE_1_SLICE.md](./PHASE_1_SLICE.md) — scope boundary
- [WORKSTREAMS.md](./WORKSTREAMS.md) — WS-06, WS-08
- [LEGACY_REFERENCE.md](./LEGACY_REFERENCE.md) — port `claim-flags.tsx`, not tab layout
- [FEATURE_ROADMAP.md](../FEATURE_ROADMAP.md) — denial drivers → flag types
