/**
 * sUSDe Resource Actions
 *
 * Operations for the staked USDe vault (ERC-4626):
 * - Staking (deposit USDe -> get sUSDe)
 * - Unstaking (redeem sUSDe -> get USDe)
 * - Exchange rate queries
 * - APY tracking
 * - Cooldown management
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { EthenaClient } from '../../transport/ethenaClient';
import { EthenaApi } from '../../transport/ethenaApi';
import { SubgraphClient } from '../../transport/subgraphClient';
import { getContractAddress, TOKEN_DECIMALS } from '../../constants';
import { calculateCooldownStatus } from '../../utils/cooldownUtils';
import { ethers } from 'ethers';

export async function executeSusdeOperation(
  this: IExecuteFunctions,
  operation: string,
  client: EthenaClient,
  api: EthenaApi,
  _subgraph: SubgraphClient | null,
  index: number
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  switch (operation) {
    case 'getBalance': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || client.getAddress();

      const balance = await client.getSusdeBalance(targetAddress);
      const formattedBalance = ethers.formatUnits(balance, TOKEN_DECIMALS.susde);

      // Also get the USDe value
      const exchangeRate = await client.getSusdeExchangeRate();
      const usdeValue = parseFloat(formattedBalance) * exchangeRate;

      returnData.push({
        json: {
          address: targetAddress,
          balance: formattedBalance,
          balanceRaw: balance.toString(),
          usdeValue: usdeValue.toFixed(6),
          exchangeRate,
          decimals: TOKEN_DECIMALS.susde,
          symbol: 'sUSDe',
        },
      });
      break;
    }

    case 'stake': {
      const amount = this.getNodeParameter('amount', index) as string;
      const receiver = this.getNodeParameter('receiver', index, '') as string;

      const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS.usde);
      const receiverAddress = receiver || client.getAddress();

      // Preview the shares we'll receive
      const expectedShares = await client.previewDeposit(amountWei);

      const tx = await client.stakeUsde(amountWei, receiverAddress);
      const receipt = await tx.wait();

      returnData.push({
        json: {
          success: true,
          transactionHash: receipt?.hash,
          depositor: client.getAddress(),
          receiver: receiverAddress,
          assetsDeposited: amount,
          sharesReceived: ethers.formatUnits(expectedShares, TOKEN_DECIMALS.susde),
          blockNumber: receipt?.blockNumber,
          gasUsed: receipt?.gasUsed?.toString(),
        },
      });
      break;
    }

    case 'unstake': {
      const shares = this.getNodeParameter('shares', index) as string;
      const receiver = this.getNodeParameter('receiver', index, '') as string;

      const sharesWei = ethers.parseUnits(shares, TOKEN_DECIMALS.susde);
      const receiverAddress = receiver || client.getAddress();

      // Preview the assets we'll receive
      const expectedAssets = await client.getSusdeContract().previewRedeem(sharesWei);

      const tx = await client.unstakeSusde(sharesWei, receiverAddress);
      const receipt = await tx.wait();

      returnData.push({
        json: {
          success: true,
          transactionHash: receipt?.hash,
          owner: client.getAddress(),
          receiver: receiverAddress,
          sharesRedeemed: shares,
          assetsReceived: ethers.formatUnits(expectedAssets, TOKEN_DECIMALS.usde),
          blockNumber: receipt?.blockNumber,
          gasUsed: receipt?.gasUsed?.toString(),
        },
      });
      break;
    }

    case 'getExchangeRate': {
      const rate = await client.getSusdeExchangeRate();

      returnData.push({
        json: {
          exchangeRate: rate,
          description: `1 sUSDe = ${rate.toFixed(6)} USDe`,
          timestamp: Date.now(),
        },
      });
      break;
    }

    case 'getApy': {
      const yieldResponse = await api.getYieldData();

      if (!yieldResponse.success) {
        throw new NodeOperationError(this.getNode(), yieldResponse.error || 'Failed to get APY');
      }

      returnData.push({
        json: {
          symbol: 'sUSDe',
          currentApy: yieldResponse.data?.currentApy,
          weeklyApy: yieldResponse.data?.weeklyApy,
          monthlyApy: yieldResponse.data?.monthlyApy,
          apyFormatted: `${((yieldResponse.data?.currentApy || 0) * 100).toFixed(2)}%`,
          timestamp: yieldResponse.timestamp,
        },
      });
      break;
    }

    case 'getTotalSupply': {
      const contract = client.getSusdeContract();
      const totalSupply = await contract.totalSupply();
      const formattedSupply = ethers.formatUnits(totalSupply, TOKEN_DECIMALS.susde);

      returnData.push({
        json: {
          totalSupply: formattedSupply,
          totalSupplyRaw: totalSupply.toString(),
          symbol: 'sUSDe',
          decimals: TOKEN_DECIMALS.susde,
        },
      });
      break;
    }

    case 'getTotalAssets': {
      const totalAssets = await client.getSusdeTotalAssets();
      const formattedAssets = ethers.formatUnits(totalAssets, TOKEN_DECIMALS.usde);

      returnData.push({
        json: {
          totalAssets: formattedAssets,
          totalAssetsRaw: totalAssets.toString(),
          description: 'Total USDe deposited in sUSDe vault',
        },
      });
      break;
    }

    case 'previewDeposit': {
      const assets = this.getNodeParameter('assets', index) as string;
      const assetsWei = ethers.parseUnits(assets, TOKEN_DECIMALS.usde);

      const shares = await client.previewDeposit(assetsWei);
      const formattedShares = ethers.formatUnits(shares, TOKEN_DECIMALS.susde);

      returnData.push({
        json: {
          assetsToDeposit: assets,
          sharesReceived: formattedShares,
          exchangeRate: parseFloat(assets) / parseFloat(formattedShares),
        },
      });
      break;
    }

    case 'previewWithdraw': {
      const assets = this.getNodeParameter('assets', index) as string;
      const assetsWei = ethers.parseUnits(assets, TOKEN_DECIMALS.usde);

      const shares = await client.previewWithdraw(assetsWei);
      const formattedShares = ethers.formatUnits(shares, TOKEN_DECIMALS.susde);

      returnData.push({
        json: {
          assetsToWithdraw: assets,
          sharesRequired: formattedShares,
          exchangeRate: parseFloat(assets) / parseFloat(formattedShares),
        },
      });
      break;
    }

    case 'maxDeposit': {
      const receiver = this.getNodeParameter('receiver', index, '') as string;
      const receiverAddress = receiver || client.getAddress();

      const maxDeposit = await client.maxDeposit(receiverAddress);
      const formattedMax = ethers.formatUnits(maxDeposit, TOKEN_DECIMALS.usde);

      returnData.push({
        json: {
          receiver: receiverAddress,
          maxDeposit: formattedMax,
          maxDepositRaw: maxDeposit.toString(),
        },
      });
      break;
    }

    case 'maxWithdraw': {
      const owner = this.getNodeParameter('owner', index, '') as string;
      const ownerAddress = owner || client.getAddress();

      const maxWithdraw = await client.maxWithdraw(ownerAddress);
      const formattedMax = ethers.formatUnits(maxWithdraw, TOKEN_DECIMALS.usde);

      returnData.push({
        json: {
          owner: ownerAddress,
          maxWithdraw: formattedMax,
          maxWithdrawRaw: maxWithdraw.toString(),
        },
      });
      break;
    }

    case 'getCooldownStatus': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || client.getAddress();

      const cooldown = await client.getCooldownStatus(targetAddress);
      const status = calculateCooldownStatus(
        cooldown.cooldownEnd > 0 ? cooldown.cooldownEnd - 7 * 24 * 60 * 60 : 0,
        cooldown.cooldownEnd,
        cooldown.underlyingAmount
      );

      returnData.push({
        json: {
          address: targetAddress,
          isActive: status.isActive,
          canWithdraw: status.canWithdraw,
          amount: ethers.formatUnits(status.amount, TOKEN_DECIMALS.usde),
          amountRaw: status.amount.toString(),
          cooldownEnd: status.endTime,
          cooldownEndDate: status.endTime > 0 ? new Date(status.endTime * 1000).toISOString() : null,
          remainingTime: status.remainingFormatted,
          progress: status.progress,
        },
      });
      break;
    }

    case 'initiateCooldown': {
      const assets = this.getNodeParameter('assets', index) as string;
      const assetsWei = ethers.parseUnits(assets, TOKEN_DECIMALS.usde);

      const tx = await client.initiateCooldown(assetsWei);
      const receipt = await tx.wait();

      returnData.push({
        json: {
          success: true,
          transactionHash: receipt?.hash,
          user: client.getAddress(),
          assetsInCooldown: assets,
          cooldownDuration: '7 days',
          blockNumber: receipt?.blockNumber,
        },
      });
      break;
    }

    case 'getYieldHistory': {
      const period = this.getNodeParameter('period', index, '30d') as string;

      const historyResponse = await api.getYieldHistory(period as '24h' | '7d' | '30d' | '90d' | '1y');

      if (!historyResponse.success) {
        throw new NodeOperationError(this.getNode(), historyResponse.error || 'Failed to get yield history');
      }

      returnData.push({
        json: {
          symbol: 'sUSDe',
          period,
          history: historyResponse.data?.map((h) => ({
            timestamp: h.timestamp,
            date: new Date(h.timestamp * 1000).toISOString(),
            apy: h.apy,
            apyFormatted: `${(h.apy * 100).toFixed(2)}%`,
          })),
        },
      });
      break;
    }

    case 'getContractAddress': {
      const network = this.getNodeParameter('network', index, 'ethereum') as string;
      const address = getContractAddress(network, 'susde');

      returnData.push({
        json: {
          network,
          contractAddress: address,
          symbol: 'sUSDe',
          decimals: TOKEN_DECIMALS.susde,
          standard: 'ERC-4626',
        },
      });
      break;
    }

    case 'getPrice': {
      const priceResponse = await api.getSusdePrice();

      if (!priceResponse.success) {
        throw new NodeOperationError(this.getNode(), priceResponse.error || 'Failed to get price');
      }

      returnData.push({
        json: {
          symbol: 'sUSDe',
          price: priceResponse.data?.price,
          exchangeRate: priceResponse.data?.exchangeRate,
          timestamp: priceResponse.timestamp,
        },
      });
      break;
    }

    case 'transfer': {
      const to = this.getNodeParameter('to', index) as string;
      const amount = this.getNodeParameter('amount', index) as string;

      if (!ethers.isAddress(to)) {
        throw new NodeOperationError(this.getNode(), 'Invalid recipient address');
      }

      const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS.susde);
      const contract = client.getSusdeContract();
      const tx = await contract.transfer(to, amountWei);
      const receipt = await tx.wait();

      returnData.push({
        json: {
          success: true,
          transactionHash: receipt?.hash,
          from: client.getAddress(),
          to,
          amount,
          amountRaw: amountWei.toString(),
          blockNumber: receipt?.blockNumber,
        },
      });
      break;
    }

    case 'approve': {
      const spender = this.getNodeParameter('spender', index) as string;
      const amount = this.getNodeParameter('amount', index) as string;
      const unlimited = this.getNodeParameter('unlimited', index, false) as boolean;

      if (!ethers.isAddress(spender)) {
        throw new NodeOperationError(this.getNode(), 'Invalid spender address');
      }

      const amountWei = unlimited
        ? ethers.MaxUint256
        : ethers.parseUnits(amount, TOKEN_DECIMALS.susde);

      const contract = client.getSusdeContract();
      const tx = await contract.approve(spender, amountWei);
      const receipt = await tx.wait();

      returnData.push({
        json: {
          success: true,
          transactionHash: receipt?.hash,
          owner: client.getAddress(),
          spender,
          amount: unlimited ? 'unlimited' : amount,
          blockNumber: receipt?.blockNumber,
        },
      });
      break;
    }

    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }

  return returnData;
}
