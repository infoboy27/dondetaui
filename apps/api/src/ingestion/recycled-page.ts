import type { Browser, Page } from 'playwright'

export const INDEXER_USER_AGENT = 'Mozilla/5.0 (compatible; DondeTaPriceIndexer/0.3; +https://dondeta.app)'

// One page reused for a whole catalog run leaks: on 2026-10-12 PriceSmart's
// renderer grew ~80 MB per product page and passed 4 GB by product 69, on a
// 12 GB server shared with everything else. Closing the page every `every`
// products drops that renderer and starts clean, so a run stays bounded.
export class RecycledPage {
  private current?: Page
  private uses = 0

  constructor(
    private readonly browser: Browser,
    private readonly every: number,
  ) {}

  async page(): Promise<Page> {
    if (this.current && this.uses >= this.every) {
      await this.current.close().catch(() => undefined)
      this.current = undefined
    }
    if (!this.current) {
      this.current = await this.browser.newPage({ userAgent: INDEXER_USER_AGENT })
      this.uses = 0
    }
    this.uses += 1
    return this.current
  }
}
