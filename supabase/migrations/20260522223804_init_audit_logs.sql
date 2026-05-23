-- Phase 1.3 — Block 6: append-only audit logs
-- leave_decisions and login_logs are insert-only. UPDATE/DELETE blocked by RLS in 1.4.
-- No updated_at column on either — append-only.

create table public.leave_decisions (
  id                    uuid primary key default gen_random_uuid(),
  leave_request_id      uuid not null references public.leave_requests(id) on delete restrict,
  -- Denormalized identifiers (no FK) so audit survives subject/decider deletion.
  student_id            uuid not null,
  student_name          text not null,
  student_department    text not null,
  decider_id            uuid not null,
  decider_name          text not null,
  decider_role          text not null,
  action                leave_decision_action not null,
  comments              text not null default '',
  decided_at            timestamptz not null default now(),
  leave_snapshot        jsonb not null,
  ip_address            text not null default '',
  user_agent            text not null default '',
  created_at            timestamptz not null default now()
);
create index leave_decisions_dept_decided_idx    on public.leave_decisions(student_department, decided_at desc);
create index leave_decisions_request_decided_idx on public.leave_decisions(leave_request_id, decided_at desc);

create table public.login_logs (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references public.profiles(id) on delete set null,
  email                 text not null,
  action                login_action not null,
  ip_address            inet not null,
  user_agent            text not null,
  status                login_status not null,
  reason                text,
  location_country      text,
  location_region       text,
  location_city         text,
  location_timezone     text,
  device_type           text,
  device_browser        text,
  device_os             text,
  session_id            text,
  additional_data       jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);
create index login_logs_user_created_idx    on public.login_logs(user_id, created_at desc);
create index login_logs_email_created_idx   on public.login_logs(email, created_at desc);
create index login_logs_ip_created_idx      on public.login_logs(ip_address, created_at desc);
create index login_logs_action_created_idx  on public.login_logs(action, created_at desc);
create index login_logs_status_created_idx  on public.login_logs(status, created_at desc);
create index login_logs_created_idx         on public.login_logs(created_at desc);

alter table public.leave_decisions enable row level security;
alter table public.login_logs      enable row level security;
