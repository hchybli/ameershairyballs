# Backstop strategy (north star)

**Last updated:** 2026-06-28  
**Adversarial review:** [STRATEGY_REDTEAM.md](./STRATEGY_REDTEAM.md) · **Competitive context:** [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md)

---

## Win condition

Become the system a clinic runs its **money** through, then its **whole practice**.

**Endgame:** Full end-to-end dental PMS that beats Archy and Curve — reached by **sequence**, powered by a compounding payer-intelligence moat and an agent fleet.

We do not win by matching incumbent breadth on day one. We win by owning the financial core first, then expanding from trust already earned.

---

## Product shape

### Phase 1 — Billing product (now)

The billing product is the **only** thing overlaying an existing PMS (Dentrix-first):

- **Integrate, don't replace** — zero migration, zero rip-and-replace
- Cover billing **end-to-end** with an **agent fleet** — use agents wherever they beat rules or humans
- Software + managed service; outcome-priced; below incumbents

### Phase 2 — All-in-one PMS (later)

Once billing is perfected and dominant, build our **own** standalone all-in-one PMS — **not** modules bolted onto Dentrix.

**Plant seeds now** so Phase 2 is additive, not a rewrite:

- Event-spine namespaces: `clinical.*`, `schedule.*`, `comms.*`
- Schema stubs and projector patterns that generalize beyond claims
- The payer-intelligence moat (see below)

---

## Wedge

Win the **financial core** — the #1 user complaint for **both** Archy and Curve:

- Ledger accuracy and collections workflow
- Reporting and audit trails
- Insurance edge cases (attachments, narratives, downcodes, timely filing)

This is where the money and proprietary outcome data live.

**Integrate on top of the huge Dentrix installed base** — neither full-PMS competitor can serve that base without rip-and-replace. We meet clinics where they already are.

---

## Moat — payer-intelligence graph

**Structure:** CDT code × payer × outcome × attachment requirement × narrative adequacy — a graph that compounds with every claim we touch.

**Warm start:** Seeded from pilot clinics' real Vyne / InsideDesk history. Competitors start **cold** on billing depth because their data is locked behind full-PMS migration or diluted across ten modules.

**What is NOT the moat:** Generic AI. Agents are commoditizing. Our edge is:

1. Proprietary outcome-linked data (rights locked in contracts)
2. Embedded workflow (claims route through us)
3. Outcome pricing aligned with clinic success

**Precondition:** WS-07 (`@backstop/intelligence`) must be real before agents can read/write the flywheel intelligently.

---

## Agent fleet

Each agent **reads** the moat and **writes outcomes back** (flywheel):

| Agent | Status / priority | Role |
|-------|-------------------|------|
| Scrub | Built (WS-03) | Rules + flags pre-submission |
| Eligibility | Highest ROI next | Prevent denials before submission |
| Attachment | Planned | Payer-specific requirement matching |
| Narrative | Planned | Adequacy vs denial patterns |
| Denial prediction | Planned | Score risk from moat |
| Appeal | Planned | Template + evidence assembly |
| AR follow-up | Planned | Collections automation |

The moat is the precondition for **intelligent** agents — not generic LLM wrappers.

---

## Business model

- **Software + managed service**, outcome-priced, **below** incumbents
- AI collapses billing labor → charge less **and** keep higher margin
- Managed service routes every claim through us → feeds the moat continuously

**Fee-splitting:** Flat SaaS + state-aware service fee; percentage fees ring-fenced to billing services only. **Attorney review before first paid contract.** Pilots operate under Oklahoma law until counsel signs off nationally.

---

## Expansion path

After billing dominance:

1. Convert existing billing customers: *"Come fully onto the system you already trust with your money."*
2. Easier than competitors' cold rip-and-replace — trust and data already on Backstop
3. All-in-one PMS built on the event spine and moat planted in Phase 1

---

## Kill criteria

Stop or pivot if:

| Signal | Why existential |
|--------|-----------------|
| Matching competitor **breadth** before billing dominates | Spread kills depth; we lose the wedge |
| Fee-splitting done wrong | Regulatory / legal shutdown |
| Managed-service labor scales **linearly** with claims | Margin story breaks |
| Behavioral / outcome data rights not locked in contracts | Moat never compounds |
| Racing Archy/Curve on full PMS before billing wins | Capital and time asymmetry |

**Principles:** Sequence beats simultaneity. Depth beats breadth.

---

## How this doc is used

- **Engineering:** Phase 1 slice in [architecture/PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md); workstreams in [architecture/WORKSTREAMS.md](./architecture/WORKSTREAMS.md)
- **Agents:** Challenge this strategy per [STRATEGY_REDTEAM.md](./STRATEGY_REDTEAM.md) on the standing schedule
- **Competitive moves:** [COMPETITIVE_BRIEF.md](./COMPETITIVE_BRIEF.md) (quarterly refresh)
