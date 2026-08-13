-- CouponsManager's "Applies to" section has been sending these columns since
-- it was built, but the table never got them — every coupon save has been
-- failing with "Could not find the 'applies_to' column of 'coupons'".

alter table coupons
  add column if not exists applies_to text not null default 'all'
    check (applies_to in ('all', 'products', 'categories')),
  add column if not exists product_ids uuid[] not null default '{}',
  add column if not exists category_ids uuid[] not null default '{}';
