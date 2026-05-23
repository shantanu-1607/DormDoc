-- Phase 1.3 — Block 2: profiles + role tables
-- profiles is 1:1 with auth.users. Role tables FK to profiles(id).
-- RLS enabled default-deny; policies land in Phase 1.4.

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            user_role not null default 'student',
  name            text not null,
  email           citext not null unique,
  phone           text,
  photo_url       text,
  is_active       boolean not null default true,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
create trigger trg_profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.students (
  id                       uuid primary key references public.profiles(id) on delete cascade,
  student_id               text not null unique,
  roll_number              text unique,
  dob                      date,
  gender                   gender,
  department               text not null,
  year                     student_year not null,
  section                  text,
  programme                programme default 'B.Tech',
  batch                    text,
  hostel                   text,
  room_number              text,
  blood_group              blood_group,
  allergies                text[] not null default '{}',
  current_medications      text[] not null default '{}',
  chronic_conditions       text[] not null default '{}',
  disabilities             text not null default '',
  emergency_contact        jsonb not null default '{}'::jsonb,
  qr_code                  text unique,
  is_currently_admitted    boolean not null default false,
  insurance_id             text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index students_dept_year_idx on public.students(department, year);
create index students_hostel_idx    on public.students(hostel);
create index students_blood_idx     on public.students(blood_group);
create trigger trg_students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

create table public.faculty (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  faculty_id          text not null unique,
  dob                 date,
  gender              gender,
  department          text not null,
  designation         designation not null,
  specialization      text[] not null default '{}',
  qualification       text[] not null default '{}',
  joining_date        date,
  employee_type       employee_type not null default 'permanent',
  cabin_number        text,
  campus_address      text,
  blood_group         blood_group,
  allergies           text[] not null default '{}',
  chronic_conditions  text[] not null default '{}',
  emergency_contact   jsonb not null default '{}'::jsonb,
  hod_department      text,
  hod_since           date,
  hod_permissions     jsonb not null default jsonb_build_object(
                        'can_approve_leave', true,
                        'can_view_medical_history', true,
                        'can_export_reports', true
                      ),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index faculty_dept_idx        on public.faculty(department);
create index faculty_designation_idx on public.faculty(designation);
create trigger trg_faculty_set_updated_at
  before update on public.faculty
  for each row execute function public.set_updated_at();

create table public.parents (
  id                    uuid primary key references public.profiles(id) on delete cascade,
  parent_id             text not null unique,
  alternate_phone       text,
  dob                   date,
  gender                gender,
  occupation            text,
  address               jsonb not null default '{}'::jsonb,
  relation_to_student   relation_to_student not null,
  notifications         jsonb not null default jsonb_build_object(
                          'sms_enabled', true,
                          'email_enabled', true,
                          'emergency_alerts', true,
                          'appointment_updates', true,
                          'prescription_alerts', true
                        ),
  is_verified           boolean not null default false,
  verified_at           timestamptz,
  verified_by           uuid,  -- FK added after dispensary_staff exists (below)
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_parents_set_updated_at
  before update on public.parents
  for each row execute function public.set_updated_at();

create table public.dispensary_staff (
  id                          uuid primary key references public.profiles(id) on delete cascade,
  staff_id                    text not null unique,
  staff_type                  staff_type not null,
  designation                 text not null,
  license_number              text unique,
  qualification               text[] not null default '{}',
  specialization              text,
  experience                  int not null default 0,
  joining_date                date,
  shift                       staff_shift not null default 'morning',
  shift_start                 time not null default '09:00',
  shift_end                   time not null default '17:00',
  is_on_duty                  boolean not null default false,
  total_consultations         int not null default 0,
  current_queue_number        int not null default 0,
  max_patients_per_day        int not null default 30,
  average_consultation_time   int not null default 15,
  rating                      numeric(2,1) not null default 0 check (rating between 0 and 5),
  blood_group                 blood_group,
  emergency_contact           jsonb not null default '{}'::jsonb,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index dispensary_staff_type_idx     on public.dispensary_staff(staff_type);
create index dispensary_staff_on_duty_idx  on public.dispensary_staff(is_on_duty);
create trigger trg_dispensary_staff_set_updated_at
  before update on public.dispensary_staff
  for each row execute function public.set_updated_at();

-- Now that dispensary_staff exists, add the deferred FK on parents.verified_by.
alter table public.parents
  add constraint parents_verified_by_fkey
  foreign key (verified_by) references public.dispensary_staff(id) on delete set null;

create table public.parent_student_links (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.parents(id)  on delete cascade,
  student_id   uuid not null references public.students(id) on delete cascade,
  relation     text,
  is_primary   boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (parent_id, student_id)
);
create index parent_student_links_student_idx on public.parent_student_links(student_id);

create table public.staff_availability (
  id             uuid primary key default gen_random_uuid(),
  staff_id       uuid not null references public.dispensary_staff(id) on delete cascade,
  day_of_week    day_of_week not null,
  is_available   boolean not null default true,
  start_time     time not null default '09:00',
  end_time       time not null default '17:00',
  unique (staff_id, day_of_week)
);

create table public.medical_history (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  condition    text not null,
  diagnosis    text,
  doctor       text,
  notes        text,
  occurred_on  date,
  created_at   timestamptz not null default now()
);
create index medical_history_student_idx on public.medical_history(student_id, occurred_on desc);

-- Enable RLS default-deny on every table created in this block.
-- Policies land in Phase 1.4.
alter table public.profiles             enable row level security;
alter table public.students             enable row level security;
alter table public.faculty              enable row level security;
alter table public.parents              enable row level security;
alter table public.dispensary_staff     enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.staff_availability   enable row level security;
alter table public.medical_history      enable row level security;

-- Auth bridge: new auth.users -> profiles row with default role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
