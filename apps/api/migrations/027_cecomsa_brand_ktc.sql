-- Cecomsa's products were ingested before KTC was a known brand, so they were
-- saved as "Desconocida" with "desconocida-..." slugs. Fix the brand and the
-- slug; the old slug keeps resolving through product_slug_redirects. A no-op on
-- stacks without a Cecomsa retailer.
with fixed as (
  select p.id, p.slug as old_slug, 'ktc-' || substr(p.slug, length('desconocida-') + 1) as new_slug
  from products p
  where p.brand = 'Desconocida'
    and p.slug like 'desconocida-%'
    and exists (
      select 1
      from product_variants v
      join offers o on o.product_variant_id = v.id
      join retailers r on r.id = o.retailer_id
      where v.product_id = p.id and r.slug = 'cecomsa'
    )
), redirects as (
  insert into product_slug_redirects(old_slug, product_id)
  select old_slug, id from fixed
  on conflict (old_slug) do nothing
)
update products p
set brand = 'KTC', slug = f.new_slug, updated_at = now()
from fixed f
where p.id = f.id;
