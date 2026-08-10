import { strict as assert } from 'node:assert'
import { extractRetailerLinks, isCrawlUrl, isLikelyRetailerProductUrl } from './retailer.discovery'
import { RETAILER_CONFIGS } from './retailer.config'

const corripio = RETAILER_CONFIGS.corripio
const corripioHtml = `
  <a href="/all-products?p=2">next</a>
  <a href="/ls-wa13cg5441bw-lavadora.html">washer</a>
  <a href="https://example.com/product.html">external</a>
  <a href="/cart">cart</a>
`
const corripioLinks = extractRetailerLinks(corripioHtml, corripio.seedUrls[0], corripio)
assert(corripioLinks.some(url => url.endsWith('/ls-wa13cg5441bw-lavadora.html')))
assert(corripioLinks.every(url => !url.includes('example.com')))
assert(isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/ls-wa13cg5441bw-lavadora.html', corripio))
assert(isCrawlUrl('https://www.tiendascorripio.com.do/all-products?p=2', corripio))
assert(!isLikelyRetailerProductUrl('https://www.tiendascorripio.com.do/cart', corripio))

const sirena = RETAILER_CONFIGS.sirena
assert(isCrawlUrl('https://www.sirena.do/supermercado/carnes-pescados-y-mariscos', sirena))
assert(isLikelyRetailerProductUrl('https://www.sirena.do/producto/arroz-premium-123456', sirena))

const jumbo = RETAILER_CONFIGS.jumbo
assert(isCrawlUrl('https://jumbo.com.do/supermercado/frutas-y-vegetales', jumbo))
assert(isLikelyRetailerProductUrl('https://jumbo.com.do/supermercado/arroz-premium-123456.html', jumbo))

const pricesmart = RETAILER_CONFIGS.pricesmart
assert(isCrawlUrl('https://www.pricesmart.com/es-do/category/alimentos', pricesmart))
assert(isLikelyRetailerProductUrl('https://www.pricesmart.com/es-do/product/televisor-samsung-123456', pricesmart))
assert(!isLikelyRetailerProductUrl('https://www.pricesmart.com/es-do/membership', pricesmart))

console.log('multi-retailer discovery smoke test passed')
