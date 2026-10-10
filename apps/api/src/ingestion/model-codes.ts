// Cross-retailer product matching by manufacturer model code.
//
// Retailers almost never agree on the `model` field: Sirena/Jumbo/PriceSmart
// put their own internal SKU there ("00012678", "3341835"), Plaza Lama often
// puts an EAN, Corripio sometimes a real model. What they DO agree on is the
// manufacturer model code embedded in the product name -- "Lavadora Whirlpool
// 14 Kg WWI14AWHLS" at Sirena and "Lavadora Automática ... WWI14AWHLS" at
// Plaza Lama. This module pulls those codes out of name + model so ingestion
// can match on them.

// Spec tokens that look like codes (letters + digits) but describe a
// property, not a product.
const SPEC_TOKENS = new Set([
  'SEER', 'BTU', 'INVERTER', 'QLED', 'OLED', 'UHD', 'FHD', 'WIFI', 'LED', 'USB', 'HDMI',
  '1080P', '2160P', '720P', 'R410A', 'R32',
])
const UNIT_SUFFIX = /^\d+(?:BTU|BTUS|L|LT|LTS|LB|LBS|KG|KGS|PIES|PC|CM|MM|W|GAL|SEER|PULG|P|V|HZ|MAH|GB|TB|IN|K|QT|OZ|ML)$/

function normalizeCode(token: string): string {
  return token.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function isModelCode(code: string): boolean {
  return (
    code.length >= 5 &&
    code.length <= 24 &&
    /[A-Z]/.test(code) &&
    /\d/.test(code) &&
    !SPEC_TOKENS.has(code) &&
    !UNIT_SUFFIX.test(code)
  )
}

export function extractModelCodes(name: string, model?: string | null): string[] {
  const codes = new Set<string>()
  for (const source of [name, model ?? '']) {
    const text = source
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      // "M/DF450TW" -- Plaza Lama's "modelo" prefix.
      .replace(/\bM\//g, ' ')
    for (const raw of text.match(/[A-Z0-9][A-Z0-9\-./]{3,}[A-Z0-9]/g) ?? []) {
      // "A56XL/M56LG" and "FKGN30C3YI/MYI" list alternates; keep the whole
      // token and each slash-separated part.
      for (const part of [raw, ...raw.split('/')]) {
        const code = normalizeCode(part)
        if (isModelCode(code)) codes.add(code)
      }
    }
  }
  return [...codes].sort()
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Retailer brand fields are unreliable (Jumbo has shipped a category slug,
// Corripio sometimes "Abanico"), so a mismatch only blocks a match when
// neither side's brand shows up anywhere in the other product.
export function brandsCompatible(
  a: { brand: string; name: string },
  b: { brand: string; name: string },
): boolean {
  const brandA = normalizeText(a.brand)
  const brandB = normalizeText(b.brand)
  if (!brandA || !brandB || brandA === brandB) return true
  const textA = ` ${normalizeText(`${a.brand} ${a.name}`)} `
  const textB = ` ${normalizeText(`${b.brand} ${b.name}`)} `
  return textB.includes(` ${brandA} `) || textA.includes(` ${brandB} `)
}
