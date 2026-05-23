-- Phase 1.4 — Block 1: RLS policies for all 20 tables.
-- All policies TO authenticated. anon has zero access (default-deny stays in effect).
-- service_role bypasses RLS — server-side writes that need to span policies go through that client.

-- profiles --------------------------------------------------------------------
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or public.is_dispensary_staff()
    or (public.is_hod() and (
      exists (select 1 from public.students s where s.id = profiles.id and s.department = public.hod_department())
      or exists (select 1 from public.faculty f where f.id = profiles.id and f.department = public.hod_department())
    ))
    or (public.is_parent() and exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = profiles.id
    ))
  );

create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (public.is_admin());

-- Self can update own row but cannot escalate role; admin policy permits role changes.
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role_v());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- students --------------------------------------------------------------------
create policy "students_select" on public.students
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or public.is_dispensary_staff()
    or (public.is_hod() and department = public.hod_department())
    or (public.is_parent() and public.parent_of_student(id))
  );

create policy "students_insert" on public.students
  for insert to authenticated
  with check ((id = auth.uid() and public.is_student()) or public.is_admin());

create policy "students_update" on public.students
  for update to authenticated
  using (id = auth.uid() or public.is_dispensary_staff() or public.is_admin())
  with check (id = auth.uid() or public.is_dispensary_staff() or public.is_admin());

create policy "students_delete_admin" on public.students
  for delete to authenticated
  using (public.is_admin());

-- faculty ---------------------------------------------------------------------
create policy "faculty_select" on public.faculty
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.is_hod() and department = public.hod_department())
  );

create policy "faculty_insert" on public.faculty
  for insert to authenticated
  with check ((id = auth.uid() and public.is_faculty()) or public.is_admin());

create policy "faculty_update" on public.faculty
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "faculty_delete_admin" on public.faculty
  for delete to authenticated
  using (public.is_admin());

-- parents ---------------------------------------------------------------------
-- Self can update but cannot toggle is_verified (admin-only flag, enforced by trigger below).
create policy "parents_select" on public.parents
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.is_hod() and exists (
      select 1 from public.parent_student_links psl
      join public.students s on s.id = psl.student_id
      where psl.parent_id = parents.id and s.department = public.hod_department()
    ))
  );

create policy "parents_insert" on public.parents
  for insert to authenticated
  with check ((id = auth.uid() and public.is_parent()) or public.is_admin());

create policy "parents_update" on public.parents
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "parents_delete_admin" on public.parents
  for delete to authenticated
  using (public.is_admin());

-- Trigger: only admin may flip is_verified / verified_at / verified_by.
create or replace function public.guard_parents_verification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if (new.is_verified is distinct from old.is_verified)
     or (new.verified_at is distinct from old.verified_at)
     or (new.verified_by is distinct from old.verified_by) then
    raise exception 'only admin can change parent verification fields';
  end if;
  return new;
end;
$$;

create trigger trg_parents_guard_verification
  before update on public.parents
  for each row execute function public.guard_parents_verification();

-- dispensary_staff ------------------------------------------------------------
create policy "dispensary_staff_select" on public.dispensary_staff
  for select to authenticated
  using (true);

create policy "dispensary_staff_insert_admin" on public.dispensary_staff
  for insert to authenticated
  with check (public.is_admin());

create policy "dispensary_staff_update" on public.dispensary_staff
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "dispensary_staff_delete_admin" on public.dispensary_staff
  for delete to authenticated
  using (public.is_admin());

-- parent_student_links --------------------------------------------------------
create policy "parent_student_links_select" on public.parent_student_links
  for select to authenticated
  using (parent_id = auth.uid() or student_id = auth.uid() or public.is_admin());

create policy "parent_student_links_insert_admin" on public.parent_student_links
  for insert to authenticated
  with check (public.is_admin());

create policy "parent_student_links_update_admin" on public.parent_student_links
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "parent_student_links_delete_admin" on public.parent_student_links
  for delete to authenticated
  using (public.is_admin());

-- staff_availability ----------------------------------------------------------
create policy "staff_availability_select" on public.staff_availability
  for select to authenticated
  using (true);

create policy "staff_availability_insert" on public.staff_availability
  for insert to authenticated
  with check (staff_id = auth.uid() or public.is_admin());

create policy "staff_availability_update" on public.staff_availability
  for update to authenticated
  using (staff_id = auth.uid() or public.is_admin())
  with check (staff_id = auth.uid() or public.is_admin());

create policy "staff_availability_delete" on public.staff_availability
  for delete to authenticated
  using (staff_id = auth.uid() or public.is_admin());

-- medical_history -------------------------------------------------------------
create policy "medical_history_select" on public.medical_history
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_dispensary_staff()
    or public.is_admin()
    or (public.is_hod() and public.student_department(student_id) = public.hod_department())
  );

create policy "medical_history_insert" on public.medical_history
  for insert to authenticated
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "medical_history_update" on public.medical_history
  for update to authenticated
  using (public.is_dispensary_staff() or public.is_admin())
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "medical_history_delete_admin" on public.medical_history
  for delete to authenticated
  using (public.is_admin());

-- appointments ----------------------------------------------------------------
create policy "appointments_select" on public.appointments
  for select to authenticated
  using (
    student_id = auth.uid()
    or doctor_id = auth.uid()
    or public.is_admin()
    or (public.is_hod() and public.student_department(student_id) = public.hod_department())
  );

create policy "appointments_insert" on public.appointments
  for insert to authenticated
  with check (
    student_id = auth.uid() or public.is_dispensary_staff() or public.is_admin()
  );

create policy "appointments_update" on public.appointments
  for update to authenticated
  using (student_id = auth.uid() or doctor_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or doctor_id = auth.uid() or public.is_admin());

create policy "appointments_delete_admin" on public.appointments
  for delete to authenticated
  using (public.is_admin());

-- leave_requests --------------------------------------------------------------
create policy "leave_requests_select" on public.leave_requests
  for select to authenticated
  using (
    student_id = auth.uid()
    or decided_by = auth.uid()
    or public.is_admin()
    or (public.is_hod() and public.student_department(student_id) = public.hod_department())
  );

-- Students can only file requests for themselves, and cannot pre-fill the decision fields.
create policy "leave_requests_insert" on public.leave_requests
  for insert to authenticated
  with check (
    (student_id = auth.uid() and decided_by is null and status = 'pending')
    or public.is_admin()
  );

create policy "leave_requests_update" on public.leave_requests
  for update to authenticated
  using (public.is_faculty() or public.is_admin())
  with check (public.is_faculty() or public.is_admin());

-- Student cancellation = DELETE while status is pending.
create policy "leave_requests_delete" on public.leave_requests
  for delete to authenticated
  using (
    (student_id = auth.uid() and status = 'pending')
    or public.is_admin()
  );

-- prescriptions ---------------------------------------------------------------
create policy "prescriptions_select" on public.prescriptions
  for select to authenticated
  using (
    student_id = auth.uid()
    or doctor_id = auth.uid()
    or public.is_admin()
    or (public.is_parent() and public.parent_of_student(student_id))
    or (public.is_hod() and public.student_department(student_id) = public.hod_department())
  );

create policy "prescriptions_insert" on public.prescriptions
  for insert to authenticated
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "prescriptions_update" on public.prescriptions
  for update to authenticated
  using (doctor_id = auth.uid() or public.is_admin())
  with check (doctor_id = auth.uid() or public.is_admin());

create policy "prescriptions_delete_admin" on public.prescriptions
  for delete to authenticated
  using (public.is_admin());

-- prescription_medications ----------------------------------------------------
-- SELECT inherits from parent prescription (parent RLS does the filtering).
create policy "prescription_medications_select" on public.prescription_medications
  for select to authenticated
  using (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_medications.prescription_id
  ));

create policy "prescription_medications_insert" on public.prescription_medications
  for insert to authenticated
  with check (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_medications.prescription_id
        and (p.doctor_id = auth.uid() or public.is_dispensary_staff() or public.is_admin())
    )
  );

create policy "prescription_medications_update" on public.prescription_medications
  for update to authenticated
  using (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_medications.prescription_id
      and (p.doctor_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_medications.prescription_id
      and (p.doctor_id = auth.uid() or public.is_admin())
  ));

create policy "prescription_medications_delete" on public.prescription_medications
  for delete to authenticated
  using (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_medications.prescription_id
      and (p.doctor_id = auth.uid() or public.is_admin())
  ));

-- inventory_items -------------------------------------------------------------
create policy "inventory_items_select" on public.inventory_items
  for select to authenticated
  using (true);

create policy "inventory_items_insert" on public.inventory_items
  for insert to authenticated
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "inventory_items_update" on public.inventory_items
  for update to authenticated
  using (public.is_dispensary_staff() or public.is_admin())
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "inventory_items_delete_admin" on public.inventory_items
  for delete to authenticated
  using (public.is_admin());

-- ambulances ------------------------------------------------------------------
create policy "ambulances_select" on public.ambulances
  for select to authenticated
  using (true);

create policy "ambulances_insert_admin" on public.ambulances
  for insert to authenticated
  with check (public.is_admin());

create policy "ambulances_update" on public.ambulances
  for update to authenticated
  using (public.is_dispensary_staff() or public.is_admin())
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "ambulances_delete_admin" on public.ambulances
  for delete to authenticated
  using (public.is_admin());

-- ambulance_equipment ---------------------------------------------------------
create policy "ambulance_equipment_select" on public.ambulance_equipment
  for select to authenticated
  using (true);

create policy "ambulance_equipment_insert" on public.ambulance_equipment
  for insert to authenticated
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "ambulance_equipment_update" on public.ambulance_equipment
  for update to authenticated
  using (public.is_dispensary_staff() or public.is_admin())
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "ambulance_equipment_delete_admin" on public.ambulance_equipment
  for delete to authenticated
  using (public.is_admin());

-- ambulance_maintenance_issues ------------------------------------------------
create policy "ambulance_maintenance_issues_select" on public.ambulance_maintenance_issues
  for select to authenticated
  using (true);

create policy "ambulance_maintenance_issues_insert" on public.ambulance_maintenance_issues
  for insert to authenticated
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "ambulance_maintenance_issues_update" on public.ambulance_maintenance_issues
  for update to authenticated
  using (public.is_dispensary_staff() or public.is_admin())
  with check (public.is_dispensary_staff() or public.is_admin());

create policy "ambulance_maintenance_issues_delete_admin" on public.ambulance_maintenance_issues
  for delete to authenticated
  using (public.is_admin());

-- ambulance_trips -------------------------------------------------------------
create policy "ambulance_trips_select" on public.ambulance_trips
  for select to authenticated
  using (
    student_id = auth.uid()
    or driver_id = auth.uid()
    or created_by = auth.uid()
    or public.is_dispensary_staff()
    or public.is_admin()
  );

create policy "ambulance_trips_insert" on public.ambulance_trips
  for insert to authenticated
  with check (
    (public.is_dispensary_staff() or public.is_admin())
    and created_by = auth.uid()
  );

create policy "ambulance_trips_update" on public.ambulance_trips
  for update to authenticated
  using (driver_id = auth.uid() or public.is_dispensary_staff() or public.is_admin())
  with check (driver_id = auth.uid() or public.is_dispensary_staff() or public.is_admin());

create policy "ambulance_trips_delete_admin" on public.ambulance_trips
  for delete to authenticated
  using (public.is_admin());

-- ambulance_trip_status_log (append-only) -------------------------------------
create policy "ambulance_trip_status_log_select" on public.ambulance_trip_status_log
  for select to authenticated
  using (exists (
    select 1 from public.ambulance_trips t
    where t.id = ambulance_trip_status_log.trip_id
  ));

create policy "ambulance_trip_status_log_insert" on public.ambulance_trip_status_log
  for insert to authenticated
  with check (
    exists (
      select 1 from public.ambulance_trips t
      where t.id = ambulance_trip_status_log.trip_id
        and (t.driver_id = auth.uid() or public.is_dispensary_staff() or public.is_admin())
    )
  );
-- No UPDATE/DELETE policies → append-only.

-- leave_decisions (append-only) -----------------------------------------------
create policy "leave_decisions_select" on public.leave_decisions
  for select to authenticated
  using (
    student_id = auth.uid()
    or decider_id = auth.uid()
    or public.is_admin()
    or (public.is_hod() and student_department = public.hod_department())
  );

create policy "leave_decisions_insert" on public.leave_decisions
  for insert to authenticated
  with check (public.is_faculty() or public.is_admin());
-- No UPDATE/DELETE policies → append-only.

-- login_logs (append-only) ----------------------------------------------------
create policy "login_logs_select" on public.login_logs
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "login_logs_insert_admin" on public.login_logs
  for insert to authenticated
  with check (public.is_admin());
-- No UPDATE/DELETE policies → append-only. Server logs via service_role.
