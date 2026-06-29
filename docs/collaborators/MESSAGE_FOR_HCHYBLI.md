# Hey @hchybli — review when you can

**From:** @ameerabouhouli  
**Updated:** 2026-06-29

Phase 1 vertical slice + agent fleet are on branch `feature/bungaroo/WS-AGENTS-02-denial-prediction` (PR pending merge to `main`).

## Pull & run

```bash
git pull
npm install
npm run seed
npm run dev
npx tsx --env-file=.env scripts/dev-sign-in.ts
```

| App | URL | Login |
|-----|-----|-------|
| Operator | http://localhost:5173 | `operator@demo.backstop.local` / `demo-operator-2026!` |
| Owner | http://localhost:5174 | `owner@demo.backstop.local` / `demo-owner-2026!` |

Full guide: [LOCAL_DEV.md](../LOCAL_DEV.md)

## What to try

1. **Operator** — open **SYN-CLM-003** → eligibility panel (benefit exhausted) + denial risk + approve flags
2. **Owner** — drill-down filters (Open flags / All claims); upload outcomes CSV
3. `npm run verify` — full automated check

## Open decisions

[OPEN_QUESTIONS.md](../OPEN_QUESTIONS.md) — submit vs hand-back, v1 payer sign-off, design partner.

— Ameer
