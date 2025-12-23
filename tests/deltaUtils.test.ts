/**
 * Delta-Neutral Utilities Tests
 */

import {
  calculateDelta,
  calculateHedgeRatio,
  isDeltaNeutral,
  calculateRebalanceAmount,
  calculateAnnualizedFunding,
  calculatePositionPnl,
  calculateLiquidationPrice,
  calculateCounterpartyRisk,
  estimateSlippage,
  calculateOptimalAllocation,
  needsRebalance,
  calculateFundingPayment,
  aggregatePositions,
} from '../nodes/Ethena/utils/deltaUtils';

describe('Delta-Neutral Utilities', () => {
  describe('calculateDelta', () => {
    it('should calculate net delta exposure', () => {
      const delta = calculateDelta(1000, -1000); // Spot 1000, Short -1000
      expect(delta).toBe(0); // Perfectly hedged
    });

    it('should calculate positive delta (underhedged)', () => {
      const delta = calculateDelta(1000, -500); // Spot 1000, Short -500
      expect(delta).toBe(0.5); // 50% unhedged
    });

    it('should calculate negative delta (overhedged)', () => {
      const delta = calculateDelta(1000, -1500); // Spot 1000, Short -1500
      expect(delta).toBe(-0.5); // 50% overhedged
    });

    it('should return 0 for zero spot value', () => {
      const delta = calculateDelta(0, -1000);
      expect(delta).toBe(0);
    });
  });

  describe('calculateHedgeRatio', () => {
    it('should calculate hedge ratio', () => {
      const ratio = calculateHedgeRatio(1000, 1000);
      expect(ratio).toBe(1); // 100% hedged
    });

    it('should handle partial hedge', () => {
      const ratio = calculateHedgeRatio(500, 1000);
      expect(ratio).toBe(0.5); // 50% hedged
    });
  });

  describe('isDeltaNeutral', () => {
    it('should return true for delta within tolerance', () => {
      expect(isDeltaNeutral(0.005, 0.01)).toBe(true);
      expect(isDeltaNeutral(-0.005, 0.01)).toBe(true);
    });

    it('should return false for delta outside tolerance', () => {
      expect(isDeltaNeutral(0.02, 0.01)).toBe(false);
    });
  });

  describe('calculateRebalanceAmount', () => {
    it('should recommend no action when delta neutral', () => {
      const result = calculateRebalanceAmount(1000, -1000);
      expect(result.action).toBe('none');
    });

    it('should recommend increasing short when underhedged', () => {
      const result = calculateRebalanceAmount(1000, -500);
      expect(result.action).toBe('increase_short');
      expect(result.amount).toBe(500);
    });

    it('should recommend decreasing short when overhedged', () => {
      const result = calculateRebalanceAmount(1000, -1500);
      expect(result.action).toBe('decrease_short');
      expect(result.amount).toBe(500);
    });
  });

  describe('calculateAnnualizedFunding', () => {
    it('should annualize 8h funding rate', () => {
      const fundingRate = 0.0001; // 0.01% per 8h
      const annualized = calculateAnnualizedFunding(fundingRate);
      expect(annualized).toBeGreaterThan(0.1); // > 10%
    });

    it('should handle negative funding', () => {
      const fundingRate = -0.0001;
      const annualized = calculateAnnualizedFunding(fundingRate);
      expect(annualized).toBeLessThan(0);
    });
  });

  describe('calculatePositionPnl', () => {
    it('should calculate long position profit', () => {
      const result = calculatePositionPnl(100, 110, 10, false);
      expect(result.pnl).toBe(100); // (110-100)*10
      expect(result.pnlPercent).toBe(10);
    });

    it('should calculate long position loss', () => {
      const result = calculatePositionPnl(100, 90, 10, false);
      expect(result.pnl).toBe(-100);
    });

    it('should calculate short position profit', () => {
      const result = calculatePositionPnl(100, 90, 10, true);
      expect(result.pnl).toBe(100); // Short profits when price falls
    });

    it('should calculate short position loss', () => {
      const result = calculatePositionPnl(100, 110, 10, true);
      expect(result.pnl).toBe(-100);
    });
  });

  describe('calculateLiquidationPrice', () => {
    it('should calculate long liquidation price', () => {
      const liqPrice = calculateLiquidationPrice(100, 10, false);
      expect(liqPrice).toBeLessThan(100); // Below entry for longs
    });

    it('should calculate short liquidation price', () => {
      const liqPrice = calculateLiquidationPrice(100, 10, true);
      expect(liqPrice).toBeGreaterThan(100); // Above entry for shorts
    });

    it('should account for leverage', () => {
      const liq10x = calculateLiquidationPrice(100, 10, false);
      const liq5x = calculateLiquidationPrice(100, 5, false);
      expect(liq10x).toBeGreaterThan(liq5x); // Higher leverage = tighter liquidation
    });
  });

  describe('calculateCounterpartyRisk', () => {
    it('should calculate distribution percentages', () => {
      const positions = [
        { exchange: 'binance', value: 600 },
        { exchange: 'bybit', value: 400 },
      ];
      const result = calculateCounterpartyRisk(positions);
      
      expect(result.distribution.binance).toBe(60);
      expect(result.distribution.bybit).toBe(40);
    });

    it('should identify largest exposure', () => {
      const positions = [
        { exchange: 'binance', value: 600 },
        { exchange: 'bybit', value: 400 },
      ];
      const result = calculateCounterpartyRisk(positions);
      
      expect(result.largestExposure.exchange).toBe('binance');
      expect(result.largestExposure.percent).toBe(60);
    });

    it('should calculate concentration (HHI)', () => {
      const positions = [
        { exchange: 'binance', value: 500 },
        { exchange: 'bybit', value: 500 },
      ];
      const result = calculateCounterpartyRisk(positions);
      
      expect(result.concentration).toBe(0.5); // 0.5^2 + 0.5^2
    });
  });

  describe('estimateSlippage', () => {
    it('should estimate slippage based on size and liquidity', () => {
      const slippage = estimateSlippage(100000, 10000000);
      expect(slippage).toBeGreaterThan(0.001);
      expect(slippage).toBeLessThan(0.1);
    });

    it('should return 100% for zero liquidity', () => {
      const slippage = estimateSlippage(1000, 0);
      expect(slippage).toBe(1);
    });
  });

  describe('calculateOptimalAllocation', () => {
    it('should allocate proportionally to liquidity', () => {
      const exchanges = [
        { id: 'binance', liquidity: 100000, fundingRate: 0.01, maxPosition: 50000 },
        { id: 'bybit', liquidity: 50000, fundingRate: 0.01, maxPosition: 50000 },
      ];
      const allocations = calculateOptimalAllocation(30000, exchanges);
      
      expect(allocations[0].allocation).toBeGreaterThan(allocations[1].allocation);
    });

    it('should respect max position limits', () => {
      const exchanges = [
        { id: 'binance', liquidity: 100000, fundingRate: 0.01, maxPosition: 10000 },
      ];
      const allocations = calculateOptimalAllocation(50000, exchanges);
      
      expect(allocations[0].allocation).toBe(10000);
    });
  });

  describe('needsRebalance', () => {
    it('should recommend rebalance when delta exceeds threshold', () => {
      const result = needsRebalance(0.05, 0.02);
      expect(result.shouldRebalance).toBe(true);
      expect(result.reason).toContain('Delta exposure');
    });

    it('should recommend rebalance when time exceeds maximum', () => {
      const result = needsRebalance(0.01, 0.02, 100000, 86400);
      expect(result.shouldRebalance).toBe(true);
      expect(result.reason).toContain('time');
    });

    it('should not recommend rebalance when within parameters', () => {
      const result = needsRebalance(0.01, 0.02, 1000, 86400);
      expect(result.shouldRebalance).toBe(false);
    });
  });

  describe('calculateFundingPayment', () => {
    it('should calculate short position receiving funding', () => {
      const payment = calculateFundingPayment(10000, 0.0001, true);
      expect(payment).toBe(1); // Positive = receiving
    });

    it('should calculate long position paying funding', () => {
      const payment = calculateFundingPayment(10000, 0.0001, false);
      expect(payment).toBe(-1); // Negative = paying
    });
  });

  describe('aggregatePositions', () => {
    it('should aggregate multiple positions', () => {
      const positions = [
        { exchange: 'binance', symbol: 'ETH', size: 10, side: 'long' as const, entryPrice: 2000, currentPrice: 2100, leverage: 10 },
        { exchange: 'bybit', symbol: 'ETH', size: 5, side: 'short' as const, entryPrice: 2000, currentPrice: 2100, leverage: 10 },
      ];
      const result = aggregatePositions(positions);
      
      expect(result.totalLong).toBe(21000); // 10 * 2100
      expect(result.totalShort).toBe(10500); // 5 * 2100
      expect(result.netPosition).toBe(10500);
    });

    it('should calculate weighted entry price', () => {
      const positions = [
        { exchange: 'binance', symbol: 'ETH', size: 10, side: 'long' as const, entryPrice: 2000, currentPrice: 2100, leverage: 10 },
        { exchange: 'bybit', symbol: 'ETH', size: 10, side: 'long' as const, entryPrice: 2200, currentPrice: 2100, leverage: 10 },
      ];
      const result = aggregatePositions(positions);
      
      expect(result.weightedEntryPrice).toBe(2100); // (2000*10 + 2200*10) / 20
    });
  });
});
