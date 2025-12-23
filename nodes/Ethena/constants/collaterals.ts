/**
 * Ethena Supported Collaterals
 *
 * Ethena accepts various collateral types for minting USDe.
 * The protocol uses a delta-neutral strategy with:
 * - Liquid Staking Tokens (LSTs) like stETH
 * - ETH and wrapped ETH
 * - BTC collateral on certain networks
 */

export interface CollateralInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isLST: boolean;
  isBTC: boolean;
  isStable: boolean;
  minMintAmount: string;
  maxMintAmount: string;
  enabled: boolean;
  chainlinkFeed?: string;
}

export const COLLATERALS: Record<string, Record<string, CollateralInfo>> = {
  ethereum: {
    stETH: {
      symbol: 'stETH',
      name: 'Lido Staked ETH',
      address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      decimals: 18,
      isLST: true,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '10000',
      enabled: true,
      chainlinkFeed: '0x86392dC19c0b719886221c78AB11eb8Cf5c52812',
    },
    wstETH: {
      symbol: 'wstETH',
      name: 'Wrapped Staked ETH',
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      decimals: 18,
      isLST: true,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '10000',
      enabled: true,
      chainlinkFeed: '0x164b276057258d81941072EcB825382f06CcB981',
    },
    ETH: {
      symbol: 'ETH',
      name: 'Ether',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      isLST: false,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '10000',
      enabled: true,
      chainlinkFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      isLST: false,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '10000',
      enabled: true,
      chainlinkFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    },
    rETH: {
      symbol: 'rETH',
      name: 'Rocket Pool ETH',
      address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
      decimals: 18,
      isLST: true,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '5000',
      enabled: true,
      chainlinkFeed: '0x536218f9E9Eb48863970252233c8F271f554C2d0',
    },
    cbETH: {
      symbol: 'cbETH',
      name: 'Coinbase Staked ETH',
      address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
      decimals: 18,
      isLST: true,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '5000',
      enabled: true,
      chainlinkFeed: '0xF017fcB346A1885194689bA23Eff2fE6fA5C483b',
    },
    sfrxETH: {
      symbol: 'sfrxETH',
      name: 'Staked Frax ETH',
      address: '0xac3E018457B222d93114458476f3E3416Abbe38F',
      decimals: 18,
      isLST: true,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '5000',
      enabled: true,
    },
    mETH: {
      symbol: 'mETH',
      name: 'Mantle Staked ETH',
      address: '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa',
      decimals: 18,
      isLST: true,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '5000',
      enabled: true,
    },
    WBTC: {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      isLST: false,
      isBTC: true,
      isStable: false,
      minMintAmount: '0.001',
      maxMintAmount: '500',
      enabled: true,
      chainlinkFeed: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    },
    tBTC: {
      symbol: 'tBTC',
      name: 'tBTC v2',
      address: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
      decimals: 18,
      isLST: false,
      isBTC: true,
      isStable: false,
      minMintAmount: '0.001',
      maxMintAmount: '500',
      enabled: true,
    },
  },
  arbitrum: {
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimals: 18,
      isLST: false,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '10000',
      enabled: true,
      chainlinkFeed: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
    },
    wstETH: {
      symbol: 'wstETH',
      name: 'Wrapped Staked ETH',
      address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      decimals: 18,
      isLST: true,
      isBTC: false,
      isStable: false,
      minMintAmount: '0.01',
      maxMintAmount: '10000',
      enabled: true,
    },
  },
};

/**
 * Get all collaterals for a network
 */
export function getCollaterals(network: string): Record<string, CollateralInfo> {
  return COLLATERALS[network] || {};
}

/**
 * Get a specific collateral info
 */
export function getCollateralInfo(network: string, symbol: string): CollateralInfo | undefined {
  return COLLATERALS[network]?.[symbol];
}

/**
 * Get all enabled collaterals for a network
 */
export function getEnabledCollaterals(network: string): CollateralInfo[] {
  const collaterals = COLLATERALS[network];
  if (!collaterals) return [];
  return Object.values(collaterals).filter((c) => c.enabled);
}

/**
 * Get all LST collaterals for a network
 */
export function getLSTCollaterals(network: string): CollateralInfo[] {
  const collaterals = COLLATERALS[network];
  if (!collaterals) return [];
  return Object.values(collaterals).filter((c) => c.isLST && c.enabled);
}

/**
 * Get all BTC collaterals for a network
 */
export function getBTCCollaterals(network: string): CollateralInfo[] {
  const collaterals = COLLATERALS[network];
  if (!collaterals) return [];
  return Object.values(collaterals).filter((c) => c.isBTC && c.enabled);
}

/**
 * Check if a collateral is supported
 */
export function isCollateralSupported(network: string, symbol: string): boolean {
  const collateral = COLLATERALS[network]?.[symbol];
  return !!collateral && collateral.enabled;
}
