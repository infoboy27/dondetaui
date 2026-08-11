// Maps the 5 known retailer abbreviations (StorePrice.abbr) to their
// /api/stores/:slug -- confirmed against the live API's real slugs. Offers
// from a retailer outside this set (not one of the 5 DóndeTa currently
// ingests) simply won't be tappable through to a store page.
export const STORE_SLUGS: Record<string, string> = {
  PL: 'plaza-lama',
  SI: 'sirena',
  CO: 'corripio',
  JU: 'jumbo',
  PS: 'pricesmart',
}
