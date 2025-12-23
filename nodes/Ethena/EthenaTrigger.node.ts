/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ethena Trigger Node
 *
 * Real-time event monitoring for Ethena Protocol.
 * Uses polling to check for blockchain events and API changes.
 *
 * Author: Velocity BPA
 * Website: https://velobpa.com
 * GitHub: https://github.com/Velocity-BPA
 */

import type {
  IPollFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  ICredentialDataDecryptedObject,
} from 'n8n-workflow';

import { ethers, EventLog } from 'ethers';
import { EthenaClient, ERC20_ABI, SUSDE_ABI } from './transport/ethenaClient';
import { EthenaApi } from './transport/ethenaApi';
import { getContractAddress, getDefaultRpcUrl, TOKEN_DECIMALS } from './constants';

export class EthenaTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Ethena Trigger',
    name: 'ethenaTrigger',
    icon: 'file:ethena.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Triggers on Ethena Protocol events',
    defaults: {
      name: 'Ethena Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'ethenaNetwork',
        required: true,
      },
      {
        name: 'ethenaApi',
        required: false,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        required: true,
        default: 'usdeTransfer',
        options: [
          { name: 'USDe Transfer', value: 'usdeTransfer', description: 'Trigger on USDe transfers' },
          { name: 'Large USDe Transfer', value: 'largeUsdeTransfer', description: 'Trigger on large USDe transfers (whale alert)' },
          { name: 'sUSDe Staked', value: 'susdeStaked', description: 'Trigger when USDe is staked for sUSDe' },
          { name: 'sUSDe Unstaked', value: 'susdeUnstaked', description: 'Trigger when sUSDe is redeemed' },
          { name: 'Exchange Rate Changed', value: 'exchangeRateChanged', description: 'Trigger when sUSDe/USDe rate changes' },
          { name: 'APY Changed', value: 'apyChanged', description: 'Trigger when sUSDe APY changes significantly' },
          { name: 'High Yield Alert', value: 'highYieldAlert', description: 'Trigger when APY exceeds threshold' },
          { name: 'TVL Changed', value: 'tvlChanged', description: 'Trigger when TVL changes significantly' },
          { name: 'Sats Earned', value: 'satsEarned', description: 'Trigger when sats are earned' },
          { name: 'Rank Changed', value: 'rankChanged', description: 'Trigger when leaderboard rank changes' },
        ],
      },
      {
        displayName: 'Filter Address',
        name: 'filterAddress',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'Only trigger for events involving this address',
        displayOptions: {
          show: {
            event: ['usdeTransfer', 'largeUsdeTransfer', 'susdeStaked', 'susdeUnstaked', 'satsEarned', 'rankChanged'],
          },
        },
      },
      {
        displayName: 'Minimum Amount',
        name: 'minAmount',
        type: 'number',
        default: 0,
        description: 'Minimum amount to trigger (in token units)',
        displayOptions: {
          show: {
            event: ['usdeTransfer', 'largeUsdeTransfer', 'susdeStaked', 'susdeUnstaked'],
          },
        },
      },
      {
        displayName: 'Large Transfer Threshold',
        name: 'largeTransferThreshold',
        type: 'number',
        default: 100000,
        description: 'Threshold for whale alerts (in USDe)',
        displayOptions: {
          show: {
            event: ['largeUsdeTransfer'],
          },
        },
      },
      {
        displayName: 'APY Threshold (%)',
        name: 'apyThreshold',
        type: 'number',
        default: 20,
        description: 'APY threshold for high yield alerts',
        displayOptions: {
          show: {
            event: ['highYieldAlert'],
          },
        },
      },
      {
        displayName: 'Rate Change Threshold (%)',
        name: 'rateChangeThreshold',
        type: 'number',
        default: 0.1,
        description: 'Minimum rate change to trigger (in percent)',
        displayOptions: {
          show: {
            event: ['exchangeRateChanged', 'apyChanged'],
          },
        },
      },
      {
        displayName: 'TVL Change Threshold (%)',
        name: 'tvlChangeThreshold',
        type: 'number',
        default: 5,
        description: 'Minimum TVL change to trigger (in percent)',
        displayOptions: {
          show: {
            event: ['tvlChanged'],
          },
        },
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const event = this.getNodeParameter('event') as string;
    const webhookData = this.getWorkflowStaticData('node');

    const credentials = await this.getCredentials('ethenaNetwork') as ICredentialDataDecryptedObject;
    const network = credentials.network as string;
    const rpcUrl = (credentials.rpcUrlOverride as string) || (credentials.rpcUrl as string) || getDefaultRpcUrl(network);
    const privateKey = credentials.privateKey as string;

    let api: EthenaApi;
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
      api = new EthenaApi({ environment: 'production', authType: 'none' });
    }

    const returnData: INodeExecutionData[] = [];

    try {
      switch (event) {
        case 'usdeTransfer':
        case 'largeUsdeTransfer': {
          const filterAddress = this.getNodeParameter('filterAddress', '') as string;
          const minAmount = this.getNodeParameter('minAmount', 0) as number;
          const threshold = event === 'largeUsdeTransfer'
            ? this.getNodeParameter('largeTransferThreshold', 100000) as number
            : minAmount;

          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const usdeAddress = getContractAddress(network, 'usde');

          if (!usdeAddress) return null;

          const lastBlock = (webhookData.lastBlock as number) || await provider.getBlockNumber() - 100;
          const currentBlock = await provider.getBlockNumber();

          const contract = new ethers.Contract(usdeAddress, ERC20_ABI, provider);
          const filter = contract.filters.Transfer();
          const events = await contract.queryFilter(filter, lastBlock + 1, currentBlock);

          for (const evt of events) {
            if (!(evt instanceof EventLog)) continue;
            const args = evt.args;
            if (!args) continue;

            const amount = parseFloat(ethers.formatUnits(args[2], TOKEN_DECIMALS.usde));
            if (amount < threshold) continue;
            
            const from = args[0] as string;
            const to = args[1] as string;
            
            if (filterAddress && from.toLowerCase() !== filterAddress.toLowerCase() && to.toLowerCase() !== filterAddress.toLowerCase()) continue;

            returnData.push({
              json: {
                event: event === 'largeUsdeTransfer' ? 'whale_transfer' : 'transfer',
                from,
                to,
                amount,
                amountRaw: args[2].toString(),
                transactionHash: evt.transactionHash,
                blockNumber: evt.blockNumber,
                timestamp: Date.now(),
              },
            });
          }
          webhookData.lastBlock = currentBlock;
          break;
        }

        case 'susdeStaked':
        case 'susdeUnstaked': {
          const filterAddress = this.getNodeParameter('filterAddress', '') as string;
          const minAmount = this.getNodeParameter('minAmount', 0) as number;

          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const susdeAddress = getContractAddress(network, 'susde');
          if (!susdeAddress) return null;

          const lastBlock = (webhookData.lastBlock as number) || await provider.getBlockNumber() - 100;
          const currentBlock = await provider.getBlockNumber();

          const contract = new ethers.Contract(susdeAddress, SUSDE_ABI, provider);
          const eventName = event === 'susdeStaked' ? 'Deposit' : 'Withdraw';
          const filter = contract.filters[eventName]();
          const events = await contract.queryFilter(filter, lastBlock + 1, currentBlock);

          for (const evt of events) {
            if (!(evt instanceof EventLog)) continue;
            const args = evt.args;
            if (!args) continue;

            const assets = parseFloat(ethers.formatUnits(args.assets || args[2], TOKEN_DECIMALS.usde));
            if (assets < minAmount) continue;
            
            const owner = (args.owner || args[1]) as string;
            if (filterAddress && owner?.toLowerCase() !== filterAddress.toLowerCase()) continue;

            returnData.push({
              json: {
                event: event === 'susdeStaked' ? 'stake' : 'unstake',
                sender: args.sender || args[0],
                owner,
                receiver: args.receiver || args[1],
                assets,
                shares: parseFloat(ethers.formatUnits(args.shares || args[3], TOKEN_DECIMALS.susde)),
                transactionHash: evt.transactionHash,
                blockNumber: evt.blockNumber,
                timestamp: Date.now(),
              },
            });
          }
          webhookData.lastBlock = currentBlock;
          break;
        }

        case 'exchangeRateChanged': {
          const threshold = this.getNodeParameter('rateChangeThreshold', 0.1) as number;
          const client = new EthenaClient({ network, rpcUrl, privateKey });
          const currentRate = await client.getSusdeExchangeRate();
          const lastRate = (webhookData.lastExchangeRate as number) || currentRate;
          const changePercent = Math.abs((currentRate - lastRate) / lastRate) * 100;

          if (changePercent >= threshold) {
            returnData.push({
              json: {
                event: 'exchange_rate_changed',
                previousRate: lastRate,
                currentRate,
                changePercent,
                direction: currentRate > lastRate ? 'up' : 'down',
                timestamp: Date.now(),
              },
            });
          }
          webhookData.lastExchangeRate = currentRate;
          break;
        }

        case 'apyChanged': {
          const threshold = this.getNodeParameter('rateChangeThreshold', 0.1) as number;
          const yieldResponse = await api.getYieldData();
          if (!yieldResponse.success || !yieldResponse.data) return null;

          const currentApy = yieldResponse.data.currentApy * 100;
          const lastApy = (webhookData.lastApy as number) || currentApy;
          const changePercent = Math.abs(currentApy - lastApy);

          if (changePercent >= threshold) {
            returnData.push({
              json: {
                event: 'apy_changed',
                previousApy: lastApy,
                currentApy,
                changePercent,
                direction: currentApy > lastApy ? 'up' : 'down',
                timestamp: Date.now(),
              },
            });
          }
          webhookData.lastApy = currentApy;
          break;
        }

        case 'highYieldAlert': {
          const apyThreshold = this.getNodeParameter('apyThreshold', 20) as number;
          const yieldResponse = await api.getYieldData();
          if (!yieldResponse.success || !yieldResponse.data) return null;

          const currentApy = yieldResponse.data.currentApy * 100;
          const wasAbove = webhookData.wasAboveThreshold as boolean;

          if (currentApy >= apyThreshold && !wasAbove) {
            returnData.push({
              json: {
                event: 'high_yield_alert',
                currentApy,
                threshold: apyThreshold,
                message: `sUSDe APY is now ${currentApy.toFixed(2)}%, above threshold of ${apyThreshold}%`,
                timestamp: Date.now(),
              },
            });
            webhookData.wasAboveThreshold = true;
          } else if (currentApy < apyThreshold) {
            webhookData.wasAboveThreshold = false;
          }
          break;
        }

        case 'tvlChanged': {
          const threshold = this.getNodeParameter('tvlChangeThreshold', 5) as number;
          const statsResponse = await api.getProtocolStats();
          if (!statsResponse.success || !statsResponse.data) return null;

          const currentTvl = statsResponse.data.tvl;
          const lastTvl = (webhookData.lastTvl as number) || currentTvl;
          const changePercent = Math.abs((currentTvl - lastTvl) / lastTvl) * 100;

          if (changePercent >= threshold) {
            returnData.push({
              json: {
                event: 'tvl_changed',
                previousTvl: lastTvl,
                currentTvl,
                changePercent,
                direction: currentTvl > lastTvl ? 'up' : 'down',
                changeAmount: currentTvl - lastTvl,
                timestamp: Date.now(),
              },
            });
          }
          webhookData.lastTvl = currentTvl;
          break;
        }

        case 'satsEarned': {
          const filterAddress = this.getNodeParameter('filterAddress', '') as string;
          if (!filterAddress) return null;

          const pointsResponse = await api.getPointsBalance(filterAddress);
          if (!pointsResponse.success || !pointsResponse.data) return null;

          const currentSats = pointsResponse.data.totalSats;
          const lastSats = (webhookData.lastSats as number) || currentSats;

          if (currentSats > lastSats) {
            returnData.push({
              json: {
                event: 'sats_earned',
                address: filterAddress,
                previousSats: lastSats,
                currentSats,
                satsEarned: currentSats - lastSats,
                timestamp: Date.now(),
              },
            });
          }
          webhookData.lastSats = currentSats;
          break;
        }

        case 'rankChanged': {
          const filterAddress = this.getNodeParameter('filterAddress', '') as string;
          if (!filterAddress) return null;

          const pointsResponse = await api.getPointsBalance(filterAddress);
          if (!pointsResponse.success || !pointsResponse.data) return null;

          const currentRank = pointsResponse.data.rank || 0;
          const lastRank = (webhookData.lastRank as number) || currentRank;

          if (currentRank !== lastRank) {
            returnData.push({
              json: {
                event: 'rank_changed',
                address: filterAddress,
                previousRank: lastRank,
                currentRank,
                direction: currentRank < lastRank ? 'up' : 'down',
                positionsChanged: Math.abs(lastRank - currentRank),
                timestamp: Date.now(),
              },
            });
          }
          webhookData.lastRank = currentRank;
          break;
        }
      }
    } catch (error) {
      console.error('Ethena Trigger error:', error);
    }

    if (returnData.length === 0) return null;

    return [returnData];
  }
}
