import { describe, expect, it } from 'vitest'
import { applyCategoryOverrides, isWaterDispenser, WATER_DISPENSER_CATEGORY } from './category-overrides'
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
    const item = { name: 'Nevera LG 14 pies', categoryName: 'Neveras', categorySlug: 'neveras', retailer }
    expect(applyCategoryOverrides(item)).toBe(item)
  })
})
