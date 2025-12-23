/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Delta-Neutral Utilities for Ethena Protocol
 *
 * Ethena maintains price stability through a delta-neutral strategy:
 * 1. Accepts collateral (stETH, ETH, BTC)
 * 2. Opens short perpetual futures positions
 * 3. Collects funding payments when rates are positive
 *
 * This creates a "synthetic dollar" backed by the combination of:
 * - Long spot position (collateral)
 * - Short perpetual position (hedge)
 */

/**
 * Delta position interface
 */
export interface DeltaPosition {
  spotValue: number; // USD value of spot holdings
  perpValue: number; // USD value of perp positions (negative for shorts)
  netDelta: number; // Net exposure (-1 to 1, 0 = perfectly hedged)
  fundingRate: number; // Current 8h funding rate
  unrealizedPnl: number;
  collateralType: string;
}

/**
 * Hedge effectiveness metrics
 */
export interface HedgeMetrics {
  deltaExposure: number; // Net delta exposure
  hedgeRatio: number; // Short position / Spot position
  fundingYield: number; // Annualized funding yield
  slippageRisk: number; // Estimated slippage on rebalance
  counterpartyExposure: Record<string, number>; // Per exchange exposure
}

/**
 * Calculate net delta exposure
 * @param spotValue Total spot position value
 * @param perpValue Total perpetual position value (negative for shorts)
 */
export function calculateDelta(spotValue: number, perpValue: number): number {
  if (spotValue === 0) return 0;
  return (spotValue + perpValue) / spotValue;
}

/**
 * Calculate hedge ratio
 * @param shortPosition Total short position value (positive number)
 * @param spotPosition Total spot position value
 */
export function calculateHedgeRatio(shortPosition: number, spotPosition: number): number {
  if (spotPosition === 0) return 0;
  return shortPosition / spotPosition;
}

/**
 * Check if position is within acceptable delta bounds
 * @param delta Current delta exposure
 * @param tolerance Maximum acceptable deviation (default: 1%)
 */
export function isDeltaNeutral(delta: number, tolerance = 0.01): boolean {
  return Math.abs(delta) <= tolerance;
}

/**
 * Calculate required rebalance to restore delta neutrality
 * @param spotValue Current spot value
 * @param perpValue Current perp value
 * @param targetDelta Target delta (default: 0)
 */
export function calculateRebalanceAmount(
  spotValue: number,
  perpValue: number,
  targetDelta = 0
): {
  action: 'increase_short' | 'decrease_short' | 'none';
  amount: number;
  newPerpValue: number;
} {
  const targetPerpValue = spotValue * (targetDelta - 1);
  const rebalanceAmount = targetPerpValue - perpValue;

  if (Math.abs(rebalanceAmount) < spotValue * 0.001) {
    return { action: 'none', amount: 0, newPerpValue: perpValue };
  }

  return {
    action: rebalanceAmount < 0 ? 'increase_short' : 'decrease_short',
    amount: Math.abs(rebalanceAmount),
    newPerpValue: targetPerpValue,
  };
}

/**
 * Calculate annualized funding yield
 * @param fundingRate 8-hour funding rate (e.g., 0.01 for 1%)
 * @param intervalsPerYear Number of 8-hour intervals per year (default: 1095)
 */
export function calculateAnnualizedFunding(
  fundingRate: number,
  intervalsPerYear = 1095
): number {
  // Simple: fundingRate * intervalsPerYear
  // Compounded: (1 + fundingRate)^intervalsPerYear - 1
  return Math.pow(1 + fundingRate, intervalsPerYear) - 1;
}

/**
 * Calculate position PnL
 */
export function calculatePositionPnl(
  entryPrice: number,
  currentPrice: number,
  size: number,
  isShort: boolean
): {
  pnl: number;
  pnlPercent: number;
} {
  const priceDiff = currentPrice - entryPrice;
  const pnl = isShort ? -priceDiff * size : priceDiff * size;
  const pnlPercent = (pnl / (entryPrice * size)) * 100;

  return { pnl, pnlPercent };
}

/**
 * Calculate liquidation price for a position
 * @param entryPrice Entry price
 * @param leverage Position leverage
 * @param isShort Whether position is short
 * @param maintenanceMargin Maintenance margin rate (default: 0.5%)
 */
export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  isShort: boolean,
  maintenanceMargin = 0.005
): number {
  const marginRatio = 1 / leverage;

  if (isShort) {
    // Short liquidation: price rises
    return entryPrice * (1 + marginRatio - maintenanceMargin);
  } else {
    // Long liquidation: price falls
    return entryPrice * (1 - marginRatio + maintenanceMargin);
  }
}

/**
 * Calculate counterparty risk distribution
 */
export function calculateCounterpartyRisk(
  positions: Array<{
    exchange: string;
    value: number;
  }>
): {
  distribution: Record<string, number>;
  concentration: number; // HHI-like measure
  largestExposure: { exchange: string; percent: number };
} {
  const total = positions.reduce((sum, p) => sum + Math.abs(p.value), 0);
  const distribution: Record<string, number> = {};

  for (const pos of positions) {
    const percent = total > 0 ? (Math.abs(pos.value) / total) * 100 : 0;
    distribution[pos.exchange] = (distribution[pos.exchange] || 0) + percent;
  }

  // Calculate concentration (sum of squared market shares)
  const concentration = Object.values(distribution).reduce((sum, p) => sum + Math.pow(p / 100, 2), 0);

  // Find largest exposure
  const largestExchange = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0];

  return {
    distribution,
    concentration,
    largestExposure: {
      exchange: largestExchange?.[0] || '',
      percent: largestExchange?.[1] || 0,
    },
  };
}

/**
 * Estimate slippage for a trade
 * @param size Trade size in USD
 * @param liquidity Available liquidity
 * @param baseSlippage Base slippage rate
 */
export function estimateSlippage(
  size: number,
  liquidity: number,
  baseSlippage = 0.001
): number {
  if (liquidity === 0) return 1; // 100% slippage
  const impact = (size / liquidity) * 0.1; // Linear impact model
  return baseSlippage + impact;
}

/**
 * Calculate optimal position sizing across exchanges
 */
export function calculateOptimalAllocation(
  totalSize: number,
  exchanges: Array<{
    id: string;
    liquidity: number;
    fundingRate: number;
    maxPosition: number;
  }>
): Array<{
  exchange: string;
  allocation: number;
  percent: number;
}> {
  // Simple liquidity-weighted allocation
  const totalLiquidity = exchanges.reduce((sum, e) => sum + e.liquidity, 0);
  const allocations = [];

  let remaining = totalSize;
  for (const exchange of exchanges) {
    const optimalAlloc = (exchange.liquidity / totalLiquidity) * totalSize;
    const allocation = Math.min(optimalAlloc, exchange.maxPosition, remaining);
    remaining -= allocation;

    allocations.push({
      exchange: exchange.id,
      allocation,
      percent: (allocation / totalSize) * 100,
    });
  }

  return allocations;
}

/**
 * Check if position needs rebalancing
 */
export function needsRebalance(
  currentDelta: number,
  rebalanceThreshold = 0.02,
  timeSinceLastRebalance?: number, // seconds
  maxRebalanceInterval = 86400 // 24 hours
): {
  shouldRebalance: boolean;
  reason: string;
} {
  if (Math.abs(currentDelta) > rebalanceThreshold) {
    return {
      shouldRebalance: true,
      reason: `Delta exposure ${(currentDelta * 100).toFixed(2)}% exceeds threshold`,
    };
  }

  if (timeSinceLastRebalance && timeSinceLastRebalance > maxRebalanceInterval) {
    return {
      shouldRebalance: true,
      reason: 'Maximum time since last rebalance exceeded',
    };
  }

  return {
    shouldRebalance: false,
    reason: 'Position within acceptable parameters',
  };
}

/**
 * Calculate funding payment
 */
export function calculateFundingPayment(
  positionSize: number,
  fundingRate: number,
  isShort: boolean
): number {
  // Short positions receive funding when rate is positive
  // Short positions pay funding when rate is negative
  return isShort ? positionSize * fundingRate : -positionSize * fundingRate;
}

/**
 * Aggregate position across multiple exchanges
 */
export function aggregatePositions(
  positions: Array<{
    exchange: string;
    symbol: string;
    size: number;
    side: 'long' | 'short';
    entryPrice: number;
    currentPrice: number;
    leverage: number;
  }>
): {
  totalLong: number;
  totalShort: number;
  netPosition: number;
  weightedEntryPrice: number;
  aggregatePnl: number;
} {
  let totalLong = 0;
  let totalShort = 0;
  let weightedEntry = 0;
  let totalSize = 0;
  let aggregatePnl = 0;

  for (const pos of positions) {
    const value = pos.size * pos.currentPrice;
    const pnl = calculatePositionPnl(
      pos.entryPrice,
      pos.currentPrice,
      pos.size,
      pos.side === 'short'
    );

    if (pos.side === 'long') {
      totalLong += value;
    } else {
      totalShort += value;
    }

    weightedEntry += pos.entryPrice * pos.size;
    totalSize += pos.size;
    aggregatePnl += pnl.pnl;
  }

  return {
    totalLong,
    totalShort,
    netPosition: totalLong - totalShort,
    weightedEntryPrice: totalSize > 0 ? weightedEntry / totalSize : 0,
    aggregatePnl,
  };
}
