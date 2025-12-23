/**
 * Yield Resource Actions
 *
 * Operations for yield tracking and analysis:
 * - Current APY
 * - Historical yields
 * - Yield sources breakdown
 * - Funding rate yields
 * - Earnings calculations
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { EthenaClient } from '../../transport/ethenaClient';
import { EthenaApi } from '../../transport/ethenaApi';
import {
  calculateEarnings,
  formatYield,
  fundingRateToApy,
} from '../../utils/yieldUtils';

export async function executeYieldOperation(
  this: IExecuteFunctions,
  operation: string,
  _client: EthenaClient,
  api: EthenaApi,
  index: number
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  switch (operation) {
    case 'getCurrentYield': {
      const yieldResponse = await api.getYieldData();

      if (!yieldResponse.success) {
        throw new NodeOperationError(this.getNode(), yieldResponse.error || 'Failed to get yield data');
      }

      const data = yieldResponse.data!;

      returnData.push({
        json: {
          currentApy: data.currentApy,
          currentApyFormatted: formatYield(data.currentApy),
          weeklyApy: data.weeklyApy,
          weeklyApyFormatted: formatYield(data.weeklyApy),
          monthlyApy: data.monthlyApy,
          monthlyApyFormatted: formatYield(data.monthlyApy),
          timestamp: yieldResponse.timestamp,
        },
      });
      break;
    }

    case 'getHistoricalYield': {
      const period = this.getNodeParameter('period', index, '30d') as string;

      const historyResponse = await api.getYieldHistory(period as '24h' | '7d' | '30d' | '90d' | '1y');

      if (!historyResponse.success) {
        throw new NodeOperationError(this.getNode(), historyResponse.error || 'Failed to get yield history');
      }

      const history = historyResponse.data || [];
      const avgApy = history.length > 0
        ? history.reduce((sum, h) => sum + h.apy, 0) / history.length
        : 0;

      returnData.push({
        json: {
          period,
          dataPoints: history.length,
          averageApy: avgApy,
          averageApyFormatted: formatYield(avgApy),
          minApy: history.length > 0 ? Math.min(...history.map(h => h.apy)) : 0,
          maxApy: history.length > 0 ? Math.max(...history.map(h => h.apy)) : 0,
          history: history.map(h => ({
            timestamp: h.timestamp,
            date: new Date(h.timestamp * 1000).toISOString(),
            apy: h.apy,
            apyFormatted: formatYield(h.apy),
          })),
        },
      });
      break;
    }

    case 'getYieldSources': {
      const sourcesResponse = await api.getYieldSources();

      if (!sourcesResponse.success) {
        throw new NodeOperationError(this.getNode(), sourcesResponse.error || 'Failed to get yield sources');
      }

      const sources = sourcesResponse.data || [];
      const totalYield = sources.reduce((sum, s) => sum + s.apy * s.contribution, 0);

      returnData.push({
        json: {
          totalYield,
          totalYieldFormatted: formatYield(totalYield),
          sources: sources.map(s => ({
            source: s.source,
            contribution: s.contribution,
            contributionPercent: `${(s.contribution * 100).toFixed(2)}%`,
            apy: s.apy,
            apyFormatted: formatYield(s.apy),
            effectiveYield: s.apy * s.contribution,
          })),
          timestamp: sourcesResponse.timestamp,
        },
      });
      break;
    }

    case 'getFundingRateYield': {
      const fundingResponse = await api.getFundingRates();

      if (!fundingResponse.success) {
        throw new NodeOperationError(this.getNode(), fundingResponse.error || 'Failed to get funding rates');
      }

      const rates = fundingResponse.data || [];
      const avgRate = rates.length > 0
        ? rates.reduce((sum, r) => sum + r.rate, 0) / rates.length
        : 0;

      const annualizedYield = fundingRateToApy(avgRate);

      returnData.push({
        json: {
          averageFundingRate: avgRate,
          averageFundingRateFormatted: `${(avgRate * 100).toFixed(4)}%`,
          annualizedYield,
          annualizedYieldFormatted: formatYield(annualizedYield),
          exchanges: rates.map(r => ({
            exchange: r.exchange,
            symbol: r.symbol,
            rate: r.rate,
            rateFormatted: `${(r.rate * 100).toFixed(4)}%`,
            nextFunding: r.nextFunding,
            nextFundingDate: new Date(r.nextFunding * 1000).toISOString(),
            annualizedYield: fundingRateToApy(r.rate),
          })),
          timestamp: fundingResponse.timestamp,
        },
      });
      break;
    }

    case 'getStakingYield': {
      const yieldResponse = await api.getYieldData();

      if (!yieldResponse.success) {
        throw new NodeOperationError(this.getNode(), yieldResponse.error || 'Failed to get yield data');
      }

      returnData.push({
        json: {
          stakingYield: yieldResponse.data?.stakingYield || 0,
          stakingYieldFormatted: formatYield(yieldResponse.data?.stakingYield || 0),
          description: 'Yield from liquid staking tokens (stETH, rETH, etc.)',
          timestamp: yieldResponse.timestamp,
        },
      });
      break;
    }

    case 'getProtocolRevenue': {
      const statsResponse = await api.getProtocolStats();

      if (!statsResponse.success) {
        throw new NodeOperationError(this.getNode(), statsResponse.error || 'Failed to get protocol stats');
      }

      // Protocol revenue would typically come from the API
      returnData.push({
        json: {
          tvl: statsResponse.data?.tvl,
          volume24h: statsResponse.data?.volume24h,
          timestamp: statsResponse.timestamp,
        },
      });
      break;
    }

    case 'getNextDistribution': {
      const yieldResponse = await api.getYieldData();

      if (!yieldResponse.success) {
        throw new NodeOperationError(this.getNode(), yieldResponse.error || 'Failed to get yield data');
      }

      const nextDist = yieldResponse.data?.nextDistribution || 0;

      returnData.push({
        json: {
          nextDistribution: nextDist,
          nextDistributionDate: nextDist > 0 ? new Date(nextDist * 1000).toISOString() : null,
          timeUntil: nextDist > 0 ? formatTimeUntil(nextDist) : 'Unknown',
          timestamp: yieldResponse.timestamp,
        },
      });
      break;
    }

    case 'calculateEarnings': {
      const principal = this.getNodeParameter('principal', index) as number;
      const apy = this.getNodeParameter('apy', index, 0) as number;
      const days = this.getNodeParameter('days', index, 365) as number;
      const useCurrentApy = this.getNodeParameter('useCurrentApy', index, false) as boolean;

      let actualApy = apy;

      if (useCurrentApy) {
        const yieldResponse = await api.getYieldData();
        if (yieldResponse.success && yieldResponse.data) {
          actualApy = yieldResponse.data.currentApy;
        }
      }

      const earnings = calculateEarnings(principal, actualApy, days, true);

      returnData.push({
        json: {
          principal,
          apy: actualApy,
          apyFormatted: formatYield(actualApy),
          days,
          finalAmount: earnings.finalAmount.toFixed(2),
          totalEarnings: earnings.earnings.toFixed(2),
          dailyEarnings: earnings.dailyEarnings.toFixed(4),
          roi: ((earnings.earnings / principal) * 100).toFixed(2) + '%',
        },
      });
      break;
    }

    case 'getYieldByPeriod': {
      const period = this.getNodeParameter('period', index, '30d') as string;

      const historyResponse = await api.getYieldHistory(period as '24h' | '7d' | '30d' | '90d' | '1y');

      if (!historyResponse.success) {
        throw new NodeOperationError(this.getNode(), historyResponse.error || 'Failed to get yield history');
      }

      const history = historyResponse.data || [];

      // Calculate statistics
      const apys = history.map(h => h.apy);
      const avg = apys.length > 0 ? apys.reduce((a, b) => a + b, 0) / apys.length : 0;
      const min = apys.length > 0 ? Math.min(...apys) : 0;
      const max = apys.length > 0 ? Math.max(...apys) : 0;
      const stdDev = apys.length > 0
        ? Math.sqrt(apys.reduce((sum, apy) => sum + Math.pow(apy - avg, 2), 0) / apys.length)
        : 0;

      returnData.push({
        json: {
          period,
          statistics: {
            average: avg,
            averageFormatted: formatYield(avg),
            minimum: min,
            minimumFormatted: formatYield(min),
            maximum: max,
            maximumFormatted: formatYield(max),
            standardDeviation: stdDev,
            volatility: avg > 0 ? (stdDev / avg) * 100 : 0,
          },
          dataPoints: history.length,
          timestamp: historyResponse.timestamp,
        },
      });
      break;
    }

    case 'getYieldForecast': {
      // Get current yield and calculate forecast
      const yieldResponse = await api.getYieldData();
      const historyResponse = await api.getYieldHistory('30d');

      if (!yieldResponse.success) {
        throw new NodeOperationError(this.getNode(), yieldResponse.error || 'Failed to get yield data');
      }

      const currentApy = yieldResponse.data?.currentApy || 0;
      const history = historyResponse.data || [];

      // Simple trend analysis
      let trend = 'stable';
      if (history.length >= 7) {
        const recentAvg = history.slice(0, 7).reduce((sum, h) => sum + h.apy, 0) / 7;
        const olderAvg = history.slice(-7).reduce((sum, h) => sum + h.apy, 0) / 7;
        if (recentAvg > olderAvg * 1.05) trend = 'increasing';
        else if (recentAvg < olderAvg * 0.95) trend = 'decreasing';
      }

      returnData.push({
        json: {
          currentApy,
          currentApyFormatted: formatYield(currentApy),
          trend,
          forecast: {
            conservative: currentApy * 0.8,
            conservativeFormatted: formatYield(currentApy * 0.8),
            moderate: currentApy,
            moderateFormatted: formatYield(currentApy),
            optimistic: currentApy * 1.2,
            optimisticFormatted: formatYield(currentApy * 1.2),
          },
          disclaimer: 'Forecasts are estimates based on historical data and are not guaranteed.',
          timestamp: yieldResponse.timestamp,
        },
      });
      break;
    }

    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }

  return returnData;
}

function formatTimeUntil(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
