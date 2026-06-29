# Strategy red-team log

Sessions since last red-team: **0** (reset after 2026-06-29 agent-fleet exchange)

Next scheduled red-team: **orchestrated session 3** (when the counter above reaches 3 again), unless a major architecture/strategy decision or WEB_RADAR threat triggers it sooner.

---

## Sessions

### 2026-06-29 — Agent fleet orchestration (WS-AGENTS-00/01/02)

**Challenge 1:** LLM-judged denial prediction on every claim vs moat-first scoring?  
**Verdict:** **Defended (moat-first)**  
**Reasoning:** User chose deterministic moat math from `payer_intelligence`; LLM optional for reason text only. Aligns with STRATEGY moat thesis and testability.

**Challenge 2:** Onederful/Vyne adapter vs moat-independent eligibility path?  
**Verdict:** **Fixed — Option C**  
**Reasoning:** User chose both: Onederful-shaped adapter + synthetic for WS-AGENTS-01; manual benefit snapshot as fallback later.

**Challenge 3:** Synthetic seed vs pulling forward Vyne/InsideDesk history import for warm moat?  
**Verdict:** **Accepted-and-watching** — Phase 1 chain uses synthetic only in repo. User evaluating what Vyne exports would help; aggregate payer stats rated ~7/10 for moat warmth (see chat 2026-06-29).

**Actions:** WS-AGENTS-01/02 shipped on feature branch; merge PR to `main`.
