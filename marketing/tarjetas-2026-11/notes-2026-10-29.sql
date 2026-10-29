-- Shorter notes: the cap is already shown as "tope RD$…" on each row.
update card_promotions p set note = '3% en caja + 3% al corte' from retailers r
  where r.id = p.retailer_id and r.slug = 'corripio' and p.bank = 'BHD' and p.starts_on = '2026-10-29';
update card_promotions p set note = 'reembolso' from retailers r
  where r.id = p.retailer_id and r.slug = 'sirena' and p.bank = 'APAP' and p.starts_on = '2026-10-29';
