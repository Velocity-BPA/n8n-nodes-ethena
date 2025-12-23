/**
 * Analytics Resource Actions
 *
 * Operations for protocol analytics and reporting:
 * - Protocol statistics
 * - TVL tracking
 * - Volume analytics
 * - User metrics
 * - Risk metrics
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { EthenaClient } from '../../transport/ethenaClient';
import { EthenaApi } from '../../transport/ethenaApi';
import { SubgraphClient } from '../../transport/subgraphClient';

export async function executeAnalyticsOperation(
  this: IExecuteFunctions,
  operation: string,
  _client: EthenaClient,
  api: EthenaApi,
  subgraph: SubgraphClient | null,
  index: number
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  switch (operation) {
    case 'getProtocolStats': {
      const statsResponse = await api.getProtocolStats();

      if (!statsResponse.success) {
        throw new NodeOperationError(this.getNode(), statsResponse.error || 'Failed to get protocol stats');
      }

      const stats = statsResponse.data!;

      returnData.push({
        json: {
          tvl: stats.tvl,
          tvlFormatted: formatCurrency(stats.tvl),
          usdeTotalSupply: stats.usdeTotalSupply,
          usdeTotalSupplyFormatted: formatCurrency(stats.usdeTotalSupply),
          susdeTotalSupply: stats.susdeTotalSupply,
          susdeTotalSupplyFormatted: formatCurrency(stats.susdeTotalSupply),
          susdeApy: stats.susdeApy,
          susdeApyFormatted: `${(stats.susdeApy * 100).toFixed(2)}%`,
          totalUsers: stats.totalUsers,
          volume24h: stats.volume24h,
          volume24hFormatted: formatCurrency(stats.volume24h),
          marketCap: stats.marketCap,
          marketCapFormatted: formatCurrency(stats.marketCap),
          timestamp: statsResponse.timestamp,
        },
      });
      break;
    }

    case 'getTvl': {
      const tvlResponse = await api.getTVL();

      if (!tvlResponse.success) {
        throw new NodeOperationError(this.getNode(), tvlResponse.error || 'Failed to get TVL');
      }

      returnData.push({
        json: {
          tvl: tvlResponse.data?.tvl,
          tvlFormatted: formatCurrency(tvlResponse.data?.tvl || 0),
          breakdown: tvlResponse.data?.breakdown,
          timestamp: tvlResponse.timestamp,
        },
      });
      break;
    }

    case 'getTvlHistory': {
      const period = this.getNodeParameter('period', index, '30d') as string;

      const historyResponse = await api.getTVLHistory(period as '24h' | '7d' | '30d' | '90d' | '1y');

      if (!historyResponse.success) {
        throw new NodeOperationError(this.getNode(), historyResponse.error || 'Failed to get TVL history');
      }

      const history = historyResponse.data || [];

      // Calculate growth
      let growth = 0;
      if (history.length >= 2) {
        const latest = history[0].tvl;
        const earliest = history[history.length - 1].tvl;
        growth = earliest > 0 ? ((latest - earliest) / earliest) * 100 : 0;
      }

      returnData.push({
        json: {
          period,
          currentTvl: history.length > 0 ? history[0].tvl : 0,
          currentTvlFormatted: formatCurrency(history.length > 0 ? history[0].tvl : 0),
          growth: growth.toFixed(2) + '%',
          dataPoints: history.length,
          history: history.map(h => ({
            timestamp: h.timestamp,
            date: new Date(h.timestamp * 1000).toISOString(),
            tvl: h.tvl,
            tvlFormatted: formatCurrency(h.tvl),
          })),
          timestamp: historyResponse.timestamp,
        },
      });
      break;
    }

    case 'getVolume24h': {
      const statsResponse = await api.getProtocolStats();

      if (!statsResponse.success) {
        throw new NodeOperationError(this.getNode(), statsResponse.error || 'Failed to get stats');
      }

      returnData.push({
        json: {
          volume24h: statsResponse.data?.volume24h || 0,
          volume24hFormatted: formatCurrency(statsResponse.data?.volume24h || 0),
          timestamp: statsResponse.timestamp,
        },
      });
      break;
    }

    case 'getUniqueUsers': {
      const statsResponse = await api.getProtocolStats();

      if (!statsResponse.success) {
        throw new NodeOperationError(this.getNode(), statsResponse.error || 'Failed to get stats');
      }

      returnData.push({
        json: {
          totalUsers: statsResponse.data?.totalUsers || 0,
          timestamp: statsResponse.timestamp,
        },
      });
      break;
    }

    case 'getTransactionCount': {
      if (!subgraph) {
        throw new NodeOperationError(this.getNode(), 'Subgraph not available for this network');
      }

      const snapshots = await subgraph.getDailySnapshots({ first: 30 });
      const totalTxCount = snapshots.reduce((sum, s) => sum + (parseInt(s.dailyVolume, 10) > 0 ? 1 : 0), 0);

      returnData.push({
        json: {
          transactionCount: totalTxCount,
          period: '30 days',
          dailyAverage: Math.floor(totalTxCount / 30),
        },
      });
      break;
    }

    case 'getYieldAnalytics': {
      const [yieldResponse, historyResponse] = await Promise.all([
        api.getYieldData(),
        api.getYieldHistory('30d'),
      ]);

      if (!yieldResponse.success) {
        throw new NodeOperationError(this.getNode(), yieldResponse.error || 'Failed to get yield data');
      }

      const history = historyResponse.data || [];
      const apys = history.map(h => h.apy);

      const stats = {
        current: yieldResponse.data?.currentApy || 0,
        average: apys.length > 0 ? apys.reduce((a, b) => a + b, 0) / apys.length : 0,
        min: apys.length > 0 ? Math.min(...apys) : 0,
        max: apys.length > 0 ? Math.max(...apys) : 0,
        stdDev: 0,
      };

      if (apys.length > 0) {
        stats.stdDev = Math.sqrt(
          apys.reduce((sum, apy) => sum + Math.pow(apy - stats.average, 2), 0) / apys.length
        );
      }

      returnData.push({
        json: {
          currentApy: stats.current,
          currentApyFormatted: `${(stats.current * 100).toFixed(2)}%`,
          averageApy: stats.average,
          averageApyFormatted: `${(stats.average * 100).toFixed(2)}%`,
          minApy: stats.min,
          minApyFormatted: `${(stats.min * 100).toFixed(2)}%`,
          maxApy: stats.max,
          maxApyFormatted: `${(stats.max * 100).toFixed(2)}%`,
          volatility: stats.average > 0 ? (stats.stdDev / stats.average) * 100 : 0,
          sharpeRatio: stats.stdDev > 0 ? stats.average / stats.stdDev : 0,
          period: '30 days',
          timestamp: yieldResponse.timestamp,
        },
      });
      break;
    }

    case 'getRiskMetrics': {
      const [collateralResponse, insuranceResponse] = await Promise.all([
        api.getCollateralBreakdown(),
        api.getInsuranceFund(),
      ]);

      const collateral = collateralResponse.data || [];
      const insurance = insuranceResponse.data;

      // Calculate concentration risk (HHI)
      const hhi = collateral.reduce((sum, c) => sum + Math.pow(c.percentage / 100, 2), 0);

      returnData.push({
        json: {
          collateralConcentration: {
            hhi,
            interpretation: hhi < 0.15 ? 'Diversified' : hhi < 0.25 ? 'Moderate' : 'Concentrated',
            breakdown: collateral.map(c => ({
              asset: c.asset,
              percentage: c.percentage,
            })),
          },
          insuranceFund: {
            balance: insurance?.balance || 0,
            balanceFormatted: formatCurrency(insurance?.balance || 0),
            coverageRatio: insurance?.coverageRatio || 0,
          },
          timestamp: Date.now(),
        },
      });
      break;
    }

    case 'getMarketShare': {
      const statsResponse = await api.getProtocolStats();

      if (!statsResponse.success) {
        throw new NodeOperationError(this.getNode(), statsResponse.error || 'Failed to get stats');
      }

      // Market share would require comparison data
      returnData.push({
        json: {
          usdeTvl: statsResponse.data?.tvl || 0,
          usdeSupply: statsResponse.data?.usdeTotalSupply || 0,
          description: 'Market share metrics relative to stablecoin market',
          timestamp: statsResponse.timestamp,
        },
      });
      break;
    }

    case 'exportReport': {
      const format = this.getNodeParameter('format', index, 'json') as string;

      // Gather all data for the report
      const [stats, _tvl, yield_, collateral, insurance] = await Promise.all([
        api.getProtocolStats(),
        api.getTVL(),
        api.getYieldData(),
        api.getCollateralBreakdown(),
        api.getInsuranceFund(),
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        protocol: 'Ethena',
        summary: {
          tvl: stats.data?.tvl,
          tvlFormatted: formatCurrency(stats.data?.tvl || 0),
          usdeSupply: stats.data?.usdeTotalSupply,
          susdeSupply: stats.data?.susdeTotalSupply,
          currentApy: yield_.data?.currentApy,
          currentApyFormatted: `${((yield_.data?.currentApy || 0) * 100).toFixed(2)}%`,
          totalUsers: stats.data?.totalUsers,
          volume24h: stats.data?.volume24h,
        },
        collateral: collateral.data || [],
        insuranceFund: insurance.data,
        yield: yield_.data,
      };

      returnData.push({
        json: {
          format,
          report,
        },
      });
      break;
    }

    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }

  return returnData;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
