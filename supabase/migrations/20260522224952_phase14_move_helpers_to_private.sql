-- Phase 1.4 — Block 2: move RLS helpers off the PostgREST-exposed schema.
-- Supabase grants EXECUTE explicitly to anon/authenticated on public-schema functions,
-- so REVOKE FROM PUBLIC alone wasn't enough to silence the
-- anon_security_definer_function_executable / authenticated_... advisors.
-- Moving them into app_private preserves the function OID (so existing RLS policies
-- and the parents trigger keep working) while removing the /rest/v1/rpc/* exposure.

create schema if not exists app_private;
grant usage on schema app_private to anon, authenticated, service_role;

-- Helpers that RLS policies call — keep EXECUTE for anon/authenticated so policy
-- evaluation works in either role context.
alter function public.current_role_v()                   set schema app_private;
alter function public.is_admin()                         set schema app_private;
alter function public.is_doctor()                        set schema app_private;
alter function public.is_dispensary_staff()              set schema app_private;
alter function public.is_hod()                           set schema app_private;
alter function public.is_faculty()                       set schema app_private;
alter function public.is_parent()                        set schema app_private;
alter function public.is_student()                       set schema app_private;
alter function public.hod_department()                   set schema app_private;
alter function public.student_department(uuid)           set schema app_private;
alter function public.parent_of_student(uuid)            set schema app_private;

-- Trigger-only function — nobody should be able to call this directly.
alter function public.guard_parents_verification()       set schema app_private;
revoke execute on function app_private.guard_parents_verification() from public;
revoke execute on function app_private.guard_parents_verification() from anon;
revoke execute on function app_private.guard_parents_verification() from authenticated;
