-- Links a product to its Bumpa inventory record so future CSV syncs can match
-- directly instead of guessing by name. Nullable and additive — no effect on
-- existing rows or queries until the Bumpa sync feature populates it.
alter table public.products
  add column if not exists bumpa_id text unique;
