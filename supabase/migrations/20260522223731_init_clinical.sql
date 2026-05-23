-- Phase 1.3 — Block 3: clinical (appointments, leave_requests, prescriptions)
-- All FKs documented in docs/enums-and-fks.md.

create table public.appointments (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.students(id)         on delete restrict,
  doctor_id             uuid not null references public.dispensary_staff(id) on delete restrict,
  appointment_date      date not null,
  appointment_time      time not null,
  status                appointment_status not null default 'scheduled',
  symptoms              text not null,
  priority              int not null default 5 check (priority between 1 and 10),
  queue_number          int not null,
  estimated_wait_time   int not null default 0,
  actual_wait_time      int not null default 0,
  consultation_notes    text not null default '',
  diagnosis             text not null default '',
  treatment             text not null default '',
  is_emergency          boolean not null default false,
  emergency_reason      text not null default '',
  check_in_time         timestamptz,
  check_out_time        timestamptz,
  follow_up_required    boolean not null default false,
  follow_up_date        date,
  feedback_rating       int check (feedback_rating between 1 and 5),
  feedback_comments     text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index appointments_student_date_idx   on public.appointments(student_id, appointment_date);
create index appointments_doctor_date_idx    on public.appointments(doctor_id, appointment_date);
create index appointments_status_date_idx    on public.appointments(status, appointment_date);
create index appointments_priority_date_idx  on public.appointments(priority desc, appointment_date);
create trigger trg_appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

create table public.leave_requests (
  id                   uuid primary key default gen_random_uuid(),
  appointment_id       uuid not null unique references public.appointments(id) on delete cascade,
  student_id           uuid not null references public.students(id)            on delete restrict,
  duration_days        int not null check (duration_days > 0),
  reason               text not null,
  status               leave_request_status not null default 'pending',
  decided_by           uuid references public.faculty(id) on delete set null,
  decided_by_name      text not null default '',
  decided_at           timestamptz,
  decision_role        text not null default '',
  decision_comments    text not null default '',
  hod_reviewed_at      timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index leave_requests_student_status_idx on public.leave_requests(student_id, status);
create index leave_requests_status_created_idx on public.leave_requests(status, created_at desc);
create trigger trg_leave_requests_set_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

create table public.prescriptions (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.students(id)         on delete restrict,
  doctor_id         uuid          references public.dispensary_staff(id) on delete set null,
  doctor_name       text not null,
  date              date not null,
  notes             text not null default '',
  file_url          text,
  status            prescription_status not null default 'pending',
  appointment_id    uuid references public.appointments(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index prescriptions_student_created_idx on public.prescriptions(student_id, created_at desc);
create index prescriptions_doctor_created_idx  on public.prescriptions(doctor_id, created_at desc);
create index prescriptions_status_idx          on public.prescriptions(status);
create trigger trg_prescriptions_set_updated_at
  before update on public.prescriptions
  for each row execute function public.set_updated_at();

create table public.prescription_medications (
  id                uuid primary key default gen_random_uuid(),
  prescription_id   uuid not null references public.prescriptions(id) on delete cascade,
  name              text not null,
  dosage            text not null,
  frequency         text not null,
  duration          text not null,
  instructions      text not null default '',
  position          int  not null default 0
);
create index prescription_medications_rx_idx on public.prescription_medications(prescription_id, position);

alter table public.appointments              enable row level security;
alter table public.leave_requests            enable row level security;
alter table public.prescriptions             enable row level security;
alter table public.prescription_medications  enable row level security;
