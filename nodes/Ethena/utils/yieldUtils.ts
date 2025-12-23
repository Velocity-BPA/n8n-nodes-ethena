/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Yield Utilities for Ethena Protocol
 *
 * Provides calculations for:
 * - APY/APR conversions
 * - Yield projections
 * - Funding rate analysis
 * - Earnings calculations
 */

import { ethers } from 'ethers';

/**
 * Convert APR to APY with compounding
 * @param apr Annual Percentage Rate as decimal (e.g., 0.10 for 10%)
 * @param compoundingPeriods Number of compounding periods per year (default: 365 for daily)
 */
export function aprToApy(apr: number, compoundingPeriods = 365): number {
  return Math.pow(1 + apr / compoundingPeriods, compoundingPeriods) - 1;
}

/**
 * Convert APY to APR
 * @param apy Annual Percentage Yield as decimal
 * @param compoundingPeriods Number of compounding periods per year
 */
export function apyToApr(apy: number, compoundingPeriods = 365): number {
  return compoundingPeriods * (Math.pow(1 + apy, 1 / compoundingPeriods) - 1);
}

/**
 * Calculate funding rate to annualized yield
 * @param fundingRate 8-hour funding rate as decimal
 * @param intervalsPerDay Number of funding intervals per day (default: 3 for 8h intervals)
 */
export function fundingRateToApy(fundingRate: number, intervalsPerDay = 3): number {
  const dailyRate = fundingRate * intervalsPerDay;
  return aprToApy(dailyRate * 365);
}

/**
 * Calculate daily yield from APY
 * @param apy Annual yield as decimal
 */
export function apyToDailyYield(apy: number): number {
  return Math.pow(1 + apy, 1 / 365) - 1;
}

/**
 * Calculate projected earnings
 * @param principal Initial investment amount
 * @param apy Annual yield as decimal
 * @param days Number of days
 * @param compounding Whether to compound (default: true)
 */
export function calculateEarnings(
  principal: number,
  apy: number,
  days: number,
  compounding = true
): {
  finalAmount: number;
  earnings: number;
  dailyEarnings: number;
} {
  let finalAmount: number;

  if (compounding) {
    const dailyRate = Math.pow(1 + apy, 1 / 365) - 1;
    finalAmount = principal * Math.pow(1 + dailyRate, days);
  } else {
    const dailyRate = apy / 365;
    finalAmount = principal * (1 + dailyRate * days);
  }

  const earnings = finalAmount - principal;
  const dailyEarnings = earnings / days;

  return {
    finalAmount,
    earnings,
    dailyEarnings,
  };
}

/**
 * Calculate sUSDe exchange rate from total assets and supply
 * @param totalAssets Total USDe in the vault (in wei)
 * @param totalSupply Total sUSDe supply (in wei)
 */
export function calculateExchangeRate(totalAssets: bigint, totalSupply: bigint): number {
  if (totalSupply === 0n) return 1;
  return Number(totalAssets) / Number(totalSupply);
}

/**
 * Calculate sUSDe APY from exchange rate changes
 * @param startRate Starting exchange rate
 * @param endRate Ending exchange rate
 * @param periodDays Number of days between rates
 */
export function calculateRateBasedApy(
  startRate: number,
  endRate: number,
  periodDays: number
): number {
  if (startRate === 0 || periodDays === 0) return 0;
  const periodReturn = (endRate - startRate) / startRate;
  const dailyReturn = periodReturn / periodDays;
  return aprToApy(dailyReturn * 365);
}

/**
 * Calculate yield from multiple sources
 * @param sources Array of yield sources with their contributions
 */
export function calculateBlendedYield(
  sources: Array<{
    name: string;
    apy: number;
    weight: number; // 0-1
  }>
): number {
  return sources.reduce((total, source) => total + source.apy * source.weight, 0);
}

/**
 * Format yield for display
 * @param yield_ Yield as decimal (e.g., 0.1234 for 12.34%)
 * @param decimals Number of decimal places
 */
export function formatYield(yield_: number, decimals = 2): string {
  return `${(yield_ * 100).toFixed(decimals)}%`;
}

/**
 * Parse yield from string
 * @param yieldStr Yield string (e.g., "12.34%" or "0.1234")
 */
export function parseYield(yieldStr: string): number {
  const cleaned = yieldStr.replace('%', '').trim();
  const value = parseFloat(cleaned);
  // If the original had %, it's already a percentage
  if (yieldStr.includes('%')) {
    return value / 100;
  }
  // Otherwise, if > 1, assume it's a percentage
  if (value > 1) {
    return value / 100;
  }
  return value;
}

/**
 * Calculate time-weighted average yield
 * @param yieldHistory Array of { timestamp, yield } sorted by time
 */
export function calculateTWAY(
  yieldHistory: Array<{
    timestamp: number;
    yield: number;
  }>
): number {
  if (yieldHistory.length === 0) return 0;
  if (yieldHistory.length === 1) return yieldHistory[0].yield;

  let totalWeightedYield = 0;
  let totalTime = 0;

  for (let i = 1; i < yieldHistory.length; i++) {
    const timeDiff = yieldHistory[i].timestamp - yieldHistory[i - 1].timestamp;
    const avgYield = (yieldHistory[i].yield + yieldHistory[i - 1].yield) / 2;
    totalWeightedYield += avgYield * timeDiff;
    totalTime += timeDiff;
  }

  return totalTime > 0 ? totalWeightedYield / totalTime : 0;
}

/**
 * Calculate yield with fee deduction
 * @param grossYield Gross yield before fees
 * @param feeRate Fee rate as decimal (e.g., 0.1 for 10%)
 */
export function calculateNetYield(grossYield: number, feeRate: number): number {
  return grossYield * (1 - feeRate);
}

/**
 * Project future value with variable yield
 * @param principal Starting amount
 * @param projectedYields Array of { days, apy } for each period
 */
export function projectFutureValue(
  principal: number,
  projectedYields: Array<{
    days: number;
    apy: number;
  }>
): number {
  let currentValue = principal;

  for (const period of projectedYields) {
    const dailyRate = Math.pow(1 + period.apy, 1 / 365) - 1;
    currentValue *= Math.pow(1 + dailyRate, period.days);
  }

  return currentValue;
}

/**
 * Format large numbers for display
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

/**
 * Convert wei to human readable with decimals
 */
export function formatTokenAmount(weiAmount: bigint | string, decimals = 18): string {
  return ethers.formatUnits(weiAmount, decimals);
}

/**
 * Convert human readable to wei
 */
export function parseTokenAmount(amount: string | number, decimals = 18): bigint {
  return ethers.parseUnits(String(amount), decimals);
}
