// An offer the ingestion worker hasn't re-seen in this long is treated as
// gone: the retailer delisted it, moved its URL, or our discovery stopped
// reaching it. Showing it as a live price is worse than not showing it --
// users get a stale number and crawlers see an abandoned site. History
// (price_observations) is unaffected; this only gates what counts as a
// current offer.
//
// 3 days = at least ~10 ingestion runs (every 6 h, hourly around Black
// Friday) that didn't see the listing. It was 14: Jumbo alone kept ~190
// delisted products on the site with week-old prices. If a whole scraper
// breaks, ingestion-report alerts Discord on the first failed run, well
// before its offers expire.
export const STALE_OFFER_DAYS = 3

// SQL predicate over an `offers` row aliased as `alias`.
export function freshOfferSql(alias = 'o'): string {
  return `${alias}.last_seen_at > now() - interval '${STALE_OFFER_DAYS} days'`
}
