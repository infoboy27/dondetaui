import { describe, expect, it } from 'vitest'
import {
  pickVoicedPlan,
  spanishNumber,
  spokenPct,
  spokenPrice,
  spokenProductName,
  voicedCaption,
  voicedScript,
  type PriceCheckItem,
  type PriceCheckReport,
  type VoicedPlan,
} from './voicedReel'
import type { Product } from '../types'

describe('spanishNumber', () => {
  it('reads units, tens and hundreds', () => {
    expect(spanishNumber(0)).toBe('cero')
    expect(spanishNumber(16)).toBe('dieciséis')
    expect(spanishNumber(21)).toBe('veintiuno')
    expect(spanishNumber(35)).toBe('treinta y cinco')
    expect(spanishNumber(100)).toBe('cien')
    expect(spanishNumber(101)).toBe('ciento uno')
    expect(spanishNumber(500)).toBe('quinientos')
    expect(spanishNumber(715)).toBe('setecientos quince')
    expect(spanishNumber(999)).toBe('novecientos noventa y nueve')
  })

  it('reads thousands with apocope before "mil"', () => {
    expect(spanishNumber(1000)).toBe('mil')
    expect(spanishNumber(2195)).toBe('dos mil ciento noventa y cinco')
    expect(spanishNumber(21000)).toBe('veintiún mil')
    expect(spanishNumber(31500)).toBe('treinta y un mil quinientos')
    expect(spanishNumber(101000)).toBe('ciento un mil')
    expect(spanishNumber(100000)).toBe('cien mil')
    expect(spanishNumber(111776)).toBe('ciento once mil setecientos setenta y seis')
  })

  it('reads millions', () => {
    expect(spanishNumber(1_000_000)).toBe('un millón')
    expect(spanishNumber(1_250_000)).toBe('un millón doscientos cincuenta mil')
    expect(spanishNumber(21_000_000)).toBe('veintiún millones')
    expect(spanishNumber(3_000_001)).toBe('tres millones uno')
  })

  it('apocopates a final "uno" before a masculine noun', () => {
    expect(spanishNumber(21, { masculine: true })).toBe('veintiún')
    expect(spanishNumber(41, { masculine: true })).toBe('cuarenta y un')
    expect(spanishNumber(1, { masculine: true })).toBe('un')
  })
})

describe('spokenPrice / spokenPct', () => {
  it('adds "pesos" and handles the special cases', () => {
    expect(spokenPrice(2195)).toBe('dos mil ciento noventa y cinco pesos')
    expect(spokenPrice(4495.4)).toBe('cuatro mil cuatrocientos noventa y cinco pesos')
    expect(spokenPrice(21)).toBe('veintiún pesos')
    expect(spokenPrice(1)).toBe('un peso')
    expect(spokenPrice(2_000_000)).toBe('dos millones de pesos')
  })

  it('says "más del doble" from 100 %', () => {
    expect(spokenPct(38.2)).toBe('treinta y ocho por ciento')
    expect(spokenPct(104.8)).toBe('más del doble')
  })
})

describe('spokenProductName', () => {
  it('stops at the brand or the model code', () => {
    expect(spokenProductName('Plancha De Vapor Black + Decker Trueglide Azul IRBD350', 'Black+Decker')).toBe('plancha de vapor')
    expect(spokenProductName('Lavadora Maytag Automatica 22 kg 7MMHW6621HC', 'Maytag')).toBe('lavadora')
    expect(spokenProductName('Abanico De Pared Tecnomaster M/UW2086 20" Blanco', 'Tecnomaster')).toBe('abanico de pared')
    expect(spokenProductName('Televisor 58 Pulgadas AIWA', 'Aiwa')).toBe('televisor')
    expect(spokenProductName('123ABC', '')).toBe('')
  })

  it('skips a leading brand and falls back to the category', () => {
    expect(spokenProductName('Samsung Nevera French Door', 'Samsung')).toBe('nevera french door')
    expect(spokenProductName('Samsung 249 cm / 98" Pulgadas Smart TV', 'Samsung', 'televisores')).toBe('televisor')
    expect(spokenProductName('LG 7MMX', 'LG', 'otra')).toBe('')
  })
})

const product = (id: string, extra: Partial<Product> = {}): Product => ({
  id,
  name: `Producto ${id}`,
  brand: 'Marca',
  image: `https://img/${id}.jpg`,
  category: 'Hogar',
  categoryId: 'hogar',
  prices: [],
  ...extra,
} as Product)

const item = (productId: string, extra: Partial<PriceCheckItem> = {}): PriceCheckItem => ({
  productId,
  productName: `Producto ${productId}`,
  productSlug: productId,
  image: '',
  store: 'Sirena',
  current: 4495,
  reference: 2195,
  referenceDate: '2026-10-14',
  peak: 2195,
  peakDate: '2026-10-14',
  pctVsReference: 104.8,
  pctBelowPeak: 0,
  ...extra,
})

describe('pickVoicedPlan', () => {
  const report: PriceCheckReport = {
    raised: [item('a', { pctVsReference: 30 }), item('b', { pctVsReference: 104.8 }), item('small', { pctVsReference: 4 })],
    lowest: [item('c', { current: 900, reference: 1000, pctVsReference: -10 })],
    inflated: [item('d', { current: 5000, reference: 4800, peak: 6500, pctBelowPeak: 23 })],
  }
  const products = ['a', 'b', 'c', 'd', 'small'].map(id => product(id))

  it('rotates the kind by slot and takes the strongest item', () => {
    expect(pickVoicedPlan(0, report, products, new Set())).toMatchObject({ kind: 'raised', productId: 'b', pct: 104.8, before: 2195, current: 4495 })
    expect(pickVoicedPlan(1, report, products, new Set())).toMatchObject({ kind: 'real', productId: 'c', pct: 10 })
    expect(pickVoicedPlan(3, report, products, new Set())).toMatchObject({ kind: 'inflated', productId: 'd', pct: 23, peak: 6500 })
  })

  it('skips gaming, products without a photo and recent ones, then falls through to the next kind', () => {
    const gaming = [product('b', { categoryId: 'gaming' }), product('a', { image: '' }), product('c'), product('d')]
    expect(pickVoicedPlan(0, report, gaming, new Set())).toMatchObject({ kind: 'real', productId: 'c' })
    expect(pickVoicedPlan(0, report, products, new Set(['b']))).toMatchObject({ kind: 'raised', productId: 'a' })
  })

  it('builds a cross-store comparison from the catalog', () => {
    const fridge = product('f', {
      prices: [
        { store: 'Corripio', price: 30000, shippingCost: 0, available: true },
        { store: 'Plaza Lama', price: 34000, shippingCost: 0, available: true },
      ] as Product['prices'],
    })
    expect(pickVoicedPlan(2, null, [fridge], new Set())).toMatchObject({
      kind: 'comparison', store: 'Corripio', otherStore: 'Plaza Lama', current: 30000, before: 34000, savings: 4000,
    })
    expect(pickVoicedPlan(2, null, [], new Set())).toBeNull()
  })
})

describe('voicedScript', () => {
  const plan: VoicedPlan = {
    kind: 'raised', productId: 'b', name: 'Plancha De Vapor Black + Decker Trueglide', brand: 'Black+Decker', categoryId: 'planchas', imageUrl: null,
    store: 'Sirena', current: 4495, before: 2195, pct: 104.8, peak: 2195, otherStore: '', savings: 0,
  }

  it('speaks prices in words and subtitles them in figures', () => {
    const [hook, scene, how, cta] = voicedScript(plan)
    expect(hook.scene).toBe('hook')
    expect(scene.spoken).toContain('Plancha de vapor: hace unas semanas costaba dos mil ciento noventa y cinco pesos en Sirena')
    expect(scene.subtitle).toContain('RD$2,195')
    expect(scene.subtitle).toContain('RD$4,495')
    expect(how.spoken).toContain('treinta días')
    expect(cta.spoken).toContain('búscalo en DóndeTa')
  })

  it('uses the sign-up call to action during Black Friday', () => {
    expect(voicedScript(plan, 'black-friday')[3].spoken).toContain('te avisamos solo de las ofertas reales')
    expect(voicedCaption(plan, 'dondeta.com.do', 'black-friday')).toContain('#BlackFriday')
    expect(voicedScript(plan, 'black-friday-check')[3].spoken).toContain('mira si la oferta es real')
    expect(voicedCaption(plan, 'dondeta.com.do', 'black-friday-check')).toContain('dondeta.com.do/black-friday')
  })

  it('has a line per kind', () => {
    for (const kind of ['real', 'comparison', 'inflated'] as const) {
      const lines = voicedScript({ ...plan, kind, otherStore: 'Jumbo', savings: 2300, peak: 6000 })
      expect(lines.map(l => l.scene)).toEqual(['hook', 'product', 'how', 'cta'])
      expect(lines[1].spoken).not.toMatch(/\d/)
    }
  })
})
