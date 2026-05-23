-- Phase 1.3 — Block 4: inventory
-- Single table. stock_status virtual fields stay app-side (or future VIEW).

create table public.inventory_items (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        inventory_category not null,
  description     text not null default '',
  current_stock   int not null check (current_stock >= 0),
  minimum_stock   int not null check (minimum_stock >= 0),
  maximum_stock   int not null check (maximum_stock >= 0),
  unit_price      numeric(10,2) not null default 0 check (unit_price >= 0),
  supplier        text not null default '',
  expiry_date     date,
  batch_number    text not null default '',
  added_by        uuid not null references public.profiles(id) on delete restrict,
  updated_by      uuid          references public.profiles(id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index inventory_items_name_idx     on public.inventory_items(name);
create index inventory_items_category_idx on public.inventory_items(category);
create index inventory_items_stock_idx    on public.inventory_items(current_stock);
create index inventory_items_expiry_idx   on public.inventory_items(expiry_date);
create trigger trg_inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

alter table public.inventory_items enable row level security;
