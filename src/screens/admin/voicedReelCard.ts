import type { VoicedLine, VoicedPlan, VoicedSeason } from '../../domain/voicedReel'

// Voiced Reel scenes (Wednesday and Friday autopilot Reels): transparent
// 1080x1920 PNG overlays. The worker lays each one over stock footage darkened
// with the brand navy, adds the voice and joins them with ffmpeg
// (apps/api/src/admin/instagram-reel.ts, voicedSceneArgs). Same look as the
// Black Friday paid Reel (marketing/black-friday-2026-11/make_reel_ad.py).

const W = 1080
const H = 1920
// Instagram's Reel UI covers the top ~220 px and the bottom ~380 px.
const TOP = 240
const BOTTOM = H - 400

const C = {
  green: '#00B894',
  yellow: '#FFD166',
  orange: '#FF9F1C',
  red: '#FF6B6B',
  navy: '#0F1D2D',
  muted: '#BAC6D2',
  row: 'rgba(20, 40, 58, 0.92)',
  subtitle: 'rgba(8, 16, 26, 0.88)',
}

const rd = (n: number) => `RD$${Math.round(n).toLocaleString('en-US')}`

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

// Centered, wrapped text; returns the y below the last line.
function centeredText(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, maxWidth = W - 160, lineHeight = 1.1): number {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const size = Number(/(\d+)px/.exec(font)?.[1] ?? 40)
  for (const line of wrapLines(ctx, text, maxWidth)) {
    ctx.fillText(line, W / 2, y)
    y += Math.round(size * lineHeight)
  }
  return y
}

function layer(logo: HTMLImageElement | null): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  if (logo) ctx.drawImage(logo, (W - logo.width) / 2, TOP - 20)
  return [canvas, ctx]
}

// Burned-in caption for muted viewers, just above Instagram's bottom UI.
function subtitle(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = '600 36px "DM Sans"'
  const lines = wrapLines(ctx, text, W - 200)
  const lineH = 50
  const y = BOTTOM - 40 - lines.length * lineH
  roundRect(ctx, 70, y - 22, W - 140, lines.length * lineH + 38, 24)
  ctx.fillStyle = C.subtitle
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * lineH))
}

function pill(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, background: string, color: string, font = '700 56px Poppins') {
  ctx.font = font
  const w = ctx.measureText(text).width + 64
  const h = Number(/(\d+)px/.exec(font)?.[1] ?? 56) + 32
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2)
  ctx.fillStyle = background
  ctx.fill()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy + 2)
}

const HEADINGS: Record<VoicedPlan['kind'], string> = {
  raised: 'Ojo: subió de precio',
  real: 'Oferta real',
  comparison: 'Mismo modelo',
  inflated: '¿Rebaja de verdad?',
}

function drawHook(ctx: CanvasRenderingContext2D, line: VoicedLine) {
  // The hook question, huge; its last line in green.
  ctx.font = '700 104px Poppins'
  const lines = wrapLines(ctx, line.subtitle, W - 160)
  let y = 1020 - (lines.length * 116) / 2
  lines.forEach((text, i) => {
    ctx.fillStyle = i === lines.length - 1 ? C.green : '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(text, W / 2, y)
    y += 116
  })
}

function drawProduct(ctx: CanvasRenderingContext2D, plan: VoicedPlan, photo: HTMLImageElement | null) {
  centeredText(ctx, HEADINGS[plan.kind], 450, '700 72px Poppins', '#fff')
  const box = 500
  const x = (W - box) / 2
  const y = 580
  roundRect(ctx, x, y, box, box, 40)
  ctx.fillStyle = '#fff'
  ctx.fill()
  if (photo) {
    const scale = Math.min((box - 60) / photo.width, (box - 60) / photo.height)
    const pw = photo.width * scale
    const ph = photo.height * scale
    ctx.drawImage(photo, x + (box - pw) / 2, y + (box - ph) / 2, pw, ph)
  }

  // Sticker on the photo's top-right corner.
  const sticker = {
    raised: { text: `+${Math.round(plan.pct)}%`, color: C.red },
    real: { text: `-${Math.round(plan.pct)}%`, color: C.green },
    inflated: { text: `“-${Math.round(plan.pct)}%”`, color: C.orange },
    comparison: { text: `-${rd(plan.savings)}`, color: C.green },
  }[plan.kind]
  ctx.font = '700 56px Poppins'
  const sw = ctx.measureText(sticker.text).width + 64
  pill(ctx, sticker.text, Math.min(W - 60 - sw / 2, x + box - sw / 2 + 40), y + 10, sticker.color, C.navy)

  // Before / today, stacked so long prices never collide.
  let ty = y + box + 44
  if (plan.kind === 'comparison') {
    ty = centeredText(ctx, `${plan.otherStore}: ${rd(plan.before)}`, ty, '600 44px "DM Sans"', C.muted) + 12
    ctx.font = '700 84px Poppins'
    const size = ctx.measureText(`${plan.store}: ${rd(plan.current)}`).width > W - 160 ? 64 : 84
    centeredText(ctx, `${plan.store}: ${rd(plan.current)}`, ty, `700 ${size}px Poppins`, C.green)
    return
  }
  const before = plan.kind === 'real' ? `Lo más bajo en 30 días: ${rd(plan.before)}` : `Hace unas semanas: ${rd(plan.before)}`
  ty = centeredText(ctx, before, ty, '600 42px "DM Sans"', C.muted) + 10
  const color = plan.kind === 'raised' ? C.red : plan.kind === 'real' ? C.green : C.orange
  ty = centeredText(ctx, `Hoy: ${rd(plan.current)}`, ty, '700 92px Poppins', color)
  centeredText(ctx, `en ${plan.store}`, ty - 6, '500 40px "DM Sans"', '#fff')
}

function drawHow(ctx: CanvasRenderingContext2D, stores: string[]) {
  let y = centeredText(ctx, 'Comparamos cada precio con sus', 450, '700 60px Poppins', '#fff')
  y = centeredText(ctx, 'últimos 30 días', y, '700 84px Poppins', C.green) + 36
  const rows: Array<[string, string, string]> = [
    [C.green, 'Ofertas reales', 'más baratas que en 30 días'],
    [C.orange, 'Rebajas infladas', 'subieron antes de “bajar”'],
    [C.red, 'Subieron de precio', 'ojo antes de comprar'],
  ]
  for (const [color, title, sub] of rows) {
    roundRect(ctx, 90, y, W - 180, 160, 30)
    ctx.fillStyle = C.row
    ctx.fill()
    roundRect(ctx, 90, y, 22, 160, 11)
    ctx.fillStyle = color
    ctx.fill()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#fff'
    ctx.font = '700 48px Poppins'
    ctx.fillText(title, 150, y + 28)
    ctx.fillStyle = C.muted
    ctx.font = '500 34px "DM Sans"'
    ctx.fillText(sub, 150, y + 94)
    y += 186
  }
  if (stores.length) centeredText(ctx, stores.slice(0, 5).join(' · '), y + 16, '600 32px "DM Sans"', C.yellow, W - 180)
}

function drawCta(ctx: CanvasRenderingContext2D, season: VoicedSeason, site: string) {
  const title = season === 'black-friday' ? ['Te avisamos', 'solo de las', 'ofertas reales']
    : season === 'black-friday-check' ? ['Antes de comprar,', 'revisa si la oferta', 'es real']
      : ['Compara', 'antes de', 'comprar']
  let y = 560
  const size = season === 'black-friday-check' ? 92 : 108
  title.forEach((text, i) => {
    y = centeredText(ctx, text, y, `700 ${size}px Poppins`, i === title.length - 1 ? C.green : '#fff')
  })
  y += 40
  const sub = season === 'black-friday'
    ? 'Crea tu cuenta gratis y te llega por correo lo que de verdad bajó.'
    : 'Precios de las tiendas de aquí, con su historial de 30 días. Gratis.'
  const button = season === 'black-friday' ? 'Regístrate gratis' : season === 'black-friday-check' ? `${site}/black-friday` : 'Búscalo gratis'
  y = centeredText(ctx, sub, y, '500 42px "DM Sans"', C.muted, W - 220) + 70
  pill(ctx, button, W / 2, y, C.green, C.navy, season === 'black-friday-check' ? '700 44px Poppins' : '700 52px Poppins')
  if (season !== 'black-friday-check') centeredText(ctx, site, y + 80, '700 48px Poppins', '#fff')
}

export function drawVoicedScenes(
  plan: VoicedPlan,
  lines: VoicedLine[],
  photo: HTMLImageElement | null,
  logo: HTMLImageElement | null,
  site: string,
  season: VoicedSeason,
  stores: string[],
): HTMLCanvasElement[] {
  return lines.map(line => {
    const [canvas, ctx] = layer(logo)
    if (line.scene === 'hook') drawHook(ctx, line)
    else if (line.scene === 'product') drawProduct(ctx, plan, photo)
    else if (line.scene === 'how') drawHow(ctx, stores)
    else drawCta(ctx, season, site)
    subtitle(ctx, line.subtitle)
    return canvas
  })
}
