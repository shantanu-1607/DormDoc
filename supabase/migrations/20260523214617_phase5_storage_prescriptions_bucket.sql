-- Phase 5: Supabase Storage — prescriptions bucket
--
-- Replaces the legacy multer disk store under src/server/uploads/prescriptions/.
-- Object key convention: <student_id>/<prescription_id>.<ext>
-- The first path segment (student_id) drives RLS — students only see their own folder.

-- 1) Bucket (private; signed URLs only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prescriptions',
  'prescriptions',
  false,
  10 * 1024 * 1024,                                          -- 10 MB to match legacy multer limit
  array['image/jpeg', 'image/png', 'application/pdf']        -- jpeg/png/pdf only, matched the legacy fileFilter
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) RLS policies on storage.objects, scoped to bucket_id = 'prescriptions'.
--    All policies scoped TO authenticated — service_role bypasses RLS automatically.

drop policy if exists prescriptions_select_own_or_staff on storage.objects;
create policy prescriptions_select_own_or_staff
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'prescriptions'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text   -- student reads own folder
      or app_private.is_doctor()
      or app_private.is_admin()
      or app_private.is_dispensary_staff()
    )
  );

drop policy if exists prescriptions_insert_own on storage.objects;
create policy prescriptions_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'prescriptions'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text   -- students upload to their own folder
      or app_private.is_doctor()                                  -- doctors can upload too (future doctor-attached scans)
      or app_private.is_admin()
    )
  );

drop policy if exists prescriptions_delete_own_or_staff on storage.objects;
create policy prescriptions_delete_own_or_staff
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'prescriptions'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or app_private.is_admin()
    )
  );
