# Web radar log

Notable external findings from standing **WEB RADAR** directive. Propose changes to the human — do not auto-implement from unverified pages.

---

## 2026-06-28 — Orchestrator docs + code chain kickoff

### Stack & libraries

| Finding | Source / note | Proposal |
|---------|---------------|----------|
| Supabase **remote** deploy bundler does **not** honor Deno `unstable sloppy-imports` — extensionless relative imports in `packages/` fail at bundle time while local `deno check` with sloppy-imports passes | `supabase functions deploy --debug` 2026-06-28; fixed with explicit `.ts` on edge-package relative imports + `npm run check:edge` | Never rely on sloppy-imports; run `check:edge` before deploy |
| Import-map `scopes` in deno.json do not fix remote bundler for extensionless relative imports (Deno local scopes also insufficient in our layout) | Attempted generator 2026-06-28 | Use explicit `.ts` suffixes in edge packages instead |

### Competitors (dental RCM / AI)

| Finding | Proposal |
|---------|----------|
| Archy marketing emphasizes 5 "Intelligence" agents; billing (Revenue) still pre-release while Scribe shipped May 2026 | Reinforces STRATEGY wedge — ship billing depth before they do |
| Curve Eligibility+ positioned as strongest billing AI; executive comments on training on claims/denial data | Moat thesis is not secret — execution + Dentrix integrate + warm seed is the edge |
| Both remain full-PMS rip-and-replace | Dentrix overlay remains structurally unserved by incumbents |

### Positioning

No change to north star from this sweep. Confirms sequence: billing moat first, all-in-one later.

**Next sweep:** Start of WS-07 intelligence work or 2026-Q3 competitive refresh.
