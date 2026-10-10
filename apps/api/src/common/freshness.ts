// An offer the ingestion worker hasn't re-seen in this long is treated as
// gone: the retailer delisted it, moved its URL, or our discovery stopped
// reaching it. Showing it as a live price is worse than not showing it --
// users get a stale number and crawlers see an abandoned site. History
// (price_observations) is unaffected; this only gates what counts as a
// current offer.
export const STALE_OFFER_DAYS = 14

// SQL predicate over an `offers` row aliased as `alias`.
export function freshOfferSql(alias = 'o'): string {
  return `${alias}.last_seen_at > now() - interval '${STALE_OFFER_DAYS} days'`
}
