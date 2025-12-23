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
 * Ethena API Credentials
 *
 * Provides access to Ethena's REST API endpoints for:
 * - Protocol statistics and analytics
 * - Yield data and historical information
 * - Points/Sats balance tracking
 * - Referral system management
 * - Market data and pricing
 */
export class EthenaApi implements ICredentialType {
  name = 'ethenaApi';
  displayName = 'Ethena API';
  documentationUrl = 'https://docs.ethena.fi';
  properties: INodeProperties[] = [
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      default: 'production',
      options: [
        {
          name: 'Production',
          value: 'production',
          description: 'Ethena production API',
        },
        {
          name: 'Staging',
          value: 'staging',
          description: 'Ethena staging/test API',
        },
        {
          name: 'Custom',
          value: 'custom',
          description: 'Custom API endpoint',
        },
      ],
      description: 'The Ethena API environment to use',
    },
    {
      displayName: 'API Endpoint',
      name: 'apiEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://api.ethena.fi',
      description: 'Custom API endpoint URL',
      displayOptions: {
        show: {
          environment: ['custom'],
        },
      },
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Your Ethena API key',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Your Ethena API secret for signed requests',
    },
    {
      displayName: 'Authentication Type',
      name: 'authType',
      type: 'options',
      default: 'apiKey',
      options: [
        {
          name: 'API Key',
          value: 'apiKey',
          description: 'Authenticate using API key',
        },
        {
          name: 'API Key + Signature',
          value: 'signed',
          description: 'Authenticate using API key with HMAC signature',
        },
        {
          name: 'OAuth 2.0',
          value: 'oauth2',
          description: 'Authenticate using OAuth 2.0',
        },
        {
          name: 'None',
          value: 'none',
          description: 'No authentication (public endpoints only)',
        },
      ],
      description: 'The authentication method to use',
    },
    {
      displayName: 'OAuth Client ID',
      name: 'oauthClientId',
      type: 'string',
      default: '',
      description: 'OAuth 2.0 Client ID',
      displayOptions: {
        show: {
          authType: ['oauth2'],
        },
      },
    },
    {
      displayName: 'OAuth Client Secret',
      name: 'oauthClientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'OAuth 2.0 Client Secret',
      displayOptions: {
        show: {
          authType: ['oauth2'],
        },
      },
    },
    {
      displayName: 'OAuth Access Token',
      name: 'oauthAccessToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'OAuth 2.0 Access Token',
      displayOptions: {
        show: {
          authType: ['oauth2'],
        },
      },
    },
    {
      displayName: 'Wallet Address',
      name: 'walletAddress',
      type: 'string',
      default: '',
      placeholder: '0x...',
      description: 'Your wallet address for API requests that require it',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.environment === "production" ? "https://api.ethena.fi" : $credentials.environment === "staging" ? "https://api-staging.ethena.fi" : $credentials.apiEndpoint}}',
      url: '/api/v1/health',
      method: 'GET',
    },
  };
}
