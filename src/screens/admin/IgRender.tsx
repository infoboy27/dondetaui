import { useEffect } from 'react'
import { productsApi } from '../../api/products'
import { getTopPriceDrops } from '../../domain/notifications'
import { getTopComparisons } from '../../domain/offers'
import type { Product } from '../../types'
import { caption, drawCard, drawStory, ensureFonts, type CardKind } from './instagramCard'

export interface IgCandidate {
  productId: string
  name: string
  imageUrl: string | null
  kind: CardKind
}

export interface IgRendered {
  caption: string
  feed: string
  story: string
}

export interface IgBridge {
  candidates(): Promise<IgCandidate[]>
  render(productId: string, kind: CardKind, imageDataUrl: string | null, site: string): Promise<IgRendered>
}

declare global {
  interface Window {
    __ig?: IgBridge
  }
}

async function loadImage(dataUrl: string | null): Promise<HTMLImageElement | null> {
  if (!dataUrl) return null
  try {
    const img = new Image()
    img.src = dataUrl
    await img.decode()
    return img
  } catch {
    return null
  }
}

// Headless counterpart of AdminInstagram for the Instagram autopilot
// (apps/api/src/admin/instagram-autopilot.cli.ts): the worker opens this page
// in Chromium and drives it through window.__ig, so scheduled posts are drawn
// by exactly the same code as the ones published by hand. Nothing here is
// private -- it only shows public prices -- and the worker passes the product
// photo in as a data URL, so no admin endpoint is involved.
export default function IgRender() {
  useEffect(() => {
    let products: Product[] | null = null
    const load = async () => (products ??= await productsApi.list())

    window.__ig = {
      async candidates() {
        const list = await load()
        return [
          ...getTopComparisons(list, 8).map(e => ({ product: e.product, kind: { type: 'comparison', savings: e.savings } as CardKind })),
          ...getTopPriceDrops(list, 4).map(d => ({ product: d.product, kind: { type: 'drop', pct: d.pct, oldPrice: d.oldPrice } as CardKind })),
        ].map(({ product, kind }) => ({ productId: product.id, name: product.name, imageUrl: product.image || null, kind }))
      },
      async render(productId, kind, imageDataUrl, site) {
        const product = (await load()).find(p => p.id === productId)
        if (!product) throw new Error(`Producto ${productId} no está en el catálogo`)
        await ensureFonts()
        const card = document.createElement('canvas')
        drawCard(card, product, kind, await loadImage(imageDataUrl), site)
        const story = document.createElement('canvas')
        drawStory(story, card, kind, site)
        return {
          caption: caption(product, kind, site),
          // Instagram only takes JPEG.
          feed: card.toDataURL('image/jpeg', 0.92),
          story: story.toDataURL('image/jpeg', 0.92),
        }
      },
    }
    document.title = 'DóndeTa · render'
  }, [])

  return <meta name="robots" content="noindex" />
}
