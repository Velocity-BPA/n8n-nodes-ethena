/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ethena Protocol Node
 *
 * n8n community node for interacting with the Ethena Protocol.
 * Supports USDe, sUSDe, ENA, yield tracking, points, and more.
 *
 * Author: Velocity BPA
 * Website: https://velobpa.com
 * GitHub: https://github.com/Velocity-BPA
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  ICredentialDataDecryptedObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { EthenaClient } from './transport/ethenaClient';
import { EthenaApi } from './transport/ethenaApi';
import { SubgraphClient } from './transport/subgraphClient';
import { getDefaultRpcUrl } from './constants/networks';

import { executeUsdeOperation } from './actions/usde/usde.operations';
import { executeSusdeOperation } from './actions/susde/susde.operations';
import { executeYieldOperation } from './actions/yield/yield.operations';
import { executeAnalyticsOperation } from './actions/analytics/analytics.operations';
import { executePointsOperation } from './actions/points/points.operations';

export class Ethena implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Ethena',
    name: 'ethena',
    icon: 'file:ethena.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Ethena Protocol - USDe, sUSDe, yield, points, and more',
    defaults: {
      name: 'Ethena',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'ethenaNetwork',
        required: true,
        displayOptions: {
          show: {
            resource: ['usde', 'susde', 'ena', 'minting', 'redemption', 'governance'],
          },
        },
      },
      {
        name: 'ethenaApi',
        required: false,
        displayOptions: {
          show: {
            resource: ['yield', 'analytics', 'points', 'referral', 'collateral', 'insuranceFund'],
          },
        },
      },
    ],
    properties: [
      // Resource Selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'USDe', value: 'usde', description: 'USDe stablecoin operations' },
          { name: 'sUSDe', value: 'susde', description: 'Staked USDe vault operations' },
          { name: 'Yield', value: 'yield', description: 'Yield tracking and analytics' },
          { name: 'Analytics', value: 'analytics', description: 'Protocol analytics and stats' },
          { name: 'Points/Sats', value: 'points', description: 'Points system operations' },
          { name: 'Collateral', value: 'collateral', description: 'Collateral information' },
          { name: 'Utility', value: 'utility', description: 'Utility functions' },
        ],
        default: 'usde',
      },

      // ============ USDe Operations ============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['usde'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', description: 'Get USDe balance for an address', action: 'Get USDe balance' },
          { name: 'Transfer', value: 'transfer', description: 'Transfer USDe to another address', action: 'Transfer USDe' },
          { name: 'Approve', value: 'approve', description: 'Approve USDe spending', action: 'Approve USDe spending' },
          { name: 'Get Allowance', value: 'getAllowance', description: 'Get USDe spending allowance', action: 'Get USDe allowance' },
          { name: 'Get Total Supply', value: 'getTotalSupply', description: 'Get USDe total supply', action: 'Get USDe total supply' },
          { name: 'Get Price', value: 'getPrice', description: 'Get USDe price', action: 'Get USDe price' },
          { name: 'Get Market Cap', value: 'getMarketCap', description: 'Get USDe market cap', action: 'Get USDe market cap' },
          { name: 'Get Transfer History', value: 'getTransferHistory', description: 'Get USDe transfer history', action: 'Get transfer history' },
          { name: 'Get Holders', value: 'getHolders', description: 'Get top USDe holders', action: 'Get top holders' },
          { name: 'Get Contract Address', value: 'getContractAddress', description: 'Get USDe contract address', action: 'Get contract address' },
          { name: 'Get Decimals', value: 'getDecimals', description: 'Get USDe decimals', action: 'Get decimals' },
        ],
        default: 'getBalance',
      },

      // ============ sUSDe Operations ============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['susde'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', description: 'Get sUSDe balance', action: 'Get sUSDe balance' },
          { name: 'Stake USDe', value: 'stake', description: 'Stake USDe to get sUSDe', action: 'Stake USDe' },
          { name: 'Unstake sUSDe', value: 'unstake', description: 'Unstake sUSDe to get USDe', action: 'Unstake sUSDe' },
          { name: 'Get Exchange Rate', value: 'getExchangeRate', description: 'Get sUSDe/USDe exchange rate', action: 'Get exchange rate' },
          { name: 'Get APY', value: 'getApy', description: 'Get sUSDe staking APY', action: 'Get APY' },
          { name: 'Get Total Supply', value: 'getTotalSupply', description: 'Get sUSDe total supply', action: 'Get total supply' },
          { name: 'Get Total Assets', value: 'getTotalAssets', description: 'Get total USDe in vault', action: 'Get total assets' },
          { name: 'Preview Deposit', value: 'previewDeposit', description: 'Preview shares for deposit', action: 'Preview deposit' },
          { name: 'Preview Withdraw', value: 'previewWithdraw', description: 'Preview shares needed for withdrawal', action: 'Preview withdraw' },
          { name: 'Max Deposit', value: 'maxDeposit', description: 'Get maximum deposit amount', action: 'Get max deposit' },
          { name: 'Max Withdraw', value: 'maxWithdraw', description: 'Get maximum withdrawal amount', action: 'Get max withdraw' },
          { name: 'Get Cooldown Status', value: 'getCooldownStatus', description: 'Get cooldown status', action: 'Get cooldown status' },
          { name: 'Initiate Cooldown', value: 'initiateCooldown', description: 'Start unstaking cooldown', action: 'Initiate cooldown' },
          { name: 'Get Yield History', value: 'getYieldHistory', description: 'Get historical yield data', action: 'Get yield history' },
          { name: 'Get Contract Address', value: 'getContractAddress', description: 'Get sUSDe contract address', action: 'Get contract address' },
          { name: 'Get Price', value: 'getPrice', description: 'Get sUSDe price', action: 'Get price' },
          { name: 'Transfer', value: 'transfer', description: 'Transfer sUSDe', action: 'Transfer sUSDe' },
          { name: 'Approve', value: 'approve', description: 'Approve sUSDe spending', action: 'Approve spending' },
        ],
        default: 'getBalance',
      },

      // ============ Yield Operations ============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['yield'] } },
        options: [
          { name: 'Get Current Yield', value: 'getCurrentYield', description: 'Get current APY', action: 'Get current yield' },
          { name: 'Get Historical Yield', value: 'getHistoricalYield', description: 'Get historical yield data', action: 'Get historical yield' },
          { name: 'Get Yield Sources', value: 'getYieldSources', description: 'Get yield sources breakdown', action: 'Get yield sources' },
          { name: 'Get Funding Rate Yield', value: 'getFundingRateYield', description: 'Get funding rate derived yield', action: 'Get funding yield' },
          { name: 'Get Staking Yield', value: 'getStakingYield', description: 'Get LST staking yield', action: 'Get staking yield' },
          { name: 'Get Protocol Revenue', value: 'getProtocolRevenue', description: 'Get protocol revenue', action: 'Get revenue' },
          { name: 'Get Next Distribution', value: 'getNextDistribution', description: 'Get next yield distribution', action: 'Get next distribution' },
          { name: 'Calculate Earnings', value: 'calculateEarnings', description: 'Calculate projected earnings', action: 'Calculate earnings' },
          { name: 'Get Yield by Period', value: 'getYieldByPeriod', description: 'Get yield statistics by period', action: 'Get yield by period' },
          { name: 'Get Yield Forecast', value: 'getYieldForecast', description: 'Get yield forecast', action: 'Get yield forecast' },
        ],
        default: 'getCurrentYield',
      },

      // ============ Analytics Operations ============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['analytics'] } },
        options: [
          { name: 'Get Protocol Stats', value: 'getProtocolStats', description: 'Get protocol statistics', action: 'Get protocol stats' },
          { name: 'Get TVL', value: 'getTvl', description: 'Get total value locked', action: 'Get TVL' },
          { name: 'Get TVL History', value: 'getTvlHistory', description: 'Get TVL history', action: 'Get TVL history' },
          { name: 'Get Volume (24h)', value: 'getVolume24h', description: 'Get 24h volume', action: 'Get volume' },
          { name: 'Get Unique Users', value: 'getUniqueUsers', description: 'Get unique user count', action: 'Get users' },
          { name: 'Get Transaction Count', value: 'getTransactionCount', description: 'Get transaction count', action: 'Get tx count' },
          { name: 'Get Yield Analytics', value: 'getYieldAnalytics', description: 'Get yield analytics', action: 'Get yield analytics' },
          { name: 'Get Risk Metrics', value: 'getRiskMetrics', description: 'Get risk metrics', action: 'Get risk metrics' },
          { name: 'Get Market Share', value: 'getMarketShare', description: 'Get market share data', action: 'Get market share' },
          { name: 'Export Report', value: 'exportReport', description: 'Export analytics report', action: 'Export report' },
        ],
        default: 'getProtocolStats',
      },

      // ============ Points Operations ============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['points'] } },
        options: [
          { name: 'Get Sats Balance', value: 'getBalance', description: 'Get sats balance', action: 'Get sats balance' },
          { name: 'Get Sats History', value: 'getHistory', description: 'Get sats earning history', action: 'Get sats history' },
          { name: 'Get Multiplier', value: 'getMultiplier', description: 'Get sats multiplier', action: 'Get multiplier' },
          { name: 'Get Earning Rate', value: 'getEarningRate', description: 'Get sats earning rate', action: 'Get earning rate' },
          { name: 'Get Leaderboard', value: 'getLeaderboard', description: 'Get sats leaderboard', action: 'Get leaderboard' },
          { name: 'Get Season Info', value: 'getSeasonInfo', description: 'Get current season info', action: 'Get season info' },
          { name: 'Get Bonus Multipliers', value: 'getBonusMultipliers', description: 'Get bonus multipliers', action: 'Get bonuses' },
          { name: 'Get Referral Sats', value: 'getReferralSats', description: 'Get referral sats', action: 'Get referral sats' },
          { name: 'Get Sats by Activity', value: 'getSatsByActivity', description: 'Get sats breakdown by activity', action: 'Get by activity' },
          { name: 'Get Total Sats Earned', value: 'getTotalSatsEarned', description: 'Get total sats earned', action: 'Get total earned' },
        ],
        default: 'getBalance',
      },

      // ============ Collateral Operations ============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['collateral'] } },
        options: [
          { name: 'Get Supported Collaterals', value: 'getSupportedCollaterals', description: 'Get supported collaterals', action: 'Get collaterals' },
          { name: 'Get Collateral Info', value: 'getCollateralInfo', description: 'Get collateral info', action: 'Get collateral info' },
          { name: 'Get Collateral Breakdown', value: 'getCollateralBreakdown', description: 'Get collateral breakdown', action: 'Get breakdown' },
          { name: 'Get Total Collateral', value: 'getTotalCollateral', description: 'Get total collateral value', action: 'Get total' },
        ],
        default: 'getSupportedCollaterals',
      },

      // ============ Utility Operations ============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['utility'] } },
        options: [
          { name: 'Convert Units', value: 'convertUnits', description: 'Convert token units', action: 'Convert units' },
          { name: 'Validate Address', value: 'validateAddress', description: 'Validate Ethereum address', action: 'Validate address' },
          { name: 'Get Network Status', value: 'getNetworkStatus', description: 'Get network status', action: 'Get network status' },
          { name: 'Get Contract Addresses', value: 'getContractAddresses', description: 'Get all contract addresses', action: 'Get addresses' },
          { name: 'Calculate APY', value: 'calculateApy', description: 'Calculate APY from APR', action: 'Calculate APY' },
          { name: 'Get Gas Estimate', value: 'getGasEstimate', description: 'Get gas estimate', action: 'Get gas estimate' },
        ],
        default: 'convertUnits',
      },

      // ============ Common Parameters ============
      {
        displayName: 'Address',
        name: 'address',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'Wallet address (leave empty to use connected wallet)',
        displayOptions: {
          show: {
            resource: ['usde', 'susde', 'points'],
            operation: ['getBalance', 'getTransferHistory', 'getCooldownStatus', 'getHistory', 'getMultiplier', 'getEarningRate', 'getReferralSats', 'getSatsByActivity', 'getTotalSatsEarned'],
          },
        },
      },
      {
        displayName: 'To Address',
        name: 'to',
        type: 'string',
        default: '',
        required: true,
        placeholder: '0x...',
        description: 'Recipient address',
        displayOptions: {
          show: {
            operation: ['transfer'],
          },
        },
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'string',
        default: '',
        required: true,
        placeholder: '100.0',
        description: 'Amount to transfer/approve',
        displayOptions: {
          show: {
            operation: ['transfer', 'approve'],
          },
        },
      },
      {
        displayName: 'Spender Address',
        name: 'spender',
        type: 'string',
        default: '',
        required: true,
        placeholder: '0x...',
        description: 'Address allowed to spend tokens',
        displayOptions: {
          show: {
            operation: ['approve', 'getAllowance'],
          },
        },
      },
      {
        displayName: 'Unlimited Approval',
        name: 'unlimited',
        type: 'boolean',
        default: false,
        description: 'Whether to approve unlimited spending',
        displayOptions: {
          show: {
            operation: ['approve'],
          },
        },
      },
      {
        displayName: 'Owner Address',
        name: 'owner',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'Token owner address',
        displayOptions: {
          show: {
            operation: ['getAllowance', 'maxWithdraw'],
          },
        },
      },
      {
        displayName: 'Assets (USDe)',
        name: 'assets',
        type: 'string',
        default: '',
        required: true,
        placeholder: '100.0',
        description: 'Amount of USDe assets',
        displayOptions: {
          show: {
            operation: ['stake', 'previewDeposit', 'previewWithdraw', 'initiateCooldown'],
          },
        },
      },
      {
        displayName: 'Shares (sUSDe)',
        name: 'shares',
        type: 'string',
        default: '',
        required: true,
        placeholder: '100.0',
        description: 'Amount of sUSDe shares',
        displayOptions: {
          show: {
            operation: ['unstake'],
          },
        },
      },
      {
        displayName: 'Receiver Address',
        name: 'receiver',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'Receiver address (defaults to connected wallet)',
        displayOptions: {
          show: {
            operation: ['stake', 'unstake', 'maxDeposit'],
          },
        },
      },
      {
        displayName: 'Period',
        name: 'period',
        type: 'options',
        default: '30d',
        options: [
          { name: '24 Hours', value: '24h' },
          { name: '7 Days', value: '7d' },
          { name: '30 Days', value: '30d' },
          { name: '90 Days', value: '90d' },
          { name: '1 Year', value: '1y' },
        ],
        displayOptions: {
          show: {
            operation: ['getHistoricalYield', 'getTvlHistory', 'getYieldHistory', 'getYieldByPeriod'],
          },
        },
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 100,
        description: 'Maximum number of results to return',
        displayOptions: {
          show: {
            operation: ['getTransferHistory', 'getHolders', 'getLeaderboard', 'getHistory'],
          },
        },
      },
      {
        displayName: 'Transfer Direction',
        name: 'direction',
        type: 'options',
        default: 'all',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Sent', value: 'sent' },
          { name: 'Received', value: 'received' },
        ],
        displayOptions: {
          show: {
            operation: ['getTransferHistory'],
          },
        },
      },
      {
        displayName: 'Network',
        name: 'network',
        type: 'options',
        default: 'ethereum',
        options: [
          { name: 'Ethereum', value: 'ethereum' },
          { name: 'Arbitrum', value: 'arbitrum' },
          { name: 'Base', value: 'base' },
          { name: 'Optimism', value: 'optimism' },
        ],
        displayOptions: {
          show: {
            operation: ['getContractAddress', 'getContractAddresses', 'getNetworkStatus'],
          },
        },
      },
      {
        displayName: 'Principal Amount',
        name: 'principal',
        type: 'number',
        default: 1000,
        description: 'Initial investment amount in USD',
        displayOptions: {
          show: {
            operation: ['calculateEarnings'],
          },
        },
      },
      {
        displayName: 'APY (Optional)',
        name: 'apy',
        type: 'number',
        default: 0,
        description: 'Annual percentage yield as decimal (e.g., 0.10 for 10%). Leave 0 to use current APY.',
        displayOptions: {
          show: {
            operation: ['calculateEarnings'],
          },
        },
      },
      {
        displayName: 'Use Current APY',
        name: 'useCurrentApy',
        type: 'boolean',
        default: true,
        description: 'Whether to use current protocol APY',
        displayOptions: {
          show: {
            operation: ['calculateEarnings'],
          },
        },
      },
      {
        displayName: 'Days',
        name: 'days',
        type: 'number',
        default: 365,
        description: 'Number of days to calculate earnings for',
        displayOptions: {
          show: {
            operation: ['calculateEarnings'],
          },
        },
      },
      {
        displayName: 'Report Format',
        name: 'format',
        type: 'options',
        default: 'json',
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'CSV', value: 'csv' },
        ],
        displayOptions: {
          show: {
            operation: ['exportReport'],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    // Initialize clients based on resource
    let client: EthenaClient | null = null;
    let api: EthenaApi | null = null;
    let subgraph: SubgraphClient | null = null;

    // Get credentials if needed
    if (['usde', 'susde', 'ena', 'minting', 'redemption', 'governance'].includes(resource)) {
      const credentials = await this.getCredentials('ethenaNetwork') as ICredentialDataDecryptedObject;

      const network = credentials.network as string;
      const rpcUrl = (credentials.rpcUrlOverride as string) || (credentials.rpcUrl as string) || getDefaultRpcUrl(network);
      const privateKey = credentials.privateKey as string;

      client = new EthenaClient({
        network,
        rpcUrl,
        privateKey,
      });

      // Try to initialize subgraph
      try {
        subgraph = new SubgraphClient({ network });
      } catch {
        // Subgraph not available for this network
      }
    }

    // Initialize API client if needed
    if (['yield', 'analytics', 'points', 'referral', 'collateral', 'insuranceFund'].includes(resource)) {
      try {
        const apiCredentials = await this.getCredentials('ethenaApi') as ICredentialDataDecryptedObject;

        api = new EthenaApi({
          environment: (apiCredentials.environment as 'production' | 'staging' | 'custom') || 'production',
          apiEndpoint: apiCredentials.apiEndpoint as string,
          apiKey: apiCredentials.apiKey as string,
          apiSecret: apiCredentials.apiSecret as string,
          authType: (apiCredentials.authType as 'apiKey' | 'signed' | 'oauth2' | 'none') || 'none',
          walletAddress: apiCredentials.walletAddress as string,
        });
      } catch {
        // API credentials not provided, use defaults
        api = new EthenaApi({
          environment: 'production',
          authType: 'none',
        });
      }
    }

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[] = [];

        switch (resource) {
          case 'usde':
            if (!client || !api) throw new NodeOperationError(this.getNode(), 'Client not initialized');
            result = await executeUsdeOperation.call(this, operation, client, api, subgraph, i);
            break;

          case 'susde':
            if (!client || !api) throw new NodeOperationError(this.getNode(), 'Client not initialized');
            result = await executeSusdeOperation.call(this, operation, client, api, subgraph, i);
            break;

          case 'yield':
            if (!api) throw new NodeOperationError(this.getNode(), 'API client not initialized');
            result = await executeYieldOperation.call(this, operation, client!, api, i);
            break;

          case 'analytics':
            if (!api) throw new NodeOperationError(this.getNode(), 'API client not initialized');
            result = await executeAnalyticsOperation.call(this, operation, client!, api, subgraph, i);
            break;

          case 'points':
            if (!api) throw new NodeOperationError(this.getNode(), 'API client not initialized');
            const walletAddress = client?.getAddress() || '';
            result = await executePointsOperation.call(this, operation, api, walletAddress, i);
            break;

          default:
            throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
