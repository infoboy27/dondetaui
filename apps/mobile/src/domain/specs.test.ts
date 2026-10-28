import { describe, expect, it } from 'vitest'
import { specEntries } from './specs'

describe('specEntries', () => {
  it('keeps the published order and trims', () => {
    expect(specEntries({ ' Resolución ': '4K ', 'Smart TV': 'Si' })).toEqual([
      { label: 'Resolución', value: '4K' },
      { label: 'Smart TV', value: 'Si' },
    ])
  })
  it('drops empty entries and handles no specs', () => {
    expect(specEntries({ Wifi: '  ', '': 'x', HDR: 'Si' })).toEqual([{ label: 'HDR', value: 'Si' }])
    expect(specEntries(undefined)).toEqual([])
    expect(specEntries({})).toEqual([])
  })
})
