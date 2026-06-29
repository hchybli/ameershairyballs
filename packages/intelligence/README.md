# @backstop/intelligence

Payer-intelligence moat — read/write around `payer_intelligence` table.

## Read APIs

- `readPayerIntelligence(db, tenantId)` — raw CDT × payer rows
- `buildPayerScorecards(rows)` — per-payer denial rate, downcode frequency, top denial codes
- `readAvgDaysToPayByPayer(db, tenantId)` — from outcomes × claims join

## Write path

Upserts happen via `@backstop/events` projector on `outcome.received` (append-only events → derived read model).

See [STRATEGY.md](../../docs/STRATEGY.md) for moat thesis.
