# Hey @hchybli — review when you can

**From:** @ameerabouhouli  
**Date:** 2026-06-26  
**Branch:** `main`

---

Phases **1–2** are on `main`. This is a rough draft for you to pull, run locally, and give feedback on.

## Pull & run (5 minutes)

```bash
git pull origin main
npm install
npm run dev
```

Then follow **[DEMO_WALKTHROUGH.md](../DEMO_WALKTHROUGH.md)**:

1. **/** — upload `data/synthetic/sample-claims.csv` → **Ingest & check claims** (see flags)
2. **/dashboard** — upload `data/synthetic/sample-outcomes.csv` → **Record outcomes** (see metrics)

```bash
npm test   # optional — 8 tests
```

## What to look at

- Do the **flags** make sense for a front-desk person? (audit-risk, missing attachments, fee leakage)
- Is the **dashboard** useful? ($ flagged, denial rate, $ recovered)
- Read **[FEATURE_ROADMAP.md](../FEATURE_ROADMAP.md)** — comment on the **Decisions** table (submit vs hand-back, v1 payers)

## Reply when done

Comment on GitHub, in chat, or add `docs/collaborators/hchybli-review.md` with your notes.

**No need to fix code yet** — just your take on direction before we start Phase 3.

— Ameer
