/**
 * calc-v1 — deterministic minimum-safe-price calculation.
 *
 * SCOPE: this exists to generate and verify the **fictional landing-page
 * sample data** so the displayed numbers are reproducible from the
 * displayed rules. It is NOT the production analysis engine — there is no
 * file processing, product matching, persistence, alerting, seller-specific
 * configuration, or Amazon integration here, and none belongs here. That
 * engine is Release 3 scope.
 *
 * Approved formula structure (D-06) and rounding rule (D-11):
 *
 *   non_percentage_cost      = supplier_cost + supplier_shipping
 *                            + fixed_marketplace_fee + fulfillment_cost
 *                            + additional_fixed_cost_buffer
 *   effective_percentage_cost = marketplace_percentage_fee
 *                            + additional_percentage_cost
 *   profit_floor_price       = (non_percentage_cost + minimum_dollar_profit)
 *                            / (1 - effective_percentage_cost)
 *   margin_floor_price       = non_percentage_cost
 *                            / (1 - effective_percentage_cost - minimum_margin_percentage)
 *   minimum_safe_price       = max(profit_floor_price, margin_floor_price,
 *                                  optional_absolute_minimum_price)
 *
 * Confirmed definitions: percentage fees apply to the SELLING price;
 * estimated margin is estimated profit divided by selling price; both the
 * minimum-profit and minimum-margin rules must hold, and the higher
 * required floor controls.
 *
 * Rounding: full precision is carried internally; the final safe price is
 * rounded UP to the next cent and never downward. Rounding a threshold down
 * would let a price that misses the seller's configured minimum look
 * compliant.
 *
 * No AI is involved in any value produced here, by design.
 */
import Decimal from 'decimal.js'

export interface SafePriceRules {
  /** Per-unit supplier cost. */
  supplierCost: number
  /** Per-unit inbound shipping. */
  supplierShipping: number
  /** Marketplace percentage fee as a fraction, e.g. 0.15 for 15%. */
  marketplacePercentageFee: number
  /** Per-unit fixed marketplace fee. Defaults to 0. */
  fixedMarketplaceFee?: number
  /** Per-unit fulfillment cost. Defaults to 0. */
  fulfillmentCost?: number
  /** Miscellaneous per-unit fixed buffer. Defaults to 0. */
  additionalFixedCostBuffer?: number
  /** Extra percentage cost as a fraction. Defaults to 0. */
  additionalPercentageCost?: number
  /** Minimum acceptable dollar profit. */
  minimumDollarProfit: number
  /** Minimum acceptable margin as a fraction, e.g. 0.15 for 15%. */
  minimumMarginPercentage: number
  /** Optional hard price floor the seller never wants to go below. */
  absoluteMinimumPrice?: number
}

export type SafePriceStatus =
  /** All inputs valid; a safe price was produced. */
  | 'ok'
  /** An input was absent; nothing was computed. */
  | 'insufficient_data'
  /** An input was structurally invalid (negative, or fees >= 100%). */
  | 'invalid_input'
  /** Fees plus the margin target leave no attainable price. */
  | 'unattainable_rules'

export interface SafePriceResult {
  status: SafePriceStatus
  /** Sum of all non-percentage costs. */
  nonPercentageCost?: number
  /** Combined percentage cost as a fraction. */
  effectivePercentageCost?: number
  /** Price required to satisfy the minimum-dollar-profit rule. */
  profitFloorPrice?: number
  /** Price required to satisfy the minimum-margin rule. */
  marginFloorPrice?: number
  /** The controlling floor, rounded up to the next cent. */
  minimumSafePrice?: number
  /** Which rule set the floor, when a safe price was produced. */
  controllingRule?: 'profit' | 'margin' | 'absolute-minimum'
}

export interface CurrentPriceAssessment {
  status: 'ok' | 'insufficient_data' | 'invalid_input'
  /** Non-percentage cost plus percentage cost at the current price. */
  estimatedTotalCost?: number
  /** Current price minus estimated total cost. */
  estimatedProfit?: number
  /** Estimated profit divided by the current price, as a fraction. */
  estimatedMargin?: number
}

/** Rounds up to the next cent — used only for the safe-price threshold. */
function ceilToCent(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_CEIL).toNumber()
}

/** Rounds to the nearest cent — used for descriptive display figures. */
function roundToCent(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

function isPresent(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value)
}

/**
 * Computes the minimum safe price. Returns a status rather than throwing,
 * and never emits a price alongside a non-`ok` status — a missing number is
 * safer to show a seller than a wrong one.
 */
export function calculateSafePrice(rules: SafePriceRules): SafePriceResult {
  const required = [
    rules.supplierCost,
    rules.supplierShipping,
    rules.marketplacePercentageFee,
    rules.minimumDollarProfit,
    rules.minimumMarginPercentage,
  ]
  if (!required.every(isPresent)) return { status: 'insufficient_data' }

  const fixedFee = rules.fixedMarketplaceFee ?? 0
  const fulfillment = rules.fulfillmentCost ?? 0
  const buffer = rules.additionalFixedCostBuffer ?? 0
  const additionalPct = rules.additionalPercentageCost ?? 0

  const money = [
    rules.supplierCost,
    rules.supplierShipping,
    fixedFee,
    fulfillment,
    buffer,
    rules.minimumDollarProfit,
  ]
  const percentages = [
    rules.marketplacePercentageFee,
    additionalPct,
    rules.minimumMarginPercentage,
  ]
  if (money.some((v) => v < 0) || percentages.some((v) => v < 0)) {
    return { status: 'invalid_input' }
  }

  const nonPercentageCost = new Decimal(rules.supplierCost)
    .plus(rules.supplierShipping)
    .plus(fixedFee)
    .plus(fulfillment)
    .plus(buffer)

  const effectivePercentageCost = new Decimal(rules.marketplacePercentageFee).plus(additionalPct)

  // Percentage costs consuming the whole sale leave no profitable price.
  const profitDenominator = new Decimal(1).minus(effectivePercentageCost)
  if (profitDenominator.lte(0)) return { status: 'invalid_input' }

  // Fees plus the margin target can exceed the sale entirely.
  const marginDenominator = profitDenominator.minus(rules.minimumMarginPercentage)
  if (marginDenominator.lte(0)) return { status: 'unattainable_rules' }

  const profitFloor = nonPercentageCost.plus(rules.minimumDollarProfit).dividedBy(profitDenominator)
  const marginFloor = nonPercentageCost.dividedBy(marginDenominator)

  // Full precision is preserved until the final comparison, per D-11.
  let controlling = profitFloor.gte(marginFloor) ? profitFloor : marginFloor
  let controllingRule: NonNullable<SafePriceResult['controllingRule']> =
    profitFloor.gte(marginFloor) ? 'profit' : 'margin'

  if (isPresent(rules.absoluteMinimumPrice)) {
    if (rules.absoluteMinimumPrice < 0) return { status: 'invalid_input' }
    const absolute = new Decimal(rules.absoluteMinimumPrice)
    if (absolute.gt(controlling)) {
      controlling = absolute
      controllingRule = 'absolute-minimum'
    }
  }

  return {
    status: 'ok',
    nonPercentageCost: roundToCent(nonPercentageCost),
    effectivePercentageCost: effectivePercentageCost.toNumber(),
    profitFloorPrice: ceilToCent(profitFloor),
    marginFloorPrice: ceilToCent(marginFloor),
    minimumSafePrice: ceilToCent(controlling),
    controllingRule,
  }
}

/**
 * Assesses the current selling price. Descriptive only — these figures are
 * rounded normally because they report a situation rather than enforce a
 * threshold.
 */
export function assessCurrentPrice(
  currentPrice: number,
  rules: SafePriceRules,
): CurrentPriceAssessment {
  if (!isPresent(currentPrice)) return { status: 'insufficient_data' }
  if (currentPrice <= 0) return { status: 'invalid_input' }

  const safe = calculateSafePrice(rules)
  if (safe.status === 'insufficient_data') return { status: 'insufficient_data' }
  if (safe.nonPercentageCost === undefined || safe.effectivePercentageCost === undefined) {
    return { status: 'invalid_input' }
  }

  const price = new Decimal(currentPrice)
  const totalCost = new Decimal(safe.nonPercentageCost).plus(
    price.times(safe.effectivePercentageCost),
  )
  const profit = price.minus(totalCost)

  return {
    status: 'ok',
    estimatedTotalCost: roundToCent(totalCost),
    estimatedProfit: roundToCent(profit),
    estimatedMargin: profit.dividedBy(price).toNumber(),
  }
}

/**
 * Caps a recommended price by the seller's maximum-change rule.
 *
 * This never alters the safe price itself — the safe price is a fact about
 * the product's economics, while the cap is a preference about how fast to
 * move. When the cap cannot reach the safe price, `reachable` is false and
 * the caller should say so rather than quietly showing a price that is
 * still unsafe.
 */
export function applyMaxChangeCap(
  currentPrice: number,
  minimumSafePrice: number,
  maxChangeFraction: number,
): { recommendedPrice: number; reachable: boolean } {
  const ceiling = new Decimal(currentPrice).times(new Decimal(1).plus(maxChangeFraction))
  const target = new Decimal(minimumSafePrice)
  if (ceiling.gte(target)) {
    return { recommendedPrice: ceilToCent(target), reachable: true }
  }
  return { recommendedPrice: ceilToCent(ceiling), reachable: false }
}
