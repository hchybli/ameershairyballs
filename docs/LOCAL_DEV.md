# Local development

Run the Backstop app through Phases 0–2 locally.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 8 tests
```

## Demo flow (Phases 1–2)

See **[DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md)** for the full step-by-step (claims → flags → dashboard → outcomes).

1. **/** — upload `data/synthetic/sample-claims.csv` → **Ingest & check claims**
2. **/dashboard** — upload `data/synthetic/sample-outcomes.csv` → **Record outcomes**

## Supabase (optional)

Preview and dashboard work without a database. To persist claims to Postgres:

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Copy `.env.example` → `.env.local` and fill in keys
4. Use **Save to database** on the ingest page

## What's next

- **Phase 3** — payer rule packs, AI narrative checks
- **Phase 4** — Open Dental + clearinghouse submit
