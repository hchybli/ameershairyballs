-- WS-01b: Clinic-level RLS (additive tightening — tenant isolation preserved)
-- owner/admin: all clinics within tenant
-- operator/biller: assigned clinic(s) via clinic_members only

create or replace function public.auth_is_privileged_role() returns boolean
  language sql stable
  set search_path = public
  as $$
    select auth_user_role() in ('owner', 'admin')
  $$;

-- Returns clinic IDs the current user may access within their tenant.
create or replace function public.auth_accessible_clinic_ids() returns setof uuid
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select c.id
    from clinics c
    where c.tenant_id = auth_tenant_id()
      and (
        auth_is_privileged_role()
        or c.id in (
          select cm.clinic_id
          from clinic_members cm
          where cm.user_id = auth.uid()
        )
      )
  $$;

create or replace function public.auth_can_access_clinic(p_clinic_id uuid) returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select p_clinic_id in (select auth_accessible_clinic_ids())
  $$;

create or replace function public.auth_can_access_event(payload jsonb) returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select
      payload ? 'clinic_id'
      and auth_can_access_clinic(nullif(payload ->> 'clinic_id', '')::uuid)
  $$;

-- ── Replace tenant-only policies with tenant + clinic policies ────────────────

drop policy if exists "clinics_select_tenant" on clinics;
create policy "clinics_select_accessible" on clinics
  for select using (
    tenant_id = auth_tenant_id()
    and auth_can_access_clinic(id)
  );

drop policy if exists "clinic_members_select" on clinic_members;
create policy "clinic_members_select_accessible" on clinic_members
  for select using (
    clinic_id in (select auth_accessible_clinic_ids())
    or user_id = auth.uid()
  );

drop policy if exists "events_select_tenant" on events;
create policy "events_select_tenant_clinic" on events
  for select using (
    tenant_id = auth_tenant_id()
    and auth_can_access_event(payload)
  );

drop policy if exists "claims_select_tenant" on claims_current;
create policy "claims_select_tenant_clinic" on claims_current
  for select using (
    tenant_id = auth_tenant_id()
    and auth_can_access_clinic(clinic_id)
  );

drop policy if exists "claim_lines_select_tenant" on claim_lines_current;
create policy "claim_lines_select_tenant_clinic" on claim_lines_current
  for select using (
    exists (
      select 1 from claims_current c
      where c.id = claim_lines_current.claim_id
        and c.tenant_id = auth_tenant_id()
        and auth_can_access_clinic(c.clinic_id)
    )
  );

drop policy if exists "flags_open_select_tenant" on flags_open;
create policy "flags_open_select_tenant_clinic" on flags_open
  for select using (
    tenant_id = auth_tenant_id()
    and exists (
      select 1 from claims_current c
      where c.id = flags_open.claim_id
        and auth_can_access_clinic(c.clinic_id)
    )
  );

drop policy if exists "flags_resolved_select_tenant" on flags_resolved;
create policy "flags_resolved_select_tenant_clinic" on flags_resolved
  for select using (
    tenant_id = auth_tenant_id()
    and exists (
      select 1 from claims_current c
      where c.id = flags_resolved.claim_id
        and auth_can_access_clinic(c.clinic_id)
    )
  );

drop policy if exists "outcomes_select_tenant" on outcomes;
create policy "outcomes_select_tenant_clinic" on outcomes
  for select using (
    tenant_id = auth_tenant_id()
    and exists (
      select 1 from claims_current c
      where c.id = outcomes.claim_id
        and auth_can_access_clinic(c.clinic_id)
    )
  );

-- payer_intelligence has no clinic_id; restrict to owner/admin within tenant
drop policy if exists "payer_intelligence_select_tenant" on payer_intelligence;
create policy "payer_intelligence_select_privileged" on payer_intelligence
  for select using (
    tenant_id = auth_tenant_id()
    and auth_is_privileged_role()
  );
