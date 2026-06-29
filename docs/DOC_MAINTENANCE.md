# Documentation maintenance

**Rule:** Code and docs ship together. If behavior changes, update docs in the **same PR**.

---

## Doc hierarchy (what is source of truth)

| Level | Files | Updates when |
|-------|-------|--------------|
| **Living status** | [STATUS.md](./STATUS.md) | Any workstream completes or scope changes |
| **Build gate** | [BUILD_READINESS.md](./BUILD_READINESS.md) | Pre-build checklist items complete or blockers change |
| **Product vision** | [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) | Mission, scope, PHI rules change |
| **Architecture** | [architecture/*.md](./architecture/README.md) | Stack, events, APIs, schema change |
| **UX flows** | [architecture/USER_FLOWS.md](./architecture/USER_FLOWS.md) | Personas, IA, interaction rules, competitor patterns |
| **Build preview** | [architecture/MEDIUM_BUILD.md](./architecture/MEDIUM_BUILD.md) | Screens, components, API tables change |
| **Domain research** | [research/*.md](./research/README.md) | Payer rules, CSV format, flag taxonomy change |
| **Handoff** | [HANDOFF_BUNGAROO.md](./HANDOFF_BUNGAROO.md) | Process, ownership, env setup changes |
| **Workstreams** | [architecture/WORKSTREAMS.md](./architecture/WORKSTREAMS.md) | Epic scope or acceptance criteria change |
| **Package scope** | `apps/*/README.md`, `packages/*/README.md` | Package API or deliverables change |
| **Historical** | [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) | Major phase shifts only (add note at top) |

---

## When you change X, update Y

| You changed… | Also update… |
|--------------|--------------|
| Event payload shape | `EVENT_CATALOG.md`, `DATA_MODEL.md`, `API_CONTRACTS.md`, `FLAG_TAXONOMY.md` |
| Edge Function API | `API_CONTRACTS.md`, package README, `MEDIUM_BUILD.md` screen API table |
| DB migration | `DATA_MODEL.md`, `002_*.sql` comment header, `STATUS.md` |
| New screen / route | `USER_FLOWS.md`, `MEDIUM_BUILD.md`, `apps/<app>/README.md`, canvas |
| Scrub rule added | `PAYER_RULES_V1.md`, `FLAG_TAXONOMY.md`, `WORKSTREAMS.md` WS-04, `LEGACY_REFERENCE.md` |
| CSV column added | `DENTRIX_EXPORT_FORMAT.md`, adapter tests, `data/synthetic/` |
| Workstream completed | `STATUS.md`, `WORKSTREAMS.md` checkbox, `BUILD_READINESS.md`, `PHASE_1_SLICE.md` DoD |
| KPI formula | `PHASE_1_SLICE.md`, `analytics/README.md`, `MEDIUM_BUILD.md` owner screen |
| UX interaction rule | `USER_FLOWS.md`, `MEDIUM_BUILD.md`, WS-06/08 acceptance |
| Out of scope item | `PHASE_1_SLICE.md`, `ARCHITECTURE.md`, `.cursor/rules/project.mdc` |

---

## PR checklist (copy into PR description)

```markdown
## Docs
- [ ] Updated STATUS.md (workstream / completion)
- [ ] Updated relevant architecture doc(s) — see DOC_MAINTENANCE.md
- [ ] Updated USER_FLOWS.md or MEDIUM_BUILD.md if UI or flow changed
- [ ] Updated research/*.md if rules or CSV format changed
- [ ] Updated package/app README if public API changed
- [ ] No drift: event catalog matches code
```

---

## STATUS.md format

Keep [STATUS.md](./STATUS.md) as a **one-page dashboard**:

- Current phase
- Workstream table (WS-00 … WS-09) with status: `not started` | `in progress` | `done`
- Last updated date + who updated
- Link to demo / canvas

Update at **start** and **end** of every workstream PR.

---

## Bungaroo + US team

| Action | Who |
|--------|-----|
| Mark workstream done | Bungaroo (PR) |
| Verify dental rules accuracy | US team (review) |
| Approve architecture doc changes | US team |
| Update OPEN_QUESTIONS decisions | US team |
| Provide real Dentrix export | US team (design partner) |

---

## Legacy / archived docs

| File | Status |
|------|--------|
| [archive/](./archive/README.md) | Obsolete Cursor prompts, Phase 0 onboarding, legacy Next.js demo |
| [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) | Product history — build truth is `STATUS.md` + `architecture/` |
