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

-- Helper: tenant_id, clinic_id, role from JWT app_metadata (set at signup / seed)
create or replace function public.auth_tenant_id() returns uuid
  language sql stable
  set search_path = public
  as $$
    select nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid
  $$;

create or replace function public.auth_clinic_id() returns uuid
  language sql stable
  set search_path = public
  as $$
    select nullif(auth.jwt() -> 'app_metadata' ->> 'clinic_id', '')::uuid
  $$;

create or replace function public.auth_user_role() returns text
  language sql stable
  set search_path = public
  as $$
    select auth.jwt() -> 'app_metadata' ->> 'role'
  $$;

-- tenants
create policy "tenants_select_own" on tenants
  for select using (id = auth_tenant_id());

-- clinics
create policy "clinics_select_tenant" on clinics
  for select using (tenant_id = auth_tenant_id());

-- clinic_members
create policy "clinic_members_select" on clinic_members
  for select using (
    user_id = auth.uid()
    or clinic_id in (select id from clinics where tenant_id = auth_tenant_id())
  );

-- events (append-only; clients read, writes via service role / edge functions)
create policy "events_select_tenant" on events
  for select using (tenant_id = auth_tenant_id());

revoke update, delete on events from authenticated, anon;

-- claims_current
create policy "claims_select_tenant" on claims_current
  for select using (tenant_id = auth_tenant_id());

-- claim_lines_current (via parent claim tenant)
create policy "claim_lines_select_tenant" on claim_lines_current
  for select using (
    exists (
      select 1 from claims_current c
      where c.id = claim_lines_current.claim_id
        and c.tenant_id = auth_tenant_id()
    )
  );

-- flags_open / flags_resolved
create policy "flags_open_select_tenant" on flags_open
  for select using (tenant_id = auth_tenant_id());

create policy "flags_resolved_select_tenant" on flags_resolved
  for select using (tenant_id = auth_tenant_id());

-- outcomes
create policy "outcomes_select_tenant" on outcomes
  for select using (tenant_id = auth_tenant_id());

-- payer_intelligence
create policy "payer_intelligence_select_tenant" on payer_intelligence
  for select using (tenant_id = auth_tenant_id());
