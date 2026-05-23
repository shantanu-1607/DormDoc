-- Phase 1.3 — Block 5: ambulance + trips
-- currentAssignment subdoc dropped — derive from latest active row in ambulance_trips.
-- Geo: plain numeric lat/lng for now. PostGIS deferred.

create table public.ambulances (
  id                       uuid primary key default gen_random_uuid(),
  vehicle_number           text not null unique,
  driver_name              text not null,
  driver_phone             text not null,
  driver_license           text not null unique,
  capacity                 int not null check (capacity between 1 and 4),
  status                   ambulance_status not null default 'available',
  latitude                 numeric(9,6) not null,
  longitude                numeric(9,6) not null,
  address                  text not null,
  last_service_at          timestamptz not null default now(),
  next_service_at          timestamptz not null,
  mileage                  int not null default 0 check (mileage >= 0),
  total_trips              int not null default 0,
  average_response_time    int not null default 0,
  rating                   numeric(2,1) not null default 0 check (rating between 0 and 5),
  total_rating             int not null default 0,
  rating_count             int not null default 0,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index ambulances_status_idx  on public.ambulances(status);
create index ambulances_lat_lng_idx on public.ambulances(latitude, longitude);
create trigger trg_ambulances_set_updated_at
  before update on public.ambulances
  for each row execute function public.set_updated_at();

create table public.ambulance_equipment (
  id                uuid primary key default gen_random_uuid(),
  ambulance_id      uuid not null references public.ambulances(id) on delete cascade,
  name              text not null,
  status            equipment_status not null default 'available',
  last_checked_at   timestamptz not null default now()
);
create index ambulance_equipment_ambulance_idx on public.ambulance_equipment(ambulance_id);

create table public.ambulance_maintenance_issues (
  id              uuid primary key default gen_random_uuid(),
  ambulance_id    uuid not null references public.ambulances(id) on delete cascade,
  description     text not null,
  severity        issue_severity not null default 'low',
  reported_at     timestamptz not null default now(),
  resolved        boolean not null default false,
  resolved_at     timestamptz
);
create index ambulance_issues_ambulance_idx on public.ambulance_maintenance_issues(ambulance_id, resolved);

create table public.ambulance_trips (
  id                  uuid primary key default gen_random_uuid(),
  patient_name        text not null,
  patient_phone       text not null,
  student_id          uuid references public.students(id)   on delete set null,
  pickup_location     text not null,
  destination         text not null,
  emergency_type      emergency_type not null default 'medical',
  priority            trip_priority  not null default 'medium',
  ambulance_id        uuid not null references public.ambulances(id) on delete restrict,
  driver_id           uuid references public.profiles(id)   on delete set null,
  status              ambulance_trip_status not null default 'pending',
  current_latitude    numeric(9,6),
  current_longitude   numeric(9,6),
  current_address     text not null default '',
  estimated_time      int,
  actual_duration     int,
  notes               text not null default '',
  completion_notes    text not null default '',
  created_by          uuid not null references public.profiles(id) on delete restrict,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index ambulance_trips_status_idx       on public.ambulance_trips(status);
create index ambulance_trips_priority_idx     on public.ambulance_trips(priority);
create index ambulance_trips_ambulance_idx    on public.ambulance_trips(ambulance_id);
create index ambulance_trips_created_idx      on public.ambulance_trips(created_at desc);
create index ambulance_trips_completed_idx    on public.ambulance_trips(completed_at desc);
create trigger trg_ambulance_trips_set_updated_at
  before update on public.ambulance_trips
  for each row execute function public.set_updated_at();

create table public.ambulance_trip_status_log (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.ambulance_trips(id) on delete cascade,
  status        ambulance_trip_status not null,
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  address       text,
  updated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index ambulance_trip_status_log_trip_idx on public.ambulance_trip_status_log(trip_id, created_at);

alter table public.ambulances                    enable row level security;
alter table public.ambulance_equipment           enable row level security;
alter table public.ambulance_maintenance_issues  enable row level security;
alter table public.ambulance_trips               enable row level security;
alter table public.ambulance_trip_status_log     enable row level security;
