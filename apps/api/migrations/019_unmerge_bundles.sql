-- A Jumbo "combo licuadora + sandwichera" was merged into the plain
-- sandwichera by its shared model code, which made the product's price history
-- jump between both prices (a fake 76% drop). Matching now keeps bundles apart
-- (model-codes.ts bundlesCompatible); drop the misattached bundle offers so the
-- next ingestion run creates them as products of their own.
delete from offers o
using product_variants v, products p
where v.id = o.product_variant_id
  and p.id = v.product_id
  and o.url ~* '(^|[/-])(combo|kit|paquete|pack|bundle)([/.-]|$)'
  and p.name !~* '\y(combo|kit|paquete|pack|bundle)\y';
