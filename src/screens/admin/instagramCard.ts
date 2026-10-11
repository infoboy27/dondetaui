import { formatPrice } from '../../domain/currency'
import { getOfferTotal, rankOffers } from '../../domain/offers'
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

export function caption(product: Product, kind: CardKind, site: string): string {
  const offers = rankOffers(product.prices).filter((offer, i, all) => all.findIndex(o => o.store === offer.store) === i)
  const tags = '#DóndeTa #RepúblicaDominicana #RD #Ofertas #Electrodomésticos #Ahorro'
  if (kind.type === 'comparison') {
    const best = offers[0]
    const worst = offers[offers.length - 1]
    return [
      `💰 ${product.name}`,
      '',
      `✅ ${best.store}: ${formatPrice(getOfferTotal(best))}`,
      ...offers.slice(1).map(o => `▫️ ${o.store}: ${formatPrice(getOfferTotal(o))}${o.available ? '' : ' (agotado)'}`),
      '',
      `Comparando te ahorras ${formatPrice(kind.savings)} frente a ${worst.store}.`,
      `Busca cualquier electrodoméstico en 👉 ${site}`,
      '',
      tags,
    ].join('\n')
  }
  const best = offers[0]
  return [
    `📉 ¡Bajó ${kind.pct}%! ${product.name}`,
    '',
    `Ahora ${formatPrice(getOfferTotal(best))} en ${best.store} (antes ${formatPrice(Math.round(kind.oldPrice))}).`,
    `Activa una alerta de precio en 👉 ${site}`,
    '',
    tags,
  ].join('\n')
}
