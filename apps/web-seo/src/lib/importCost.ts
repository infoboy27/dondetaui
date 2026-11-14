// Amazon + courier landed cost for the Dominican Republic (/calculadora-amazon).
// Pure so it can be unit-tested; the page is only inputs and formatting.
//
// Rules (same as the /guias/comprar-en-amazon-desde-rd guide): personal
// courier shipments up to US$200 enter without import taxes. Above that, the
// tariff (arancel) is charged on goods + freight, and ITBIS (18 %) on goods +
// freight + tariff. The tariff depends on the product and its origin, so the
// shopper picks it. It is an estimate: the courier's invoice is the real one.

export const DUTY_FREE_LIMIT_USD = 200
export const ITBIS = 0.18
export const TARIFF_OPTIONS = [0, 3, 8, 14, 20] as const

export interface ImportInput {
  /** Amazon price in USD. */
  price: number
  /** US sales tax at the courier's Miami address, in percent. */
  salesTaxPct: number
  /** Amazon shipping to the courier's address, USD. */
  usShipping: number
  /** Billable weight (the larger of real and volumetric), pounds. */
  weightLb: number
  /** Courier rate per pound, USD. */
  ratePerLb: number
  /** Courier fixed fees (handling, fuel, insurance), USD. */
  courierFees: number
  /** Tariff in percent (one of TARIFF_OPTIONS). */
  tariffPct: number
  /** DOP per USD, as charged by the shopper's card. */
  rate: number
  /** Card foreign-transaction fee, in percent. */
  cardFeePct: number
}

export interface ImportCost {
  goodsUsd: number
  courierUsd: number
  taxesUsd: number
  dutyFree: boolean
  totalUsd: number
  totalDop: number
}

const round2 = (n: number) => Math.round(n * 100) / 100
const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

export function importCost(input: ImportInput): ImportCost {
  const price = nonNeg(input.price)
  const goods = price * (1 + nonNeg(input.salesTaxPct) / 100) + nonNeg(input.usShipping)
  const courier = Math.ceil(nonNeg(input.weightLb)) * nonNeg(input.ratePerLb) + nonNeg(input.courierFees)
  const dutyFree = goods <= DUTY_FREE_LIMIT_USD
  let taxes = 0
  if (!dutyFree) {
    const cif = goods + courier
    const tariff = cif * (nonNeg(input.tariffPct) / 100)
    taxes = tariff + (cif + tariff) * ITBIS
  }
  // The card fee applies to what is charged to the card abroad: Amazon and courier.
  const totalUsd = (goods + courier) * (1 + nonNeg(input.cardFeePct) / 100) + taxes
  return {
    goodsUsd: round2(goods),
    courierUsd: round2(courier),
    taxesUsd: round2(taxes),
    dutyFree,
    totalUsd: round2(totalUsd),
    totalDop: Math.round(totalUsd * nonNeg(input.rate)),
  }
}

// Positive = importing saves that many pesos vs the local price.
export function savingVsLocal(cost: ImportCost, localDop: number): number | null {
  if (!(localDop > 0) || !(cost.totalDop > 0)) return null
  return Math.round(localDop - cost.totalDop)
}
