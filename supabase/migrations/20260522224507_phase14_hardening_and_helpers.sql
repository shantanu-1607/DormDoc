-- Phase 1.4 — Block 0: hardening fixes from 1.3 advisor warnings + RLS helper functions.
-- Applied via MCP; filename will be renamed to match the server-assigned version after apply.

-- ---------- 1. Hardening fixes for 1.3 advisor warnings ----------

-- 1a. Pin set_updated_at search_path (advisor: function_search_path_mutable)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1b. Lock down handle_new_user — it's only invoked by the auth trigger, never via RPC
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
-- Pin search_path while we're here
alter function public.handle_new_user() set search_path = public, pg_temp;

-- 1c. Move citext out of public schema (advisor: extension_in_public)
alter extension citext set schema extensions;

-- ---------- 2. RLS helper functions ----------
-- All SECURITY DEFINER + STABLE so they can read profiles without recursing through RLS.
-- search_path locked; EXECUTE revoked from PUBLIC/anon, granted to authenticated only.

create or replace function public.current_role_v()
returns user_role
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

create or replace function public.is_doctor()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'doctor', false);
$$;

create or replace function public.is_dispensary_staff()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) in ('doctor', 'dispensary_staff'),
    false
  );
$$;

create or replace function public.is_hod()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'hod', false);
$$;

create or replace function public.is_faculty()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) in ('faculty', 'hod'),
    false
  );
$$;

create or replace function public.is_parent()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'parent', false);
$$;

create or replace function public.is_student()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'student', false);
$$;

create or replace function public.hod_department()
returns text
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select hod_department from public.faculty where id = auth.uid();
$$;

create or replace function public.student_department(target_student uuid)
returns text
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select department from public.students where id = target_student;
$$;

create or replace function public.parent_of_student(target_student uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.parent_student_links
    where parent_id = auth.uid() and student_id = target_student
  );
$$;

-- Revoke default PUBLIC grant + grant only to authenticated.
-- Anon role gets no execute, so PostgREST RPC exposure is blocked.
revoke execute on function public.current_role_v()           from public;
revoke execute on function public.is_admin()                  from public;
revoke execute on function public.is_doctor()                 from public;
revoke execute on function public.is_dispensary_staff()       from public;
revoke execute on function public.is_hod()                    from public;
revoke execute on function public.is_faculty()                from public;
revoke execute on function public.is_parent()                 from public;
revoke execute on function public.is_student()                from public;
revoke execute on function public.hod_department()            from public;
revoke execute on function public.student_department(uuid)    from public;
revoke execute on function public.parent_of_student(uuid)     from public;

grant execute on function public.current_role_v()             to authenticated;
grant execute on function public.is_admin()                   to authenticated;
grant execute on function public.is_doctor()                  to authenticated;
grant execute on function public.is_dispensary_staff()        to authenticated;
grant execute on function public.is_hod()                     to authenticated;
grant execute on function public.is_faculty()                 to authenticated;
grant execute on function public.is_parent()                  to authenticated;
grant execute on function public.is_student()                 to authenticated;
grant execute on function public.hod_department()             to authenticated;
grant execute on function public.student_department(uuid)     to authenticated;
grant execute on function public.parent_of_student(uuid)      to authenticated;
