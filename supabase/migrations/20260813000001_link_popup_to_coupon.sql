-- Popup discount % becomes the single source of truth for the WELCOME15 coupon.
-- discount_value drives both the displayed copy (via the {{discount}} token in
-- headline/button_text) and the linked coupon's real discount_value/is_active,
-- so editing the popup in admin can no longer drift from what checkout honors.

alter table popup_config
  add column if not exists discount_value numeric not null default 15,
  add column if not exists coupon_code text not null default 'WELCOME15';

alter table popup_config
  alter column headline set default E'UNLOCK\n{{discount}}% OFF',
  alter column button_text set default 'SUBSCRIBE & SAVE {{discount}}%';

-- Backfill the existing row: 15% matches what WELCOME15 actually grants today,
-- so this only fixes the copy — no change to what customers receive at checkout.
update popup_config
set discount_value = 15,
    coupon_code = 'WELCOME15',
    headline = E'UNLOCK\n{{discount}}% OFF',
    button_text = 'SUBSCRIBE & SAVE {{discount}}%'
where id = '00000000-0000-0000-0000-000000000001';
