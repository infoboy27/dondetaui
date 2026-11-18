import { describe, expect, it } from 'vitest'
import { formatPrice } from './currency'

describe('formatPrice', () => {
  it('rounds peso prices to whole units, like the apps and the web', () => {
    // Store feeds sometimes carry cents (RD$10,995.24); messages showed them as is.
    expect(formatPrice(10995.24)).toBe('RD$10,995')
    expect(formatPrice(11994.7)).toBe('RD$11,995')
    expect(formatPrice(41995)).toBe('RD$41,995')
  })
})
