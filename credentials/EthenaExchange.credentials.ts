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
 * Ethena Exchange Credentials
 *
 * Provides connectivity to centralized exchanges used in Ethena's
 * delta-neutral strategy. These exchanges are used for perpetual
 * futures hedging to maintain price stability.
 *
 * Supported exchanges:
 * - Binance
 * - Bybit
 * - OKX
 * - Deribit
 * - Bitget
 *
 * SECURITY NOTE: Use API keys with minimal permissions
 * (read-only where possible). Never enable withdrawal permissions.
 */
export class EthenaExchange implements ICredentialType {
  name = 'ethenaExchange';
  displayName = 'Ethena Exchange';
  documentationUrl = 'https://docs.ethena.fi';
  properties: INodeProperties[] = [
    {
      displayName: 'Exchange',
      name: 'exchange',
      type: 'options',
      default: 'binance',
      options: [
        {
          name: 'Binance',
          value: 'binance',
          description: 'Binance exchange',
        },
        {
          name: 'Bybit',
          value: 'bybit',
          description: 'Bybit exchange',
        },
        {
          name: 'OKX',
          value: 'okx',
          description: 'OKX exchange',
        },
        {
          name: 'Deribit',
          value: 'deribit',
          description: 'Deribit exchange',
        },
        {
          name: 'Bitget',
          value: 'bitget',
          description: 'Bitget exchange',
        },
      ],
      description: 'The exchange to connect to',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Your exchange API key',
      required: true,
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Your exchange API secret',
      required: true,
    },
    {
      displayName: 'Passphrase',
      name: 'passphrase',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API passphrase (required for OKX and some other exchanges)',
      displayOptions: {
        show: {
          exchange: ['okx', 'bitget'],
        },
      },
    },
    {
      displayName: 'Use Testnet',
      name: 'useTestnet',
      type: 'boolean',
      default: false,
      description: 'Whether to use the testnet environment',
    },
    {
      displayName: 'Sub-Account',
      name: 'subAccount',
      type: 'string',
      default: '',
      description: 'Optional: Sub-account identifier for exchanges that support it',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-KEY': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.exchange === "binance" ? ($credentials.useTestnet ? "https://testnet.binancefuture.com" : "https://fapi.binance.com") : $credentials.exchange === "bybit" ? ($credentials.useTestnet ? "https://api-testnet.bybit.com" : "https://api.bybit.com") : $credentials.exchange === "okx" ? ($credentials.useTestnet ? "https://www.okx.com" : "https://www.okx.com") : $credentials.exchange === "deribit" ? ($credentials.useTestnet ? "https://test.deribit.com" : "https://www.deribit.com") : "https://api.bitget.com"}}',
      url: '/api/v1/time',
      method: 'GET',
    },
  };
}
