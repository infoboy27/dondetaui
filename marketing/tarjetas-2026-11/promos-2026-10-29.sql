-- Card promotions verified on 2026-10-29 (sources in terms_url).
-- Standing co-branded benefits have no published end date: they end on
-- 2026-11-30 so they are re-checked at the end of the month.
-- Safe to re-run: a row with the same store, bank and start date is skipped.
begin;

insert into card_promotions (retailer_id, bank, card, percent, max_discount, min_purchase, weekdays, starts_on, ends_on, terms_url, note)
select r.id, v.bank, v.card, v.percent, v.max_discount, v.min_purchase, null, v.starts_on::date, v.ends_on::date, v.terms_url, v.note
from (values
  ('jumbo',      'Banco Caribe', null,              25, 12000, 4000, '2026-10-30', '2026-11-03', 'https://jumbo.com.do/promo-banco-caribe',
   'solo crédito; reembolso'),
  ('sirena',     'APAP',         'Visa Sirena',      7, 10000,    0, '2026-10-29', '2026-11-30', 'https://apap.com.do/?p=9059',
   'reembolso'),
  ('corripio',   'BHD',          'Visa Mi País',     6,  2000,    0, '2026-10-29', '2026-11-30', 'https://bhd.com.do/homepage-personal/tarjetas/cards/482058e5-2e50-405b-bf50-e06fe9ef9ab0',
   '3% en caja + 3% al corte'),
  ('jumbo',      'Scotiabank',   'Suma CCN Amex',    5,  null,    0, '2026-10-29', '2026-11-30', 'https://jumbo.com.do/promo-banco-scotiabank',
   'al estado de cuenta'),
  ('pricesmart', 'Santa Cruz',   'Visa PriceSmart',  6,  null,    0, '2026-10-29', '2026-11-30', 'https://eldinero.com.do/?p=343071',
   'SmartCash (reembolso)')
) as v(slug, bank, card, percent, max_discount, min_purchase, starts_on, ends_on, terms_url, note)
join retailers r on r.slug = v.slug
where not exists (
  select 1 from card_promotions p
  where p.retailer_id = r.id and p.bank = v.bank and p.starts_on = v.starts_on::date
);

select r.name, p.bank, p.card, p.percent, p.max_discount, p.starts_on, p.ends_on
from card_promotions p join retailers r on r.id = p.retailer_id
order by r.name, p.bank;

commit;
