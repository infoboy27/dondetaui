import type { NormalizedRetailerItem } from './ingestion.types'

// Stores file water dispensers under their refrigeration department (HI-FI's
// "Bebedero Con Nevera", Plaza Lama's "Bebedero Tecnomaster ..."), so they
// landed in Neveras and topped a "neveras" search. The product name says
// what it is regardless of the store's taxonomy: these overrides run on
// every ingested item, whatever the adapter.
//
// One name for the slug everywhere: the category upsert renames a category
// to the last name it sees. "dispensador" keeps it inside the appliance
// gate (acceptsCategory) and the "Electrodomésticos" quick filter.
export const WATER_DISPENSER_CATEGORY = { name: 'Bebederos y dispensadores', slug: 'bebederos' } as const

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// The product noun leads the name. "Nevera ... con dispensador de agua" is a
// fridge, so "dispensador de agua" only counts at the start; "bebedero" is
// never a fridge feature, so it counts anywhere unless the name leads with
// a fridge/freezer noun.
const DISPENSER_START = /^(bebederos?|dispensador(es)? (de )?agua|water (dispenser|cooler)s?)\b/
const BEBEDERO_WORD = /\bbebederos?\b/
const FRIDGE_START = /^(nevera|nevecon|refrigerador|refrigeradora|congelador|freezer)\b/

export function isWaterDispenser(name: string): boolean {
  const normalized = normalize(name)
  if (DISPENSER_START.test(normalized)) return true
  return BEBEDERO_WORD.test(normalized) && !FRIDGE_START.test(normalized)
}

export function applyCategoryOverrides<T extends Pick<NormalizedRetailerItem, 'name' | 'categoryName' | 'categorySlug'>>(item: T): T {
  if (isWaterDispenser(item.name)) {
    return { ...item, categoryName: WATER_DISPENSER_CATEGORY.name, categorySlug: WATER_DISPENSER_CATEGORY.slug }
  }
  return item
}
