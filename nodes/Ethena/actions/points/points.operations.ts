/**
 * Points/Sats Resource Actions
 *
 * Operations for Ethena's Sats points system:
 * - Balance tracking
 * - History
 * - Multipliers
 * - Leaderboard
 * - Season info
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { EthenaApi } from '../../transport/ethenaApi';
import {
  getMultiplierTier,
  formatSats,
  getSeasonTimeRemaining,
  estimateEnaRewards,
} from '../../utils/pointsUtils';

export async function executePointsOperation(
  this: IExecuteFunctions,
  operation: string,
  api: EthenaApi,
  walletAddress: string,
  index: number
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  switch (operation) {
    case 'getBalance': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || walletAddress;

      const pointsResponse = await api.getPointsBalance(targetAddress);

      if (!pointsResponse.success) {
        throw new NodeOperationError(this.getNode(), pointsResponse.error || 'Failed to get points balance');
      }

      const points = pointsResponse.data!;
      const tierInfo = getMultiplierTier(points.totalSats);

      returnData.push({
        json: {
          address: targetAddress,
          totalSats: points.totalSats,
          totalSatsFormatted: formatSats(points.totalSats),
          breakdown: {
            holding: points.satsBreakdown.holding,
            staking: points.satsBreakdown.staking,
            referrals: points.satsBreakdown.referrals,
            integrations: points.satsBreakdown.integrations,
          },
          multiplier: points.multiplier,
          tier: tierInfo.tier,
          nextTier: tierInfo.nextTier,
          satsToNextTier: tierInfo.satsToNextTier,
          dailyEarningRate: points.dailyEarningRate,
          rank: points.rank,
          percentile: points.percentile,
          timestamp: pointsResponse.timestamp,
        },
      });
      break;
    }

    case 'getHistory': {
      const address = this.getNodeParameter('address', index, '') as string;
      const limit = this.getNodeParameter('limit', index, 100) as number;
      const targetAddress = address || walletAddress;

      const historyResponse = await api.getPointsHistory(targetAddress, limit);

      if (!historyResponse.success) {
        throw new NodeOperationError(this.getNode(), historyResponse.error || 'Failed to get points history');
      }

      const history = historyResponse.data || [];
      const totalEarned = history.reduce((sum, h) => sum + h.amount, 0);

      returnData.push({
        json: {
          address: targetAddress,
          totalEarned,
          totalEarnedFormatted: formatSats(totalEarned),
          entries: history.length,
          history: history.map(h => ({
            timestamp: h.timestamp,
            date: new Date(h.timestamp * 1000).toISOString(),
            activity: h.activity,
            amount: h.amount,
            amountFormatted: formatSats(h.amount),
            multiplier: h.multiplier,
          })),
        },
      });
      break;
    }

    case 'getMultiplier': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || walletAddress;

      const pointsResponse = await api.getPointsBalance(targetAddress);

      if (!pointsResponse.success) {
        throw new NodeOperationError(this.getNode(), pointsResponse.error || 'Failed to get points data');
      }

      const points = pointsResponse.data!;
      const tierInfo = getMultiplierTier(points.totalSats);

      returnData.push({
        json: {
          address: targetAddress,
          currentMultiplier: points.multiplier,
          tier: tierInfo.tier,
          nextTier: tierInfo.nextTier,
          satsToNextTier: tierInfo.satsToNextTier,
          nextMultiplier: tierInfo.nextTier
            ? getMultiplierTier(points.totalSats + (tierInfo.satsToNextTier || 0) + 1).multiplier
            : null,
          timestamp: pointsResponse.timestamp,
        },
      });
      break;
    }

    case 'getEarningRate': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || walletAddress;

      const pointsResponse = await api.getPointsBalance(targetAddress);

      if (!pointsResponse.success) {
        throw new NodeOperationError(this.getNode(), pointsResponse.error || 'Failed to get points data');
      }

      const points = pointsResponse.data!;

      returnData.push({
        json: {
          address: targetAddress,
          dailyRate: points.dailyEarningRate,
          dailyRateFormatted: formatSats(points.dailyEarningRate),
          weeklyRate: points.dailyEarningRate * 7,
          monthlyRate: points.dailyEarningRate * 30,
          yearlyRate: points.dailyEarningRate * 365,
          multiplier: points.multiplier,
          timestamp: pointsResponse.timestamp,
        },
      });
      break;
    }

    case 'getLeaderboard': {
      const limit = this.getNodeParameter('limit', index, 100) as number;

      const leaderboardResponse = await api.getLeaderboard(limit);

      if (!leaderboardResponse.success) {
        throw new NodeOperationError(this.getNode(), leaderboardResponse.error || 'Failed to get leaderboard');
      }

      const leaderboard = leaderboardResponse.data || [];

      returnData.push({
        json: {
          totalEntries: leaderboard.length,
          topHolder: leaderboard.length > 0 ? {
            address: leaderboard[0].address,
            sats: leaderboard[0].sats,
            satsFormatted: formatSats(leaderboard[0].sats),
          } : null,
          leaderboard: leaderboard.map(entry => ({
            rank: entry.rank,
            address: entry.address,
            sats: entry.sats,
            satsFormatted: formatSats(entry.sats),
            multiplier: entry.multiplier,
            tier: getMultiplierTier(entry.sats).tier,
          })),
          timestamp: leaderboardResponse.timestamp,
        },
      });
      break;
    }

    case 'getSeasonInfo': {
      const seasonResponse = await api.getSeasonInfo();

      if (!seasonResponse.success) {
        throw new NodeOperationError(this.getNode(), seasonResponse.error || 'Failed to get season info');
      }

      const season = seasonResponse.data!;
      const timeRemaining = getSeasonTimeRemaining(new Date(season.endTimestamp * 1000));

      returnData.push({
        json: {
          seasonNumber: season.seasonNumber,
          name: season.name,
          isActive: season.isActive,
          startDate: new Date(season.startTimestamp * 1000).toISOString(),
          endDate: new Date(season.endTimestamp * 1000).toISOString(),
          timeRemaining: timeRemaining.formatted,
          daysRemaining: timeRemaining.days,
          totalSatsDistributed: season.totalSats,
          totalSatsFormatted: formatSats(season.totalSats),
          participantCount: season.participantCount,
          rewardsPool: season.rewardsPool,
          rewardsPoolFormatted: `${season.rewardsPool.toLocaleString()} ENA`,
          timestamp: seasonResponse.timestamp,
        },
      });
      break;
    }

    case 'getBonusMultipliers': {
      // This would typically come from an API endpoint
      returnData.push({
        json: {
          multipliers: [
            { activity: 'holding_usde', baseMultiplier: 1.0, description: 'Hold USDe' },
            { activity: 'staking_susde', baseMultiplier: 2.0, description: 'Stake sUSDe' },
            { activity: 'provide_liquidity', baseMultiplier: 3.0, description: 'Provide liquidity in DeFi' },
            { activity: 'referral', baseMultiplier: 1.5, description: 'Active referral bonus' },
            { activity: 'early_adopter', baseMultiplier: 2.0, description: 'Early adopter bonus' },
          ],
          tierMultipliers: [
            { tier: 'base', minSats: 0, multiplier: 1.0 },
            { tier: 'bronze', minSats: 5000, multiplier: 1.25 },
            { tier: 'silver', minSats: 25000, multiplier: 1.5 },
            { tier: 'gold', minSats: 100000, multiplier: 2.0 },
            { tier: 'platinum', minSats: 500000, multiplier: 3.0 },
            { tier: 'diamond', minSats: 1000000, multiplier: 5.0 },
          ],
          timestamp: Date.now(),
        },
      });
      break;
    }

    case 'getReferralSats': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || walletAddress;

      const pointsResponse = await api.getPointsBalance(targetAddress);

      if (!pointsResponse.success) {
        throw new NodeOperationError(this.getNode(), pointsResponse.error || 'Failed to get points data');
      }

      returnData.push({
        json: {
          address: targetAddress,
          referralSats: pointsResponse.data?.satsBreakdown.referrals || 0,
          referralSatsFormatted: formatSats(pointsResponse.data?.satsBreakdown.referrals || 0),
          percentOfTotal: pointsResponse.data?.totalSats
            ? ((pointsResponse.data.satsBreakdown.referrals / pointsResponse.data.totalSats) * 100).toFixed(2) + '%'
            : '0%',
          timestamp: pointsResponse.timestamp,
        },
      });
      break;
    }

    case 'getSatsByActivity': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || walletAddress;

      const pointsResponse = await api.getPointsBalance(targetAddress);

      if (!pointsResponse.success) {
        throw new NodeOperationError(this.getNode(), pointsResponse.error || 'Failed to get points data');
      }

      const breakdown = pointsResponse.data?.satsBreakdown || {
        holding: 0,
        staking: 0,
        referrals: 0,
        integrations: 0,
      };
      const total = pointsResponse.data?.totalSats || 0;

      returnData.push({
        json: {
          address: targetAddress,
          totalSats: total,
          activities: [
            {
              activity: 'Holding USDe',
              sats: breakdown.holding,
              satsFormatted: formatSats(breakdown.holding),
              percentage: total > 0 ? ((breakdown.holding / total) * 100).toFixed(2) + '%' : '0%',
            },
            {
              activity: 'Staking sUSDe',
              sats: breakdown.staking,
              satsFormatted: formatSats(breakdown.staking),
              percentage: total > 0 ? ((breakdown.staking / total) * 100).toFixed(2) + '%' : '0%',
            },
            {
              activity: 'Referrals',
              sats: breakdown.referrals,
              satsFormatted: formatSats(breakdown.referrals),
              percentage: total > 0 ? ((breakdown.referrals / total) * 100).toFixed(2) + '%' : '0%',
            },
            {
              activity: 'DeFi Integrations',
              sats: breakdown.integrations,
              satsFormatted: formatSats(breakdown.integrations),
              percentage: total > 0 ? ((breakdown.integrations / total) * 100).toFixed(2) + '%' : '0%',
            },
          ],
          timestamp: pointsResponse.timestamp,
        },
      });
      break;
    }

    case 'getTotalSatsEarned': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || walletAddress;

      const [pointsResponse, seasonResponse] = await Promise.all([
        api.getPointsBalance(targetAddress),
        api.getSeasonInfo(),
      ]);

      if (!pointsResponse.success) {
        throw new NodeOperationError(this.getNode(), pointsResponse.error || 'Failed to get points data');
      }

      const points = pointsResponse.data!;
      const season = seasonResponse.data;

      // Estimate ENA rewards
      const estimatedRewards = season
        ? estimateEnaRewards(points.totalSats, season.totalSats, season.rewardsPool)
        : 0;

      returnData.push({
        json: {
          address: targetAddress,
          totalSats: points.totalSats,
          totalSatsFormatted: formatSats(points.totalSats),
          rank: points.rank,
          percentile: points.percentile,
          estimatedEnaRewards: estimatedRewards,
          estimatedEnaRewardsFormatted: `${estimatedRewards.toFixed(2)} ENA`,
          disclaimer: 'Estimated rewards are subject to change based on final season results.',
          timestamp: pointsResponse.timestamp,
        },
      });
      break;
    }

    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }

  return returnData;
}
