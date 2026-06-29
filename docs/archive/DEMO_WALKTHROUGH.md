# Demo walkthrough

**For @hchybli** — review the Phase 1–2 rough draft locally in ~5 minutes.

## Setup

```bash
git pull origin main
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 1 — Ingest & check claims

1. Go to **Ingest & check** (home page)
2. Upload `data/synthetic/sample-claims.csv`
3. Click **Ingest & check claims**

**You should see:**
- 3 claims, 5 lines parsed
- Multiple **pre-submission flags** (audit-risk, missing attachments on D4341/D2950/D2740)
- Dollar amounts at risk
- **OK** buttons to dismiss flags (one-tap, no queue)

**Sample claims intentionally trigger flags:**

| Claim ID | What's in it | Why it flags |
|----------|--------------|--------------|
| SYN-CLM-001 | Prophy + bitewing | Cleaner claim (fewer flags) |
| SYN-CLM-002 | D4341 SRP | Audit-risk + missing perio chart / X-ray / narrative |
| SYN-CLM-003 | D2950 + D2740 crown | Audit-risk + attachment requirements |

## Step 2 — Dashboard & outcomes

1. Click **Dashboard** in the nav (or the link after ingest)
2. Upload `data/synthetic/sample-outcomes.csv`
3. Click **Record outcomes**

**You should see:**
- Claims ingested, open flags, $ flagged
- Denial rate (1 of 3 denied in sample)
- Total $ paid, $ recovered
- Top flag types
- Recent outcomes with remark codes (CO-97, CO-45)

## Step 3 — Tests (optional)

```bash
npm test
```

8 tests cover CSV parsing, outcome parsing, and rule engine.

## What to review

1. **Product direction** — does pre-submission scrub + flag UI match what we want?
2. **Roadmap decisions** — [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md#decisions-resolve-before-phase-1) (submit vs hand-back, v1 payers)
3. **Flag quality** — are the reasons readable for a front-desk person?
4. **What's missing** — frequency limits, real 835 X12, Supabase persistence, AI (all Phase 3+)

## Known limitations (expected)

- Data lives **in memory** — restarting `npm run dev` clears claims/outcomes
- Outcomes CSV is **simplified**, not real X12 835 yet
- Supabase save is optional (needs `.env.local`)
- No real PHI — synthetic data only

## Comment back

Reply on GitHub or in chat with:
- 👍 / changes needed on flag types or UI
- Answers to the **Decisions** table in the roadmap
- Who owns Phase 3 (payer rules + AI)
