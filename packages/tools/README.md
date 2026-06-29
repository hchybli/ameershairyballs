# @backstop/tools

Agent function-calling tools — the **only** way agents mutate system state.

## Tools

| Tool | Action |
|------|--------|
| `query_claims` | Read `claims_current` + lines |
| `query_payer_intelligence` | Read moat table |
| `query_eligibility` | Read `eligibility_current` snapshot |
| `raise_flag` | Emit `flag.raised` |
| `emit_event` | Emit allowlisted agent events |

Agents **never** write domain read models directly.

## Workstream

WS-AGENTS-00
