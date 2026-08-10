import assert from 'node:assert/strict'
import { extractLinks, isCategoryUrl, isLikelyProductUrl } from './pricesmart.discovery'

const base = 'https://www.pricesmart.com/es-do/linea-blanca'
const html = `
  <a href="/es-do/producto/whirlpool-lavadora-impeller-carga-superior-12-kg-379506/379506">Lavadora</a>
  <a href="/es-do/linea-blanca?page=2">Página 2</a>
  <a href="/es-do/categoria/Linea-blanca-M10D43/Refrigeradores-M10D43009/M10D43009">Refrigeradores</a>
  <a href="https://www.pricesmart.com/es-do/producto/samsung-nevera-256-l-447067/447067?utm_source=test">Nevera</a>
  <a href="https://example.com/es-do/producto/externo-99999/99999">Externo</a>
  <a href="/es-do/membrecia/info">Membresía</a>
  <a href="/es-do/producto/whirlpool-lavadora-impeller-carga-superior-12-kg-379506/379506">Duplicado</a>
`

const links = extractLinks(html, base)
assert.equal(links.length, 5)
assert.ok(links.includes('https://www.pricesmart.com/es-do/producto/whirlpool-lavadora-impeller-carga-superior-12-kg-379506/379506'))
assert.ok(links.includes('https://www.pricesmart.com/es-do/linea-blanca?page=2'))
assert.ok(links.includes('https://www.pricesmart.com/es-do/categoria/Linea-blanca-M10D43/Refrigeradores-M10D43009/M10D43009'))
assert.ok(links.includes('https://www.pricesmart.com/es-do/producto/samsung-nevera-256-l-447067/447067'))
assert.ok(links.includes('https://www.pricesmart.com/es-do/membrecia/info'))

assert.equal(isCategoryUrl('https://www.pricesmart.com/es-do/linea-blanca?page=2'), true)
assert.equal(isCategoryUrl('https://www.pricesmart.com/es-do/categoria/Linea-blanca-M10D43/Refrigeradores-M10D43009/M10D43009'), true)
assert.equal(isCategoryUrl('https://www.pricesmart.com/es-do/membrecia/info'), false)
assert.equal(isLikelyProductUrl('https://www.pricesmart.com/es-do/producto/whirlpool-lavadora-impeller-carga-superior-12-kg-379506/379506'), true)
assert.equal(isLikelyProductUrl('https://www.pricesmart.com/es-do/linea-blanca'), false)
assert.equal(isLikelyProductUrl('https://www.pricesmart.com/es-do/membrecia/info'), false)

console.log('PriceSmart catalog discovery smoke test passed')
