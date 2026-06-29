-- Fix RLS recursion: auth_accessible_clinic_ids() must bypass RLS when reading clinics/clinic_members.

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
