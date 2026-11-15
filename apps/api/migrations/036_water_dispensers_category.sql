-- Water dispensers ("Bebedero Con Nevera Negro Whirlpool", "Bebedero
-- Tecnomaster TY-LWYR33W") were filed under Neveras by their stores and
-- topped a "neveras" search. Ingestion now routes them by name to their own
-- category (apps/api/src/ingestion/category-overrides.ts); this moves the
-- existing ones. Same rule as isWaterDispenser(): the name starts with
-- bebedero / dispensador de agua / water dispenser, or says "bebedero"
-- anywhere unless it leads with a fridge/freezer noun.
--
-- Runs on every country stack: where nothing matches (CO/MX/US) it creates
-- no category and updates nothing.

insert into categories (name, slug)
select 'Bebederos y dispensadores', 'bebederos'
where exists (
  select 1 from products
  where lower(name) ~ '^(bebederos?|dispensador(es)? (de )?agua|water (dispenser|cooler)s?)\M'
     or (lower(name) ~ '\mbebederos?\M'
         and lower(name) !~ '^(nevera|nevecon|nevecón|refrigerador|refrigeradora|congelador|freezer)\M')
)
on conflict (slug) do update set name = excluded.name;

update products
set category_id = (select id from categories where slug = 'bebederos'),
    updated_at = now()
where exists (select 1 from categories where slug = 'bebederos')
  and category_id <> (select id from categories where slug = 'bebederos')
  and (
    lower(name) ~ '^(bebederos?|dispensador(es)? (de )?agua|water (dispenser|cooler)s?)\M'
    or (lower(name) ~ '\mbebederos?\M'
        and lower(name) !~ '^(nevera|nevecon|nevecón|refrigerador|refrigeradora|congelador|freezer)\M')
  );
