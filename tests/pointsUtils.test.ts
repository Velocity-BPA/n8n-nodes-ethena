/**
 * Points/Sats Utilities Tests
 */

import {
  calculateDailyEarnings,
  calculateHoldingSats,
  calculateStakingSats,
  calculateReferralSats,
  getMultiplierTier,
  calculatePercentile,
  projectSatsEarnings,
  formatSats,
  calculateRankChange,
  estimateEnaRewards,
  getSeasonTimeRemaining,
  SatsActivity,
  MULTIPLIER_TIERS,
} from '../nodes/Ethena/utils/pointsUtils';

describe('Points/Sats Utilities', () => {
  describe('calculateDailyEarnings', () => {
    it('should calculate daily sats from single activity', () => {
      const activities = [
        { type: SatsActivity.HOLD_USDE, amount: 1000, multiplier: 1 },
      ];
      const sats = calculateDailyEarnings(activities);
      expect(sats).toBe(10); // 1000/1000 * 10 base rate
    });

    it('should apply multiplier', () => {
      const activities = [
        { type: SatsActivity.HOLD_USDE, amount: 1000, multiplier: 2 },
      ];
      const sats = calculateDailyEarnings(activities);
      expect(sats).toBe(20);
    });

    it('should sum multiple activities', () => {
      const activities = [
        { type: SatsActivity.HOLD_USDE, amount: 1000, multiplier: 1 },
        { type: SatsActivity.STAKE_SUSDE, amount: 1000, multiplier: 1 },
      ];
      const sats = calculateDailyEarnings(activities);
      expect(sats).toBe(30); // 10 + 20
    });
  });

  describe('calculateHoldingSats', () => {
    it('should calculate sats for holding USDe', () => {
      const sats = calculateHoldingSats(10000, 30, 1);
      expect(sats).toBe(3000); // 10 * 10 * 30
    });

    it('should apply multiplier', () => {
      const sats = calculateHoldingSats(10000, 30, 2);
      expect(sats).toBe(6000);
    });
  });

  describe('calculateStakingSats', () => {
    it('should calculate sats for staking sUSDe', () => {
      const sats = calculateStakingSats(10000, 30, 1);
      expect(sats).toBe(6000); // 10 * 20 * 30
    });
  });

  describe('calculateReferralSats', () => {
    it('should calculate referral sats with tier bonus', () => {
      const tier1 = calculateReferralSats(10000, 1);
      const tier2 = calculateReferralSats(10000, 2);
      
      expect(tier2).toBeGreaterThan(tier1);
    });
  });

  describe('getMultiplierTier', () => {
    it('should return base tier for low sats', () => {
      const result = getMultiplierTier(100);
      expect(result.tier).toBe('base');
      expect(result.multiplier).toBe(MULTIPLIER_TIERS.base);
    });

    it('should return bronze tier', () => {
      const result = getMultiplierTier(5000);
      expect(result.tier).toBe('bronze');
      expect(result.nextTier).toBe('silver');
    });

    it('should return silver tier', () => {
      const result = getMultiplierTier(25000);
      expect(result.tier).toBe('silver');
    });

    it('should return gold tier', () => {
      const result = getMultiplierTier(100000);
      expect(result.tier).toBe('gold');
    });

    it('should return platinum tier', () => {
      const result = getMultiplierTier(500000);
      expect(result.tier).toBe('platinum');
    });

    it('should return diamond tier with no next tier', () => {
      const result = getMultiplierTier(1000000);
      expect(result.tier).toBe('diamond');
      expect(result.nextTier).toBeUndefined();
    });

    it('should calculate sats to next tier', () => {
      const result = getMultiplierTier(4000);
      expect(result.satsToNextTier).toBe(1000); // 5000 - 4000
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentile correctly', () => {
      const allSats = [100, 200, 300, 400, 500];
      const percentile = calculatePercentile(350, allSats);
      expect(percentile).toBe(60); // Above 3 out of 5
    });

    it('should return 0 for lowest value', () => {
      const allSats = [100, 200, 300];
      const percentile = calculatePercentile(50, allSats);
      expect(percentile).toBe(0);
    });
  });

  describe('projectSatsEarnings', () => {
    it('should project simple earnings', () => {
      const result = projectSatsEarnings(1000, 100, 30, false);
      expect(result.projectedSats).toBe(4000); // 1000 + 100*30
    });

    it('should project with compounding multipliers', () => {
      const result = projectSatsEarnings(4000, 100, 30, true);
      expect(result.projectedSats).toBeGreaterThan(4000 + 100 * 30);
    });
  });

  describe('formatSats', () => {
    it('should format millions', () => {
      expect(formatSats(1500000)).toBe('1.50M');
    });

    it('should format thousands', () => {
      expect(formatSats(1500)).toBe('1.50K');
    });

    it('should format small numbers', () => {
      expect(formatSats(150)).toBe('150');
    });
  });

  describe('calculateRankChange', () => {
    it('should detect rank improvement', () => {
      const result = calculateRankChange(100, 50);
      expect(result.direction).toBe('up');
      expect(result.change).toBe(50);
      expect(result.formatted).toBe('↑50');
    });

    it('should detect rank decline', () => {
      const result = calculateRankChange(50, 100);
      expect(result.direction).toBe('down');
      expect(result.change).toBe(-50);
      expect(result.formatted).toBe('↓50');
    });

    it('should detect stable rank', () => {
      const result = calculateRankChange(100, 100);
      expect(result.direction).toBe('stable');
      expect(result.formatted).toBe('-');
    });
  });

  describe('estimateEnaRewards', () => {
    it('should estimate rewards proportionally', () => {
      const rewards = estimateEnaRewards(1000, 10000, 1000);
      expect(rewards).toBe(100); // 10% of pool
    });

    it('should return 0 for zero total sats', () => {
      const rewards = estimateEnaRewards(1000, 0, 1000);
      expect(rewards).toBe(0);
    });
  });

  describe('getSeasonTimeRemaining', () => {
    it('should calculate time remaining', () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const result = getSeasonTimeRemaining(futureDate);
      
      expect(result.days).toBe(1); // ~2 days
      expect(result.formatted).toContain('d');
    });

    it('should return "Season Ended" for past date', () => {
      const pastDate = new Date(Date.now() - 1000);
      const result = getSeasonTimeRemaining(pastDate);
      
      expect(result.formatted).toBe('Season Ended');
      expect(result.days).toBe(0);
    });
  });
});
