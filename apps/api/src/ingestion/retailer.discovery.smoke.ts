import { strict as assert } from 'node:assert'
import { extractRetailerLinks, isCrawlUrl, isLikelyRetailerProductUrl } from './retailer.discovery'
import { RETAILER_CONFIGS } from './retailer.config'

const corripio = RETAILER_CONFIGS.corripio
const corripioHtml = `
  <a href="/refrigeracion/neveras.html">next</a>
  <a href="/ls-wa13cg5441bw-lavadora.html">washer</a>
  <a href="https://example.com/product.html">external</a>
  <a href="/cart">cart</a>
`
const corripioLinks = extractRetailerLinks(corripioHtml, corripio.seedUrls[0], corripio)
assert(corripioLinks.some(url => url.endsWith('/ls-wa13cg5441bw-lavadora.html')))
assert(corripioLinks.every(url => !url.includes('example.com')))
assert(isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/ls-wa13cg5441bw-lavadora.html', corripio))
assert(isCrawlUrl('https://www.tiendascorripio.com.do/refrigeracion/neveras.html', corripio))
assert(!isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/cart', corripio))
// DóndeTa is appliances-only — Corripio's general catalog and home-decor
// department must not be crawled, only the appliance-specific sections.
assert(!isCrawlUrl('https://www.tiendascorripio.com.do/all-products?p=2', corripio))
assert(!isCrawlUrl('https://www.tiendascorripio.com.do/hogar/decoracion.html', corripio))
// Category/subcategory/filter index pages also end in .html — nested ones must not be
// mistaken for products (Bebederos, RD$0, was showing as the homepage's featured deal),
// and even a flat one without a SKU digit (Audio) must not match either.
assert(!isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/refrigeracion/equipos-especializados/bebederos.html', corripio))
assert(!isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/audio/audio-personal.html', corripio))
assert(!isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/audio.html', corripio))
assert(isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/an-p18kn-abanico-nedoca-18.html', corripio))
assert(isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/btva-argbr1345-base-de-tv-inclinable-32-55.html', corripio))

const sirena = RETAILER_CONFIGS.sirena
assert(isCrawlUrl('https://www.sirena.do/electrodomesticos/lavado-y-secado', sirena))
assert(isLikelyRetailerProductUrl('https://www.sirena.do/lavadora-lg-14kg-123456/p', sirena))
// Groceries/beauty were the old (too broad) seeds — must not be crawled anymore.
assert(!isCrawlUrl('https://www.sirena.do/supermercado/carnes-pescados-y-mariscos', sirena))
assert(!isCrawlUrl('https://www.sirena.do/belleza/perfumeria', sirena))

const jumbo = RETAILER_CONFIGS.jumbo
// Jumbo renamed /electrodomesticos to /electro-hogar; real product URLs are a bare
// single-segment slug+SKU (no /product/ segment or .html suffix).
assert(isCrawlUrl('https://jumbo.com.do/electro-hogar?p=2', jumbo))
assert(isLikelyRetailerProductUrl('https://jumbo.com.do/freidora-de-aire-black-decker-hf5005b-3316834', jumbo))
assert(isLikelyRetailerProductUrl('https://jumbo.com.do//freidora-de-aire-black-decker-hf5005b-3316834', jumbo))
assert(!isCrawlUrl('https://jumbo.com.do/supermercado/frutas-y-vegetales', jumbo))
// Deeply nested nav/filter paths whose last segment coincidentally looks SKU-like too
// (short numbers, product-line codes) must not be mistaken for real product pages.
assert(!isLikelyRetailerProductUrl('https://jumbo.com.do/hogar/cocina-sl-5652', jumbo))
assert(!isLikelyRetailerProductUrl('https://jumbo.com.do/tv-y-tecnologia/televisores/tv-entre-55-a-65', jumbo))
assert(!isLikelyRetailerProductUrl('https://jumbo.com.do/equipaje/maletas/maletas-hasta-74cm', jumbo))
assert(!isLikelyRetailerProductUrl('https://jumbo.com.do/supermercado/bebe/alimentacion-de-bebe', jumbo))

console.log('multi-retailer discovery smoke test passed')
