import { formatPrice } from '../../domain/currency'
import { closingQuestion, hashtags } from '../../domain/instagram'
import { currentSocialProfile, englishLine } from '../../domain/socialProfile'
import { getOfferTotal, getSavingsRange, rankOffers } from '../../domain/offers'
import type { Product } from '../../types'

// 1080x1350 (4:5): the tallest ratio Instagram shows uncropped in the feed.
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

export type CardKind =
  | { type: 'comparison'; savings: number }
  | { type: 'drop'; pct: number; oldPrice: number }

const C = {
  green: '#00B894',
  greenDark: '#009B7D',
  mint: '#E6F7F3',
  orange: '#FF9F1C',
  navy: '#0F1D2D',
  navy400: '#5D7EA0',
  yellow: '#FFD166',
  border: '#E8EDF2',
  bg: '#F2F4F7',
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Word-wraps into at most maxLines, ellipsizing the last one.
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth) {
      line = next
      continue
    }
    if (line) lines.push(line)
    line = word
    if (lines.length === maxLines) break
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1]
    while (last.length && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    lines[maxLines - 1] = `${last.trimEnd()}…`
  }
  return lines
}

export async function ensureFonts() {
  await Promise.all([
    document.fonts.load('700 64px Poppins'),
    document.fonts.load('600 40px Poppins'),
    document.fonts.load('500 36px "DM Sans"'),
  ]).catch(() => undefined)
}

// Draws the card. `image` is the product photo already loaded from a
// same-origin blob URL (see AdminInstagram), so the canvas stays exportable.
export function drawCard(canvas: HTMLCanvasElement, product: Product, kind: CardKind, image: HTMLImageElement | null, site: string) {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')!
  const W = CARD_WIDTH
  const pad = 72

  // Background + header band
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, CARD_HEIGHT)
  const grad = ctx.createLinearGradient(0, 0, W, 260)
  grad.addColorStop(0, C.green)
  grad.addColorStop(1, '#00cba0')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, 250)

  ctx.fillStyle = '#fff'
  ctx.font = '700 58px Poppins'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('DóndeTa', pad, 118)
  ctx.font = '500 34px "DM Sans"'
  ctx.globalAlpha = 0.9
  ctx.fillText(kind.type === 'comparison' ? '¿Dónde \'ta más barato?' : 'Bajó de precio', pad, 178)
  ctx.globalAlpha = 1

  // Highlight pill (top right of header)
  const pill = kind.type === 'comparison' ? `Ahorras ${formatPrice(kind.savings)}` : `Bajó ${kind.pct}%`
  ctx.font = '700 40px Poppins'
  const pillW = ctx.measureText(pill).width + 64
  roundRect(ctx, W - pad - pillW, 92, pillW, 84, 42)
  ctx.fillStyle = C.orange
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText(pill, W - pad - pillW + 32, 148)

  // Main card
  const cardY = 210
  const cardH = CARD_HEIGHT - cardY - 150
  roundRect(ctx, pad - 24, cardY, W - 2 * (pad - 24), cardH, 40)
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(15,29,45,0.10)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 12
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // Product photo
  const imgBox = { x: pad + 20, y: cardY + 36, w: W - 2 * (pad + 20), h: 400 }
  roundRect(ctx, imgBox.x, imgBox.y, imgBox.w, imgBox.h, 28)
  ctx.fillStyle = '#F8FAFC'
  ctx.fill()
  if (image && image.naturalWidth) {
    const scale = Math.min((imgBox.w - 40) / image.naturalWidth, (imgBox.h - 40) / image.naturalHeight)
    const w = image.naturalWidth * scale
    const h = image.naturalHeight * scale
    ctx.drawImage(image, imgBox.x + (imgBox.w - w) / 2, imgBox.y + (imgBox.h - h) / 2, w, h)
  }

  // Name
  let y = imgBox.y + imgBox.h + 76
  ctx.fillStyle = C.navy
  ctx.font = '600 44px Poppins'
  for (const line of wrap(ctx, product.name, W - 2 * (pad + 20), 2)) {
    ctx.fillText(line, pad + 20, y)
    y += 58
  }
  y += 10

  if (kind.type === 'comparison') {
    // Store rows, cheapest first
    const offers = rankOffers(product.prices).filter((offer, i, all) => all.findIndex(o => o.store === offer.store) === i).slice(0, 4)
    offers.forEach((offer, i) => {
      const rowH = 82
      const best = i === 0
      roundRect(ctx, pad + 20, y, W - 2 * (pad + 20), rowH - 12, 20)
      ctx.fillStyle = best ? C.mint : '#fff'
      ctx.fill()
      if (!best) {
        ctx.strokeStyle = C.border
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.fillStyle = C.navy
      ctx.font = `${best ? 700 : 500} 34px "DM Sans"`
      // Out-of-stock offers rank after in-stock ones, so a cheaper but sold-out
      // store can sit below a pricier one -- say why.
      ctx.fillText(offer.store + (best ? '  ✓ más barato' : offer.available ? '' : '  (agotado)'), pad + 48, y + 48)
      ctx.font = '700 38px Poppins'
      ctx.fillStyle = best ? C.greenDark : C.navy
      const price = formatPrice(getOfferTotal(offer))
      ctx.fillText(price, W - pad - 48 - ctx.measureText(price).width, y + 50)
      y += rowH
    })
  } else {
    const best = rankOffers(product.prices)[0]
    ctx.font = '700 84px Poppins'
    ctx.fillStyle = C.greenDark
    const now = best ? formatPrice(getOfferTotal(best)) : ''
    ctx.fillText(now, pad + 20, y + 80)
    const nowW = ctx.measureText(now).width
    ctx.font = '500 40px "DM Sans"'
    ctx.fillStyle = C.navy400
    const was = `antes ${formatPrice(Math.round(kind.oldPrice))}`
    const wasX = pad + 44 + nowW
    ctx.fillText(was, wasX, y + 78)
    ctx.fillRect(wasX, y + 64, ctx.measureText(was).width, 3)
    if (best) {
      ctx.font = '500 36px "DM Sans"'
      ctx.fillStyle = C.navy
      ctx.fillText(`en ${best.store}`, pad + 20, y + 150)
    }
  }

  // Footer
  ctx.fillStyle = C.navy
  ctx.font = '700 40px Poppins'
  ctx.fillText(site, pad, CARD_HEIGHT - 62)
  ctx.font = '500 30px "DM Sans"'
  ctx.fillStyle = C.navy400
  const tag = 'Compara antes de comprar'
  ctx.fillText(tag, W - pad - ctx.measureText(tag).width, CARD_HEIGHT - 66)
}

const profile = () => currentSocialProfile()

function distinctOffers(product: Product) {
  return rankOffers(product.prices).filter((offer, i, all) => all.findIndex(o => o.store === offer.store) === i)
}

// The first line is all most people read in the feed: lead with the money.
export function caption(product: Product, kind: CardKind, site: string): string {
  const offers = distinctOffers(product)
  const best = offers[0]
  if (kind.type === 'comparison') {
    return [
      `💰 ${formatPrice(kind.savings)} de diferencia por el mismo modelo`,
      product.name,
      '',
      `✅ ${best.store}: ${formatPrice(getOfferTotal(best))}`,
      ...offers.slice(1).map(o => `▫️ ${o.store}: ${formatPrice(getOfferTotal(o))}${o.available ? '' : ' (agotado)'}`),
      '',
      closingQuestion('comparison', product.id),
      '',
      `🔎 Compara cualquier electrodoméstico gratis en ${site} (link en la bio)`,
      ...englishLine(profile(), `🔎 Compare any appliance for free at ${site} (link in bio)`),
      profile().location,
      '',
      hashtags(product),
    ].join('\n')
  }
  return [
    `📉 ¡Bajó ${kind.pct}%! ${product.name}`,
    '',
    `Ahora ${formatPrice(getOfferTotal(best))} en ${best.store} (antes ${formatPrice(Math.round(kind.oldPrice))}).`,
    closingQuestion('drop', product.id),
    '',
    `🔔 Crea una alerta de precio gratis en ${site} (link en la bio)`,
    ...englishLine(profile(), `🔔 Set a free price alert at ${site} (link in bio)`),
    profile().location,
    '',
    hashtags(product),
  ].join('\n')
}

// 9:16 Story built from the feed card: the same 1080x1350 card centered on a
// brand-green background, with the logo line on top and a call to action below.
export const STORY_HEIGHT = 1920

export function drawStory(story: HTMLCanvasElement, card: HTMLCanvasElement, kind: CardKind, site: string) {
  story.width = CARD_WIDTH
  story.height = STORY_HEIGHT
  const ctx = story.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT)
  grad.addColorStop(0, C.green)
  grad.addColorStop(1, C.greenDark)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CARD_WIDTH, STORY_HEIGHT)

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = '700 64px Poppins'
  ctx.fillText(kind.type === 'comparison' ? "¿Dónde 'ta más barato?" : '¡Bajó de precio!', CARD_WIDTH / 2, 180)
  ctx.font = '500 36px "DM Sans"'
  ctx.globalAlpha = 0.9
  ctx.fillText(`Comparamos precios de ${profile().storesPhrase} por ti`, CARD_WIDTH / 2, 240)
  ctx.globalAlpha = 1

  // The card itself, slightly inset, with rounded corners and a shadow.
  const inset = 40
  const w = CARD_WIDTH - inset * 2
  const h = w * (CARD_HEIGHT / CARD_WIDTH)
  const x = inset
  const y = 300
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 20
  roundRect(ctx, x, y, w, h, 44)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.restore()
  ctx.save()
  roundRect(ctx, x, y, w, h, 44)
  ctx.clip()
  ctx.drawImage(card, x, y, w, h)
  ctx.restore()

  // Call to action
  const ctaY = y + h + 110
  ctx.font = '700 46px Poppins'
  const cta = `Búscalo en ${site}`
  const ctaW = ctx.measureText(cta).width + 100
  roundRect(ctx, (CARD_WIDTH - ctaW) / 2, ctaY - 66, ctaW, 100, 50)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.fillStyle = C.greenDark
  ctx.fillText(cta, CARD_WIDTH / 2, ctaY + 2)
  ctx.textAlign = 'left'
}

function drawContained(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, box: { x: number; y: number; w: number; h: number }, padding = 40) {
  if (!image || !image.naturalWidth) return
  const scale = Math.min((box.w - padding) / image.naturalWidth, (box.h - padding) / image.naturalHeight)
  const w = image.naturalWidth * scale
  const h = image.naturalHeight * scale
  ctx.drawImage(image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h)
}

function greenBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.4, h)
  grad.addColorStop(0, C.green)
  grad.addColorStop(1, C.greenDark)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function centered(ctx: CanvasRenderingContext2D, text: string, y: number, w: number) {
  ctx.textAlign = 'center'
  ctx.fillText(text, w / 2, y)
  ctx.textAlign = 'left'
}

// ---------------------------------------------------------------------------
// Weekly "Top 5" carousel (1080x1350 slides): cover, one slide per product,
// closing call to action.

export interface TopType {
  slug: string
  label: string
  masculine?: boolean
}

const topTitle = (type: TopType) => ({ article: type.masculine ? 'Los' : 'Las', cheapest: type.masculine ? 'más baratos' : 'más baratas' })

// "Jumbo, Sirena y Plaza Lama"
function listJoin(items: string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

export function drawTopCover(canvas: HTMLCanvasElement, type: TopType, dateLabel: string, site: string) {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')!
  const W = CARD_WIDTH
  greenBackground(ctx, W, CARD_HEIGHT)

  ctx.fillStyle = '#fff'
  ctx.font = '700 58px Poppins'
  ctx.fillText('DóndeTa', 72, 130)

  const title = topTitle(type)
  ctx.font = '700 120px Poppins'
  centered(ctx, `${title.article} 5`, 470, W)
  ctx.font = '700 96px Poppins'
  for (const [i, line] of wrap(ctx, type.label, W - 144, 2).entries()) centered(ctx, line, 590 + i * 110, W)
  ctx.font = '700 72px Poppins'
  ctx.fillStyle = C.yellow
  centered(ctx, `${title.cheapest} ${profile().cheapestOf}`, 590 + Math.min(2, wrap(ctx, type.label, W - 144, 2).length) * 110 + 10, W)

  ctx.fillStyle = '#fff'
  ctx.font = '500 38px "DM Sans"'
  ctx.globalAlpha = 0.9
  centered(ctx, `Precios de esta semana · ${dateLabel}`, 1010, W)
  ctx.globalAlpha = 1

  ctx.font = '700 40px Poppins'
  const swipe = 'Desliza  →'
  const swipeW = ctx.measureText(swipe).width + 80
  roundRect(ctx, (W - swipeW) / 2, 1080, swipeW, 90, 45)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.fillStyle = C.greenDark
  centered(ctx, swipe, 1140, W)

  ctx.fillStyle = '#fff'
  ctx.font = '700 36px Poppins'
  centered(ctx, site, CARD_HEIGHT - 60, W)
}

export function drawTopItem(canvas: HTMLCanvasElement, product: Product, rank: number, image: HTMLImageElement | null, site: string) {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')!
  const W = CARD_WIDTH
  const pad = 72
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, CARD_HEIGHT)

  // Rank badge + brand line
  ctx.beginPath()
  ctx.arc(pad + 56, 120, 56, 0, Math.PI * 2)
  ctx.fillStyle = C.orange
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 60px Poppins'
  ctx.textAlign = 'center'
  ctx.fillText(String(rank), pad + 56, 142)
  ctx.textAlign = 'left'
  ctx.fillStyle = C.navy
  ctx.font = '700 44px Poppins'
  ctx.fillText('DóndeTa', pad + 140, 112)
  ctx.font = '500 30px "DM Sans"'
  ctx.fillStyle = C.navy400
  ctx.fillText(product.brand || 'Precio más bajo hoy', pad + 140, 156)

  // Photo card
  const box = { x: pad - 24, y: 220, w: W - 2 * (pad - 24), h: 560 }
  roundRect(ctx, box.x, box.y, box.w, box.h, 40)
  ctx.fillStyle = '#fff'
  ctx.fill()
  drawContained(ctx, image, box, 80)

  // Name
  let y = box.y + box.h + 80
  ctx.fillStyle = C.navy
  ctx.font = '600 44px Poppins'
  for (const line of wrap(ctx, product.name, W - 2 * pad, 2)) {
    ctx.fillText(line, pad, y)
    y += 58
  }

  // Price + store
  const offers = distinctOffers(product)
  const best = offers[0]
  if (best) {
    ctx.font = '700 88px Poppins'
    ctx.fillStyle = C.greenDark
    ctx.fillText(formatPrice(getOfferTotal(best)), pad, y + 84)
    ctx.font = '500 38px "DM Sans"'
    ctx.fillStyle = C.navy
    ctx.fillText(`en ${best.store}`, pad, y + 144)
  }
  const savings = getSavingsRange(product.prices)
  if (offers.length > 1 && savings > 0) {
    const pill = `En ${offers.length} tiendas · ahorras ${formatPrice(savings)}`
    ctx.font = '700 32px "DM Sans"'
    const pillW = ctx.measureText(pill).width + 48
    roundRect(ctx, pad, y + 176, pillW, 64, 32)
    ctx.fillStyle = C.mint
    ctx.fill()
    ctx.fillStyle = C.greenDark
    ctx.fillText(pill, pad + 24, y + 219)
  }

  ctx.fillStyle = C.navy
  ctx.font = '700 36px Poppins'
  ctx.fillText(site, pad, CARD_HEIGHT - 56)
}

export function drawTopEnd(canvas: HTMLCanvasElement, type: TopType, stores: string[], site: string) {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')!
  const W = CARD_WIDTH
  ctx.fillStyle = C.navy
  ctx.fillRect(0, 0, W, CARD_HEIGHT)

  ctx.fillStyle = '#fff'
  ctx.font = '700 84px Poppins'
  centered(ctx, '¿Vas a comprar?', 420, W)
  ctx.font = '500 40px "DM Sans"'
  ctx.globalAlpha = 0.85
  const text = `Compara los precios de ${type.label} en ${listJoin(stores)} antes de decidir.`
  for (const [i, line] of wrap(ctx, text, W - 200, 4).entries()) centered(ctx, line, 520 + i * 58, W)
  ctx.globalAlpha = 1

  ctx.font = '700 52px Poppins'
  const cta = site
  const ctaW = ctx.measureText(cta).width + 120
  roundRect(ctx, (W - ctaW) / 2, 820, ctaW, 120, 60)
  ctx.fillStyle = C.green
  ctx.fill()
  ctx.fillStyle = '#fff'
  centered(ctx, cta, 900, W)

  ctx.font = '600 40px Poppins'
  ctx.fillStyle = C.yellow
  centered(ctx, 'Guarda este post 📌', 1080, W)
}

export function topCaption(type: TopType, items: Product[], dateLabel: string, site: string): string {
  const lines = items.map((product, i) => {
    const best = distinctOffers(product)[0]
    return `${i + 1}. ${product.name} — ${best ? `${formatPrice(getOfferTotal(best))} en ${best.store}` : ''}`
  })
  return [
    `📌 ${topTitle(type).article} 5 ${type.label} ${topTitle(type).cheapest} ${profile().cheapestOf} esta semana`,
    '',
    ...lines,
    '',
    `Precios del ${dateLabel}; pueden cambiar. ${closingQuestion('top5', type.slug + dateLabel)}`,
    '',
    `🔎 Compara ${type.masculine ? 'todos los' : 'todas las'} ${type.label} en ${site}/precios/${type.slug} (link en la bio)`,
    profile().location,
    '',
    hashtags(items[0] ?? null),
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Reel scenes (1080x1920). The worker turns them into an MP4 with ffmpeg
// (crossfades, a slow zoom on the scenes marked `zoom`), see
// apps/api/src/admin/instagram-reel.ts.

export interface ReelScene {
  canvas: HTMLCanvasElement
  seconds: number
  zoom: boolean
}

const REEL_W = CARD_WIDTH
const REEL_H = STORY_HEIGHT

function reelCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = REEL_W
  canvas.height = REEL_H
  return [canvas, canvas.getContext('2d')!]
}

function reelHeader(ctx: CanvasRenderingContext2D, color = '#fff') {
  ctx.fillStyle = color
  ctx.font = '700 56px Poppins'
  centered(ctx, 'DóndeTa', 200, REEL_W)
}

export function drawReelScenes(product: Product, kind: CardKind, image: HTMLImageElement | null, site: string): ReelScene[] {
  const scenes: ReelScene[] = []
  // The reveal has no room for "(agotado)": show only stores that have it.
  const all = distinctOffers(product)
  const inStock = all.filter(offer => offer.available)
  const offers = (inStock.length ? inStock : all).slice(0, 4)
  const best = offers[0]

  // 1. Hook: the number, huge.
  {
    const [canvas, ctx] = reelCanvas()
    greenBackground(ctx, REEL_W, REEL_H)
    reelHeader(ctx)
    ctx.fillStyle = '#fff'
    if (kind.type === 'comparison') {
      ctx.font = '700 92px Poppins'
      centered(ctx, 'Mismo modelo,', 760, REEL_W)
      ctx.font = '700 150px Poppins'
      ctx.fillStyle = C.yellow
      centered(ctx, formatPrice(kind.savings), 950, REEL_W)
      ctx.fillStyle = '#fff'
      ctx.font = '700 92px Poppins'
      centered(ctx, 'de diferencia 😳', 1100, REEL_W)
    } else {
      ctx.font = '700 170px Poppins'
      ctx.fillStyle = C.yellow
      centered(ctx, `-${kind.pct}%`, 900, REEL_W)
      ctx.fillStyle = '#fff'
      ctx.font = '700 92px Poppins'
      centered(ctx, '¡Bajó de precio!', 1060, REEL_W)
    }
    ctx.font = '500 44px "DM Sans"'
    ctx.globalAlpha = 0.9
    centered(ctx, kind.type === 'comparison' ? 'Mira dónde está más barato 👇' : 'Mira cuánto cuesta ahora 👇', 1300, REEL_W)
    ctx.globalAlpha = 1
    scenes.push({ canvas, seconds: 2.6, zoom: true })
  }

  // 2. The product.
  {
    const [canvas, ctx] = reelCanvas()
    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, REEL_W, REEL_H)
    reelHeader(ctx, C.green)
    const box = { x: 70, y: 340, w: REEL_W - 140, h: 900 }
    roundRect(ctx, box.x, box.y, box.w, box.h, 48)
    ctx.fillStyle = '#fff'
    ctx.fill()
    drawContained(ctx, image, box, 100)
    ctx.fillStyle = C.navy
    ctx.font = '600 56px Poppins'
    for (const [i, line] of wrap(ctx, product.name, REEL_W - 160, 3).entries()) centered(ctx, line, 1380 + i * 72, REEL_W)
    scenes.push({ canvas, seconds: 2.4, zoom: true })
  }

  // 3. The reveal.
  if (kind.type === 'comparison' && offers.length > 1) {
    // Priciest first, cheapest last -- one row more per scene.
    const order = [...offers].reverse()
    for (let shown = 1; shown <= order.length; shown++) {
      const [canvas, ctx] = reelCanvas()
      ctx.fillStyle = C.bg
      ctx.fillRect(0, 0, REEL_W, REEL_H)
      reelHeader(ctx, C.green)
      ctx.fillStyle = C.navy
      ctx.font = '700 72px Poppins'
      centered(ctx, "¿Dónde 'ta más barato?", 420, REEL_W)
      const last = shown === order.length
      order.slice(0, shown).forEach((offer, i) => {
        const y = 560 + i * 200
        const isBest = last && offer === best
        roundRect(ctx, 80, y, REEL_W - 160, 160, 36)
        ctx.fillStyle = isBest ? C.green : '#fff'
        ctx.fill()
        ctx.fillStyle = isBest ? '#fff' : C.navy
        ctx.font = `${isBest ? 700 : 500} 48px "DM Sans"`
        ctx.fillText(offer.store + (isBest ? '  ✓' : ''), 130, y + 96)
        ctx.font = '700 56px Poppins'
        const price = formatPrice(getOfferTotal(offer))
        ctx.fillText(price, REEL_W - 130 - ctx.measureText(price).width, y + 100)
      })
      if (last) {
        ctx.fillStyle = C.orange
        ctx.font = '700 64px Poppins'
        centered(ctx, `Ahorras ${formatPrice(kind.savings)}`, 560 + order.length * 200 + 120, REEL_W)
      }
      scenes.push({ canvas, seconds: last ? 2.8 : 1.3, zoom: false })
    }
  } else if (best) {
    const steps = kind.type === 'drop' ? [false, true] : [true]
    for (const showNow of steps) {
      const [canvas, ctx] = reelCanvas()
      ctx.fillStyle = C.bg
      ctx.fillRect(0, 0, REEL_W, REEL_H)
      reelHeader(ctx, C.green)
      if (kind.type === 'drop') {
        ctx.fillStyle = C.navy400
        ctx.font = '500 64px "DM Sans"'
        centered(ctx, 'Antes', 700, REEL_W)
        ctx.font = '700 110px Poppins'
        const was = formatPrice(Math.round(kind.oldPrice))
        centered(ctx, was, 840, REEL_W)
        if (showNow) {
          const wasW = ctx.measureText(was).width
          ctx.fillRect((REEL_W - wasW) / 2, 805, wasW, 8)
        }
      }
      if (showNow) {
        ctx.fillStyle = C.navy
        ctx.font = '500 64px "DM Sans"'
        centered(ctx, 'Ahora', 1060, REEL_W)
        ctx.fillStyle = C.greenDark
        ctx.font = '700 140px Poppins'
        centered(ctx, formatPrice(getOfferTotal(best)), 1220, REEL_W)
        ctx.fillStyle = C.navy
        ctx.font = '500 56px "DM Sans"'
        centered(ctx, `en ${best.store}`, 1320, REEL_W)
      }
      scenes.push({ canvas, seconds: showNow ? 2.8 : 1.4, zoom: false })
    }
  }

  // 4. Call to action.
  {
    const [canvas, ctx] = reelCanvas()
    ctx.fillStyle = C.navy
    ctx.fillRect(0, 0, REEL_W, REEL_H)
    reelHeader(ctx)
    ctx.fillStyle = '#fff'
    ctx.font = '700 96px Poppins'
    centered(ctx, 'Compara antes', 780, REEL_W)
    centered(ctx, 'de comprar', 900, REEL_W)
    ctx.font = '700 64px Poppins'
    const ctaW = ctx.measureText(site).width + 140
    roundRect(ctx, (REEL_W - ctaW) / 2, 1020, ctaW, 140, 70)
    ctx.fillStyle = C.green
    ctx.fill()
    ctx.fillStyle = '#fff'
    centered(ctx, site, 1113, REEL_W)
    ctx.font = '500 48px "DM Sans"'
    ctx.fillStyle = C.yellow
    centered(ctx, `Síguenos para más ${profile().followLine}`, 1330, REEL_W)
    scenes.push({ canvas, seconds: 2.8, zoom: true })
  }

  return scenes
}
