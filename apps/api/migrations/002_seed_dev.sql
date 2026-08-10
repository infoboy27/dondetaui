-- Deterministic local/CI seed data for DóndeTa.
-- This is sample data only; production retailer ingestion will replace it.

insert into categories (id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'Electrodomésticos', 'electrodomesticos'),
  ('10000000-0000-0000-0000-000000000002', 'TV y Audio', 'tv-audio')
on conflict (id) do nothing;

insert into products (
  id, category_id, name, brand, subtitle, image_url, rating, reviews, discount, previous_price
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Samsung 18kg WA18T6360BV',
    'Samsung',
    'Lavadora carga superior',
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=600&fit=crop&auto=format',
    4.60,
    128,
    14,
    28995
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'TV Samsung 55" UN55TU7000',
    'Samsung',
    'Smart TV 4K UHD',
    'https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=600&h=600&fit=crop&auto=format',
    4.80,
    256,
    18,
    39995
  )
on conflict (id) do nothing;

insert into product_variants (
  id, product_id, model, ean, upc, manufacturer_sku, is_primary
) values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'WA18T6360BV',
    '8806092000001',
    '887276500001',
    'WA18T6360BV/AP',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'UN55TU7000',
    '8806090000002',
    '887276400002',
    'UN55TU7000PXPA',
    true
  )
on conflict (id) do nothing;

insert into retailers (id, name, slug, abbr, primary_color, website_url) values
  (
    '40000000-0000-0000-0000-000000000001',
    'Plaza Lama',
    'plaza-lama',
    'PL',
    '#C0392B',
    'https://plazalama.com'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'Sirena',
    'sirena',
    'SI',
    '#2980B9',
    'https://sirena.do'
  )
on conflict (id) do nothing;

insert into stores (id, retailer_id, name, address) values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Plaza Lama - Sample Branch',
    'Santo Domingo, República Dominicana'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    'Sirena - Sample Branch',
    'Santo Domingo, República Dominicana'
  )
on conflict (id) do nothing;

insert into offers (
  id, product_variant_id, retailer_id, store_id, external_sku, url,
  price, shipping_price, availability, last_seen_at
) values
  (
    '60000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'SEED-WASHER-PL',
    'https://plazalama.com',
    24495,
    0,
    'in_stock',
    now()
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000002',
    'SEED-WASHER-SI',
    'https://sirena.do',
    24995,
    500,
    'in_stock',
    now()
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'SEED-TV-PL',
    'https://plazalama.com',
    33495,
    0,
    'in_stock',
    now()
  )
on conflict (id) do nothing;

insert into price_observations (offer_id, price, shipping_price, availability, observed_at) values
  ('60000000-0000-0000-0000-000000000001', 25995, 0, 'in_stock', now() - interval '30 days'),
  ('60000000-0000-0000-0000-000000000001', 24995, 0, 'in_stock', now() - interval '14 days'),
  ('60000000-0000-0000-0000-000000000001', 24495, 0, 'in_stock', now()),
  ('60000000-0000-0000-0000-000000000002', 25995, 500, 'in_stock', now() - interval '14 days'),
  ('60000000-0000-0000-0000-000000000002', 24995, 500, 'in_stock', now()),
  ('60000000-0000-0000-0000-000000000003', 34995, 0, 'in_stock', now() - interval '7 days'),
  ('60000000-0000-0000-0000-000000000003', 33495, 0, 'in_stock', now());
