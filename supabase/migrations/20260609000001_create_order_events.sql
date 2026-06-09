create table order_events (
  id         uuid        default gen_random_uuid() primary key,
  order_id   uuid        not null references orders(id) on delete cascade,
  type       text        not null,  -- 'comment' | 'status_change' | 'note'
  message    text        not null,
  created_at timestamptz default now() not null
);

create index on order_events(order_id, created_at desc);

alter table order_events enable row level security;

create policy "Admins can manage order events"
  on order_events for all
  using (true)
  with check (true);
