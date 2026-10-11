-- One spelling per brand (retailers write "SAMSUNG", "Samsung", "samsung").
-- Mirrors normalizeBrand() in src/ingestion/brands.ts, which ingestion now
-- applies to every new item: all-caps names longer than three letters are
-- title-cased (LG, TCL, GE stay); a few brands keep their own casing.
update products
set brand = initcap(brand)
where brand = upper(brand)
  and length(brand) > 3
  and brand ~ '[A-Z]';

update products set brand = 'KitchenAid' where lower(brand) = 'kitchenaid';
update products set brand = 'Black+Decker' where lower(brand) = 'black+decker';
update products set brand = 'KDK' where lower(brand) = 'kdk';
