/**
 * Yield Utilities Tests
 */

import {
  aprToApy,
  apyToApr,
  fundingRateToApy,
  apyToDailyYield,
  calculateEarnings,
  calculateExchangeRate,
  calculateRateBasedApy,
  calculateBlendedYield,
  formatYield,
  parseYield,
  calculateNetYield,
  formatLargeNumber,
} from '../nodes/Ethena/utils/yieldUtils';

describe('Yield Utilities', () => {
  describe('aprToApy', () => {
    it('should convert APR to APY with daily compounding', () => {
      const apr = 0.10; // 10% APR
      const apy = aprToApy(apr, 365);
      expect(apy).toBeCloseTo(0.10516, 4);
    });

    it('should return 0 for 0% APR', () => {
      expect(aprToApy(0)).toBe(0);
    });

    it('should handle high APR values', () => {
      const apr = 1.0; // 100% APR
      const apy = aprToApy(apr, 365);
      expect(apy).toBeCloseTo(1.7145, 3);
    });
  });

  describe('apyToApr', () => {
    it('should convert APY back to APR', () => {
      const apy = 0.10516;
      const apr = apyToApr(apy, 365);
      expect(apr).toBeCloseTo(0.10, 2);
    });

    it('should be inverse of aprToApy', () => {
      const originalApr = 0.15;
      const apy = aprToApy(originalApr);
      const convertedApr = apyToApr(apy);
      expect(convertedApr).toBeCloseTo(originalApr, 4);
    });
  });

  describe('fundingRateToApy', () => {
    it('should convert 8h funding rate to annualized yield', () => {
      const fundingRate = 0.0001; // 0.01% per 8h
      const apy = fundingRateToApy(fundingRate);
      expect(apy).toBeGreaterThan(0.1); // Should be > 10% annualized
    });

    it('should handle negative funding rates', () => {
      const fundingRate = -0.0001;
      const apy = fundingRateToApy(fundingRate);
      expect(apy).toBeLessThan(0);
    });
  });

  describe('apyToDailyYield', () => {
    it('should calculate correct daily yield from APY', () => {
      const apy = 0.10; // 10% APY
      const daily = apyToDailyYield(apy);
      expect(daily).toBeCloseTo(0.000261, 5);
    });
  });

  describe('calculateEarnings', () => {
    it('should calculate compounded earnings correctly', () => {
      const result = calculateEarnings(1000, 0.10, 365, true);
      expect(result.finalAmount).toBeCloseTo(1100, 0);
      expect(result.earnings).toBeCloseTo(100, 0);
    });

    it('should calculate simple interest correctly', () => {
      const result = calculateEarnings(1000, 0.10, 365, false);
      expect(result.finalAmount).toBe(1100);
      expect(result.earnings).toBe(100);
    });

    it('should calculate daily earnings', () => {
      const result = calculateEarnings(1000, 0.10, 365);
      expect(result.dailyEarnings).toBeCloseTo(0.274, 2);
    });
  });

  describe('calculateExchangeRate', () => {
    it('should calculate exchange rate from assets and supply', () => {
      const totalAssets = BigInt('1050000000000000000000'); // 1050 USDe
      const totalSupply = BigInt('1000000000000000000000'); // 1000 sUSDe
      const rate = calculateExchangeRate(totalAssets, totalSupply);
      expect(rate).toBe(1.05);
    });

    it('should return 1 for zero supply', () => {
      const rate = calculateExchangeRate(BigInt(0), BigInt(0));
      expect(rate).toBe(1);
    });
  });

  describe('calculateRateBasedApy', () => {
    it('should calculate APY from exchange rate change', () => {
      const startRate = 1.0;
      const endRate = 1.01; // 1% increase
      const days = 30;
      const apy = calculateRateBasedApy(startRate, endRate, days);
      expect(apy).toBeGreaterThan(0.10); // Should be > 10% annualized
    });

    it('should return 0 for zero start rate', () => {
      const apy = calculateRateBasedApy(0, 1.01, 30);
      expect(apy).toBe(0);
    });
  });

  describe('calculateBlendedYield', () => {
    it('should calculate weighted average yield', () => {
      const sources = [
        { name: 'funding', apy: 0.15, weight: 0.6 },
        { name: 'staking', apy: 0.05, weight: 0.4 },
      ];
      const blended = calculateBlendedYield(sources);
      expect(blended).toBe(0.11); // 15% * 0.6 + 5% * 0.4
    });
  });

  describe('formatYield', () => {
    it('should format yield as percentage', () => {
      expect(formatYield(0.1234)).toBe('12.34%');
      expect(formatYield(0.1)).toBe('10.00%');
    });

    it('should respect decimal parameter', () => {
      expect(formatYield(0.12345, 3)).toBe('12.345%');
    });
  });

  describe('parseYield', () => {
    it('should parse percentage string', () => {
      expect(parseYield('12.34%')).toBeCloseTo(0.1234, 4);
    });

    it('should parse decimal string', () => {
      expect(parseYield('0.1234')).toBe(0.1234);
    });

    it('should handle numbers > 1 as percentages', () => {
      expect(parseYield('12.34')).toBeCloseTo(0.1234, 4);
    });
  });

  describe('calculateNetYield', () => {
    it('should deduct fees from gross yield', () => {
      const grossYield = 0.10; // 10%
      const feeRate = 0.10; // 10% fee
      const netYield = calculateNetYield(grossYield, feeRate);
      expect(netYield).toBe(0.09); // 9%
    });
  });

  describe('formatLargeNumber', () => {
    it('should format billions', () => {
      expect(formatLargeNumber(1500000000)).toBe('1.50B');
    });

    it('should format millions', () => {
      expect(formatLargeNumber(1500000)).toBe('1.50M');
    });

    it('should format thousands', () => {
      expect(formatLargeNumber(1500)).toBe('1.50K');
    });

    it('should format small numbers', () => {
      expect(formatLargeNumber(150)).toBe('150.00');
    });
  });
});
