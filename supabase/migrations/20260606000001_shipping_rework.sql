-- New 3-level shipping hierarchy: State → Branch → Location
-- Replaces the old shipping_zones / delivery_types / delivery_zones / delivery_rates approach.

create table if not exists shipping_states (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists shipping_branches (
  id         uuid primary key default gen_random_uuid(),
  state_id   uuid not null references shipping_states(id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique(state_id, name)
);

create table if not exists shipping_locations (
  id         uuid primary key default gen_random_uuid(),
  branch_id  uuid not null references shipping_branches(id) on delete cascade,
  name       text not null,
  price      numeric(10,2) not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique(branch_id, name)
);

-- Row-level security
alter table shipping_states    enable row level security;
alter table shipping_branches  enable row level security;
alter table shipping_locations enable row level security;

-- Public: read active rows (checkout page uses anon key)
create policy "public_read_states"    on shipping_states    for select using (is_active = true);
create policy "public_read_branches"  on shipping_branches  for select using (is_active = true);
create policy "public_read_locations" on shipping_locations for select using (is_active = true);

-- Admin mutations go via the service_role client (createAdminClient) which bypasses RLS entirely.
-- No additional write policies required.
