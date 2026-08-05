import { describe, it, expect } from 'vitest'
import {
  SEVERITY_META,
  accountSummary,
  alertRows,
  heroAlerts,
  productMatches,
  protectionRules,
} from './landing-sample-data'
import { severityBorder } from '@/components/product/severity-badge'

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
