import { describe, expect, it } from 'vitest'
import { importCost, savingVsLocal, type ImportInput } from './importCost'

const base: ImportInput = {
  price: 80, salesTaxPct: 0, usShipping: 0, weightLb: 9, ratePerLb: 3, courierFees: 5,
  tariffPct: 20, rate: 60, cardFeePct: 0,
}

describe('importCost', () => {
  it('matches the guide example: no taxes under US$200', () => {
    const cost = importCost(base)
    expect(cost).toMatchObject({ goodsUsd: 80, courierUsd: 32, taxesUsd: 0, dutyFree: true, totalUsd: 112, totalDop: 6720 })
    expect(savingVsLocal(cost, 7200)).toBe(480)
    expect(savingVsLocal(cost, 6500)).toBe(-220)
  })

  it('charges tariff on goods + freight and ITBIS on top above US$200', () => {
    const cost = importCost({ ...base, price: 300 })
    // CIF 332, tariff 66.4, ITBIS 18 % of 398.4 = 71.712
    expect(cost.dutyFree).toBe(false)
    expect(cost.taxesUsd).toBe(138.11)
    expect(cost.totalUsd).toBe(470.11)
  })

  it('counts US sales tax and shipping toward the US$200 limit, rounds weight up, adds the card fee', () => {
    const cost = importCost({ ...base, price: 190, salesTaxPct: 7, weightLb: 2.2, tariffPct: 0, cardFeePct: 2 })
    expect(cost.goodsUsd).toBe(203.3)
    expect(cost.dutyFree).toBe(false)
    expect(cost.courierUsd).toBe(14)
  })

  it('ignores empty or negative inputs', () => {
    expect(importCost({ ...base, price: Number.NaN, weightLb: -3, courierFees: 0 }).totalUsd).toBe(0)
    expect(savingVsLocal(importCost(base), 0)).toBeNull()
  })
})
