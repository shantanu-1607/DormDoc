-- Phase 1.3 — Block 1: extensions + enum types
-- All enums in dependency-free order. Safe to apply first.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type user_role as enum (
  'student', 'doctor', 'hod', 'admin', 'parent', 'dispensary_staff', 'faculty'
);

create type gender as enum ('male', 'female', 'other');

create type blood_group as enum (
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
);

create type student_year as enum ('1st', '2nd', '3rd', '4th', '5th');

create type programme as enum (
  'B.Tech', 'M.Tech', 'MCA', 'MBA', 'B.Pharm', 'M.Pharm', 'Ph.D'
);

create type designation as enum (
  'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer',
  'HOD', 'Dean', 'Registrar', 'Director'
);

create type employee_type as enum ('permanent', 'contractual', 'visiting');

create type relation_to_student as enum (
  'father', 'mother', 'guardian', 'uncle', 'aunt', 'sibling', 'other'
);

create type staff_type as enum (
  'medical_officer', 'nurse', 'pharmacist', 'lab_technician',
  'admin_staff', 'ambulance_driver', 'counsellor'
);

create type staff_shift as enum ('morning', 'evening', 'night', 'rotating');

create type day_of_week as enum (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

create type prescription_status as enum (
  'pending', 'active', 'completed', 'expired', 'cancelled'
);

create type appointment_status as enum (
  'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);

create type leave_request_status as enum ('pending', 'approved', 'rejected');

create type leave_decision_action as enum ('approved', 'rejected');

create type inventory_category as enum (
  'medication', 'supplies', 'equipment', 'consumables'
);

create type ambulance_status as enum (
  'available', 'in_use', 'maintenance', 'out_of_service'
);

create type equipment_status as enum ('available', 'in_use', 'maintenance');

create type issue_severity as enum ('low', 'medium', 'high', 'critical');

create type emergency_type as enum (
  'medical', 'accident', 'cardiac', 'respiratory', 'trauma', 'other'
);

create type trip_priority as enum ('high', 'medium', 'low');

create type ambulance_trip_status as enum (
  'pending', 'dispatched', 'en_route', 'arrived', 'completed', 'cancelled'
);

create type login_action as enum (
  'login', 'logout', 'register', 'password_reset', 'password_change',
  'otp_request', 'otp_verify', 'profile_update', 'account_lock', 'account_unlock'
);

create type login_status as enum ('success', 'failed', 'pending');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
