import { describe, expect, it } from 'vitest'
import { brandFromName, cleanBrand, normalizeBrand } from './brands'

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

describe('cleanBrand', () => {
  it('keeps known brands and brands the name mentions', () => {
    expect(cleanBrand('SAMSUNG', 'Nevera 20 pies RT53')).toBe('Samsung')
    expect(cleanBrand('Nikkei', 'Licuadora Nikkei 1.5L')).toBe('Nikkei')
  })

  it('replaces garbage with the brand found in the name', () => {
    expect(cleanBrand('dores-y-felpas', 'Lavadora Secadora Eléctrica Frigidaire 11 Kg FWD11H4G')).toBe('Frigidaire')
    expect(cleanBrand('Argomsoporte de televisi', 'Base De Tv Argom, Full Motion, Un Brazo, 32"-55"')).toBe('Argom')
    expect(cleanBrand('sEstufa Empotrable DRIJA Milano 60 Pro 2', 'Estufa Empotrable Drija, 24"-60Cm')).toBe('Drija')
  })

  it('trims company suffixes after a known brand', () => {
    expect(cleanBrand('TCL Comunications Equipment', 'Televisor TCL 55" 4K')).toBe('TCL')
  })

  it('keeps explicit no-brand markers and decodes HTML entities', () => {
    expect(cleanBrand('Sin Marca', 'Control Para Aire Universal Kt-E08')).toBe('Sin Marca')
    expect(cleanBrand('BLACK &amp; DECKER', 'Plancha Black & Decker')).toBe('Black & Decker')
    expect(cleanBrand('White Westinghouse', 'Lavadora White Westinghouse 14KG')).toBe('White Westinghouse')
  })

  it('keeps an unknown brand when the name has no better one', () => {
    expect(cleanBrand('Desconocida', 'Abanico de mesa 12"')).toBe('Desconocida')
  })
})
