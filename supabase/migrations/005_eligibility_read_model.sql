-- WS-AGENTS-01: eligibility.checked read model

create table if not exists eligibility_current (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  clinic_id uuid not null references clinics (id) on delete cascade,
  patient_ref text not null,
  payer_name text not null,
  active boolean not null default true,
  checked_at timestamptz not null default now(),
  annual_max_remaining numeric,
  deductible_remaining numeric,
  breakdown jsonb not null default '{}'::jsonb,
  alerts text[] not null default '{}',
  source_event_id uuid references events (id),
  updated_at timestamptz not null default now(),
  unique (tenant_id, clinic_id, patient_ref, payer_name)
);

create index if not exists eligibility_current_tenant_patient_idx
  on eligibility_current (tenant_id, patient_ref);

alter table eligibility_current enable row level security;

create policy "eligibility_current_select_clinic" on eligibility_current
  for select
  using (
    tenant_id = auth_tenant_id()
    and clinic_id in (select auth_accessible_clinic_ids())
  );

create policy "eligibility_current_service_all" on eligibility_current
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
