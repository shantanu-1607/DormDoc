-- Phase 1.4 — Block 3: performance pass.
-- 1) Add covering indexes on the 9 actor/audit FKs the advisor flagged.
-- 2) Rewrite all policies that call auth.uid() to use (select auth.uid())
--    so the planner caches it as an initplan instead of re-evaluating per row.
-- Done as drop + recreate (cheaper than 30+ ALTER POLICY on an empty DB).

-- ---------- 1. FK covering indexes ----------
create index if not exists ambulance_trip_status_log_updated_by_idx on public.ambulance_trip_status_log(updated_by);
create index if not exists ambulance_trips_created_by_idx           on public.ambulance_trips(created_by);
create index if not exists ambulance_trips_driver_id_idx            on public.ambulance_trips(driver_id);
create index if not exists ambulance_trips_student_id_idx           on public.ambulance_trips(student_id);
create index if not exists inventory_items_added_by_idx             on public.inventory_items(added_by);
create index if not exists inventory_items_updated_by_idx           on public.inventory_items(updated_by);
create index if not exists leave_requests_decided_by_idx            on public.leave_requests(decided_by);
create index if not exists parents_verified_by_idx                  on public.parents(verified_by);
create index if not exists prescriptions_appointment_id_idx         on public.prescriptions(appointment_id);

-- ---------- 2. Recreate policies with (select auth.uid()) ----------

-- profiles --------------------------------------------------------------------
drop policy if exists "profiles_select"        on public.profiles;
drop policy if exists "profiles_insert_admin"  on public.profiles;
drop policy if exists "profiles_update_self"   on public.profiles;
drop policy if exists "profiles_update_admin"  on public.profiles;
drop policy if exists "profiles_delete_admin"  on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or app_private.is_admin()
    or app_private.is_dispensary_staff()
    or (app_private.is_hod() and (
      exists (select 1 from public.students s where s.id = profiles.id and s.department = app_private.hod_department())
      or exists (select 1 from public.faculty f where f.id = profiles.id and f.department = app_private.hod_department())
    ))
    or (app_private.is_parent() and exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = (select auth.uid()) and psl.student_id = profiles.id
    ))
  );

create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (app_private.is_admin());

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = app_private.current_role_v());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (app_private.is_admin());

-- students --------------------------------------------------------------------
drop policy if exists "students_select"        on public.students;
drop policy if exists "students_insert"        on public.students;
drop policy if exists "students_update"        on public.students;
drop policy if exists "students_delete_admin"  on public.students;

create policy "students_select" on public.students
  for select to authenticated
  using (
    id = (select auth.uid())
    or app_private.is_admin()
    or app_private.is_dispensary_staff()
    or (app_private.is_hod() and department = app_private.hod_department())
    or (app_private.is_parent() and app_private.parent_of_student(id))
  );

create policy "students_insert" on public.students
  for insert to authenticated
  with check ((id = (select auth.uid()) and app_private.is_student()) or app_private.is_admin());

create policy "students_update" on public.students
  for update to authenticated
  using (id = (select auth.uid()) or app_private.is_dispensary_staff() or app_private.is_admin())
  with check (id = (select auth.uid()) or app_private.is_dispensary_staff() or app_private.is_admin());

create policy "students_delete_admin" on public.students
  for delete to authenticated
  using (app_private.is_admin());

-- faculty ---------------------------------------------------------------------
drop policy if exists "faculty_select"        on public.faculty;
drop policy if exists "faculty_insert"        on public.faculty;
drop policy if exists "faculty_update"        on public.faculty;
drop policy if exists "faculty_delete_admin"  on public.faculty;

create policy "faculty_select" on public.faculty
  for select to authenticated
  using (
    id = (select auth.uid())
    or app_private.is_admin()
    or (app_private.is_hod() and department = app_private.hod_department())
  );

create policy "faculty_insert" on public.faculty
  for insert to authenticated
  with check ((id = (select auth.uid()) and app_private.is_faculty()) or app_private.is_admin());

create policy "faculty_update" on public.faculty
  for update to authenticated
  using (id = (select auth.uid()) or app_private.is_admin())
  with check (id = (select auth.uid()) or app_private.is_admin());

create policy "faculty_delete_admin" on public.faculty
  for delete to authenticated
  using (app_private.is_admin());

-- parents ---------------------------------------------------------------------
drop policy if exists "parents_select"        on public.parents;
drop policy if exists "parents_insert"        on public.parents;
drop policy if exists "parents_update"        on public.parents;
drop policy if exists "parents_delete_admin"  on public.parents;

create policy "parents_select" on public.parents
  for select to authenticated
  using (
    id = (select auth.uid())
    or app_private.is_admin()
    or (app_private.is_hod() and exists (
      select 1 from public.parent_student_links psl
      join public.students s on s.id = psl.student_id
      where psl.parent_id = parents.id and s.department = app_private.hod_department()
    ))
  );

create policy "parents_insert" on public.parents
  for insert to authenticated
  with check ((id = (select auth.uid()) and app_private.is_parent()) or app_private.is_admin());

create policy "parents_update" on public.parents
  for update to authenticated
  using (id = (select auth.uid()) or app_private.is_admin())
  with check (id = (select auth.uid()) or app_private.is_admin());

create policy "parents_delete_admin" on public.parents
  for delete to authenticated
  using (app_private.is_admin());

-- dispensary_staff ------------------------------------------------------------
drop policy if exists "dispensary_staff_select"        on public.dispensary_staff;
drop policy if exists "dispensary_staff_insert_admin"  on public.dispensary_staff;
drop policy if exists "dispensary_staff_update"        on public.dispensary_staff;
drop policy if exists "dispensary_staff_delete_admin"  on public.dispensary_staff;

create policy "dispensary_staff_select" on public.dispensary_staff
  for select to authenticated
  using (true);

create policy "dispensary_staff_insert_admin" on public.dispensary_staff
  for insert to authenticated
  with check (app_private.is_admin());

create policy "dispensary_staff_update" on public.dispensary_staff
  for update to authenticated
  using (id = (select auth.uid()) or app_private.is_admin())
  with check (id = (select auth.uid()) or app_private.is_admin());

create policy "dispensary_staff_delete_admin" on public.dispensary_staff
  for delete to authenticated
  using (app_private.is_admin());

-- parent_student_links --------------------------------------------------------
drop policy if exists "parent_student_links_select"        on public.parent_student_links;
drop policy if exists "parent_student_links_insert_admin"  on public.parent_student_links;
drop policy if exists "parent_student_links_update_admin"  on public.parent_student_links;
drop policy if exists "parent_student_links_delete_admin"  on public.parent_student_links;

create policy "parent_student_links_select" on public.parent_student_links
  for select to authenticated
  using (parent_id = (select auth.uid()) or student_id = (select auth.uid()) or app_private.is_admin());

create policy "parent_student_links_insert_admin" on public.parent_student_links
  for insert to authenticated
  with check (app_private.is_admin());

create policy "parent_student_links_update_admin" on public.parent_student_links
  for update to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

create policy "parent_student_links_delete_admin" on public.parent_student_links
  for delete to authenticated
  using (app_private.is_admin());

-- staff_availability ----------------------------------------------------------
drop policy if exists "staff_availability_select" on public.staff_availability;
drop policy if exists "staff_availability_insert" on public.staff_availability;
drop policy if exists "staff_availability_update" on public.staff_availability;
drop policy if exists "staff_availability_delete" on public.staff_availability;

create policy "staff_availability_select" on public.staff_availability
  for select to authenticated
  using (true);

create policy "staff_availability_insert" on public.staff_availability
  for insert to authenticated
  with check (staff_id = (select auth.uid()) or app_private.is_admin());

create policy "staff_availability_update" on public.staff_availability
  for update to authenticated
  using (staff_id = (select auth.uid()) or app_private.is_admin())
  with check (staff_id = (select auth.uid()) or app_private.is_admin());

create policy "staff_availability_delete" on public.staff_availability
  for delete to authenticated
  using (staff_id = (select auth.uid()) or app_private.is_admin());

-- medical_history -------------------------------------------------------------
drop policy if exists "medical_history_select"        on public.medical_history;
drop policy if exists "medical_history_insert"        on public.medical_history;
drop policy if exists "medical_history_update"        on public.medical_history;
drop policy if exists "medical_history_delete_admin"  on public.medical_history;

create policy "medical_history_select" on public.medical_history
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or app_private.is_dispensary_staff()
    or app_private.is_admin()
    or (app_private.is_hod() and app_private.student_department(student_id) = app_private.hod_department())
  );

create policy "medical_history_insert" on public.medical_history
  for insert to authenticated
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "medical_history_update" on public.medical_history
  for update to authenticated
  using (app_private.is_dispensary_staff() or app_private.is_admin())
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "medical_history_delete_admin" on public.medical_history
  for delete to authenticated
  using (app_private.is_admin());

-- appointments ----------------------------------------------------------------
drop policy if exists "appointments_select"        on public.appointments;
drop policy if exists "appointments_insert"        on public.appointments;
drop policy if exists "appointments_update"        on public.appointments;
drop policy if exists "appointments_delete_admin"  on public.appointments;

create policy "appointments_select" on public.appointments
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or doctor_id = (select auth.uid())
    or app_private.is_admin()
    or (app_private.is_hod() and app_private.student_department(student_id) = app_private.hod_department())
  );

create policy "appointments_insert" on public.appointments
  for insert to authenticated
  with check (
    student_id = (select auth.uid()) or app_private.is_dispensary_staff() or app_private.is_admin()
  );

create policy "appointments_update" on public.appointments
  for update to authenticated
  using (student_id = (select auth.uid()) or doctor_id = (select auth.uid()) or app_private.is_admin())
  with check (student_id = (select auth.uid()) or doctor_id = (select auth.uid()) or app_private.is_admin());

create policy "appointments_delete_admin" on public.appointments
  for delete to authenticated
  using (app_private.is_admin());

-- leave_requests --------------------------------------------------------------
drop policy if exists "leave_requests_select"  on public.leave_requests;
drop policy if exists "leave_requests_insert"  on public.leave_requests;
drop policy if exists "leave_requests_update"  on public.leave_requests;
drop policy if exists "leave_requests_delete"  on public.leave_requests;

create policy "leave_requests_select" on public.leave_requests
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or decided_by = (select auth.uid())
    or app_private.is_admin()
    or (app_private.is_hod() and app_private.student_department(student_id) = app_private.hod_department())
  );

create policy "leave_requests_insert" on public.leave_requests
  for insert to authenticated
  with check (
    (student_id = (select auth.uid()) and decided_by is null and status = 'pending')
    or app_private.is_admin()
  );

create policy "leave_requests_update" on public.leave_requests
  for update to authenticated
  using (app_private.is_faculty() or app_private.is_admin())
  with check (app_private.is_faculty() or app_private.is_admin());

create policy "leave_requests_delete" on public.leave_requests
  for delete to authenticated
  using (
    (student_id = (select auth.uid()) and status = 'pending')
    or app_private.is_admin()
  );

-- prescriptions ---------------------------------------------------------------
drop policy if exists "prescriptions_select"        on public.prescriptions;
drop policy if exists "prescriptions_insert"        on public.prescriptions;
drop policy if exists "prescriptions_update"        on public.prescriptions;
drop policy if exists "prescriptions_delete_admin"  on public.prescriptions;

create policy "prescriptions_select" on public.prescriptions
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or doctor_id = (select auth.uid())
    or app_private.is_admin()
    or (app_private.is_parent() and app_private.parent_of_student(student_id))
    or (app_private.is_hod() and app_private.student_department(student_id) = app_private.hod_department())
  );

create policy "prescriptions_insert" on public.prescriptions
  for insert to authenticated
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "prescriptions_update" on public.prescriptions
  for update to authenticated
  using (doctor_id = (select auth.uid()) or app_private.is_admin())
  with check (doctor_id = (select auth.uid()) or app_private.is_admin());

create policy "prescriptions_delete_admin" on public.prescriptions
  for delete to authenticated
  using (app_private.is_admin());

-- prescription_medications ----------------------------------------------------
drop policy if exists "prescription_medications_select" on public.prescription_medications;
drop policy if exists "prescription_medications_insert" on public.prescription_medications;
drop policy if exists "prescription_medications_update" on public.prescription_medications;
drop policy if exists "prescription_medications_delete" on public.prescription_medications;

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
        and (p.doctor_id = (select auth.uid()) or app_private.is_dispensary_staff() or app_private.is_admin())
    )
  );

create policy "prescription_medications_update" on public.prescription_medications
  for update to authenticated
  using (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_medications.prescription_id
      and (p.doctor_id = (select auth.uid()) or app_private.is_admin())
  ))
  with check (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_medications.prescription_id
      and (p.doctor_id = (select auth.uid()) or app_private.is_admin())
  ));

create policy "prescription_medications_delete" on public.prescription_medications
  for delete to authenticated
  using (exists (
    select 1 from public.prescriptions p
    where p.id = prescription_medications.prescription_id
      and (p.doctor_id = (select auth.uid()) or app_private.is_admin())
  ));

-- inventory_items -------------------------------------------------------------
drop policy if exists "inventory_items_select"        on public.inventory_items;
drop policy if exists "inventory_items_insert"        on public.inventory_items;
drop policy if exists "inventory_items_update"        on public.inventory_items;
drop policy if exists "inventory_items_delete_admin"  on public.inventory_items;

create policy "inventory_items_select" on public.inventory_items
  for select to authenticated
  using (true);

create policy "inventory_items_insert" on public.inventory_items
  for insert to authenticated
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "inventory_items_update" on public.inventory_items
  for update to authenticated
  using (app_private.is_dispensary_staff() or app_private.is_admin())
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "inventory_items_delete_admin" on public.inventory_items
  for delete to authenticated
  using (app_private.is_admin());

-- ambulances ------------------------------------------------------------------
drop policy if exists "ambulances_select"        on public.ambulances;
drop policy if exists "ambulances_insert_admin"  on public.ambulances;
drop policy if exists "ambulances_update"        on public.ambulances;
drop policy if exists "ambulances_delete_admin"  on public.ambulances;

create policy "ambulances_select" on public.ambulances
  for select to authenticated
  using (true);

create policy "ambulances_insert_admin" on public.ambulances
  for insert to authenticated
  with check (app_private.is_admin());

create policy "ambulances_update" on public.ambulances
  for update to authenticated
  using (app_private.is_dispensary_staff() or app_private.is_admin())
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "ambulances_delete_admin" on public.ambulances
  for delete to authenticated
  using (app_private.is_admin());

-- ambulance_equipment ---------------------------------------------------------
drop policy if exists "ambulance_equipment_select"        on public.ambulance_equipment;
drop policy if exists "ambulance_equipment_insert"        on public.ambulance_equipment;
drop policy if exists "ambulance_equipment_update"        on public.ambulance_equipment;
drop policy if exists "ambulance_equipment_delete_admin"  on public.ambulance_equipment;

create policy "ambulance_equipment_select" on public.ambulance_equipment
  for select to authenticated
  using (true);

create policy "ambulance_equipment_insert" on public.ambulance_equipment
  for insert to authenticated
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "ambulance_equipment_update" on public.ambulance_equipment
  for update to authenticated
  using (app_private.is_dispensary_staff() or app_private.is_admin())
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "ambulance_equipment_delete_admin" on public.ambulance_equipment
  for delete to authenticated
  using (app_private.is_admin());

-- ambulance_maintenance_issues ------------------------------------------------
drop policy if exists "ambulance_maintenance_issues_select"        on public.ambulance_maintenance_issues;
drop policy if exists "ambulance_maintenance_issues_insert"        on public.ambulance_maintenance_issues;
drop policy if exists "ambulance_maintenance_issues_update"        on public.ambulance_maintenance_issues;
drop policy if exists "ambulance_maintenance_issues_delete_admin"  on public.ambulance_maintenance_issues;

create policy "ambulance_maintenance_issues_select" on public.ambulance_maintenance_issues
  for select to authenticated
  using (true);

create policy "ambulance_maintenance_issues_insert" on public.ambulance_maintenance_issues
  for insert to authenticated
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "ambulance_maintenance_issues_update" on public.ambulance_maintenance_issues
  for update to authenticated
  using (app_private.is_dispensary_staff() or app_private.is_admin())
  with check (app_private.is_dispensary_staff() or app_private.is_admin());

create policy "ambulance_maintenance_issues_delete_admin" on public.ambulance_maintenance_issues
  for delete to authenticated
  using (app_private.is_admin());

-- ambulance_trips -------------------------------------------------------------
drop policy if exists "ambulance_trips_select"        on public.ambulance_trips;
drop policy if exists "ambulance_trips_insert"        on public.ambulance_trips;
drop policy if exists "ambulance_trips_update"        on public.ambulance_trips;
drop policy if exists "ambulance_trips_delete_admin"  on public.ambulance_trips;

create policy "ambulance_trips_select" on public.ambulance_trips
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or driver_id = (select auth.uid())
    or created_by = (select auth.uid())
    or app_private.is_dispensary_staff()
    or app_private.is_admin()
  );

create policy "ambulance_trips_insert" on public.ambulance_trips
  for insert to authenticated
  with check (
    (app_private.is_dispensary_staff() or app_private.is_admin())
    and created_by = (select auth.uid())
  );

create policy "ambulance_trips_update" on public.ambulance_trips
  for update to authenticated
  using (driver_id = (select auth.uid()) or app_private.is_dispensary_staff() or app_private.is_admin())
  with check (driver_id = (select auth.uid()) or app_private.is_dispensary_staff() or app_private.is_admin());

create policy "ambulance_trips_delete_admin" on public.ambulance_trips
  for delete to authenticated
  using (app_private.is_admin());

-- ambulance_trip_status_log (append-only) -------------------------------------
drop policy if exists "ambulance_trip_status_log_select" on public.ambulance_trip_status_log;
drop policy if exists "ambulance_trip_status_log_insert" on public.ambulance_trip_status_log;

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
        and (t.driver_id = (select auth.uid()) or app_private.is_dispensary_staff() or app_private.is_admin())
    )
  );

-- leave_decisions (append-only) -----------------------------------------------
drop policy if exists "leave_decisions_select" on public.leave_decisions;
drop policy if exists "leave_decisions_insert" on public.leave_decisions;

create policy "leave_decisions_select" on public.leave_decisions
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or decider_id = (select auth.uid())
    or app_private.is_admin()
    or (app_private.is_hod() and student_department = app_private.hod_department())
  );

create policy "leave_decisions_insert" on public.leave_decisions
  for insert to authenticated
  with check (app_private.is_faculty() or app_private.is_admin());

-- login_logs (append-only) ----------------------------------------------------
drop policy if exists "login_logs_select"        on public.login_logs;
drop policy if exists "login_logs_insert_admin"  on public.login_logs;

create policy "login_logs_select" on public.login_logs
  for select to authenticated
  using (user_id = (select auth.uid()) or app_private.is_admin());

create policy "login_logs_insert_admin" on public.login_logs
  for insert to authenticated
  with check (app_private.is_admin());
