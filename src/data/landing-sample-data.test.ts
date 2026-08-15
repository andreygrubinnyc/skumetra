import { describe, it, expect } from 'vitest'
import {
  SEVERITY_META,
  SAMPLE_MAX_PRICE_CHANGE,
  SAMPLE_RULES,
  accountSummary,
  alertRows,
  heroAlerts,
  productMatches,
  protectionRules,
  sampleRulesFor,
} from './landing-sample-data'
import { severityBorder } from '@/components/product/severity-badge'
import { applyMaxChangeCap, assessCurrentPrice, calculateSafePrice } from '@/lib/calc/safe-price'

describe('SEVERITY_META', () => {
  it('provides a label and color class for every severity', () => {
    for (const key of ['critical', 'high', 'medium', 'healthy'] as const) {
      expect(SEVERITY_META[key].label).toBeTruthy()
      expect(SEVERITY_META[key].colorClass).toMatch(/^text-sev-/)
    }
  })

  it('severityBorder returns the matching hex', () => {
    expect(severityBorder('critical')).toBe(SEVERITY_META.critical.borderColor)
  })
})

describe('landing sample data', () => {
  it('hero shows exactly the first two alerts', () => {
    expect(heroAlerts).toHaveLength(2)
    expect(heroAlerts).toEqual(alertRows.slice(0, 2))
  })

  it('the critical alert is a supplier stockout with zero quantity', () => {
    const critical = alertRows.find((a) => a.severity === 'critical')
    expect(critical?.sku).toBe('KB-204')
    expect(critical?.supplierQuantity).toBe(0)
    expect(critical?.minimumSafePrice).toBeUndefined()
  })

  it('keeps the locked pilot rule values', () => {
    const byLabel = Object.fromEntries(protectionRules.map((r) => [r.label, r.value]))
    expect(byLabel['Minimum profit']).toBe('$5.00')
    expect(byLabel['Minimum margin']).toBe('15%')
  })

  it('exposes one high-confidence and one review match', () => {
    expect(productMatches.map((m) => m.confidence).sort()).toEqual(['high', 'review'])
  })

  it('reports the expected monitored count', () => {
    expect(accountSummary.productsMonitored).toBe(184)
  })
})

/**
 * These are the guard rails for finding F-2: before calc-v1, the displayed
 * safe prices could not be reproduced from the displayed rules by ANY
 * consistent fee/cost assumption. Every assertion below recomputes from
 * `SAMPLE_RULES`, so a hand-edited figure fails the suite.
 */
describe('sample safe prices are reproducible from calc-v1', () => {
  const priced = alertRows.filter((a) => a.minimumSafePrice !== undefined)

  it('covers every row that displays a safe price', () => {
    expect(priced.map((a) => a.sku)).toEqual(['WB-118', 'CH-310', 'DL-402'])
  })

  it.each(priced.map((a) => [a.sku, a] as const))(
    '%s safe price equals the calc-v1 result',
    (_sku, row) => {
      const result = calculateSafePrice(sampleRulesFor(row.supplierCost!))
      expect(result.status).toBe('ok')
      expect(row.minimumSafePrice).toBe(result.minimumSafePrice)
    },
  )

  it('every row uses one shared assumption set', () => {
    for (const row of alertRows) {
      const rules = sampleRulesFor(row.supplierCost!)
      expect(rules.supplierShipping).toBe(SAMPLE_RULES.supplierShipping)
      expect(rules.marketplacePercentageFee).toBe(SAMPLE_RULES.marketplacePercentageFee)
      expect(rules.fulfillmentCost).toBe(SAMPLE_RULES.fulfillmentCost)
      expect(rules.minimumDollarProfit).toBe(SAMPLE_RULES.minimumDollarProfit)
      expect(rules.minimumMarginPercentage).toBe(SAMPLE_RULES.minimumMarginPercentage)
    }
  })

  it('no displayed safe price is below either configured floor', () => {
    for (const row of priced) {
      const r = calculateSafePrice(sampleRulesFor(row.supplierCost!))
      expect(row.minimumSafePrice!).toBeGreaterThanOrEqual(r.profitFloorPrice!)
      expect(row.minimumSafePrice!).toBeGreaterThanOrEqual(r.marginFloorPrice!)
    }
  })

  it('the displayed rules panel matches the assumption set that produced the numbers', () => {
    const byLabel = Object.fromEntries(protectionRules.map((r) => [r.label, r.value]))
    expect(byLabel['Supplier shipping']).toBe(`$${SAMPLE_RULES.supplierShipping.toFixed(2)}`)
    expect(byLabel['Fulfillment cost']).toBe(`$${SAMPLE_RULES.fulfillmentCost!.toFixed(2)}`)
    expect(byLabel['Est. marketplace fee']).toBe(
      `${SAMPLE_RULES.marketplacePercentageFee * 100}%`,
    )
    expect(byLabel['Minimum profit']).toBe(`$${SAMPLE_RULES.minimumDollarProfit.toFixed(2)}`)
    expect(byLabel['Minimum margin']).toBe(`${SAMPLE_RULES.minimumMarginPercentage * 100}%`)
    expect(byLabel['Max recommended price change']).toBe(`${SAMPLE_MAX_PRICE_CHANGE * 100}%`)
  })
})

describe('sample severities follow from the corrected numbers', () => {
  const bySku = Object.fromEntries(alertRows.map((a) => [a.sku, a]))

  it('WB-118 is below its safe price, so it is high severity', () => {
    const row = bySku['WB-118']!
    expect(row.amazonPrice!).toBeLessThan(row.minimumSafePrice!)
    expect(row.severity).toBe('high')
  })

  it('WB-118 can reach its safe price within the max-change rule', () => {
    const row = bySku['WB-118']!
    const { recommendedPrice, reachable } = applyMaxChangeCap(
      row.amazonPrice!,
      row.minimumSafePrice!,
      SAMPLE_MAX_PRICE_CHANGE,
    )
    expect(reachable).toBe(true)
    expect(recommendedPrice).toBe(row.minimumSafePrice)
    expect(row.recommendedAction).toContain('31.48')
  })

  it('CH-310 stays above its safe price, so a cost rise is only a review prompt', () => {
    const row = bySku['CH-310']!
    expect(row.amazonPrice!).toBeGreaterThan(row.minimumSafePrice!)
    expect(row.severity).toBe('medium')
    const a = assessCurrentPrice(row.amazonPrice!, sampleRulesFor(row.supplierCost!))
    // Compressed but still clearing both configured floors.
    expect(a.estimatedMargin!).toBeGreaterThan(SAMPLE_RULES.minimumMarginPercentage)
    expect(a.estimatedProfit!).toBeGreaterThan(SAMPLE_RULES.minimumDollarProfit)
  })

  it('DL-402 is financially healthy — its alert is about data age, not price', () => {
    const row = bySku['DL-402']!
    expect(row.amazonPrice!).toBeGreaterThan(row.minimumSafePrice!)
    expect(row.severity).toBe('medium')
    expect(row.alertType).toMatch(/stale/i)
  })

  it('KB-204 hides a safe price because the stockout is the actionable issue', () => {
    const row = bySku['KB-204']!
    expect(row.minimumSafePrice).toBeUndefined()
    expect(row.supplierQuantity).toBe(0)
    // Its price is nevertheless healthy, so hiding the figure conceals nothing.
    const r = calculateSafePrice(sampleRulesFor(row.supplierCost!))
    expect(row.amazonPrice!).toBeGreaterThan(r.minimumSafePrice!)
  })
})

describe('sample profit and margin agree with the same inputs', () => {
  it.each(alertRows.map((a) => [a.sku, a] as const))(
    '%s current-price assessment is internally consistent',
    (_sku, row) => {
      const a = assessCurrentPrice(row.amazonPrice!, sampleRulesFor(row.supplierCost!))
      expect(a.status).toBe('ok')

      // Margin is profit over selling price. It is derived at full precision
      // while the displayed profit is rounded to the nearest cent, so the two
      // can differ by up to half a cent's worth of margin — and no more.
      const marginFromDisplayedProfit = a.estimatedProfit! / row.amazonPrice!
      const halfCentOfMargin = 0.005 / row.amazonPrice!
      expect(Math.abs(a.estimatedMargin! - marginFromDisplayedProfit)).toBeLessThanOrEqual(
        halfCentOfMargin,
      )
    },
  )

  it('the product-matching sample reuses the CH-310 supplier cost', () => {
    const hub = productMatches.find((m) => m.amazon.title.includes('USB-C'))!
    const cost = hub.supplier.fields.find((f) => f.label === 'Cost')!.value
    const ch310 = alertRows.find((a) => a.sku === 'CH-310')!
    expect(cost).toBe(`$${ch310.supplierCost!.toFixed(2)}`)
  })
})
