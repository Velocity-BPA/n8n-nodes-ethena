/**
 * Network Configurations for Ethena Protocol
 *
 * Contains chain IDs, RPC endpoints, block explorers, and
 * network-specific settings for all supported networks.
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorer: string;
  subgraphUrl?: string;
  multicallAddress: string;
  isTestnet: boolean;
  avgBlockTime: number; // in seconds
}

export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'eth',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth',
    ],
    blockExplorer: 'https://etherscan.io',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ethena-labs/ethena-mainnet',
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    isTestnet: false,
    avgBlockTime: 12,
  },
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    shortName: 'sep',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://ethereum-sepolia.publicnode.com',
      'https://rpc.sepolia.org',
    ],
    blockExplorer: 'https://sepolia.etherscan.io',
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    isTestnet: true,
    avgBlockTime: 12,
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'arb1',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://rpc.ankr.com/arbitrum',
    ],
    blockExplorer: 'https://arbiscan.io',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ethena-labs/ethena-arbitrum',
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    isTestnet: false,
    avgBlockTime: 0.25,
  },
  base: {
    chainId: 8453,
    name: 'Base',
    shortName: 'base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://rpc.ankr.com/base',
    ],
    blockExplorer: 'https://basescan.org',
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    isTestnet: false,
    avgBlockTime: 2,
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    shortName: 'oeth',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism.llamarpc.com',
      'https://rpc.ankr.com/optimism',
    ],
    blockExplorer: 'https://optimistic.etherscan.io',
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    isTestnet: false,
    avgBlockTime: 2,
  },
  bnb: {
    chainId: 56,
    name: 'BNB Smart Chain',
    shortName: 'bnb',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://bsc.llamarpc.com',
      'https://rpc.ankr.com/bsc',
    ],
    blockExplorer: 'https://bscscan.com',
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    isTestnet: false,
    avgBlockTime: 3,
  },
};

export const DEFAULT_NETWORK = 'ethereum';

/**
 * Get network configuration by network key or chain ID
 */
export function getNetworkConfig(networkOrChainId: string | number): NetworkConfig | undefined {
  if (typeof networkOrChainId === 'number') {
    return Object.values(NETWORKS).find((n) => n.chainId === networkOrChainId);
  }
  return NETWORKS[networkOrChainId];
}

/**
 * Get the default RPC URL for a network
 */
export function getDefaultRpcUrl(network: string): string {
  const config = NETWORKS[network];
  return config?.rpcUrls[0] ?? '';
}

/**
 * Get chain ID for a network
 */
export function getChainId(network: string): number {
  const config = NETWORKS[network];
  return config?.chainId ?? 1;
}

/**
 * Check if a network is supported
 */
export function isNetworkSupported(network: string): boolean {
  return network in NETWORKS;
}

/**
 * Get all supported network keys
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(NETWORKS);
}

/**
 * Get block explorer URL for a transaction
 */
export function getTxExplorerUrl(network: string, txHash: string): string {
  const config = NETWORKS[network];
  return config ? `${config.blockExplorer}/tx/${txHash}` : '';
}

/**
 * Get block explorer URL for an address
 */
export function getAddressExplorerUrl(network: string, address: string): string {
  const config = NETWORKS[network];
  return config ? `${config.blockExplorer}/address/${address}` : '';
}
