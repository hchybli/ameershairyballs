-- Backstop event-sourced schema (Phase 1 target)
-- Apply on fresh Supabase project OR new environment.
-- Does NOT migrate data from 001_initial_schema.sql — greenfield.
-- Synthetic data only until HIPAA BAAs.

create extension if not exists "pgcrypto";

-- ── L6 Foundation ─────────────────────────────────────────────────────────────

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table clinics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  pms_type text,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table clinic_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  role text not null check (role in ('operator', 'owner', 'biller', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, clinic_id)
);

-- ── L5 Event log (append-only) ────────────────────────────────────────────────

create table events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index events_tenant_created_idx on events (tenant_id, created_at desc);
create index events_tenant_type_idx on events (tenant_id, type);

-- ── Read models (projected from events) ─────────────────────────────────────

create table claims_current (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  external_claim_id text not null,
  patient_ref text not null,
  payer_name text not null,
  status text not null default 'ingested',
  last_event_id uuid references events(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, external_claim_id)
);

create table claim_lines_current (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims_current(id) on delete cascade,
  line_index int not null,
  cdt_code text not null,
  fee_billed numeric(10, 2) not null,
  fee_allowed numeric(10, 2),
  tooth text,
  quadrant text,
  unique (claim_id, line_index)
);

create table flags_open (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  claim_id uuid not null references claims_current(id) on delete cascade,
  line_index int,
  cdt_code text,
  flag_type text not null,
  severity text not null,
  dollar_impact numeric(10, 2),
  reason text not null,
  suggested_fix text,
  raised_event_id uuid not null references events(id),
  created_at timestamptz not null default now()
);

create table flags_resolved (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  claim_id uuid not null references claims_current(id) on delete cascade,
  flag_type text not null,
  severity text not null,
  status text not null check (status in ('approved', 'overridden')),
  resolution_reason text,
  resolution_event_id uuid not null references events(id),
  resolved_at timestamptz not null default now()
);

-- ── Outcomes (append-only) + moat ─────────────────────────────────────────────

create table outcomes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  claim_id uuid not null references claims_current(id),
  result text not null check (result in ('paid', 'denied', 'downcoded')),
  paid_amount numeric(10, 2) not null default 0,
  remark_code text,
  remark_text text,
  source_event_id uuid not null references events(id),
  observed_at timestamptz not null default now()
);

create table payer_intelligence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  payer_name text not null,
  cdt_code text not null,
  sample_size int not null default 0,
  paid_count int not null default 0,
  denied_count int not null default 0,
  downcoded_count int not null default 0,
  avg_paid_amount numeric(10, 2),
  common_remark_codes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (tenant_id, payer_name, cdt_code)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table tenants enable row level security;
alter table clinics enable row level security;
alter table clinic_members enable row level security;
alter table events enable row level security;
alter table claims_current enable row level security;
alter table claim_lines_current enable row level security;
alter table flags_open enable row level security;
alter table flags_resolved enable row level security;
alter table outcomes enable row level security;
alter table payer_intelligence enable row level security;

-- Helper: tenant_id from JWT app_metadata (set by auth hook in implementation)
-- create policy ... using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Policies to be completed in WS-01 with auth hook documentation.
