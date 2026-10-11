import { describe, expect, it } from 'vitest'
import { brandsCompatible, bundlesCompatible, extractModelCodes } from './model-codes'

describe('extractModelCodes', () => {
  it('finds the same code in two retailers\' differently worded names', () => {
    const sirena = extractModelCodes('Lavadora Whirlpool Impeller 14 Kg WWI14AWHLS', '00013463')
    const plazaLama = extractModelCodes('Lavadora Automática Carga Superior 14kg Whirlpool WWI14AWHLS', '7708228051912')
    expect(sirena).toContain('WWI14AWHLS')
    expect(plazaLama).toContain('WWI14AWHLS')
  })

  it('splits slash-separated alternates and strips the M/ prefix', () => {
    expect(extractModelCodes('Abanico De Techo KDK M/A56XL/M56LG', 'A56XL')).toEqual(
      expect.arrayContaining(['A56XL', 'M56LG']),
    )
    expect(extractModelCodes('Nevera Nedoca 14 Pies NN-HHF214DSM/214DSA', '')).toEqual(
      expect.arrayContaining(['NNHHF214DSM', '214DSA']),
    )
  })

  it('ignores specs, units and pure-digit retailer SKUs', () => {
    const codes = extractModelCodes('Aire Acondicionado 12000BTU Inverter 21 SEER 4K 55" 220V 500L', '00012678')
    expect(codes).toEqual([])
  })

  it('reads a real code from the model field when the name lacks it', () => {
    expect(extractModelCodes('Abanico De Pedestal Daiwa, 18"', 'AD-WFS1820G')).toEqual(['ADWFS1820G'])
  })
})

describe('bundlesCompatible', () => {
  it('keeps a combo apart from the single product sharing its model code', () => {
    expect(bundlesCompatible(
      { name: 'Combo Licuadora Compact Mix HEBL209N + Sandwichera HESM2P155N Home Elements' },
      { name: 'Sandwichera Home Elements 2 Placas HESM2P155N' },
    )).toBe(false)
  })

  it('matches bundles with bundles and singles with singles', () => {
    expect(bundlesCompatible({ name: 'Combo A' }, { name: 'Kit A' })).toBe(true)
    expect(bundlesCompatible({ name: 'Nevera LG GT32' }, { name: 'Refrigerador LG GT32' })).toBe(true)
    expect(bundlesCompatible({ name: 'Batidora KitchenAid KSM150' }, { name: 'KitchenAid KSM150 Artisan' })).toBe(true)
  })
})

describe('brandsCompatible', () => {
  it('accepts equal brands regardless of case', () => {
    expect(brandsCompatible({ brand: 'WHIRLPOOL', name: 'x' }, { brand: 'Whirlpool', name: 'y' })).toBe(true)
  })

  it('accepts a junk brand when the real one appears in its name', () => {
    expect(
      brandsCompatible(
        { brand: 'dores-y-felpas', name: 'Estufa Whirlpool 30" LWF7700S' },
        { brand: 'Whirlpool', name: 'Whirlpool Estufa de 5 Quemadores LWF7700S' },
      ),
    ).toBe(true)
  })

  it('rejects two different real brands', () => {
    expect(
      brandsCompatible(
        { brand: 'Samsung', name: 'Nevera Samsung RS57DG4000' },
        { brand: 'LG', name: 'Nevera LG GS65SPP1' },
      ),
    ).toBe(false)
  })
})
