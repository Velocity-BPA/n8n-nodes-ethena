/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Points/Sats Utilities for Ethena Protocol
 *
 * Ethena has a points system called "Sats" that rewards users
 * for protocol participation. Sats can be earned through:
 * - Holding USDe
 * - Staking sUSDe
 * - Referrals
 * - DeFi integrations
 */

/**
 * Points balance interface
 */
export interface PointsBalance {
  totalSats: number;
  satsFromHolding: number;
  satsFromStaking: number;
  satsFromReferrals: number;
  satsFromIntegrations: number;
  currentMultiplier: number;
  dailyEarningRate: number;
  rank?: number;
  percentile?: number;
}

/**
 * Season information
 */
export interface SeasonInfo {
  seasonNumber: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  totalSatsDistributed: number;
  participantCount: number;
  rewardsPool: number; // ENA tokens
}

/**
 * Multiplier tiers based on activity
 */
export const MULTIPLIER_TIERS = {
  base: 1.0,
  bronze: 1.25,
  silver: 1.5,
  gold: 2.0,
  platinum: 3.0,
  diamond: 5.0,
};

/**
 * Activity types that earn sats
 */
export enum SatsActivity {
  HOLD_USDE = 'hold_usde',
  STAKE_SUSDE = 'stake_susde',
  PROVIDE_LIQUIDITY = 'provide_liquidity',
  REFERRAL = 'referral',
  EARLY_ADOPTER = 'early_adopter',
  DEFI_INTEGRATION = 'defi_integration',
  GOVERNANCE = 'governance',
  SPECIAL_EVENT = 'special_event',
}

/**
 * Base sats earning rates (per $1000 per day)
 */
export const BASE_EARNING_RATES: Record<SatsActivity, number> = {
  [SatsActivity.HOLD_USDE]: 10,
  [SatsActivity.STAKE_SUSDE]: 20,
  [SatsActivity.PROVIDE_LIQUIDITY]: 30,
  [SatsActivity.REFERRAL]: 5,
  [SatsActivity.EARLY_ADOPTER]: 15,
  [SatsActivity.DEFI_INTEGRATION]: 25,
  [SatsActivity.GOVERNANCE]: 10,
  [SatsActivity.SPECIAL_EVENT]: 50,
};

/**
 * Calculate daily sats earnings
 */
export function calculateDailyEarnings(
  activities: Array<{
    type: SatsActivity;
    amount: number; // USD value
    multiplier?: number;
  }>
): number {
  let totalSats = 0;

  for (const activity of activities) {
    const baseRate = BASE_EARNING_RATES[activity.type] || 0;
    const multiplier = activity.multiplier || 1;
    const sats = (activity.amount / 1000) * baseRate * multiplier;
    totalSats += sats;
  }

  return totalSats;
}

/**
 * Calculate sats for holding USDe
 */
export function calculateHoldingSats(usdeBalance: number, days: number, multiplier = 1): number {
  const dailyRate = BASE_EARNING_RATES[SatsActivity.HOLD_USDE];
  return (usdeBalance / 1000) * dailyRate * days * multiplier;
}

/**
 * Calculate sats for staking sUSDe
 */
export function calculateStakingSats(
  susdeValue: number, // USD value
  days: number,
  multiplier = 1
): number {
  const dailyRate = BASE_EARNING_RATES[SatsActivity.STAKE_SUSDE];
  return (susdeValue / 1000) * dailyRate * days * multiplier;
}

/**
 * Calculate referral sats
 */
export function calculateReferralSats(
  referredVolume: number, // Total volume from referrals
  referralTier = 1
): number {
  const baseRate = BASE_EARNING_RATES[SatsActivity.REFERRAL];
  const tierMultiplier = 1 + (referralTier - 1) * 0.25; // 25% bonus per tier
  return (referredVolume / 1000) * baseRate * tierMultiplier;
}

/**
 * Get multiplier tier based on total sats
 */
export function getMultiplierTier(totalSats: number): {
  tier: string;
  multiplier: number;
  nextTier?: string;
  satsToNextTier?: number;
} {
  const thresholds = [
    { tier: 'diamond', sats: 1000000, multiplier: MULTIPLIER_TIERS.diamond },
    { tier: 'platinum', sats: 500000, multiplier: MULTIPLIER_TIERS.platinum },
    { tier: 'gold', sats: 100000, multiplier: MULTIPLIER_TIERS.gold },
    { tier: 'silver', sats: 25000, multiplier: MULTIPLIER_TIERS.silver },
    { tier: 'bronze', sats: 5000, multiplier: MULTIPLIER_TIERS.bronze },
    { tier: 'base', sats: 0, multiplier: MULTIPLIER_TIERS.base },
  ];

  for (let i = 0; i < thresholds.length; i++) {
    if (totalSats >= thresholds[i].sats) {
      const result: {
        tier: string;
        multiplier: number;
        nextTier?: string;
        satsToNextTier?: number;
      } = {
        tier: thresholds[i].tier,
        multiplier: thresholds[i].multiplier,
      };

      if (i > 0) {
        result.nextTier = thresholds[i - 1].tier;
        result.satsToNextTier = thresholds[i - 1].sats - totalSats;
      }

      return result;
    }
  }

  return { tier: 'base', multiplier: 1 };
}

/**
 * Calculate percentile rank
 */
export function calculatePercentile(userSats: number, allUserSats: number[]): number {
  const sorted = [...allUserSats].sort((a, b) => a - b);
  const rank = sorted.filter((s) => s < userSats).length;
  return (rank / sorted.length) * 100;
}

/**
 * Project sats earnings over time
 */
export function projectSatsEarnings(
  currentBalance: number,
  dailyEarningRate: number,
  days: number,
  includeCompounding = false
): {
  projectedSats: number;
  projectedTier: string;
  projectedMultiplier: number;
} {
  let projectedSats = currentBalance;

  if (includeCompounding) {
    // Simulate tier upgrades affecting earnings
    for (let i = 0; i < days; i++) {
      const { multiplier } = getMultiplierTier(projectedSats);
      projectedSats += dailyEarningRate * multiplier;
    }
  } else {
    projectedSats += dailyEarningRate * days;
  }

  const tierInfo = getMultiplierTier(projectedSats);

  return {
    projectedSats,
    projectedTier: tierInfo.tier,
    projectedMultiplier: tierInfo.multiplier,
  };
}

/**
 * Format sats for display
 */
export function formatSats(sats: number): string {
  if (sats >= 1000000) return `${(sats / 1000000).toFixed(2)}M`;
  if (sats >= 1000) return `${(sats / 1000).toFixed(2)}K`;
  return sats.toFixed(0);
}

/**
 * Calculate leaderboard position change
 */
export function calculateRankChange(
  previousRank: number,
  currentRank: number
): {
  change: number;
  direction: 'up' | 'down' | 'stable';
  formatted: string;
} {
  const change = previousRank - currentRank;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
  const formatted =
    direction === 'stable' ? '-' : direction === 'up' ? `↑${change}` : `↓${Math.abs(change)}`;

  return { change, direction, formatted };
}

/**
 * Estimate ENA rewards from sats
 */
export function estimateEnaRewards(
  userSats: number,
  totalSeasonSats: number,
  rewardsPool: number
): number {
  if (totalSeasonSats === 0) return 0;
  return (userSats / totalSeasonSats) * rewardsPool;
}

/**
 * Parse sats history from API response
 */
export function parseSatsHistory(
  history: Array<{
    timestamp: number;
    activity: string;
    amount: number;
    multiplier: number;
  }>
): Array<{
  date: Date;
  activity: SatsActivity;
  satsEarned: number;
  multiplier: number;
}> {
  return history.map((entry) => ({
    date: new Date(entry.timestamp * 1000),
    activity: entry.activity as SatsActivity,
    satsEarned: entry.amount,
    multiplier: entry.multiplier,
  }));
}

/**
 * Calculate time until season ends
 */
export function getSeasonTimeRemaining(endDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, formatted: 'Season Ended' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let formatted = '';
  if (days > 0) formatted += `${days}d `;
  if (hours > 0 || days > 0) formatted += `${hours}h `;
  formatted += `${minutes}m`;

  return { days, hours, minutes, formatted: formatted.trim() };
}
