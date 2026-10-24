import { useEffect } from 'react'
import { productsApi } from '../../api/products'
import { currentSocialProfile } from '../../domain/socialProfile'
import { bestPrice, isWorthSharing, weekIndex, weeklyTop } from '../../domain/instagram'
import { getTopPriceDrops } from '../../domain/notifications'
import { getTopComparisons } from '../../domain/offers'
import type { Product } from '../../types'
import {
  caption,
  drawCard,
  drawReelScenes,
  drawStory,
  drawTopCover,
  drawTopEnd,
  drawTopItem,
  ensureFonts,
  topCaption,
  type CardKind,
} from './instagramCard'

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

export interface IgWeekly {
  slug: string
  label: string
  items: Array<{ productId: string; name: string; imageUrl: string | null }>
}

export interface IgCarousel {
  caption: string
  slides: string[]
}

export interface IgReel {
  caption: string
  scenes: Array<{ image: string; seconds: number; zoom: boolean }>
}

export interface IgBridge {
  candidates(): Promise<IgCandidate[]>
  render(productId: string, kind: CardKind, imageDataUrl: string | null, site: string): Promise<IgRendered>
  weekly(): Promise<IgWeekly | null>
  renderCarousel(slug: string, images: Record<string, string | null>, site: string): Promise<IgCarousel>
  renderReel(productId: string, kind: CardKind, imageDataUrl: string | null, site: string): Promise<IgReel>
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

// Instagram only takes JPEG.
const jpeg = (canvas: HTMLCanvasElement) => canvas.toDataURL('image/jpeg', 0.92)

// "11 de octubre"
function dateLabel(date = new Date()): string {
  return new Intl.DateTimeFormat(currentSocialProfile().locale, { day: 'numeric', month: 'long', timeZone: currentSocialProfile().timeZone }).format(date)
}

// Headless counterpart of AdminInstagram for the Instagram autopilot
// (apps/api/src/admin/instagram-autopilot.cli.ts): the worker opens this page
// in Chromium and drives it through window.__ig, so scheduled posts are drawn
// by exactly the same code as the ones published by hand. Nothing here is
// private -- it only shows public prices -- and the worker passes the product
// photos in as data URLs, so no admin endpoint is involved.
export default function IgRender() {
  useEffect(() => {
    let products: Product[] | null = null
    const load = async () => (products ??= await productsApi.list())
    const find = async (productId: string) => {
      const product = (await load()).find(p => p.id === productId)
      if (!product) throw new Error(`Producto ${productId} no está en el catálogo`)
      return product
    }

    window.__ig = {
      async candidates() {
        const list = await load()
        return [
          ...getTopComparisons(list, 30)
            .filter(e => isWorthSharing(e.savings, bestPrice(e.product) ?? 0))
            .slice(0, 8)
            .map(e => ({ product: e.product, kind: { type: 'comparison', savings: e.savings } as CardKind })),
          ...getTopPriceDrops(list, 4).map(d => ({ product: d.product, kind: { type: 'drop', pct: d.pct, oldPrice: d.oldPrice } as CardKind })),
        ].map(({ product, kind }) => ({ productId: product.id, name: product.name, imageUrl: product.image || null, kind }))
      },
      async render(productId, kind, imageDataUrl, site) {
        const product = await find(productId)
        await ensureFonts()
        const card = document.createElement('canvas')
        drawCard(card, product, kind, await loadImage(imageDataUrl), site)
        const story = document.createElement('canvas')
        drawStory(story, card, kind, site)
        return { caption: caption(product, kind, site), feed: jpeg(card), story: jpeg(story) }
      },
      async weekly() {
        const top = weeklyTop(await load(), weekIndex())
        if (!top) return null
        return {
          slug: top.type.slug,
          label: top.type.label,
          items: top.items.map(p => ({ productId: p.id, name: p.name, imageUrl: p.image || null })),
        }
      },
      async renderCarousel(slug, images, site) {
        const top = weeklyTop(await load(), weekIndex())
        if (!top || top.type.slug !== slug) throw new Error(`El top semanal ya no es ${slug}`)
        await ensureFonts()
        const label = dateLabel()
        const slides: string[] = []
        const canvas = document.createElement('canvas')
        drawTopCover(canvas, top.type, label, site)
        slides.push(jpeg(canvas))
        for (const [i, product] of top.items.entries()) {
          drawTopItem(canvas, product, i + 1, await loadImage(images[product.id] ?? null), site)
          slides.push(jpeg(canvas))
        }
        const stores = [...new Set((await load()).flatMap(p => p.prices.map(o => o.store)))].sort()
        drawTopEnd(canvas, top.type, stores, site)
        slides.push(jpeg(canvas))
        return { caption: topCaption(top.type, top.items, label, site), slides }
      },
      async renderReel(productId, kind, imageDataUrl, site) {
        const product = await find(productId)
        await ensureFonts()
        const scenes = drawReelScenes(product, kind, await loadImage(imageDataUrl), site)
        return {
          caption: caption(product, kind, site),
          scenes: scenes.map(scene => ({ image: jpeg(scene.canvas), seconds: scene.seconds, zoom: scene.zoom })),
        }
      },
    }
    document.title = 'DóndeTa · render'
  }, [])

  return <meta name="robots" content="noindex" />
}
