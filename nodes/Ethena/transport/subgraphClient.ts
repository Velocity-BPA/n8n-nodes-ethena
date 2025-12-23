/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ethena Subgraph Client
 *
 * Handles GraphQL queries to The Graph subgraphs for:
 * - Historical data
 * - Event queries
 * - Analytics
 * - User activity
 */

import { GraphQLClient, gql } from 'graphql-request';

export interface SubgraphConfig {
  network: string;
  customEndpoint?: string;
}

// Subgraph endpoints by network
const SUBGRAPH_ENDPOINTS: Record<string, string> = {
  ethereum: 'https://api.thegraph.com/subgraphs/name/ethena-labs/ethena-mainnet',
  arbitrum: 'https://api.thegraph.com/subgraphs/name/ethena-labs/ethena-arbitrum',
  base: 'https://api.thegraph.com/subgraphs/name/ethena-labs/ethena-base',
  optimism: 'https://api.thegraph.com/subgraphs/name/ethena-labs/ethena-optimism',
};

// GraphQL Fragments
const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    address
    usdeBalance
    susdeBalance
    enaBalance
    totalStaked
    totalUnstaked
    totalMinted
    totalRedeemed
    firstActivityTimestamp
    lastActivityTimestamp
  }
`;

/**
 * Ethena Subgraph Client
 */
export class SubgraphClient {
  private client: GraphQLClient;

  constructor(config: SubgraphConfig) {
    const endpoint = config.customEndpoint || SUBGRAPH_ENDPOINTS[config.network];

    if (!endpoint) {
      throw new Error(`No subgraph available for network: ${config.network}`);
    }

    this.client = new GraphQLClient(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============ User Queries ============

  /**
   * Get user data
   */
  async getUser(address: string): Promise<{
    id: string;
    address: string;
    usdeBalance: string;
    susdeBalance: string;
    enaBalance: string;
    totalStaked: string;
    totalUnstaked: string;
    firstActivityTimestamp: number;
    lastActivityTimestamp: number;
  } | null> {
    const query = gql`
      ${USER_FRAGMENT}
      query GetUser($id: ID!) {
        user(id: $id) {
          ...UserFields
        }
      }
    `;

    const result = await this.client.request<{ user: unknown }>(query, {
      id: address.toLowerCase(),
    });

    return result.user as {
      id: string;
      address: string;
      usdeBalance: string;
      susdeBalance: string;
      enaBalance: string;
      totalStaked: string;
      totalUnstaked: string;
      firstActivityTimestamp: number;
      lastActivityTimestamp: number;
    } | null;
  }

  /**
   * Get top holders
   */
  async getTopHolders(
    token: 'usde' | 'susde' | 'ena',
    limit = 100
  ): Promise<
    Array<{
      address: string;
      balance: string;
    }>
  > {
    const orderBy = `${token}Balance`;
    const query = gql`
      query GetTopHolders($first: Int!, $orderBy: String!) {
        users(first: $first, orderBy: $orderBy, orderDirection: desc) {
          id
          address
          ${token}Balance
        }
      }
    `;

    const result = await this.client.request<{
      users: Array<{ id: string; address: string; [key: string]: string }>;
    }>(query, { first: limit, orderBy });

    return result.users.map((u) => ({
      address: u.address,
      balance: u[`${token}Balance`],
    }));
  }

  // ============ Transfer Queries ============

  /**
   * Get USDe transfers
   */
  async getUsdeTransfers(params: {
    from?: string;
    to?: string;
    first?: number;
    skip?: number;
    orderDirection?: 'asc' | 'desc';
  }): Promise<
    Array<{
      id: string;
      from: string;
      to: string;
      amount: string;
      timestamp: number;
      transactionHash: string;
    }>
  > {
    const { from, to, first = 100, skip = 0, orderDirection = 'desc' } = params;

    let whereClause = '';
    if (from && to) {
      whereClause = `where: { from: "${from.toLowerCase()}", to: "${to.toLowerCase()}" }`;
    } else if (from) {
      whereClause = `where: { from: "${from.toLowerCase()}" }`;
    } else if (to) {
      whereClause = `where: { to: "${to.toLowerCase()}" }`;
    }

    const query = gql`
      query GetTransfers($first: Int!, $skip: Int!) {
        usdeTransfers(
          first: $first
          skip: $skip
          orderBy: timestamp
          orderDirection: ${orderDirection}
          ${whereClause}
        ) {
          id
          from
          to
          amount
          timestamp
          transactionHash
          blockNumber
        }
      }
    `;

    const result = await this.client.request<{
      usdeTransfers: Array<{
        id: string;
        from: string;
        to: string;
        amount: string;
        timestamp: string;
        transactionHash: string;
      }>;
    }>(query, { first, skip });

    return result.usdeTransfers.map((t) => ({
      ...t,
      timestamp: parseInt(t.timestamp, 10),
    }));
  }

  /**
   * Get large transfers (whales)
   */
  async getLargeTransfers(
    minAmount: string,
    limit = 50
  ): Promise<
    Array<{
      id: string;
      from: string;
      to: string;
      amount: string;
      timestamp: number;
      transactionHash: string;
    }>
  > {
    const query = gql`
      query GetLargeTransfers($minAmount: BigInt!, $first: Int!) {
        usdeTransfers(
          first: $first
          orderBy: amount
          orderDirection: desc
          where: { amount_gte: $minAmount }
        ) {
          id
          from
          to
          amount
          timestamp
          transactionHash
        }
      }
    `;

    const result = await this.client.request<{
      usdeTransfers: Array<{
        id: string;
        from: string;
        to: string;
        amount: string;
        timestamp: string;
        transactionHash: string;
      }>;
    }>(query, { minAmount, first: limit });

    return result.usdeTransfers.map((t) => ({
      ...t,
      timestamp: parseInt(t.timestamp, 10),
    }));
  }

  // ============ Staking Queries ============

  /**
   * Get stake events
   */
  async getStakeEvents(params: {
    user?: string;
    first?: number;
    skip?: number;
    orderDirection?: 'asc' | 'desc';
  }): Promise<
    Array<{
      id: string;
      user: string;
      assets: string;
      shares: string;
      timestamp: number;
      transactionHash: string;
    }>
  > {
    const { user, first = 100, skip = 0, orderDirection = 'desc' } = params;

    const whereClause = user ? `where: { user: "${user.toLowerCase()}" }` : '';

    const query = gql`
      query GetStakes($first: Int!, $skip: Int!) {
        stakes(
          first: $first
          skip: $skip
          orderBy: timestamp
          orderDirection: ${orderDirection}
          ${whereClause}
        ) {
          id
          user
          assets
          shares
          timestamp
          transactionHash
          blockNumber
        }
      }
    `;

    const result = await this.client.request<{
      stakes: Array<{
        id: string;
        user: string;
        assets: string;
        shares: string;
        timestamp: string;
        transactionHash: string;
      }>;
    }>(query, { first, skip });

    return result.stakes.map((s) => ({
      ...s,
      timestamp: parseInt(s.timestamp, 10),
    }));
  }

  /**
   * Get unstake events
   */
  async getUnstakeEvents(params: {
    user?: string;
    first?: number;
    skip?: number;
    orderDirection?: 'asc' | 'desc';
  }): Promise<
    Array<{
      id: string;
      user: string;
      assets: string;
      shares: string;
      timestamp: number;
      transactionHash: string;
    }>
  > {
    const { user, first = 100, skip = 0, orderDirection = 'desc' } = params;

    const whereClause = user ? `where: { user: "${user.toLowerCase()}" }` : '';

    const query = gql`
      query GetUnstakes($first: Int!, $skip: Int!) {
        unstakes(
          first: $first
          skip: $skip
          orderBy: timestamp
          orderDirection: ${orderDirection}
          ${whereClause}
        ) {
          id
          user
          assets
          shares
          timestamp
          transactionHash
          blockNumber
        }
      }
    `;

    const result = await this.client.request<{
      unstakes: Array<{
        id: string;
        user: string;
        assets: string;
        shares: string;
        timestamp: string;
        transactionHash: string;
      }>;
    }>(query, { first, skip });

    return result.unstakes.map((u) => ({
      ...u,
      timestamp: parseInt(u.timestamp, 10),
    }));
  }

  // ============ Protocol Stats ============

  /**
   * Get protocol daily snapshots
   */
  async getDailySnapshots(params: {
    first?: number;
    skip?: number;
  }): Promise<
    Array<{
      id: string;
      date: number;
      totalSupply: string;
      totalStaked: string;
      exchangeRate: string;
      dailyVolume: string;
      uniqueUsers: number;
    }>
  > {
    const { first = 30, skip = 0 } = params;

    const query = gql`
      query GetDailySnapshots($first: Int!, $skip: Int!) {
        dailySnapshots(
          first: $first
          skip: $skip
          orderBy: date
          orderDirection: desc
        ) {
          id
          date
          totalSupply
          totalStaked
          exchangeRate
          dailyVolume
          uniqueUsers
        }
      }
    `;

    const result = await this.client.request<{
      dailySnapshots: Array<{
        id: string;
        date: string;
        totalSupply: string;
        totalStaked: string;
        exchangeRate: string;
        dailyVolume: string;
        uniqueUsers: string;
      }>;
    }>(query, { first, skip });

    return result.dailySnapshots.map((s) => ({
      ...s,
      date: parseInt(s.date, 10),
      uniqueUsers: parseInt(s.uniqueUsers, 10),
    }));
  }

  /**
   * Get exchange rate history
   */
  async getExchangeRateHistory(
    days = 30
  ): Promise<Array<{ timestamp: number; rate: string }>> {
    const query = gql`
      query GetRateHistory($first: Int!) {
        exchangeRateSnapshots(
          first: $first
          orderBy: timestamp
          orderDirection: desc
        ) {
          timestamp
          rate
        }
      }
    `;

    const result = await this.client.request<{
      exchangeRateSnapshots: Array<{
        timestamp: string;
        rate: string;
      }>;
    }>(query, { first: days });

    return result.exchangeRateSnapshots.map((s) => ({
      timestamp: parseInt(s.timestamp, 10),
      rate: s.rate,
    }));
  }

  // ============ Governance Queries ============

  /**
   * Get governance proposals
   */
  async getProposals(params: {
    status?: string;
    first?: number;
    skip?: number;
  }): Promise<
    Array<{
      id: string;
      proposalId: string;
      proposer: string;
      description: string;
      status: string;
      forVotes: string;
      againstVotes: string;
      startBlock: number;
      endBlock: number;
    }>
  > {
    const { status, first = 20, skip = 0 } = params;

    const whereClause = status ? `where: { status: "${status}" }` : '';

    const query = gql`
      query GetProposals($first: Int!, $skip: Int!) {
        proposals(
          first: $first
          skip: $skip
          orderBy: startBlock
          orderDirection: desc
          ${whereClause}
        ) {
          id
          proposalId
          proposer
          description
          status
          forVotes
          againstVotes
          startBlock
          endBlock
        }
      }
    `;

    const result = await this.client.request<{
      proposals: Array<{
        id: string;
        proposalId: string;
        proposer: string;
        description: string;
        status: string;
        forVotes: string;
        againstVotes: string;
        startBlock: string;
        endBlock: string;
      }>;
    }>(query, { first, skip });

    return result.proposals.map((p) => ({
      ...p,
      startBlock: parseInt(p.startBlock, 10),
      endBlock: parseInt(p.endBlock, 10),
    }));
  }

  /**
   * Get votes for a proposal
   */
  async getVotes(
    proposalId: string,
    limit = 100
  ): Promise<
    Array<{
      voter: string;
      support: boolean;
      weight: string;
      timestamp: number;
    }>
  > {
    const query = gql`
      query GetVotes($proposalId: String!, $first: Int!) {
        votes(
          first: $first
          where: { proposal: $proposalId }
          orderBy: timestamp
          orderDirection: desc
        ) {
          voter
          support
          weight
          timestamp
        }
      }
    `;

    const result = await this.client.request<{
      votes: Array<{
        voter: string;
        support: boolean;
        weight: string;
        timestamp: string;
      }>;
    }>(query, { proposalId, first: limit });

    return result.votes.map((v) => ({
      ...v,
      timestamp: parseInt(v.timestamp, 10),
    }));
  }

  // ============ Custom Query ============

  /**
   * Execute custom GraphQL query
   */
  async query<T>(
    queryString: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    return this.client.request<T>(queryString, variables);
  }
}
