import { Injectable, NotFoundException } from '@nestjs/common'
import { homeHighlights } from './highlights'
import { buildReport, productChecks, type PriceCheck, type PriceCheckReport } from './price-check'
import { ProductsRepository } from './products.repository'
import { rankSearchResults } from './search-ranking'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  list() {
    return this.repository.list()
  }

  async highlights() {
    return homeHighlights(await this.repository.list())
  }

  async search(query: string) {
    return rankSearchResults(await this.repository.list(query), query)
  }

  async get(productId: string) {
    const product = await this.repository.findById(productId)
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async getBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug)
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  offers(productId: string) {
    return this.repository.offers(productId)
  }

  // The report scans every live offer's 30-day history; it only changes when
  // ingestion runs, so it's cached briefly in memory.
  private priceCheckCache: { at: number; report: Promise<PriceCheckReport> } | null = null

  priceCheck(): Promise<PriceCheckReport> {
    if (!this.priceCheckCache || Date.now() - this.priceCheckCache.at > 10 * 60_000) {
      const report = this.repository.priceCheckSeries().then(series => buildReport(series))
      report.catch(() => { this.priceCheckCache = null })
      this.priceCheckCache = { at: Date.now(), report }
    }
    return this.priceCheckCache.report
  }

  // One product's verdicts, one per store (its share card shows the one for
  // the store with the best price). Not cached: a single product's offers.
  async productPriceCheck(productId: string): Promise<PriceCheck[]> {
    if (!UUID.test(productId)) return []
    return productChecks(await this.repository.priceCheckSeries(productId))
  }

  history(productId: string) {
    return this.repository.history(productId)
  }

  async barcode(code: string) {
    const product = await this.repository.findByBarcode(code)
    if (!product) throw new NotFoundException('Barcode not found')
    return product
  }
}
