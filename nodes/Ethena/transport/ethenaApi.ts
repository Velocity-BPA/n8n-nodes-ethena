/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ethena API Client
 *
 * Handles REST API interactions with Ethena's backend services:
 * - Protocol statistics
 * - Yield data
 * - Points/Sats tracking
 * - Referral system
 * - Market data
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import crypto from 'crypto';

export interface ApiConfig {
  environment: 'production' | 'staging' | 'custom';
  apiEndpoint?: string;
  apiKey?: string;
  apiSecret?: string;
  authType: 'apiKey' | 'signed' | 'oauth2' | 'none';
  walletAddress?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ProtocolStats {
  tvl: number;
  usdeTotalSupply: number;
  susdeTotalSupply: number;
  susdeApy: number;
  totalUsers: number;
  volume24h: number;
  marketCap: number;
}

export interface YieldData {
  currentApy: number;
  weeklyApy: number;
  monthlyApy: number;
  fundingYield: number;
  stakingYield: number;
  blendedYield: number;
  nextDistribution: number;
}

export interface PointsData {
  totalSats: number;
  satsBreakdown: {
    holding: number;
    staking: number;
    referrals: number;
    integrations: number;
  };
  multiplier: number;
  rank: number;
  percentile: number;
  dailyEarningRate: number;
}

export interface SeasonData {
  seasonNumber: number;
  name: string;
  startTimestamp: number;
  endTimestamp: number;
  isActive: boolean;
  totalSats: number;
  participantCount: number;
  rewardsPool: number;
}

export interface ReferralData {
  code: string;
  referredUsers: number;
  totalVolume: number;
  earnings: number;
  tier: number;
  nextTierThreshold: number;
}

/**
 * Ethena REST API Client
 */
export class EthenaApi {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;

    const baseURL = this.getBaseUrl();
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((reqConfig) => {
      return this.addAuth(reqConfig);
    });
  }

  private getBaseUrl(): string {
    switch (this.config.environment) {
      case 'production':
        return 'https://api.ethena.fi';
      case 'staging':
        return 'https://api-staging.ethena.fi';
      case 'custom':
        return this.config.apiEndpoint || 'https://api.ethena.fi';
      default:
        return 'https://api.ethena.fi';
    }
  }

  private addAuth(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const headers = config.headers;

    switch (this.config.authType) {
      case 'apiKey':
        if (this.config.apiKey) {
          headers.set('X-API-Key', this.config.apiKey);
        }
        break;

      case 'signed':
        if (this.config.apiKey && this.config.apiSecret) {
          const timestamp = Date.now().toString();
          const message = `${timestamp}${config.method?.toUpperCase()}${config.url}`;
          const signature = crypto
            .createHmac('sha256', this.config.apiSecret)
            .update(message)
            .digest('hex');

          headers.set('X-API-Key', this.config.apiKey);
          headers.set('X-Timestamp', timestamp);
          headers.set('X-Signature', signature);
        }
        break;

      case 'oauth2':
        // OAuth handled separately
        break;
    }

    if (this.config.walletAddress) {
      headers.set('X-Wallet-Address', this.config.walletAddress);
    }

    return config;
  }

  // ============ Protocol Stats ============

  /**
   * Get protocol statistics
   */
  async getProtocolStats(): Promise<ApiResponse<ProtocolStats>> {
    try {
      const response = await this.client.get('/api/v1/stats');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get TVL (Total Value Locked)
   */
  async getTVL(): Promise<ApiResponse<{ tvl: number; breakdown: Record<string, number> }>> {
    try {
      const response = await this.client.get('/api/v1/tvl');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get TVL history
   */
  async getTVLHistory(
    period: '24h' | '7d' | '30d' | '90d' | '1y'
  ): Promise<ApiResponse<Array<{ timestamp: number; tvl: number }>>> {
    try {
      const response = await this.client.get('/api/v1/tvl/history', {
        params: { period },
      });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Yield Data ============

  /**
   * Get current yield data
   */
  async getYieldData(): Promise<ApiResponse<YieldData>> {
    try {
      const response = await this.client.get('/api/v1/yield');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get historical yield data
   */
  async getYieldHistory(
    period: '24h' | '7d' | '30d' | '90d' | '1y'
  ): Promise<ApiResponse<Array<{ timestamp: number; apy: number }>>> {
    try {
      const response = await this.client.get('/api/v1/yield/history', {
        params: { period },
      });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get yield sources breakdown
   */
  async getYieldSources(): Promise<
    ApiResponse<Array<{ source: string; contribution: number; apy: number }>>
  > {
    try {
      const response = await this.client.get('/api/v1/yield/sources');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get funding rates
   */
  async getFundingRates(): Promise<
    ApiResponse<Array<{ exchange: string; symbol: string; rate: number; nextFunding: number }>>
  > {
    try {
      const response = await this.client.get('/api/v1/funding-rates');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Points/Sats ============

  /**
   * Get user points/sats balance
   */
  async getPointsBalance(address: string): Promise<ApiResponse<PointsData>> {
    try {
      const response = await this.client.get(`/api/v1/points/${address}`);
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get points history
   */
  async getPointsHistory(
    address: string,
    limit = 100
  ): Promise<
    ApiResponse<
      Array<{ timestamp: number; activity: string; amount: number; multiplier: number }>
    >
  > {
    try {
      const response = await this.client.get(`/api/v1/points/${address}/history`, {
        params: { limit },
      });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get points leaderboard
   */
  async getLeaderboard(
    limit = 100
  ): Promise<
    ApiResponse<Array<{ rank: number; address: string; sats: number; multiplier: number }>>
  > {
    try {
      const response = await this.client.get('/api/v1/points/leaderboard', {
        params: { limit },
      });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get current season info
   */
  async getSeasonInfo(): Promise<ApiResponse<SeasonData>> {
    try {
      const response = await this.client.get('/api/v1/season');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Referrals ============

  /**
   * Get referral data for user
   */
  async getReferralData(address: string): Promise<ApiResponse<ReferralData>> {
    try {
      const response = await this.client.get(`/api/v1/referrals/${address}`);
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get referral leaderboard
   */
  async getReferralLeaderboard(
    limit = 100
  ): Promise<
    ApiResponse<Array<{ rank: number; address: string; referrals: number; volume: number }>>
  > {
    try {
      const response = await this.client.get('/api/v1/referrals/leaderboard', {
        params: { limit },
      });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Market Data ============

  /**
   * Get USDe price
   */
  async getUsdePrice(): Promise<ApiResponse<{ price: number; change24h: number }>> {
    try {
      const response = await this.client.get('/api/v1/price/usde');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get sUSDe price
   */
  async getSusdePrice(): Promise<ApiResponse<{ price: number; exchangeRate: number }>> {
    try {
      const response = await this.client.get('/api/v1/price/susde');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get ENA price
   */
  async getEnaPrice(): Promise<
    ApiResponse<{ price: number; change24h: number; marketCap: number }>
  > {
    try {
      const response = await this.client.get('/api/v1/price/ena');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Collateral Data ============

  /**
   * Get collateral breakdown
   */
  async getCollateralBreakdown(): Promise<
    ApiResponse<Array<{ asset: string; amount: number; value: number; percentage: number }>>
  > {
    try {
      const response = await this.client.get('/api/v1/collateral');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Insurance Fund ============

  /**
   * Get insurance fund data
   */
  async getInsuranceFund(): Promise<
    ApiResponse<{
      balance: number;
      coverageRatio: number;
      history: Array<{ timestamp: number; balance: number }>;
    }>
  > {
    try {
      const response = await this.client.get('/api/v1/insurance-fund');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Health Check ============

  /**
   * Check API health
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    try {
      const response = await this.client.get('/api/v1/health');
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============ Error Handling ============

  private handleError(error: unknown): ApiResponse<never> {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: Date.now(),
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}
