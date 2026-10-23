import { describe, expect, it } from 'vitest'
import { acceptsCategory } from './ingestion.repository'

const retailer = { name: 'X', slug: 'x', abbr: 'XX', primaryColor: '#000', websiteUrl: 'https://x.test' }
const accepts = (categoryName: string) => acceptsCategory({ categoryName, categorySlug: 'c', retailer })

describe('acceptsCategory', () => {
  it('accepts appliance categories, including Colombian store names', () => {
    for (const name of ['Neveras', 'Nevecones', 'Lavavajillas', 'Minibares', 'Calentadores de Agua', 'Televisores', 'Estufas y Empotrables']) {
      expect(accepts(name), name).toBe(true)
    }
  })

  it('still rejects non-appliance categories', () => {
    for (const name of ['Proyectores', 'Soportes', 'Portarretratos digitales', 'Celulares y Smartwatch']) {
      expect(accepts(name), name).toBe(false)
    }
  })
})
