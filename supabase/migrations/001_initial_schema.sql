-- Backstop Phase 0 schema (synthetic data only until HIPAA BAAs)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard → SQL → New query

create extension if not exists "pgcrypto";

-- ── Core tables ─────────────────────────────────────────────────────────────

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pms_type text,
  created_at timestamptz not null default now()
);

create table payers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  edi_payer_id text,
  created_at timestamptz not null default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  patient_ref text not null,
  payer_id uuid not null references payers(id),
  external_claim_id text,
  status text not null default 'ingested' check (status in ('ingested', 'checking', 'ready', 'submitted', 'paid', 'denied')),
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table claim_lines (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  cdt_code text not null,
  fee_billed numeric(10, 2) not null,
  fee_allowed numeric(10, 2),
  tooth text,
  quadrant text,
  created_at timestamptz not null default now()
);

-- ── Future phases (empty shells, append-only where noted) ─────────────────────

create table flags (
  id uuid primary key default gen_random_uuid(),
  claim_line_id uuid not null references claim_lines(id) on delete cascade,
  type text not null,
  severity text not null,
  dollar_impact numeric(10, 2),
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table fixes (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references flags(id),
  applied_by text not null,
  auto boolean not null default false,
  reason text not null,
  created_at timestamptz not null default now()
);

create table outcomes (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id),
  result text not null,
  paid_amount numeric(10, 2),
  observed_at timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

create index claims_clinic_id_idx on claims (clinic_id);
create index claims_payer_id_idx on claims (payer_id);
create index claim_lines_claim_id_idx on claim_lines (claim_id);

-- ── Row Level Security (on from day one) ──────────────────────────────────────
-- Service role (server-side only) bypasses RLS. No anon policies until auth exists.

alter table clinics enable row level security;
alter table payers enable row level security;
alter table claims enable row level security;
alter table claim_lines enable row level security;
alter table flags enable row level security;
alter table fixes enable row level security;
alter table outcomes enable row level security;
