import { Injectable, NotFoundException } from '@nestjs/common'
import { buildReport, type PriceCheckReport } from './price-check'
import { ProductsRepository } from './products.repository'

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  list() {
    return this.repository.list()
  }

  search(query: string) {
    return this.repository.list(query)
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

  history(productId: string) {
    return this.repository.history(productId)
  }

  async barcode(code: string) {
    const product = await this.repository.findByBarcode(code)
    if (!product) throw new NotFoundException('Barcode not found')
    return product
  }
}
