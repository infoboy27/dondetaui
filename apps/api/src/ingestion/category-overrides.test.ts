import { describe, expect, it } from 'vitest'
import { CANONICAL_CATEGORY_NAMES, applyCategoryOverrides, canonicalCategory, isWaterDispenser, WATER_DISPENSER_CATEGORY } from './category-overrides'
import { acceptsCategory } from './ingestion.repository'

const retailer = { name: 'X', slug: 'x', abbr: 'XX', primaryColor: '#000', websiteUrl: 'https://x.test' }

describe('isWaterDispenser', () => {
  it('flags water dispensers however the store names them', () => {
    for (const name of [
      'Bebedero Con Nevera Negro Whirlpool',
      'Bebedero Tecnomaster TY-LWYR33W',
      'BEBEDERO BLANCO KENMORE',
      'Dispensador de Agua Frigidaire Fría y Caliente',
      'Dispensador agua Drija',
      'Water Dispenser Midea',
      'Mini Bebedero de mesa',
    ]) {
      expect(isWaterDispenser(name), name).toBe(true)
    }
  })

  it('leaves fridges with a water dispenser and other appliances alone', () => {
    for (const name of [
      'Nevera Samsung 18 pies con dispensador de agua',
      'Refrigerador LG con bebedero',
      'Nevera Whirlpool Top Mount',
      'Dispensador de cereal',
      'Lavadora Frigidaire 22 lb',
    ]) {
      expect(isWaterDispenser(name), name).toBe(false)
    }
  })
})

describe('applyCategoryOverrides', () => {
  it('moves a dispenser out of Neveras and keeps it inside the appliance gate', () => {
    const item = applyCategoryOverrides({ name: 'Bebedero Tecnomaster TY-LWYR33W', categoryName: 'Neveras', categorySlug: 'neveras', retailer })
    expect(item).toMatchObject({ categoryName: WATER_DISPENSER_CATEGORY.name, categorySlug: 'bebederos' })
    expect(acceptsCategory(item)).toBe(true)
  })

  it('keeps the store category for everything else', () => {
    const item = { name: 'Abanico de Pared Conex 16"', categoryName: 'Abanicos', categorySlug: 'abanicos', retailer }
    expect(applyCategoryOverrides(item)).toBe(item)
  })

  it('merges store aliases into one category with one name', () => {
    for (const slug of ['television', 'televisor', 'televisores']) {
      expect(applyCategoryOverrides({ name: 'Televisor Samsung 55" 4K', categoryName: slug, categorySlug: slug, retailer }))
        .toMatchObject({ categorySlug: 'televisores', categoryName: 'Televisores' })
    }
    expect(canonicalCategory('Nevera LG 14 pies', 'refrigeradores')).toBe('neveras')
    expect(canonicalCategory('Lavavajillas Bosch', 'lavavajillas')).toBe('lavaplatos')
  })

  it('moves accessories and parts out of the appliance categories (audit 2026-11-27)', () => {
    const cases: Array<[string, string, string]> = [
      ['Control Universal 620/9512 Universal', 'television', 'accesorios'],
      ['Control Para Aire Universal Kt-E08', 'aires-acondicionados', 'accesorios'],
      ['Cuchilla Repuesto Licuadora Oster', 'licuadoras', 'accesorios'],
      ['Vaso De Licuadora Plastico Oster', 'licuadoras', 'accesorios'],
      ['Kit de Instalación para Lavadora Whirlpool M/W10869845', 'lavadoras', 'accesorios'],
      ['Samsung Kit de Apilamiento SKK‑8K 20/22KG', 'lavadoras-secadoras', 'accesorios'],
      ['JVC Aire Acondicionado Tipo Split Inverter de 12 000 BTU', 'ventiladores', 'aires-acondicionados'],
      ['Aire Acondicionado Inverter LG DUALCOOL 36K BTU', 'aires-acondicionados', 'aires-acondicionados'],
      ['Secadora A Gas Maytag 25 Kg 7MMGDB835EW', 'lavadoras', 'secadoras'],
      ['Torre de Lavado LG WashTower Lavadora 25 kg / Secadora 22 kg', 'lavadoras', 'lavadoras-secadoras'],
      ['VINERA KTC WINE COOLER 34-BOTTLES (JC-94)', 'neveras', 'vineras'],
      ['IonChill Refrigerador de Vino para 6 Botellas', 'refrigeradores', 'vineras'],
      ['Horno Eléctrico Tostador Disney con Broiler DN13341', 'microondas', 'tostadoras-y-hornos-tostadores'],
      ['Secadora de Cabello Conair', 'secadores-de-cabello', 'secadores-de-cabello'],
      ['Estufa De Gas Kitchenaid 30P KFGS530SPS', 'estufas', 'estufas'],
      ['Extractor Campana Kitchenaid 36P KVWC736SSS', 'extractores', 'extractores'],
      ['Lavadora Samsung 22 kg con secadora de ropa', 'lavadoras', 'lavadoras'],
      ['Abanico Control Remoto Westinghouse', 'abanicos', 'abanicos'],
      ['BLACK+DECKER Lavadora Twin Tub 12 Kg / 26 Lbs BXWABH12TT', 'lavadora-secadora', 'lavadoras'],
      ['BLACK+DECKER Lavasecadora BXWDBH15FL', 'lavadora-secadora', 'lavadoras-secadoras'],
      ['Nedoca Lavadora y Secadora de Carga Frontal 15 kg', 'electrodomesticos', 'lavadoras-secadoras'],
    ]
    for (const [name, slug, expected] of cases) expect([name, canonicalCategory(name, slug)]).toEqual([name, expected])
  })

  it('keeps every canonical name inside the appliance gate', () => {
    for (const [slug, name] of Object.entries(CANONICAL_CATEGORY_NAMES)) {
      expect([slug, acceptsCategory({ categoryName: name, categorySlug: slug, retailer })]).toEqual([slug, true])
    }
  })
})
