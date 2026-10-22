import { ELECTRODOM_CONFIG, ShopifyAdapter, type ShopifyConfig } from './shopify.adapter'
import { runIngestion } from './run-ingestion'

const STORES: Record<string, ShopifyConfig> = { electrodom: ELECTRODOM_CONFIG }

const config = STORES[process.argv[2] ?? '']
if (!config) {
  console.error(`usage: shopify.cli.js <${Object.keys(STORES).join('|')}>`)
  process.exit(1)
}

const maxPages = Number(process.env.SHOPIFY_MAX_PAGES ?? 12)
const delayMs = Number(process.env.SHOPIFY_REQUEST_DELAY_MS ?? 2000)

runIngestion(config.source, async function* (onSeen) {
  const adapter = new ShopifyAdapter(config, delayMs)
  for (let page = 1; page <= maxPages; page++) {
    const products = await adapter.fetchPage(page)
    if (!products.length) return
    for (const product of products) {
      onSeen()
      yield adapter.normalize(product)
    }
  }
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})
