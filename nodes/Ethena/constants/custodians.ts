/**
 * Ethena Custodians
 *
 * Ethena uses qualified custodians for off-exchange settlement
 * and asset protection. This provides security against
 * exchange counterparty risk.
 */

export interface CustodianInfo {
  name: string;
  id: string;
  type: 'qualified' | 'institutional' | 'protocol';
  website: string;
  description: string;
  supportedAssets: string[];
  jurisdiction: string;
  regulatoryStatus: string;
  insuranceCoverage: string;
  enabled: boolean;
}

export const CUSTODIANS: Record<string, CustodianInfo> = {
  copper: {
    name: 'Copper',
    id: 'copper',
    type: 'qualified',
    website: 'https://copper.co',
    description:
      'Copper provides institutional-grade custody with ClearLoop off-exchange settlement.',
    supportedAssets: ['ETH', 'stETH', 'wstETH', 'BTC', 'WBTC', 'USDT', 'USDC'],
    jurisdiction: 'United Kingdom',
    regulatoryStatus: 'FCA Registered',
    insuranceCoverage: '$500M',
    enabled: true,
  },
  ceffu: {
    name: 'Ceffu (Binance Custody)',
    id: 'ceffu',
    type: 'institutional',
    website: 'https://www.ceffu.com',
    description: 'Ceffu is Binance institutional custody solution with MirrorX trading.',
    supportedAssets: ['ETH', 'BTC', 'stETH', 'USDT', 'USDC'],
    jurisdiction: 'Multiple',
    regulatoryStatus: 'Regulated in multiple jurisdictions',
    insuranceCoverage: 'SAFU Fund Coverage',
    enabled: true,
  },
  cobo: {
    name: 'Cobo',
    id: 'cobo',
    type: 'institutional',
    website: 'https://www.cobo.com',
    description:
      'Cobo provides MPC-based custody and SuperLoop off-exchange settlement solution.',
    supportedAssets: ['ETH', 'BTC', 'stETH', 'wstETH'],
    jurisdiction: 'Singapore',
    regulatoryStatus: 'Licensed in Singapore',
    insuranceCoverage: 'Variable',
    enabled: true,
  },
  fireblocks: {
    name: 'Fireblocks',
    id: 'fireblocks',
    type: 'institutional',
    website: 'https://www.fireblocks.com',
    description: 'Fireblocks provides MPC custody with direct market access capabilities.',
    supportedAssets: ['ETH', 'BTC', 'stETH', 'wstETH', 'USDT', 'USDC', 'DAI'],
    jurisdiction: 'United States',
    regulatoryStatus: 'SOC 2 Type II Certified',
    insuranceCoverage: '$30M standard',
    enabled: true,
  },
};

/**
 * Exchanges used in delta-neutral strategy
 */
export interface ExchangeInfo {
  name: string;
  id: string;
  type: 'centralized' | 'decentralized';
  website: string;
  description: string;
  supportedPairs: string[];
  marginType: 'cross' | 'isolated' | 'both';
  maxLeverage: number;
  fundingInterval: number; // hours
  enabled: boolean;
}

export const EXCHANGES: Record<string, ExchangeInfo> = {
  binance: {
    name: 'Binance',
    id: 'binance',
    type: 'centralized',
    website: 'https://www.binance.com',
    description: 'Leading cryptocurrency exchange with perpetual futures.',
    supportedPairs: ['ETH-PERP', 'BTC-PERP', 'stETH-PERP'],
    marginType: 'both',
    maxLeverage: 125,
    fundingInterval: 8,
    enabled: true,
  },
  bybit: {
    name: 'Bybit',
    id: 'bybit',
    type: 'centralized',
    website: 'https://www.bybit.com',
    description: 'Derivatives-focused exchange with perpetual contracts.',
    supportedPairs: ['ETH-PERP', 'BTC-PERP'],
    marginType: 'both',
    maxLeverage: 100,
    fundingInterval: 8,
    enabled: true,
  },
  okx: {
    name: 'OKX',
    id: 'okx',
    type: 'centralized',
    website: 'https://www.okx.com',
    description: 'Major exchange with comprehensive derivatives offering.',
    supportedPairs: ['ETH-PERP', 'BTC-PERP', 'stETH-PERP'],
    marginType: 'both',
    maxLeverage: 100,
    fundingInterval: 8,
    enabled: true,
  },
  deribit: {
    name: 'Deribit',
    id: 'deribit',
    type: 'centralized',
    website: 'https://www.deribit.com',
    description: 'Options and futures focused exchange.',
    supportedPairs: ['ETH-PERP', 'BTC-PERP'],
    marginType: 'cross',
    maxLeverage: 50,
    fundingInterval: 8,
    enabled: true,
  },
  bitget: {
    name: 'Bitget',
    id: 'bitget',
    type: 'centralized',
    website: 'https://www.bitget.com',
    description: 'Copy trading focused exchange with perpetuals.',
    supportedPairs: ['ETH-PERP', 'BTC-PERP'],
    marginType: 'both',
    maxLeverage: 125,
    fundingInterval: 8,
    enabled: true,
  },
};

/**
 * Get custodian info
 */
export function getCustodianInfo(id: string): CustodianInfo | undefined {
  return CUSTODIANS[id];
}

/**
 * Get all enabled custodians
 */
export function getEnabledCustodians(): CustodianInfo[] {
  return Object.values(CUSTODIANS).filter((c) => c.enabled);
}

/**
 * Get exchange info
 */
export function getExchangeInfo(id: string): ExchangeInfo | undefined {
  return EXCHANGES[id];
}

/**
 * Get all enabled exchanges
 */
export function getEnabledExchanges(): ExchangeInfo[] {
  return Object.values(EXCHANGES).filter((e) => e.enabled);
}
