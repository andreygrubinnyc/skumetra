import { describe, it, expect } from 'vitest'
import {
  calculateSafePrice,
  assessCurrentPrice,
  applyMaxChangeCap,
  type SafePriceRules,
} from './safe-price'

/** Fixed synthetic baseline. Not Amazon's real fees. */
const base: SafePriceRules = {
  supplierCost: 14.0,
  supplierShipping: 4.0,
  marketplacePercentageFee: 0.15,
  fulfillmentCost: 3.0,
  minimumDollarProfit: 5.0,
  minimumMarginPercentage: 0.15,
}

describe('calc-v1 profit floor', () => {
  it('solves (N + P) / (1 - p)', () => {
    // N = 21.00, P = 5.00, p = 0.15 -> 26 / 0.85 = 30.5882... -> 30.59
    const r = calculateSafePrice(base)
    expect(r.status).toBe('ok')
    expect(r.nonPercentageCost).toBe(21.0)
    expect(r.profitFloorPrice).toBe(30.59)
  })

  it('includes every non-percentage cost component', () => {
    const r = calculateSafePrice({
      ...base,
      fixedMarketplaceFee: 1.0,
      additionalFixedCostBuffer: 0.5,
    })
    expect(r.nonPercentageCost).toBe(22.5)
  })

  it('adds additional percentage cost to the marketplace fee', () => {
    const r = calculateSafePrice({ ...base, additionalPercentageCost: 0.05 })
    expect(r.effectivePercentageCost).toBeCloseTo(0.2, 10)
    // 26 / 0.80 = 32.50
    expect(r.profitFloorPrice).toBe(32.5)
  })
})

describe('calc-v1 margin floor', () => {
  it('solves N / (1 - p - m)', () => {
    // 21 / (1 - 0.15 - 0.15) = 21 / 0.70 = 30.00
    expect(calculateSafePrice(base).marginFloorPrice).toBe(30.0)
  })
})

describe('calc-v1 higher floor controls', () => {
  it('uses the profit floor when it is higher', () => {
    const r = calculateSafePrice({ ...base, minimumDollarProfit: 8.0, minimumMarginPercentage: 0.05 })
    // profit 29/0.85 = 34.12 ; margin 21/0.80 = 26.25
    expect(r.profitFloorPrice).toBe(34.12)
    expect(r.marginFloorPrice).toBe(26.25)
    expect(r.minimumSafePrice).toBe(34.12)
    expect(r.controllingRule).toBe('profit')
  })

  it('uses the margin floor when it is higher', () => {
    const r = calculateSafePrice({ ...base, minimumDollarProfit: 2.0, minimumMarginPercentage: 0.3 })
    // profit 23/0.85 = 27.06 ; margin 21/0.55 = 38.19
    expect(r.profitFloorPrice).toBe(27.06)
    expect(r.marginFloorPrice).toBe(38.19)
    expect(r.minimumSafePrice).toBe(38.19)
    expect(r.controllingRule).toBe('margin')
  })

  it('honours an absolute minimum price above both floors', () => {
    const r = calculateSafePrice({ ...base, absoluteMinimumPrice: 39.99 })
    expect(r.minimumSafePrice).toBe(39.99)
    expect(r.controllingRule).toBe('absolute-minimum')
  })

  it('ignores an absolute minimum below both floors', () => {
    const r = calculateSafePrice({ ...base, absoluteMinimumPrice: 10.0 })
    expect(r.minimumSafePrice).toBe(30.59)
    expect(r.controllingRule).toBe('profit')
  })
})

describe('calc-v1 rounding (D-11 — always up to the next cent)', () => {
  it('rounds a repeating result up rather than to nearest', () => {
    // N = 20.00 -> 25 / 0.85 = 29.41176...  nearest would be 29.41
    const r = calculateSafePrice({ ...base, supplierCost: 13.0 })
    expect(r.profitFloorPrice).toBe(29.42)
  })

  it('rounding down would break the seller-configured minimum profit', () => {
    // Proves why ceiling is required: at 29.41 the rule is not met.
    const rules = { ...base, supplierCost: 13.0 }
    const nearestCent = 29.41
    const profitAtNearest = nearestCent * (1 - rules.marketplacePercentageFee) - 20.0
    expect(profitAtNearest).toBeLessThan(rules.minimumDollarProfit)

    const safe = calculateSafePrice(rules).minimumSafePrice!
    const profitAtSafe = safe * (1 - rules.marketplacePercentageFee) - 20.0
    expect(profitAtSafe).toBeGreaterThanOrEqual(rules.minimumDollarProfit)
  })

  it('leaves an exact cent value unchanged', () => {
    // 21 / 0.70 = 30.00 exactly
    expect(calculateSafePrice({ ...base, minimumDollarProfit: 0.5 }).marginFloorPrice).toBe(30.0)
  })
})

describe('calc-v1 invalid and missing inputs', () => {
  it('rejects a percentage denominator of zero or less', () => {
    expect(calculateSafePrice({ ...base, marketplacePercentageFee: 1.0 }).status).toBe(
      'invalid_input',
    )
    expect(calculateSafePrice({ ...base, marketplacePercentageFee: 1.2 }).status).toBe(
      'invalid_input',
    )
  })

  it('reports unattainable rules when fees plus margin exhaust the sale', () => {
    const r = calculateSafePrice({
      ...base,
      marketplacePercentageFee: 0.6,
      additionalPercentageCost: 0.2,
      minimumMarginPercentage: 0.25,
    })
    expect(r.status).toBe('unattainable_rules')
    expect(r.minimumSafePrice).toBeUndefined()
  })

  it('never emits a price alongside a non-ok status', () => {
    for (const r of [
      calculateSafePrice({ ...base, marketplacePercentageFee: 1.0 }),
      calculateSafePrice({ ...base, minimumMarginPercentage: 0.9 }),
      calculateSafePrice({ ...base, supplierCost: undefined as unknown as number }),
    ]) {
      expect(r.status).not.toBe('ok')
      expect(r.minimumSafePrice).toBeUndefined()
    }
  })

  it('reports insufficient_data when a required input is missing', () => {
    expect(calculateSafePrice({ ...base, supplierCost: undefined as unknown as number }).status).toBe(
      'insufficient_data',
    )
    expect(
      calculateSafePrice({ ...base, marketplacePercentageFee: undefined as unknown as number })
        .status,
    ).toBe('insufficient_data')
  })

  it('rejects negative money and percentage inputs', () => {
    expect(calculateSafePrice({ ...base, supplierCost: -1 }).status).toBe('invalid_input')
    expect(calculateSafePrice({ ...base, minimumMarginPercentage: -0.1 }).status).toBe(
      'invalid_input',
    )
  })
})

describe('current-price assessment', () => {
  it('computes total cost, profit and margin from the same inputs', () => {
    const a = assessCurrentPrice(34.99, base)
    // 21 + 0.15*34.99 = 26.2485 -> 26.25 ; profit 8.7415 -> 8.74
    expect(a.estimatedTotalCost).toBe(26.25)
    expect(a.estimatedProfit).toBe(8.74)
    expect(a.estimatedMargin).toBeCloseTo(0.2498, 4)
  })

  it('reports a negative profit rather than clamping it', () => {
    const a = assessCurrentPrice(20.0, base)
    expect(a.estimatedProfit).toBeLessThan(0)
    expect(a.estimatedMargin).toBeLessThan(0)
  })

  it('defines margin as profit divided by selling price', () => {
    const price = 40.0
    const a = assessCurrentPrice(price, base)
    expect(a.estimatedMargin).toBeCloseTo(a.estimatedProfit! / price, 10)
  })

  it('rejects a non-positive price', () => {
    expect(assessCurrentPrice(0, base).status).toBe('invalid_input')
  })
})

describe('maximum recommended change', () => {
  it('caps the recommendation without moving the safe price', () => {
    const safe = 31.48
    const { recommendedPrice, reachable } = applyMaxChangeCap(20.0, safe, 0.2)
    expect(recommendedPrice).toBe(24.0) // 20.00 * 1.20
    expect(reachable).toBe(false)
    expect(safe).toBe(31.48) // unchanged by the cap
  })

  it('recommends the safe price when the cap allows it', () => {
    const { recommendedPrice, reachable } = applyMaxChangeCap(27.99, 31.48, 0.2)
    expect(recommendedPrice).toBe(31.48)
    expect(reachable).toBe(true)
  })
})
