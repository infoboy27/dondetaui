import { describe, expect, it } from 'vitest'
import {
  BROADCAST_BODY_MAX,
  BROADCAST_TITLE_MAX,
  parseBroadcast,
  PushBudget,
  buildPriceDropPush,
  chunk,
  classifyTickets,
  expoHeaders,
  isExpoPushToken,
  priceDropPct,
  pushEnabled,
  sendableTokens,
  tokensToDisableFromReceipts,
} from './push-messages'

const A = 'ExponentPushToken[aaaaaaaaaaaa]'
const B = 'ExponentPushToken[bbbbbbbbbbbb]'
const C = 'ExpoPushToken[cccccccccccc]'

describe('isExpoPushToken / sendableTokens', () => {
  it('accepts both Expo token prefixes and rejects anything else', () => {
    expect(isExpoPushToken(A)).toBe(true)
    expect(isExpoPushToken(C)).toBe(true)
    expect(isExpoPushToken('ExponentPushToken[]')).toBe(false)
    expect(isExpoPushToken('fcm-raw-token')).toBe(false)
  })

  it('drops invalid and duplicate tokens', () => {
    expect(sendableTokens([A, 'junk', A, B])).toEqual([A, B])
  })
})

describe('pushEnabled', () => {
  it('is off unless the flag is explicitly on', () => {
    expect(pushEnabled({})).toBe(false)
    expect(pushEnabled({ PUSH_NOTIFICATIONS_ENABLED: '0' })).toBe(false)
    expect(pushEnabled({ PUSH_NOTIFICATIONS_ENABLED: '' })).toBe(false)
    expect(pushEnabled({ PUSH_NOTIFICATIONS_ENABLED: '1' })).toBe(true)
    expect(pushEnabled({ PUSH_NOTIFICATIONS_ENABLED: 'true' })).toBe(true)
  })
})

describe('expoHeaders', () => {
  it('adds the bearer only when an access token is configured', () => {
    expect(expoHeaders(undefined).Authorization).toBeUndefined()
    expect(expoHeaders('secret').Authorization).toBe('Bearer secret')
  })
})

describe('chunk', () => {
  it('splits into batches of at most the given size', () => {
    const items = Array.from({ length: 250 }, (_, i) => i)
    const batches = chunk(items, 100)
    expect(batches.map(batch => batch.length)).toEqual([100, 100, 50])
    expect(batches.flat()).toEqual(items)
  })

  it('returns nothing for an empty list', () => {
    expect(chunk([], 100)).toEqual([])
  })
})

describe('buildPriceDropPush', () => {
  it('builds Spanish copy with old price, percentage and a product deep link', () => {
    const push = buildPriceDropPush({ productName: 'Nevera Whirlpool 18 pies', newPrice: 'RD$40,000', previousPrice: 'RD$50,000', pct: 20, slug: 'nevera-whirlpool-18' })
    expect(push.title).toBe('Bajó de precio (−20 %)')
    expect(push.body).toBe('Nevera Whirlpool 18 pies: ahora RD$40,000 (antes RD$50,000).')
    expect(push.data).toEqual({ type: 'price-drop', url: '/product/nevera-whirlpool-18' })
  })

  it('omits the old price, percentage and link when unknown', () => {
    const push = buildPriceDropPush({ productName: 'TV', newPrice: 'RD$9,000', slug: null })
    expect(push.title).toBe('Bajó de precio')
    expect(push.body).toBe('TV: ahora RD$9,000.')
    expect(push.data).toEqual({ type: 'price-drop' })
  })

  it('truncates very long product names', () => {
    const push = buildPriceDropPush({ productName: 'x'.repeat(200), newPrice: 'RD$1', slug: 'x' })
    expect(push.body.startsWith(`${'x'.repeat(79)}…:`)).toBe(true)
  })
})

describe('priceDropPct', () => {
  it('rounds the drop and ignores non-drops', () => {
    expect(priceDropPct(1000, 850)).toBe(15)
    expect(priceDropPct(1000, 1000)).toBeUndefined()
    expect(priceDropPct(undefined, 10)).toBeUndefined()
  })
})

describe('classifyTickets', () => {
  it('keeps ok tickets pending and disables DeviceNotRegistered tokens right away', () => {
    const outcome = classifyTickets(
      [{ to: A }, { to: B }, { to: C }],
      [
        { status: 'ok', id: 't1' },
        { status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } },
        { status: 'error', message: 'too big', details: { error: 'MessageTooBig' } },
      ],
    )
    expect(outcome.pending).toEqual([{ id: 't1', token: A }])
    expect(outcome.disable).toEqual([B])
  })

  it('prefers the token Expo names in the error details', () => {
    const outcome = classifyTickets([{ to: A }], [{ status: 'error', details: { error: 'DeviceNotRegistered', expoPushToken: C } }])
    expect(outcome.disable).toEqual([C])
  })
})

describe('tokensToDisableFromReceipts', () => {
  it('disables only tokens whose receipt says DeviceNotRegistered', () => {
    const disable = tokensToDisableFromReceipts(
      [{ id: 't1', token: A }, { id: 't2', token: B }, { id: 't3', token: C }],
      {
        t1: { status: 'ok' },
        t2: { status: 'error', details: { error: 'DeviceNotRegistered' } },
        t3: { status: 'error', details: { error: 'MessageRateExceeded' } },
      },
    )
    expect(disable).toEqual([B])
  })

  it('leaves tokens alone when the receipt is not there yet', () => {
    expect(tokensToDisableFromReceipts([{ id: 't1', token: A }], {})).toEqual([])
  })
})

describe('PushBudget', () => {
  it('caps pushes per user within a run', () => {
    const budget = new PushBudget(2)
    expect(budget.take('u1')).toBe(true)
    expect(budget.take('u1')).toBe(true)
    expect(budget.take('u1')).toBe(false)
    expect(budget.take('u2')).toBe(true)
  })
})

describe('parseBroadcast', () => {
  it('trims a valid title and body', () => {
    expect(parseBroadcast({ title: '  Black Friday 🛍️ ', body: ' Compara antes de comprar. ' }))
      .toEqual({ title: 'Black Friday 🛍️', body: 'Compara antes de comprar.' })
  })
  it('rejects a missing title or body', () => {
    expect(() => parseBroadcast({ title: ' ', body: 'x' })).toThrow('título')
    expect(() => parseBroadcast({ title: 'x', body: 42 })).toThrow('mensaje')
  })
  it('rejects text over the limits, counting emoji as one character', () => {
    expect(() => parseBroadcast({ title: 'a'.repeat(BROADCAST_TITLE_MAX + 1), body: 'x' })).toThrow('título')
    expect(() => parseBroadcast({ title: 'x', body: 'a'.repeat(BROADCAST_BODY_MAX + 1) })).toThrow('mensaje')
    expect(parseBroadcast({ title: '🛍️'.repeat(20), body: 'x' }).title).toBeTruthy()
  })
})
