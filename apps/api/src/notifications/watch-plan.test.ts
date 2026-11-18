import { describe, expect, it } from 'vitest'
import { addDays } from './notification-rules'
import { planWatchNotifications, productUrl, sentKey, type PlanInput, type ProductSnapshot, type WatchRecipient } from './watch-plan'

const NOW = new Date('2026-11-17T15:00:00Z') // Tuesday, 11:00 in DR, outside Black Friday week
const TODAY = '2026-11-17'
const fmt = (price: number) => `RD$${price.toLocaleString('en-US')}`

function snapshot(id: string, over: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    productId: id,
    name: `Producto ${id}`,
    slug: id,
    imageUrl: null,
    current: 1000,
    store: 'Jumbo',
    freshInStock: 1,
    freshOutOfStock: 0,
    history: Array.from({ length: 30 }, (_, i) => ({ date: addDays(TODAY, -(30 - i)), price: 1000 })),
    ...over,
  }
}

function recipient(id: string, prefs: unknown = null): WatchRecipient {
  return { userId: id, email: `${id}@example.com`, name: null, pushTokens: [], prefs }
}

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    now: NOW,
    offsetHours: -4,
    siteUrl: 'https://dondeta.com.do',
    formatPrice: fmt,
    recipients: [recipient('u1')],
    watched: [{ userId: 'u1', productId: 'p1' }],
    snapshots: new Map([['p1', snapshot('p1')]]),
    stockStates: new Map(),
    cardPromotions: [],
    retailerOffers: [],
    savedSearchMatches: [],
    sent: new Set(),
    ...over,
  }
}

describe('planWatchNotifications: back_in_stock', () => {
  it('notifies watchers when a product comes back, and saves the new state', () => {
    const plan = planWatchNotifications(input({ stockStates: new Map([['p1', 'out_of_stock']]) }))
    expect(plan.notifications.map(n => n.type)).toEqual(['back_in_stock'])
    expect(plan.notifications[0]).toMatchObject({ userId: 'u1', productId: 'p1', keys: [`p1:${TODAY}`], channel: 'price-alerts' })
    expect(plan.notifications[0]?.email.subject).toBe('Volvió a estar disponible: Producto p1')
    expect(plan.stockUpdates).toEqual([{ productId: 'p1', state: 'in_stock' }])
  })

  it('records the first state silently', () => {
    const plan = planWatchNotifications(input())
    expect(plan.notifications).toEqual([])
    expect(plan.stockUpdates).toEqual([{ productId: 'p1', state: 'in_stock' }])
  })

  it('respects the switch and the dedupe marker', () => {
    const off = planWatchNotifications(input({ recipients: [recipient('u1', { back_in_stock: false })], stockStates: new Map([['p1', 'out_of_stock']]) }))
    expect(off.notifications).toEqual([])
    expect(off.stockUpdates).toEqual([{ productId: 'p1', state: 'in_stock' }])
    const sent = planWatchNotifications(input({ stockStates: new Map([['p1', 'out_of_stock']]), sent: new Set([sentKey('u1', 'back_in_stock', `p1:${TODAY}`)]) }))
    expect(sent.notifications).toEqual([])
  })

  it('ignores watchers that are not recipients', () => {
    const plan = planWatchNotifications(input({ recipients: [], stockStates: new Map([['p1', 'out_of_stock']]) }))
    expect(plan.notifications).toEqual([])
  })
})

describe('planWatchNotifications: lowest_price_90d', () => {
  it('fires on a 90-day low, once a day', () => {
    const snapshots = new Map([['p1', snapshot('p1', { current: 900 })]])
    const plan = planWatchNotifications(input({ snapshots }))
    expect(plan.notifications.map(n => n.type)).toEqual(['lowest_price_90d'])
    expect(plan.notifications[0]?.keys).toEqual([`p1:${TODAY}`])
  })

  it('stays quiet when the price-drop alert already said it (shared marker)', () => {
    const snapshots = new Map([['p1', snapshot('p1', { current: 900 })]])
    const plan = planWatchNotifications(input({ snapshots, sent: new Set([sentKey('u1', 'lowest_price_90d', `p1:${TODAY}`)]) }))
    expect(plan.notifications).toEqual([])
  })

  it('stays quiet when turned off', () => {
    const snapshots = new Map([['p1', snapshot('p1', { current: 900 })]])
    expect(planWatchNotifications(input({ snapshots, recipients: [recipient('u1', { lowest_price_90d: false })] })).notifications).toEqual([])
  })
})

describe('planWatchNotifications: card_discount', () => {
  const promotion = {
    id: 'promo1', retailerId: 'r1', store: 'Jumbo', bank: 'BHD', card: null, percent: 10, kind: 'discount' as const,
    weekdays: [2], startsOn: TODAY, endsOn: '2026-11-30', createdOn: '2026-11-15',
  }

  it('groups the saved products at that store into one message', () => {
    const plan = planWatchNotifications(input({
      watched: [{ userId: 'u1', productId: 'p1' }, { userId: 'u1', productId: 'p2' }, { userId: 'u1', productId: 'p3' }],
      snapshots: new Map([['p1', snapshot('p1')], ['p2', snapshot('p2')], ['p3', snapshot('p3')]]),
      stockStates: new Map([['p1', 'in_stock'], ['p2', 'in_stock'], ['p3', 'in_stock']]),
      cardPromotions: [promotion],
      retailerOffers: [{ productId: 'p1', retailerId: 'r1', price: 1000 }, { productId: 'p2', retailerId: 'r1', price: 2000 }, { productId: 'p3', retailerId: 'r9', price: 5 }],
    }))
    expect(plan.notifications).toHaveLength(1)
    const [n] = plan.notifications
    expect(n?.keys).toEqual(['promo1'])
    expect(n?.email.subject).toBe('Nuevo descuento con tarjeta en Jumbo: 10 % con tarjetas BHD los martes')
    expect(n?.email.text).toContain('hasta el 30 de noviembre')
    expect(n?.email.text).toContain('Producto p2')
    expect(n?.email.text).not.toContain('Producto p3')
    expect(n?.push.body).toContain('Producto p2 y 1 producto más')
  })

  it('skips old promotions, users without products there, and users who turned it off', () => {
    const base = { stockStates: new Map([['p1', 'in_stock' as const]]), retailerOffers: [{ productId: 'p1', retailerId: 'r1', price: 1000 }] }
    expect(planWatchNotifications(input({ ...base, cardPromotions: [{ ...promotion, startsOn: '2026-11-01', createdOn: '2026-11-01' }] })).notifications).toEqual([])
    expect(planWatchNotifications(input({ ...base, cardPromotions: [promotion], retailerOffers: [] })).notifications).toEqual([])
    expect(planWatchNotifications(input({ ...base, cardPromotions: [promotion], recipients: [recipient('u1', { card_discount: false })] })).notifications).toEqual([])
    expect(planWatchNotifications(input({ ...base, cardPromotions: [promotion], sent: new Set([sentKey('u1', 'card_discount', 'promo1')]) })).notifications).toEqual([])
  })
})

describe('planWatchNotifications: saved_search', () => {
  const match = (productId: string, over: Record<string, unknown> = {}) => ({
    searchId: 's1', userId: 'u1', query: 'nevera', maxPrice: 20000, searchCreatedAt: '2026-11-10T00:00:00.000Z',
    productId, name: `Nevera ${productId}`, slug: productId, imageUrl: null, productCreatedAt: '2026-01-01T00:00:00.000Z',
    store: 'Sirena', current: 19000, previous: 21000, ...over,
  })

  it('sends one message per search with the products that qualify, cheapest first', () => {
    const plan = planWatchNotifications(input({
      stockStates: new Map([['p1', 'in_stock']]),
      savedSearchMatches: [match('a'), match('b', { current: 15000, previous: 16000 }), match('c', { current: 18000, productCreatedAt: '2026-11-12T00:00:00.000Z', previous: null })],
    }))
    expect(plan.notifications).toHaveLength(1)
    const [n] = plan.notifications
    expect(n?.type).toBe('saved_search')
    expect(n?.keys).toEqual(['s1:c', 's1:a'])
    expect(n?.email.text).toContain('Nuevo en DóndeTa')
    expect(n?.email.text).toContain('Bajó de RD$21,000')
    expect(n?.email.text).toContain('por RD$20,000 o menos')
  })

  it('skips products already notified for that search, and users who turned it off', () => {
    const base = { stockStates: new Map([['p1', 'in_stock' as const]]), savedSearchMatches: [match('a')] }
    expect(planWatchNotifications(input({ ...base, sent: new Set([sentKey('u1', 'saved_search', 's1:a')]) })).notifications).toEqual([])
    expect(planWatchNotifications(input({ ...base, recipients: [recipient('u1', { saved_search: false })] })).notifications).toEqual([])
  })
})

describe('planWatchNotifications: weekly_digest (opt-in)', () => {
  const sunday = new Date('2026-11-22T15:00:00Z')
  // 900 a month ago (so 950 today is not a 90-day low), 1000 for the last three weeks.
  const history = Array.from({ length: 30 }, (_, i) => ({ date: addDays('2026-11-22', -(30 - i)), price: i < 5 ? 900 : 1000 }))
  const base = { now: sunday, stockStates: new Map([['p1', 'in_stock' as const]]), snapshots: new Map([['p1', snapshot('p1', { current: 950, history })]]) }

  it('is off by default', () => {
    expect(planWatchNotifications(input(base)).notifications).toEqual([])
  })

  it('sends the summary once per week to those who opted in', () => {
    const plan = planWatchNotifications(input({ ...base, recipients: [recipient('u1', { weekly_digest: true })] }))
    expect(plan.notifications.map(n => n.type)).toEqual(['weekly_digest'])
    expect(plan.notifications[0]).toMatchObject({ keys: ['2026-W47'], channel: 'promotions' })
    expect(plan.notifications[0]?.email.subject).toBe('Tu resumen de la semana: 1 bajó de precio')
    const again = planWatchNotifications(input({ ...base, recipients: [recipient('u1', { weekly_digest: true })], sent: new Set([sentKey('u1', 'weekly_digest', '2026-W47')]) }))
    expect(again.notifications).toEqual([])
  })

  it('sends nothing when nothing changed, or outside Sunday morning', () => {
    const flat = { ...base, snapshots: new Map([['p1', snapshot('p1', { current: 1000, history })]]) }
    expect(planWatchNotifications(input({ ...flat, recipients: [recipient('u1', { weekly_digest: true })] })).notifications).toEqual([])
    expect(planWatchNotifications(input({ ...base, now: NOW, recipients: [recipient('u1', { weekly_digest: true })] })).notifications).toEqual([])
  })
})

describe('planWatchNotifications: deal_real (opt-in, seasonal)', () => {
  const blackFriday = new Date('2026-11-27T15:00:00Z')
  const history = Array.from({ length: 30 }, (_, i) => ({ date: addDays('2026-11-27', -(30 - i)), price: 1000 + (i % 2) * 100 }))
  const base = {
    now: blackFriday,
    stockStates: new Map([['p1', 'in_stock' as const]]),
    snapshots: new Map([['p1', snapshot('p1', { current: 1000, history })]]),
  }

  it('is off by default (promotional)', () => {
    expect(planWatchNotifications(input(base)).notifications).toEqual([])
  })

  it('sends one message a day to those who opted in, once per product per season', () => {
    const plan = planWatchNotifications(input({ ...base, recipients: [recipient('u1', { deal_real: true })] }))
    expect(plan.notifications.map(n => n.type)).toEqual(['deal_real'])
    expect(plan.notifications[0]?.keys).toEqual(['day:2026-11-27', 'p1:black-friday-2026'])
    expect(plan.notifications[0]?.channel).toBe('promotions')
    const productDone = planWatchNotifications(input({ ...base, recipients: [recipient('u1', { deal_real: true })], sent: new Set([sentKey('u1', 'deal_real', 'p1:black-friday-2026')]) }))
    expect(productDone.notifications).toEqual([])
    const dayDone = planWatchNotifications(input({ ...base, recipients: [recipient('u1', { deal_real: true })], sent: new Set([sentKey('u1', 'deal_real', 'day:2026-11-27')]) }))
    expect(dayDone.notifications).toEqual([])
  })

  it('does nothing outside the season', () => {
    expect(planWatchNotifications(input({ ...base, now: NOW, recipients: [recipient('u1', { deal_real: true })] })).notifications).toEqual([])
  })
})

describe('planWatchNotifications: ordering', () => {
  it('puts alerts before promotions so the per-user cap defers promotions first', () => {
    const blackFriday = new Date('2026-11-27T15:00:00Z')
    const history = Array.from({ length: 30 }, (_, i) => ({ date: addDays('2026-11-27', -(30 - i)), price: 1000 + (i % 2) * 100 }))
    const plan = planWatchNotifications(input({
      now: blackFriday,
      recipients: [recipient('u1', { deal_real: true })],
      snapshots: new Map([['p1', snapshot('p1', { current: 1000, history })]]),
      stockStates: new Map([['p1', 'out_of_stock']]),
    }))
    expect(plan.notifications.map(n => n.type)).toEqual(['back_in_stock', 'deal_real'])
  })

  it('builds product links on the stack site', () => {
    expect(productUrl('https://co.dondeta.com.do', 'tv 55')).toBe('https://co.dondeta.com.do/product/tv%2055')
    expect(productUrl('https://dondeta.com.do', null)).toBe('https://dondeta.com.do')
  })
})
