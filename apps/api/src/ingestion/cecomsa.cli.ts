import { CecomsaAdapter, CECOMSA_SEEDS, normalizeCecomsaItem } from './cecomsa.adapter'
import { runIngestion } from './run-ingestion'

const maxProducts = Number(process.env.CECOMSA_MAX_PRODUCTS ?? 1500)
const maxPagesPerSeed = Number(process.env.CECOMSA_MAX_PAGES ?? 40)
const delayMs = Number(process.env.CECOMSA_REQUEST_DELAY_MS ?? 800)

runIngestion('cecomsa-odoo-shop', async function* (onSeen) {
  const adapter = new CecomsaAdapter(delayMs)
  const seen = new Set<string>()
  let yielded = 0

  for (const seed of CECOMSA_SEEDS) {
    for (let page = 1; page <= maxPagesPerSeed; page++) {
      let listing
      try {
        listing = await adapter.fetchListing(seed, page)
      } catch (error) {
        console.warn(`[cecomsa] ${seed.categoryName} page ${page} failed: ${error instanceof Error ? error.message : String(error)}`)
        break
      }
      // Odoo repeats the last page for out-of-range numbers: stop when nothing is new.
      const fresh = listing.filter(item => !seen.has(item.code))
      if (!fresh.length) break
      for (const item of fresh) {
        seen.add(item.code)
        onSeen()
        yield normalizeCecomsaItem(item, seed)
        if (++yielded >= maxProducts) return
      }
    }
  }
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})
