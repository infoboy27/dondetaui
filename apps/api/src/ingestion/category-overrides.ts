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

// Each store brings its own taxonomy ("television", "televisor",
// "televisores"...), which split filters and per-type stats. Every alias maps
// to one canonical slug, and every canonical slug gets one name (the upsert
// renames a category to the last name it sees). Names keep an appliance
// keyword so the gate (acceptsCategory) still passes.
export const CANONICAL_CATEGORY_NAMES: Record<string, string> = {
  televisores: 'Televisores',
  neveras: 'Neveras y refrigeradores',
  estufas: 'Estufas',
  hornos: 'Hornos',
  extractores: 'Extractores',
  lavadoras: 'Lavadoras',
  secadoras: 'Secadoras',
  'lavadoras-secadoras': 'Lavadoras-secadoras',
  lavaplatos: 'Lavaplatos',
  aspiradoras: 'Aspiradoras',
  licuadoras: 'Licuadoras',
  'aires-acondicionados': 'Aires acondicionados',
  'planchas-y-tablas-de-planchar': 'Planchas',
  'tostadoras-y-hornos-tostadores': 'Tostadoras y hornos tostadores',
  vineras: 'Vineras (neveras de vino)',
  accesorios: 'Accesorios para electrodomésticos',
  [WATER_DISPENSER_CATEGORY.slug]: WATER_DISPENSER_CATEGORY.name,
}

export const CATEGORY_ALIASES: Record<string, string> = {
  television: 'televisores',
  televisor: 'televisores',
  nevera: 'neveras',
  refrigerador: 'neveras',
  refrigeradores: 'neveras',
  estufa: 'estufas',
  'estufas-y-hornos': 'estufas',
  horno: 'hornos',
  'horno-empotrable': 'hornos',
  extractor: 'extractores',
  'extractor-de-grasa': 'extractores',
  // Stores file plain washers (twin tub, top load) as "lavadora-secadora":
  // only the name rule below makes something a washer-dryer.
  'lavadora-secadora': 'lavadoras',
  'lavado-y-secado': 'lavadoras',
  'centro-de-lavado': 'lavadoras-secadoras',
  'lavadoras-de-ropa': 'lavadoras',
  'secadoras-de-ropa': 'secadoras',
  lavavajillas: 'lavaplatos',
  'dispensador-de-agua': WATER_DISPENSER_CATEGORY.slug,
  'dispensadores-de-agua': WATER_DISPENSER_CATEGORY.slug,
  'aspiradoras-y-cuidado-de-pisos': 'aspiradoras',
  licuadora: 'licuadoras',
  'aires-acondicionados-y-calefactores': 'aires-acondicionados',
  'planchas-y-planchas-a-vapor': 'planchas-y-tablas-de-planchar',
}

// The product noun leads the name, whatever department the store filed it
// under. Accessories and parts (remotes, install kits, blender jars) were
// sitting in TVs, ACs and washers and dragged "desde RD$165" into them.
// Order matters: the first match wins.
const NAME_RULES: Array<[RegExp, string]> = [
  // A leading brand word is allowed only for kits ("Samsung Kit de
  // Apilamiento"): "Abanico Control Remoto" is a fan, not a remote.
  [/^(control(es)? (remoto|universal|para)|([\w-]+ )?kits?\b|repuestos?\b|cuchillas?\b|vasos? (de|para)\b|jarras? (de|para) licuadora|tapas?\b|roscas?\b|filtros?\b|mangueras?\b|adaptador(es)?\b|protector(es)? de voltaje|regulador(es)? de voltaje)/, 'accesorios'],
  // Brand-first names are common ("JVC Aire Acondicionado", "IonChill Refrigerador de Vino").
  [/^([\w-]+ )?(aire acondicionado|aires acondicionados|acondicionador(es)? de aire|a\/a\b|minisplit|mini split)/, 'aires-acondicionados'],
  [/^([\w+-]+ )?(lavadora[ -]secadora|lavadora y secadora|lavasecadora|torre de lavado|centro de lavado)/, 'lavadoras-secadoras'],
  [/^([\w-]+ )?secadoras?\b(?!.*\b(cabello|pelo|manos)\b)/, 'secadoras'],
  [/^([\w-]+ )?(vineras?|vinoteca|cava de vino|enfriador de vino|refrigerador(a)? de vino)|\bwine cooler\b/, 'vineras'],
  [/^horno (electrico )?tostador|^horno tostador/, 'tostadoras-y-hornos-tostadores'],
]

export function canonicalCategory(name: string, categorySlug: string): string {
  if (isWaterDispenser(name)) return WATER_DISPENSER_CATEGORY.slug
  const normalized = normalize(name)
  for (const [pattern, slug] of NAME_RULES) if (pattern.test(normalized)) return slug
  return CATEGORY_ALIASES[categorySlug] ?? categorySlug
}

export function applyCategoryOverrides<T extends Pick<NormalizedRetailerItem, 'name' | 'categoryName' | 'categorySlug'>>(item: T): T {
  const slug = canonicalCategory(item.name, item.categorySlug)
  const name = CANONICAL_CATEGORY_NAMES[slug] ?? item.categoryName
  if (slug === item.categorySlug && name === item.categoryName) return item
  return { ...item, categoryName: name, categorySlug: slug }
}
