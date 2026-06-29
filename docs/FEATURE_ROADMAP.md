# Feature roadmap (historical)

> **Not build truth.** For implementation use [STATUS.md](./STATUS.md), [BUILD_READINESS.md](./BUILD_READINESS.md), and [architecture/](./architecture/README.md).  
> **Last updated:** 2026-06-29

This doc captures **product vision tiers** and denial-driver priority. Phase 1 vertical slice items below are largely **done** — see [STATUS.md](./STATUS.md).

---

## What Backstop is (and is not)

**Pre-submission billing autopilot** on top of the clinic PMS — not charting, scheduling, or patient billing.

| We own | PMS already owns |
|--------|------------------|
| Pre-submission scrub | Scheduling, charting |
| Auto-fix + flag | Treatment documentation |
| Outcome capture + learning | Primary claim build |
| Dashboard KPIs | Patient payments, AR |

---

## Top denial drivers (rule priority)

| Priority | Problem | Backstop check |
|----------|---------|----------------|
| P0 | Missing attachments | CDT + payer rules |
| P0 | Wrong CDT | Format + deprecation |
| P0 | Audit-risk codes | D4341, D2950, crowns, etc. |
| P1 | Frequency limits | Payer rules + eligibility |
| P2 | Payer-specific learned rules | **Moat** — `payer_intelligence` |

---

## Tier status (snapshot)

### Tier A — MVP (Phase 1)

| Feature | Status |
|---------|--------|
| CSV claim ingest | Done |
| Scrub engine + attachment flags | Done |
| Auto-fix (safe items) | Partial |
| Flag UI + gate | Done |
| Outcome CSV ingest | Done |
| Owner dashboard KPI | Done |
| Eligibility warnings | Done — synthetic adapter (WS-AGENTS-01) |

### Tier B — v1 credibility

Frequency alerts, batch filters, resubmit helper, live eligibility — **post Phase 1**.

### Tier C — Moat

| Feature | Status |
|---------|--------|
| Denial prediction before submit | Done — moat-first (WS-AGENTS-02) |
| Payer learning from outcomes | Done — `payer_intelligence` |
| Clearinghouse submit | Phase 4 |
| Open Dental API | Phase 4 |

### Tier D — Out of scope (Stage 1)

Charting, scheduling, imaging, patient billing, GL — see [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

---

## Phase history

```
✅ Phase 0   Repo, schema, CSV ingest, synthetic data
✅ Phase 1   Scrub + gate + operator/owner apps + edge functions
✅ Phase 1+  Agent fleet (eligibility, denial prediction)
→  Phase 2   history.imported warm moat, payer rule packs
→  Phase 3   AI narrative, live Vyne eligibility
→  Phase 4   Clearinghouse submit, Open Dental API
```

---

## Related docs

| Doc | Owns |
|-----|------|
| [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) | Vision, stages, PHI rules |
| [STRATEGY.md](./STRATEGY.md) | Wedge, moat, kill criteria |
| [STATUS.md](./STATUS.md) | What's shipped |
