# @backstop/auth

Tenant context from Supabase JWT, RBAC (`operator`, `owner`, `biller`).

## Workstream

WS-01, WS-05

## Rules

- `tenant_id` from `app_metadata` only
- Browser uses anon key + RLS — never service role
