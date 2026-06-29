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

---

## 2026-06-29 — Agent fleet orchestration (WS-AGENTS-00/01/02)

### Eligibility APIs (adapter target)

| Finding | Source | Implication |
|---------|--------|-------------|
| Vyne acquired Onederful; **v2 universal JSON schema** normalizes payer-specific 271 data | [developers.onederful.co/blog/eligibility-v2](https://developers.onederful.co/blog/eligibility-v2) | Our `EligibilityAdapter` should target Onederful v2 shape; synthetic fixture must match |
| POST `/eligibility` with subscriber + provider NPI + payer; optional `procedure_codes` (up to 10 CDT) | [developers.onederful.co/documentation](https://developers.onederful.co/documentation) | Adapter interface: `checkEligibility(request) → normalized benefit breakdown` |
| 240+ payer connections; JSON/HTML/X12 270/271 | [vynedental.com/api-eligibility-benefits](https://vynedental.com/api-eligibility-benefits/) | Phase 1: synthetic adapter only; real `VyneOnederfulAdapter` behind OAuth later |

### Competitors — denial / eligibility AI

| Finding | Source | Implication |
|---------|--------|-------------|
| **Archy Verify** live; **Archy Revenue** still "in development" / planned 2026 | [archy.com/ai](https://www.archy.com/ai), [PR May 2026 Scribe](https://www.morningstar.com/news/pr-newswire/20260504la49688/archy-launches-native-ai-scribe-inside-its-dental-pms) | Denial-prediction from moat is still open wedge before Revenue ships deep |
| Archy Intelligence = 5 agents; billing depth not yet marketed as denial-prediction engine | [PR Newswire Jun 2025](https://www.prnewswire.com/news-releases/introducing-archy-intelligence-your-newest-ai-team-members-302482130.html) | Moat compounding (CDT×payer×outcome) remains differentiated vs generic scrub |
| Curve Eligibility+; bolt-on AI (DentalRobot, VideaAI) for denial flagging on existing PMS | [themolarreport.com/learn/best-ai-dental-insurance-claims](https://www.themolarreport.com/learn/best-ai-dental-insurance-claims) | Overlay + warm payer_intelligence is the structural answer to full-PMS rip-and-replace |

### Stack

| Finding | Proposal |
|---------|----------|
| Anthropic tool-use pattern fits `@backstop/tools` + orchestrator | Sonnet for judgment agents; Haiku for extraction; **no keys client-side** — edge/worker only |
| Synthetic eligibility fixture | `data/synthetic/eligibility-onederful-v2.json` (WS-AGENTS-01) | Done |

**Proposal (not auto-implemented):** Rules+moat-first denial scoring; LLM optional for narrative reasons; eligibility synthetic adapter before live Vyne OAuth.
