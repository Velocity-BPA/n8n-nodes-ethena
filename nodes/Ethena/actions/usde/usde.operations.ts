/**
 * USDe Resource Actions
 *
 * Operations for the USDe stablecoin:
 * - Balance queries
 * - Transfers
 * - Approvals
 * - Supply info
 * - Price data
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { EthenaClient } from '../../transport/ethenaClient';
import { EthenaApi } from '../../transport/ethenaApi';
import { SubgraphClient } from '../../transport/subgraphClient';
import { getContractAddress, TOKEN_DECIMALS } from '../../constants';
import { ethers } from 'ethers';

export async function executeUsdeOperation(
  this: IExecuteFunctions,
  operation: string,
  client: EthenaClient,
  api: EthenaApi,
  subgraph: SubgraphClient | null,
  index: number
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  switch (operation) {
    case 'getBalance': {
      const address = this.getNodeParameter('address', index, '') as string;
      const targetAddress = address || client.getAddress();

      const balance = await client.getUsdeBalance(targetAddress);
      const formattedBalance = ethers.formatUnits(balance, TOKEN_DECIMALS.usde);

      returnData.push({
        json: {
          address: targetAddress,
          balance: formattedBalance,
          balanceRaw: balance.toString(),
          decimals: TOKEN_DECIMALS.usde,
          symbol: 'USDe',
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

      const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS.usde);
      const tx = await client.transferUsde(to, amountWei);
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
          gasUsed: receipt?.gasUsed?.toString(),
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
        : ethers.parseUnits(amount, TOKEN_DECIMALS.usde);

      const tx = await client.approveUsde(spender, amountWei);
      const receipt = await tx.wait();

      returnData.push({
        json: {
          success: true,
          transactionHash: receipt?.hash,
          owner: client.getAddress(),
          spender,
          amount: unlimited ? 'unlimited' : amount,
          amountRaw: amountWei.toString(),
          blockNumber: receipt?.blockNumber,
        },
      });
      break;
    }

    case 'getAllowance': {
      const owner = this.getNodeParameter('owner', index, '') as string;
      const spender = this.getNodeParameter('spender', index) as string;

      const ownerAddress = owner || client.getAddress();

      if (!ethers.isAddress(spender)) {
        throw new NodeOperationError(this.getNode(), 'Invalid spender address');
      }

      const allowance = await client.getUsdeAllowance(ownerAddress, spender);
      const formattedAllowance = ethers.formatUnits(allowance, TOKEN_DECIMALS.usde);

      returnData.push({
        json: {
          owner: ownerAddress,
          spender,
          allowance: formattedAllowance,
          allowanceRaw: allowance.toString(),
          isUnlimited: allowance === ethers.MaxUint256,
        },
      });
      break;
    }

    case 'getTotalSupply': {
      const totalSupply = await client.getUsdeTotalSupply();
      const formattedSupply = ethers.formatUnits(totalSupply, TOKEN_DECIMALS.usde);

      returnData.push({
        json: {
          totalSupply: formattedSupply,
          totalSupplyRaw: totalSupply.toString(),
          symbol: 'USDe',
          decimals: TOKEN_DECIMALS.usde,
        },
      });
      break;
    }

    case 'getPrice': {
      const priceResponse = await api.getUsdePrice();

      if (!priceResponse.success) {
        throw new NodeOperationError(this.getNode(), priceResponse.error || 'Failed to get price');
      }

      returnData.push({
        json: {
          symbol: 'USDe',
          price: priceResponse.data?.price,
          change24h: priceResponse.data?.change24h,
          timestamp: priceResponse.timestamp,
        },
      });
      break;
    }

    case 'getMarketCap': {
      const [totalSupply, priceResponse] = await Promise.all([
        client.getUsdeTotalSupply(),
        api.getUsdePrice(),
      ]);

      const formattedSupply = parseFloat(ethers.formatUnits(totalSupply, TOKEN_DECIMALS.usde));
      const price = priceResponse.data?.price || 1;
      const marketCap = formattedSupply * price;

      returnData.push({
        json: {
          symbol: 'USDe',
          totalSupply: formattedSupply,
          price,
          marketCap,
          marketCapFormatted: formatLargeNumber(marketCap),
        },
      });
      break;
    }

    case 'getTransferHistory': {
      const address = this.getNodeParameter('address', index, '') as string;
      const limit = this.getNodeParameter('limit', index, 100) as number;
      const direction = this.getNodeParameter('direction', index, 'all') as string;

      if (!subgraph) {
        throw new NodeOperationError(this.getNode(), 'Subgraph not available for this network');
      }

      const targetAddress = address || client.getAddress();

      const params: { from?: string; to?: string; first: number } = { first: limit };
      if (direction === 'sent' || direction === 'all') {
        params.from = targetAddress;
      }
      if (direction === 'received' || direction === 'all') {
        params.to = targetAddress;
      }

      const transfers = await subgraph.getUsdeTransfers(params);

      returnData.push({
        json: {
          address: targetAddress,
          direction,
          count: transfers.length,
          transfers: transfers.map((t) => ({
            ...t,
            amount: ethers.formatUnits(t.amount, TOKEN_DECIMALS.usde),
            date: new Date(t.timestamp * 1000).toISOString(),
          })),
        },
      });
      break;
    }

    case 'getHolders': {
      const limit = this.getNodeParameter('limit', index, 100) as number;

      if (!subgraph) {
        throw new NodeOperationError(this.getNode(), 'Subgraph not available for this network');
      }

      const holders = await subgraph.getTopHolders('usde', limit);

      returnData.push({
        json: {
          count: holders.length,
          holders: holders.map((h) => ({
            address: h.address,
            balance: ethers.formatUnits(h.balance, TOKEN_DECIMALS.usde),
            balanceRaw: h.balance,
          })),
        },
      });
      break;
    }

    case 'getContractAddress': {
      const network = this.getNodeParameter('network', index, 'ethereum') as string;
      const address = getContractAddress(network, 'usde');

      returnData.push({
        json: {
          network,
          contractAddress: address,
          symbol: 'USDe',
          decimals: TOKEN_DECIMALS.usde,
        },
      });
      break;
    }

    case 'getDecimals': {
      returnData.push({
        json: {
          symbol: 'USDe',
          decimals: TOKEN_DECIMALS.usde,
        },
      });
      break;
    }

    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }

  return returnData;
}

function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
