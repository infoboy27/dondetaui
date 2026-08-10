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

const sirena = RETAILER_CONFIGS.sirena
assert(isCrawlUrl('https://www.sirena.do/electrodomesticos/lavado-y-secado', sirena))
assert(isLikelyRetailerProductUrl('https://www.sirena.do/lavadora-lg-14kg-123456/p', sirena))
// Groceries/beauty were the old (too broad) seeds — must not be crawled anymore.
assert(!isCrawlUrl('https://www.sirena.do/supermercado/carnes-pescados-y-mariscos', sirena))
assert(!isCrawlUrl('https://www.sirena.do/belleza/perfumeria', sirena))

const jumbo = RETAILER_CONFIGS.jumbo
assert(isCrawlUrl('https://jumbo.com.do/electrodomesticos/refrigeracion', jumbo))
assert(isLikelyRetailerProductUrl('https://jumbo.com.do/electrodomesticos/nevera-samsung-123456.html', jumbo))
assert(!isCrawlUrl('https://jumbo.com.do/supermercado/frutas-y-vegetales', jumbo))

const pricesmart = RETAILER_CONFIGS.pricesmart
assert(isCrawlUrl('https://www.pricesmart.com/es-do/linea-blanca/refrigeradores', pricesmart))
assert(isLikelyRetailerProductUrl('https://www.pricesmart.com/es-do/linea-blanca/product/televisor-samsung-123456', pricesmart))
assert(!isLikelyRetailerProductUrl('https://www.pricesmart.com/es-do/membership', pricesmart))
// The old scope matched the entire site (/es-do) — must be narrowed now.
assert(!isCrawlUrl('https://www.pricesmart.com/es-do/alimentos-para-todos', pricesmart))

console.log('multi-retailer discovery smoke test passed')
