-- HI-FI Electrodomésticos (hifi.com.do) joins the RD ingestion loop. Its two
-- showrooms come from the store's contact page (address + map pins).
--
-- Migration 010 inserted no branches because it ran before ingestion had
-- created the retailers it joins on. To avoid that here, the retailer row is
-- created first, with the same values the ingestion adapter upserts
-- (hifi.adapter.ts), so the branches land even before the first crawl.
-- Migrations also run on the .co/.mx stacks: only the RD stack (the one with
-- Sirena, a DR-only retailer) gets the row; elsewhere this is a no-op.
insert into retailers (name, slug, abbr, primary_color, website_url)
select 'HI-FI', 'hifi', 'HF', '#0F1D39', 'https://hifi.com.do'
where exists (select 1 from retailers where slug = 'sirena')
on conflict (slug) do nothing;

-- Idempotent like 023: a branch is only added if its retailer has none by that name.
insert into stores (retailer_id, name, address, latitude, longitude)
select r.id, b.name, b.address, b.latitude, b.longitude
from (values
  ('hifi', 'HI-FI - Naco', 'Calle Presidente González 3, Naco, Santo Domingo, República Dominicana', 18.4792274, -69.9269732),
  ('hifi', 'HI-FI - Sambil', 'Centro Comercial Sambil, Nivel Kennedy, Santo Domingo, República Dominicana', 18.483, -69.9121724)
) as b(retailer_slug, name, address, latitude, longitude)
join retailers r on r.slug = b.retailer_slug
where not exists (
  select 1 from stores s where s.retailer_id = r.id and s.name = b.name
);
