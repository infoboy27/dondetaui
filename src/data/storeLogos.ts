import plazaLama from '../assets/logos/plaza-lama.png'
import sirena from '../assets/logos/sirena.webp'
import corripio from '../assets/logos/corripio.svg'
import jumbo from '../assets/logos/jumbo.svg'
import priceSmart from '../assets/logos/pricesmart.png'

// Official logos, pulled directly from each retailer's own site header
// (PriceSmart's site-header SVG rendered broken standalone -- missing
// wordmark, likely a <use> reference that only resolved in that page's own
// DOM -- so that one is the Wikimedia Commons infobox logo instead).
// AGENTS.md flags this as a stopgap: eventually these should come from
// retailer data (a logo_url column), not a hardcoded map -- but that
// requires the ingestion adapters to capture and store a real URL per
// retailer first, so this mirrors the STORE_COLORS hardcoded lookup that
// already exists today rather than inventing a new pattern.
//
// Keyed by the retailer abbreviation (PL/SI/CO/JU/PS), not the display
// name -- some screens show a branch-specific name like "Plaza Lama
// Churchill", but abbr is the one canonical identifier used everywhere
// (retailers.abbr in the backend, offer.abbr on the frontend).
export const STORE_LOGOS: Record<string, string> = {
  PL: plazaLama,
  SI: sirena,
  CO: corripio,
  JU: jumbo,
  PS: priceSmart,
}
