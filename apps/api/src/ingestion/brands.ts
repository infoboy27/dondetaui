// Appliance brands sold by Dominican and Colombian retailers. Used as the
// fallback when a product page doesn't state its brand: the first known brand
// that appears as a whole word in the product name wins. Longer names first
// so "Black+Decker" beats "Black" and "Hamilton Beach" beats "Hamilton".
const KNOWN_BRANDS = [
  'Hamilton Beach', 'Black+Decker', 'Black & Decker', 'Black and Decker', 'General Electric', 'Cuisinart',
  'Samsung', 'LG', 'Whirlpool', 'Frigidaire', 'Electrolux', 'Mabe', 'GE', 'Haier', 'Hisense', 'TCL',
  'Midea', 'Daewoo', 'Panasonic', 'Sony', 'Sharp', 'Philips', 'JBL', 'Bose', 'Aiwa', 'Xiaomi', 'Roku',
  'Tecnomaster', 'Nedoca', 'Daiwa', 'Drija', 'Dimensions', 'Dimension', 'Sensibo', 'Oster', 'Ninja',
  'Instant Pot', 'Cosori', 'Taurus', 'Imusa', 'Universal', 'Premier', 'Conex', 'Kalley', 'Challenger',
  'Indurama', 'Atbiz', 'KDK', 'Westinghouse', 'Toshiba', 'Hitachi', 'Gree', 'Carrier', 'Trane',
  'Rheem', 'Bosch', 'KitchenAid', 'Maytag', 'Amana', 'Winia', 'Royal', 'Avanti',
  'Magic Chef', 'Hyundai', 'Kenmore', 'Sankey', 'Krups', 'Nespresso', 'Remington', 'Conair',
  'Shark', 'Bissell', 'Dyson', 'Rowenta', 'Proctor Silex', 'Holstein', 'Brentwood', 'Cecotec',
  'Elegance', 'Tornado', 'Lasko', 'Honeywell', 'Coby', 'Klip Xtreme', 'Nex', 'Infinix', 'Motorola',
].sort((a, b) => b.length - a.length)

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const PATTERNS = KNOWN_BRANDS.map(brand => ({
  brand,
  pattern: new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegex(brand)}(?:$|[^\\p{L}\\p{N}])`, 'iu'),
}))

export function brandFromName(name: string): string | undefined {
  return PATTERNS.find(({ pattern }) => pattern.test(name))?.brand
}

const CANONICAL = new Map(KNOWN_BRANDS.map(brand => [brand.toLowerCase(), brand]))

// One spelling per brand: retailers write "SAMSUNG", "Samsung" and "samsung".
// Known brands get their canonical form; other all-caps names longer than
// three letters (acronyms like LG/TCL stay) are title-cased.
export function normalizeBrand(brand: string): string {
  const trimmed = brand.trim().replace(/\s+/g, ' ')
  const known = CANONICAL.get(trimmed.toLowerCase())
  if (known) return known
  if (trimmed.length > 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed.toLowerCase().replace(/(^|[\s&+\-/])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
  }
  return trimmed
}
