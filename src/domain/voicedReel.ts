// Voiced Reels (Instagram autopilot, Wednesday and Friday): what the Reel is
// about and what the voice says. Pure -- the canvas drawing lives in
// src/screens/admin/voicedReelCard.ts and the voice + video in
// apps/api/src/admin (elevenlabs.ts, instagram-reel.ts).

import { getBestOffer, getHighestAvailableOffer, getOfferTotal, getTopComparisons } from './offers'
import type { Product } from '../types'

// ---------------------------------------------------------------------------
// Numbers in Spanish words, for the text-to-speech: "RD$2,195" read as digits
// sounds wrong, "dos mil ciento noventa y cinco pesos" doesn't.

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

// "uno" -> "un" (and "veintiuno" -> "veintiún") before a masculine noun or "mil".
function apocope(words: string): string {
  return words.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')
}

function below1000(n: number): string {
  if (n === 100) return 'cien'
  const h = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (h) parts.push(HUNDREDS[h])
  if (rest) {
    if (rest < 30) parts.push(UNITS[rest])
    else parts.push(TENS[Math.floor(rest / 10)] + (rest % 10 ? ` y ${UNITS[rest % 10]}` : ''))
  }
  return parts.join(' ')
}

function below1e6(n: number): string {
  const thousands = Math.floor(n / 1000)
  const rest = n % 1000
  const parts: string[] = []
  if (thousands === 1) parts.push('mil')
  else if (thousands > 1) parts.push(`${apocope(below1000(thousands))} mil`)
  if (rest) parts.push(below1000(rest))
  return parts.join(' ')
}

// Integer in words. `masculine` apocopates a final "uno" ("veintiún pesos").
export function spanishNumber(value: number, options: { masculine?: boolean } = {}): string {
  const n = Math.round(Math.abs(value))
  if (n === 0) return 'cero'
  const millions = Math.floor(n / 1_000_000)
  const rest = n % 1_000_000
  const parts: string[] = []
  if (millions === 1) parts.push('un millón')
  else if (millions > 1) parts.push(`${apocope(below1e6(millions))} millones`)
  if (rest) parts.push(below1e6(rest))
  const words = parts.join(' ')
  return options.masculine ? apocope(words) : words
}

// "dos mil ciento noventa y cinco pesos", "un peso", "un millón de pesos".
export function spokenPrice(value: number): string {
  const n = Math.round(Math.abs(value))
  if (n === 1) return 'un peso'
  const words = spanishNumber(n, { masculine: true })
  return n >= 1_000_000 && n % 1_000_000 === 0 ? `${words} de pesos` : `${words} pesos`
}

// "treinta y ocho por ciento"; 100 % or more reads better as "más del doble".
export function spokenPct(pct: number): string {
  const n = Math.round(Math.abs(pct))
  if (n >= 100) return 'más del doble'
  return `${spanishNumber(n)} por ciento`
}

// What the voice calls the product: the words before the brand or the model
// code ("Lavadora Maytag Automatica 22 kg 7MMHW6621HC" -> "lavadora").
// Product names are long and full of codes that sound terrible spoken.
// Names that start with the brand ("Samsung 98\" Smart TV…") fall back to
// what the category is called.
const TRAILING = new Set(['de', 'con', 'para', 'a', 'en', 'y', 'el', 'la', 'del'])
const CATEGORY_NOUNS: Array<[RegExp, string]> = [
  [/televis|tv/, 'televisor'],
  [/nevera|refriger/, 'nevera'],
  [/lavadora/, 'lavadora'],
  [/secadora/, 'secadora'],
  [/estufa/, 'estufa'],
  [/aire/, 'aire acondicionado'],
  [/microondas/, 'microondas'],
  [/abanico|ventilador/, 'abanico'],
  [/licuadora/, 'licuadora'],
  [/freidora/, 'freidora'],
  [/plancha/, 'plancha'],
]
export function spokenProductName(name: string, brand = '', categoryId = ''): string {
  const brandWords = brand.toLowerCase().split(/[\s+&]+/).filter(Boolean)
  const words: string[] = []
  for (const raw of name.split(/\s+/)) {
    const word = raw.toLowerCase().replace(/[.,;:()"]/g, '')
    if (!words.length && brandWords.includes(word)) continue
    if (!word || /\d/.test(word) || brandWords.includes(word) || word === '+' || word === '-' || word === '/') break
    words.push(word)
    if (words.length === 4) break
  }
  while (words.length && TRAILING.has(words[words.length - 1])) words.pop()
  if (!words.length) return CATEGORY_NOUNS.find(([pattern]) => pattern.test(categoryId))?.[1] ?? ''
  return words.join(' ')
}

// ---------------------------------------------------------------------------
// What the Reel is about. Four kinds, rotated so the week doesn't repeat.

export type VoicedKind = 'raised' | 'real' | 'comparison' | 'inflated'
export const VOICED_ROTATION: VoicedKind[] = ['raised', 'real', 'comparison', 'inflated']

// One item of GET /price-check (apps/api/src/products/price-check.ts).
export interface PriceCheckItem {
  productId: string
  productName: string
  productSlug: string
  image: string
  store: string
  current: number
  reference: number
  referenceDate: string
  peak: number
  peakDate: string
  pctVsReference: number
  pctBelowPeak: number
}
export interface PriceCheckReport {
  lowest: PriceCheckItem[]
  inflated: PriceCheckItem[]
  raised: PriceCheckItem[]
}

export interface VoicedPlan {
  kind: VoicedKind
  productId: string
  name: string
  brand: string
  /** Picks the b-roll for the product scene (appliance vs other). */
  categoryId: string
  imageUrl: string | null
  store: string
  /** Today's price at `store` (for comparison: the cheapest store). */
  current: number
  /** raised/real: lowest of the last 30 days; inflated: what it cost weeks ago; comparison: priciest store. */
  before: number
  /** raised: % above the 30-day low; inflated: % it "dropped" from its peak; real: % below. */
  pct: number
  /** inflated: the peak it "dropped" from. comparison: unused. */
  peak: number
  /** comparison: the priciest store. */
  otherStore: string
  savings: number
}

// Thresholds: below these the story isn't worth a voice-over.
const MIN_RAISED_PCT = 10
const MIN_REAL_PCT = 5
const MIN_INFLATED_PCT = 10

function eligible(product: Product | undefined, exclude: Set<string>): product is Product {
  return Boolean(product && product.categoryId !== 'gaming' && product.image && !exclude.has(product.id))
}

function fromCheck(kind: VoicedKind, item: PriceCheckItem, product: Product): VoicedPlan {
  return {
    kind,
    productId: product.id,
    name: product.name,
    brand: product.brand,
    categoryId: product.categoryId,
    imageUrl: product.image || item.image || null,
    store: item.store,
    current: item.current,
    before: item.reference,
    pct: kind === 'inflated' ? item.pctBelowPeak : Math.abs(item.pctVsReference),
    peak: item.peak,
    otherStore: '',
    savings: 0,
  }
}

function planFor(kind: VoicedKind, report: PriceCheckReport | null, products: Map<string, Product>, exclude: Set<string>, minSavings: (product: Product, savings: number) => boolean): VoicedPlan | null {
  if (kind === 'comparison') {
    for (const entry of getTopComparisons([...products.values()], 30)) {
      if (!eligible(entry.product, exclude) || !minSavings(entry.product, entry.savings)) continue
      const best = getBestOffer(entry.product.prices)
      const priciest = getHighestAvailableOffer(entry.product.prices)
      if (!best || !priciest || best.store === priciest.store) continue
      return {
        kind, productId: entry.product.id, name: entry.product.name, brand: entry.product.brand, categoryId: entry.product.categoryId, imageUrl: entry.product.image || null,
        store: best.store, current: getOfferTotal(best), before: getOfferTotal(priciest), pct: 0, peak: 0,
        otherStore: priciest.store, savings: Math.round(getOfferTotal(priciest) - getOfferTotal(best)),
      }
    }
    return null
  }
  if (!report) return null
  const list = kind === 'raised' ? report.raised : kind === 'real' ? report.lowest : report.inflated
  const ranked = [...list]
    .filter(item => item.store !== 'Eneba')
    .filter(item => kind === 'raised' ? item.pctVsReference >= MIN_RAISED_PCT
      : kind === 'real' ? item.pctVsReference <= -MIN_REAL_PCT
        : item.pctBelowPeak >= MIN_INFLATED_PCT)
    .sort((a, b) => kind === 'inflated' ? b.pctBelowPeak - a.pctBelowPeak : Math.abs(b.pctVsReference) - Math.abs(a.pctVsReference))
  for (const item of ranked) {
    const product = products.get(item.productId)
    if (eligible(product, exclude)) return fromCheck(kind, item, product)
  }
  return null
}

// The kind for this slot (rotation), or the next one that has a product.
export function pickVoicedPlan(
  slot: number,
  report: PriceCheckReport | null,
  products: Product[],
  exclude: Set<string>,
  minSavings: (product: Product, savings: number) => boolean = () => true,
): VoicedPlan | null {
  const byId = new Map(products.map(p => [p.id, p]))
  for (let i = 0; i < VOICED_ROTATION.length; i++) {
    const kind = VOICED_ROTATION[(slot + i) % VOICED_ROTATION.length]
    const plan = planFor(kind, report, byId, exclude, minSavings)
    if (plan) return plan
  }
  return null
}

// ---------------------------------------------------------------------------
// The script: four scenes, each with what the voice says and the subtitle
// burned into the video (most people watch Reels muted).

export type VoicedScene = 'hook' | 'product' | 'how' | 'cta'
export interface VoicedLine {
  scene: VoicedScene
  spoken: string
  subtitle: string
}
// Black Friday week through Cyber Monday: 'black-friday' invites to the
// real-deals email sign-up (/cuenta/black-friday, needs email delivery live);
// 'black-friday-check' sends people to /black-friday instead.
export type VoicedSeason = 'black-friday' | 'black-friday-check' | null

const rd = (n: number) => `RD$${Math.round(n).toLocaleString('en-US')}`
const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export function voicedHook(kind: VoicedKind): string {
  switch (kind) {
    case 'raised': return '¿Vas a comprar? Ojo con este precio.'
    case 'real': return 'Esta sí es una oferta real.'
    case 'comparison': return 'Mismo modelo, distinto precio.'
    case 'inflated': return '¿Rebaja? Mira bien antes de comprar.'
  }
}

export function voicedScript(plan: VoicedPlan, season: VoicedSeason = null): VoicedLine[] {
  const what = capitalize(spokenProductName(plan.name, plan.brand, plan.categoryId)) || 'Este producto'
  const hook = voicedHook(plan.kind)
  let product: VoicedLine
  switch (plan.kind) {
    case 'raised':
      product = {
        scene: 'product',
        spoken: `${what}: hace unas semanas costaba ${spokenPrice(plan.before)} en ${plan.store}. Hoy cuesta ${spokenPrice(plan.current)}. Si después le hacen una rebaja hasta ese precio… no es oferta.`,
        subtitle: `Hace unas semanas: ${rd(plan.before)}. Hoy: ${rd(plan.current)} en ${plan.store}. Una “rebaja” hasta ese precio no es oferta.`,
      }
      break
    case 'real':
      product = {
        scene: 'product',
        spoken: `${what} en ${plan.store}: hoy cuesta ${spokenPrice(plan.current)}. Lo más bajo de los últimos treinta días era ${spokenPrice(plan.before)}. Es su precio más bajo del mes.`,
        subtitle: `Hoy: ${rd(plan.current)} en ${plan.store}. Lo más bajo en 30 días era ${rd(plan.before)}.`,
      }
      break
    case 'comparison':
      product = {
        scene: 'product',
        spoken: `${what}: en ${plan.otherStore} cuesta ${spokenPrice(plan.before)}. En ${plan.store}, ${spokenPrice(plan.current)}. Te ahorras ${spokenPrice(plan.savings)} por el mismo modelo.`,
        subtitle: `${plan.otherStore}: ${rd(plan.before)} · ${plan.store}: ${rd(plan.current)}. Te ahorras ${rd(plan.savings)}.`,
      }
      break
    case 'inflated':
      product = {
        scene: 'product',
        spoken: `${what} en ${plan.store}: dice que bajó ${spokenPct(plan.pct)}. Pero hace unas semanas costaba ${spokenPrice(plan.before)}, y hoy cuesta ${spokenPrice(plan.current)}. Primero subió, después bajó.`,
        subtitle: `“Bajó” ${Math.round(plan.pct)}% desde ${rd(plan.peak)}, pero hace unas semanas costaba ${rd(plan.before)}. Hoy: ${rd(plan.current)}.`,
      }
      break
  }
  const how: VoicedLine = {
    scene: 'how',
    spoken: 'En DóndeTa comparamos cada precio con sus últimos treinta días, en las tiendas de aquí.',
    subtitle: 'En DóndeTa comparamos cada precio con sus últimos 30 días.',
  }
  const cta: VoicedLine = season === 'black-friday'
    ? { scene: 'cta', spoken: 'Crea tu cuenta gratis en DóndeTa… y te avisamos solo de las ofertas reales.', subtitle: 'Crea tu cuenta gratis y te avisamos solo de las ofertas reales.' }
    : season === 'black-friday-check'
      ? { scene: 'cta', spoken: 'Antes de comprar, búscalo en DóndeTa… y mira si la oferta es real. Es gratis.', subtitle: 'Antes de comprar, búscalo en DóndeTa y mira si la oferta es real. Es gratis.' }
      : { scene: 'cta', spoken: 'Antes de comprar, búscalo en DóndeTa. Es gratis.', subtitle: 'Antes de comprar, búscalo en DóndeTa. Es gratis.' }
  return [{ scene: 'hook', spoken: hook, subtitle: hook }, product, how, cta]
}

export function voicedCaption(plan: VoicedPlan, site: string, season: VoicedSeason = null): string {
  const first = {
    raised: `👀 Ojo: subió ${Math.round(plan.pct)}% — ${plan.name}`,
    real: `✅ Oferta real: ${plan.name} está más barato que en los últimos 30 días`,
    comparison: `💰 ${rd(plan.savings)} de diferencia por el mismo modelo — ${plan.name}`,
    inflated: `⚠️ ¿Rebaja? ${plan.name} subió antes de “bajar”`,
  }[plan.kind]
  const detail = {
    raised: `Hace unas semanas costaba ${rd(plan.before)} en ${plan.store}; hoy ${rd(plan.current)}.`,
    real: `Hoy ${rd(plan.current)} en ${plan.store}. Lo más bajo de los últimos 30 días era ${rd(plan.before)}.`,
    comparison: `✅ ${plan.store}: ${rd(plan.current)}\n▫️ ${plan.otherStore}: ${rd(plan.before)}`,
    inflated: `“Bajó” desde ${rd(plan.peak)}, pero hace unas semanas costaba ${rd(plan.before)}. Hoy: ${rd(plan.current)} en ${plan.store}.`,
  }[plan.kind]
  return [
    first,
    '',
    detail,
    '',
    season === 'black-friday'
      ? `📩 Crea tu cuenta gratis en ${site} y te avisamos solo de las ofertas reales de Black Friday (link en la bio).`
      : season === 'black-friday-check'
        ? `🔎 Antes de comprar en Black Friday, mira si la oferta es real: ${site}/black-friday (link en la bio).`
        : `🔎 Compara antes de comprar en ${site} (link en la bio).`,
    'Precios publicados en las tiendas en línea al momento de este post; pueden cambiar.',
    '',
    '#DóndeTa #OfertasRD #RepúblicaDominicana #ComparaPrecios' + (season ? ' #BlackFriday #BlackFridayRD' : ''),
  ].join('\n')
}
