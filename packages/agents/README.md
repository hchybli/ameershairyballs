# @backstop/agents

Scrub/Coding agent: rules first, Sonnet for ambiguous lines.

## Port from legacy

`src/lib/rules/*` → `src/scrub/rules/` — see [LEGACY_REFERENCE.md](../../docs/architecture/LEGACY_REFERENCE.md)

## Workstream

WS-04

## Rules

- Never write DB directly — use `@backstop/tools` to emit events
- `use_llm: false` must work for CI without API key
