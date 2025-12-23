import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ethena Network Credentials
 *
 * Provides blockchain connectivity for Ethena Protocol operations.
 * Supports multiple EVM networks including Ethereum Mainnet, Arbitrum,
 * Base, Optimism, BNB Chain, and custom endpoints.
 *
 * SECURITY NOTE: Private keys are stored securely and never logged.
 * Always use dedicated wallets for automation with limited funds.
 */
export class EthenaNetwork implements ICredentialType {
  name = 'ethenaNetwork';
  displayName = 'Ethena Network';
  documentationUrl = 'https://docs.ethena.fi';
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      default: 'ethereum',
      options: [
        {
          name: 'Ethereum Mainnet',
          value: 'ethereum',
          description: 'Ethereum Mainnet (Chain ID: 1)',
        },
        {
          name: 'Ethereum Sepolia (Testnet)',
          value: 'sepolia',
          description: 'Ethereum Sepolia Testnet (Chain ID: 11155111)',
        },
        {
          name: 'Arbitrum One',
          value: 'arbitrum',
          description: 'Arbitrum One L2 (Chain ID: 42161)',
        },
        {
          name: 'Base',
          value: 'base',
          description: 'Base L2 (Chain ID: 8453)',
        },
        {
          name: 'Optimism',
          value: 'optimism',
          description: 'Optimism L2 (Chain ID: 10)',
        },
        {
          name: 'BNB Chain',
          value: 'bnb',
          description: 'BNB Smart Chain (Chain ID: 56)',
        },
        {
          name: 'Custom',
          value: 'custom',
          description: 'Custom RPC endpoint',
        },
      ],
      description: 'The blockchain network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      description: 'The RPC endpoint URL for blockchain connectivity. Required for Custom network, optional for others to override defaults.',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
      required: true,
    },
    {
      displayName: 'RPC Endpoint URL (Optional Override)',
      name: 'rpcUrlOverride',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      description: 'Optional: Override the default RPC endpoint for this network',
      displayOptions: {
        hide: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: '0x...',
      description: 'The private key of the wallet to use for transactions. Keep this secure and never share it.',
      required: true,
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 1,
      description: 'The chain ID of the network (auto-populated based on network selection)',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Referral Code',
      name: 'referralCode',
      type: 'string',
      default: '',
      placeholder: 'your-referral-code',
      description: 'Optional: Ethena referral code for earning rewards',
    },
    {
      displayName: 'Gas Settings',
      name: 'gasSettings',
      type: 'collection',
      placeholder: 'Add Gas Setting',
      default: {},
      options: [
        {
          displayName: 'Max Fee Per Gas (Gwei)',
          name: 'maxFeePerGas',
          type: 'number',
          default: 0,
          description: 'Maximum fee per gas unit (0 = auto)',
        },
        {
          displayName: 'Max Priority Fee (Gwei)',
          name: 'maxPriorityFeePerGas',
          type: 'number',
          default: 0,
          description: 'Maximum priority fee per gas unit (0 = auto)',
        },
        {
          displayName: 'Gas Limit',
          name: 'gasLimit',
          type: 'number',
          default: 0,
          description: 'Gas limit for transactions (0 = auto estimate)',
        },
      ],
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.rpcUrl || $credentials.rpcUrlOverride || ""}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
