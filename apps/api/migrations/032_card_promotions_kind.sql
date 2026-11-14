-- Most bank promos in DR are cashback (money credited weeks later), not a
-- discount at the register. kind tells clients how to word the deal: a
-- discount lowers the price you pay; cashback is money back afterwards.
alter table card_promotions add column if not exists kind text not null default 'discount'
  check (kind in ('discount', 'cashback'));
