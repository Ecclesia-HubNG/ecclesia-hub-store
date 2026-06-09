create table if not exists popup_config (
  id               uuid default gen_random_uuid() primary key,
  is_enabled       boolean default true not null,
  image_url        text,
  pre_headline     text default 'Join the community' not null,
  headline         text default 'UNLOCK 15% OFF' not null,
  body_text        text default 'On your next order. Sign up for exclusive updates, new arrivals & insider-only discounts.' not null,
  button_text      text default 'SUBSCRIBE & SAVE 15%' not null,
  dismiss_text     text default 'No thanks, I''ll pay full price' not null,
  delay_seconds    int default 3 not null,
  suppress_days    int default 14 not null,
  show_on_pages    text[] default '{all}' not null,
  updated_at       timestamptz default now()
);

-- Seed the single config row
insert into popup_config (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict do nothing;

alter table popup_config enable row level security;
create policy "Admins can manage popup config" on popup_config
  for all using (true) with check (true);
