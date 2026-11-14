-- Black Friday 2026 card promotions, verified on 2026-11-13 on each bank's own
-- page (terms_url). Credit cards only. Needs migration 032 (card_promotions.kind).
-- Almost all are cashback: the bank credits the money 20-45 days later, so the
-- site shows "te devuelven RD$X", never a lower checkout price.
-- Safe to re-run: a row with the same store, bank, start date, % and kind is skipped.
begin;

-- Rows loaded on 2026-10-29 that are really refunds ("reembolso", statement
-- credit) become cashback. Corripio/BHD Mi País (3% at the register + 3% at
-- the statement) stays a discount.
update card_promotions set kind = 'cashback'
where kind = 'discount' and (note ilike '%reembolso%' or note ilike '%estado de cuenta%');

insert into card_promotions (retailer_id, kind, bank, card, percent, max_discount, min_purchase, weekdays, starts_on, ends_on, terms_url, note)
select r.id, v.kind, v.bank, v.card, v.percent, v.max_discount, v.min_purchase, v.weekdays::smallint[], v.starts_on::date, v.ends_on::date, v.terms_url, v.note
from (values
  -- The one instant discount: 15% at the register, Mondays Nov 16 and 23.
  ('sirena',     'discount', 'BHD',         'Visa crédito',  15, null::numeric, 0::numeric, '{1}', '2026-11-16', '2026-11-23',
   'https://www.bhd.com.do/homepage-personal/otros-servicios/products/259',
   'en caja, solo en tienda; las categorías cambian cada lunes, ver BHD'),

  -- Banco Santa Cruz: credit cards + Cuotas Santa Cruz.
  ('jumbo',      'cashback', 'Santa Cruz',  'crédito',       15, 6000, 5000, null, '2026-11-13', '2026-11-15',
   'https://www.bsc.com.do/promociones', 'excluye Multicrédito, tarjetas de supermercado y Visa Empresarial'),
  ('corripio',   'cashback', 'Santa Cruz',  'crédito',       20, 7500, 10000, null, '2026-11-19', '2026-11-22',
   'https://www.bsc.com.do/promociones', 'excluye tarjetas PriceSmart'),
  ('cecomsa',    'cashback', 'Santa Cruz',  'crédito',       15, 5000, 5000, null, '2026-11-19', '2026-11-21',
   'https://www.bsc.com.do/promociones', null),
  ('plaza-lama', 'cashback', 'Santa Cruz',  'crédito',       20, 6000, 6000, null, '2026-11-23', '2026-11-25',
   'https://www.bsc.com.do/promociones', 'tope según el banco: RD$6,000 (otra parte dice RD$7,500)'),
  ('pricesmart', 'cashback', 'Santa Cruz',  'crédito',       10, 3500, 10000, null, '2026-11-28', '2026-11-29',
   'https://www.bsc.com.do/promociones', null),

  -- BHD "Feria Black Friday": spend accumulated across the participating stores.
  -- Clásica figures; Gold/Platinum/Infinite have higher minimums and caps (up to RD$12,000).
  ('sirena',     'cashback', 'BHD',         'crédito',       20, 4000, 15000, null, '2026-11-23', '2026-11-29',
   'https://www.bhd.com.do/homepage-personal/otros-servicios/products/259/product-detail/923',
   'acumulado; montos de Clásica, mayores en Gold/Platinum/Infinite; sin supermercado ni cuotas sin intereses'),
  ('jumbo',      'cashback', 'BHD',         'crédito',       20, 4000, 15000, null, '2026-11-23', '2026-11-29',
   'https://www.bhd.com.do/homepage-personal/otros-servicios/products/259/product-detail/923',
   'acumulado; montos de Clásica, mayores en Gold/Platinum/Infinite; sin supermercado ni cuotas sin intereses'),
  ('plaza-lama', 'cashback', 'BHD',         'crédito',       20, 4000, 15000, null, '2026-11-23', '2026-11-29',
   'https://www.bhd.com.do/homepage-personal/otros-servicios/products/259/product-detail/923',
   'acumulado; montos de Clásica, mayores en Gold/Platinum/Infinite; sin supermercado ni cuotas sin intereses'),
  ('corripio',   'cashback', 'BHD',         'crédito',       20, 4000, 15000, null, '2026-11-23', '2026-11-29',
   'https://www.bhd.com.do/homepage-personal/otros-servicios/products/259/product-detail/923',
   'acumulado; montos de Clásica, mayores en Gold/Platinum/Infinite; sin supermercado ni cuotas sin intereses'),
  ('electrodom', 'cashback', 'BHD',         'crédito',       20, 4000, 15000, null, '2026-11-23', '2026-11-29',
   'https://www.bhd.com.do/homepage-personal/otros-servicios/products/259/product-detail/923',
   'acumulado; montos de Clásica, mayores en Gold/Platinum/Infinite; sin cuotas sin intereses'),

  -- Asociación Cibao: credit cards + Ultracrédito.
  ('sirena',     'cashback', 'Cibao',       'crédito',       25, 8000, 5000, null, '2026-11-24', '2026-11-26',
   'https://www.cibao.com.do/banca-personal/ofertas-y-promociones/ofertas-de-noviembre-2026/', 'compra mínima por transacción; no aplica Ci+'),
  -- "Black Friday Nacional": RD$10,000 accumulated.
  ('pricesmart', 'cashback', 'Cibao',       'crédito',       20, 8000, 10000, null, '2026-11-27', '2026-11-28',
   'https://www.cibao.com.do/banca-personal/ofertas-y-promociones/ofertas-de-noviembre-2026/', 'acumulado; Ultracrédito no aplica en línea'),
  ('sirena',     'cashback', 'Cibao',       'crédito',       20, 8000, 10000, null, '2026-11-27', '2026-11-28',
   'https://www.cibao.com.do/banca-personal/ofertas-y-promociones/ofertas-de-noviembre-2026/', 'acumulado; no aplica Ci+; Ultracrédito no aplica en línea'),
  ('plaza-lama', 'cashback', 'Cibao',       'crédito',       20, 8000, 10000, null, '2026-11-27', '2026-11-28',
   'https://www.cibao.com.do/banca-personal/ofertas-y-promociones/ofertas-de-noviembre-2026/', 'acumulado; no aplica Ci+; Ultracrédito no aplica en línea'),
  ('corripio',   'cashback', 'Cibao',       'crédito',       20, 8000, 10000, null, '2026-11-27', '2026-11-28',
   'https://www.cibao.com.do/banca-personal/ofertas-y-promociones/ofertas-de-noviembre-2026/', 'acumulado; Ultracrédito no aplica en línea'),
  ('jumbo',      'cashback', 'Cibao',       'crédito',       20, 8000, 10000, null, '2026-11-27', '2026-11-28',
   'https://www.cibao.com.do/banca-personal/ofertas-y-promociones/ofertas-de-noviembre-2026/', 'acumulado; no aplica Ci+; Ultracrédito no aplica en línea'),

  ('sirena',     'cashback', 'Banesco',     'crédito',       25, 8000, 5000, null, '2026-11-24', '2026-11-26',
   'https://www.banesco.com.do/promociones/promos-noviembre/', 'acumulado'),

  -- Scotiabank.
  ('jumbo',      'cashback', 'Scotiabank',  'Amex crédito',  15, 3000, 5000, null, '2026-11-27', '2026-11-29',
   'https://do.scotiabank.com/banca-personal/promociones/post.black-friday-de-jumbo-nov26.html', 'Amex personal; no aplica Amex Carrefour'),
  ('cecomsa',    'cashback', 'Scotiabank',  'crédito',       15, 5000, 3000, null, '2026-11-23', '2026-11-25',
   'https://do.scotiabank.com/banca-personal/promociones/post.black-friday-cecomsa-nov26.html', 'Visa, Mastercard y Amex personales; no aplica Visa Bravo, Amex Carrefour ni Suma CCN')
) as v(slug, kind, bank, card, percent, max_discount, min_purchase, weekdays, starts_on, ends_on, terms_url, note)
join retailers r on r.slug = v.slug
where not exists (
  select 1 from card_promotions p
  where p.retailer_id = r.id and p.bank = v.bank and p.starts_on = v.starts_on::date
    and p.percent = v.percent and p.kind = v.kind
);

select r.name, p.kind, p.bank, p.card, p.percent, p.max_discount, p.min_purchase, p.starts_on, p.ends_on
from card_promotions p join retailers r on r.id = p.retailer_id
order by p.starts_on, r.name, p.bank;

commit;
