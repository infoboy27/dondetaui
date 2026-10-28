import { describe, expect, it } from 'vitest'
import { extractVtexSpecs } from './vtex-api.adapter'

describe('extractVtexSpecs', () => {
  it('keeps real specifications and drops internal codes and placeholders', () => {
    const specs = extractVtexSpecs({
      productId: '1', productName: 'TV', link: '/tv',
      allSpecifications: ['TaxIndicator', 'Resolución', 'Smart TV', 'Ancho', 'Modelo'],
      TaxIndicator: ['18'], Resolución: ['4K'], 'Smart TV': ['Si'], Ancho: ['defaultValue'], Modelo: ['55D3200'],
    })
    expect(specs).toEqual({ Resolución: '4K', 'Smart TV': 'Si' })
  })

  it('returns undefined when there is nothing usable', () => {
    expect(extractVtexSpecs({ productId: '1', productName: 'TV', link: '/tv' })).toBeUndefined()
  })
})
