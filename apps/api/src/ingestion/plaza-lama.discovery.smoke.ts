import assert from 'node:assert/strict'
import { extractLinks, isCategoryUrl, isLikelyProductUrl } from './plaza-lama.discovery'

const base = 'https://plazalama.com.do/ca/electrodomesticos/4'
const html = `
  <a href="/ca/electrodomesticos/refrigeracion/4/4-9">Refrigeración</a>
  <a href="/ca/electrodomesticos/4?page=2">Página 2</a>
  <a href="/p/lavadora-samsung-wa18t6360bv-8806092000001">Lavadora Samsung</a>
  <a href="https://plazalama.com.do/producto/nevera-lg-vs25bjnk-12345678?utm_source=test">Nevera LG</a>
  <a href="https://example.com/producto/externo-12345678">Externo</a>
  <a href="/search?name=Samsung">Buscar</a>
  <a href="/p/lavadora-samsung-wa18t6360bv-8806092000001">Duplicado</a>
`

const links = extractLinks(html, base)
assert.equal(links.length, 5)
assert.ok(links.includes('https://plazalama.com.do/ca/electrodomesticos/refrigeracion/4/4-9'))
assert.ok(links.includes('https://plazalama.com.do/ca/electrodomesticos/4?page=2'))
assert.ok(links.includes('https://plazalama.com.do/p/lavadora-samsung-wa18t6360bv-8806092000001'))
assert.ok(links.includes('https://plazalama.com.do/producto/nevera-lg-vs25bjnk-12345678'))
assert.ok(links.includes('https://plazalama.com.do/search?name=Samsung'))

assert.equal(isCategoryUrl('https://plazalama.com.do/ca/electrodomesticos/4?page=2'), true)
assert.equal(isCategoryUrl('https://plazalama.com.do/search?name=Samsung'), false)
assert.equal(isLikelyProductUrl('https://plazalama.com.do/p/lavadora-samsung-wa18t6360bv-8806092000001'), true)
assert.equal(isLikelyProductUrl('https://plazalama.com.do/producto/nevera-lg-vs25bjnk-12345678'), true)
assert.equal(isLikelyProductUrl('https://plazalama.com.do/ca/electrodomesticos/4'), false)
assert.equal(isLikelyProductUrl('https://plazalama.com.do/search?name=Samsung'), false)

console.log('Plaza Lama catalog discovery smoke test passed')
