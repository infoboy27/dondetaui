import { describe, expect, it, vi } from 'vitest'
import type { Browser, Page } from 'playwright'
import { RecycledPage } from './recycled-page'

function fakeBrowser() {
  const opened: { close: ReturnType<typeof vi.fn> }[] = []
  const browser = {
    newPage: vi.fn(async () => {
      const page = { close: vi.fn(async () => undefined) }
      opened.push(page)
      return page as unknown as Page
    }),
  }
  return { browser: browser as unknown as Browser, opened }
}

describe('RecycledPage', () => {
  // Regression: a single page reused for a whole PriceSmart run grew past 4 GB.
  it('hands out the same page `every` times, then closes it and opens a fresh one', async () => {
    const { browser, opened } = fakeBrowser()
    const pages = new RecycledPage(browser, 3)

    const first = await pages.page()
    expect(await pages.page()).toBe(first)
    expect(await pages.page()).toBe(first)
    const second = await pages.page()

    expect(second).not.toBe(first)
    expect(opened).toHaveLength(2)
    expect(opened[0].close).toHaveBeenCalledOnce()
    expect(opened[1].close).not.toHaveBeenCalled()
  })

  it('opens a replacement even if closing the old page fails', async () => {
    const { browser, opened } = fakeBrowser()
    const pages = new RecycledPage(browser, 1)
    await pages.page()
    opened[0].close.mockRejectedValueOnce(new Error('target closed'))
    await expect(pages.page()).resolves.toBeDefined()
    expect(opened).toHaveLength(2)
  })
})
