import { HifiAdapter, HIFI_SEEDS, normalizeHifiProduct } from './hifi.adapter'
import { runIngestion } from './run-ingestion'

const maxProducts = Number(process.env.HIFI_MAX_PRODUCTS ?? 2000)
const maxPagesPerSeed = Number(process.env.HIFI_MAX_PAGES ?? 80)
const delayMs = Number(process.env.HIFI_REQUEST_DELAY_MS ?? 1000)

runIngestion('hifi-inertia', async function* (onSeen) {
  const adapter = new HifiAdapter(delayMs)
  const seen = new Set<number>()
  let yielded = 0

  for (const seed of HIFI_SEEDS) {
    for (let page = 1; page <= maxPagesPerSeed; page++) {
      let listing
      try {
        listing = await adapter.fetchListing(seed, page)
      } catch (error) {
        console.warn(`[hifi] ${seed} page ${page} failed: ${error instanceof Error ? error.message : String(error)}`)
        break
      }
      for (const product of listing.products) {
        if (seen.has(product.id)) continue
        seen.add(product.id)
        onSeen()
        // null = skipped (not an appliance, no price); runIngestion counts it.
        const item = normalizeHifiProduct(product)
        yield item
        if (item && ++yielded >= maxProducts) return
      }
      if (page >= listing.lastPage || !listing.products.length) break
    }
  }
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})
