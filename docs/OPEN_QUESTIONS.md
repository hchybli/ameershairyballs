# Open questions

Business and product decisions **not yet locked**. Build truth is [STATUS.md](./STATUS.md) + [BUILD_READINESS.md](./BUILD_READINESS.md).

| # | Question | Status |
|---|----------|--------|
| 1 | Real project name (replace "Backstop") | Open |
| 2 | Pricing — flat monthly + performance kicker | Open |
| 3 | First clinic / design partner (real Dentrix CSV) | Open |
| 4 | GitHub repo rename (`ameershairyballs`) | Open |
| 5 | Submit claims ourselves vs hand clean claim back | Open — **Phase 4**; gate-only for Phase 1 |
| 6 | Which auto-fixes are safe without human approval | Open — US review |
| 7 | v1 payer rule packs sign-off (Delta, MetLife, Cigna) | Open — see [research/PAYER_RULES_V1.md](./research/PAYER_RULES_V1.md) |

## Decided (do not re-litigate in docs)

| Question | Decision | Doc |
|----------|----------|-----|
| Stack | npm workspaces, Vite, Supabase, TypeScript strict | [BUILD_READINESS.md](./BUILD_READINESS.md) |
| Operator UX | Work queue first | [USER_FLOWS.md](./architecture/USER_FLOWS.md) |
| Phase 1 KPI | Clean-claim rate | [PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md) |
| Two apps vs one | `operator` + `owner` | [PHASE_1_SLICE.md](./architecture/PHASE_1_SLICE.md) |
| Eligibility Phase 1 | Synthetic Onederful adapter; live Vyne later | [STRATEGY_REDTEAM.md](./STRATEGY_REDTEAM.md) |
| Denial prediction | Moat-first; LLM for reason text only | [STRATEGY_REDTEAM.md](./STRATEGY_REDTEAM.md) |

## How to resolve

1. Discuss → update **Decision** here
2. If scope changes, update [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) in same PR
