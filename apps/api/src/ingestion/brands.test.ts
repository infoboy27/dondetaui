import { describe, expect, it } from 'vitest'
import { brandFromName, normalizeBrand } from './brands'

describe('brandFromName', () => {
  it('finds a brand anywhere in the name, case-insensitively', () => {
    expect(brandFromName('Televisor 58 Pulgadas AIWA QLED 4K AW58B2Q')).toBe('Aiwa')
    expect(brandFromName('Abanico de techo KDK 56"')).toBe('KDK')
  })

  it('prefers the longer brand name', () => {
    expect(brandFromName('Freidora Black+Decker HF5005B')).toBe('Black+Decker')
    expect(brandFromName('Lavadora General Electric 18kg')).toBe('General Electric')
  })

  it('only matches whole words', () => {
    expect(brandFromName('Nevera Glgx 14 pies')).toBeUndefined()
    expect(brandFromName('Estufa Global 30')).toBeUndefined()
  })
})

describe('normalizeBrand', () => {
  it('gives each known brand one spelling', () => {
    expect(normalizeBrand('SAMSUNG')).toBe('Samsung')
    expect(normalizeBrand('kitchenaid')).toBe('KitchenAid')
    expect(normalizeBrand('lg')).toBe('LG')
  })

  it('title-cases unknown all-caps names but keeps short acronyms', () => {
    expect(normalizeBrand('NIKKEI')).toBe('Nikkei')
    expect(normalizeBrand('BLACK & DECKER')).toBe('Black & Decker')
    expect(normalizeBrand('ARG')).toBe('ARG')
    expect(normalizeBrand('  Argom ')).toBe('Argom')
  })
})
