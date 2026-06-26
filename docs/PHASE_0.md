# Phase 0 — local dev

Phase 0 delivers: Next.js app, Supabase schema, CSV ingest, synthetic sample data.

## 1. Install dependencies

```bash
npm install
```

## 2. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload `data/synthetic/sample-claims.csv` and click **Preview parse**.

## 3. Run tests

```bash
npm test
```

## 4. Set up Supabase (optional for preview; required to save)

1. Create a free project at [supabase.com](https://supabase.com)
2. **SQL Editor** → paste `supabase/migrations/001_initial_schema.sql` → Run
3. Copy **Project URL** and **service_role** key (Settings → API)
4. Copy `.env.example` → `.env.local` and fill in values
5. Restart `npm run dev`, upload CSV, click **Save to database**

## What Phase 0 does *not* include yet

- Pre-submission rule checks (Phase 1)
- Dashboard (Phase 2)
- AI agents (Phase 3)
