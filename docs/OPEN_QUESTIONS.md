# Open questions

Product and business decisions. **Build-blocking decisions** live in [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md#decisions-resolve-before-phase-1) — check there first.

**Does not block WS-00–WS-05** (backend spine). Blocks production and design-partner validation.

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Real project name (replace "Backstop") | Open | |
| 2 | Stack sign-off (Turborepo, Supabase, Vite, Anthropic) | **Decided** | Locked in ARCHITECTURE.md + BUILD_READINESS.md |
| 3 | Operator UX (queue-first vs upload-first) | **Decided** | Work queue default — USER_FLOWS.md |
| 4 | Phase 1 KPI | **Decided** | Clean-claim rate — PHASE_1_SLICE.md |
| 5 | Pricing — flat monthly + performance kicker | Open | |
| 6 | First clinic to build against (design partner) | Open | Blocks real Dentrix CSV mapping |
| 7 | Who scaffolds / owns each phase | Open | Bungaroo = implementation; US = product review |
| 8 | GitHub repo name (`ameershairyballs` → rename?) | Open | |
| 9 | Two apps vs one app with routes | **Decided** | Two apps (`operator`, `owner`) — PHASE_1_SLICE.md |

Moved to roadmap (resolve before production, not Phase 1 build):

- Submit ourselves vs hand clean claim back → [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md#decisions-resolve-before-phase-1)
- Which auto-fixes are safe without human approval → same
- v1 payer rule packs (Delta, MetLife, Cigna) → [research/PAYER_RULES_V1.md](./research/PAYER_RULES_V1.md) — US review pending

## How to resolve

1. Discuss in chat or a short call
2. Update the **Decision** column here
3. If it changes build scope, update `PROJECT_OVERVIEW.md` and `BUILD_READINESS.md` in the same PR
