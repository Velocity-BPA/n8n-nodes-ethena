/**
 * Ethena Protocol Contract Addresses
 *
 * Contains all deployed contract addresses across supported networks.
 * These addresses are for the main Ethena protocol components including:
 * - USDe stablecoin
 * - sUSDe staking vault
 * - ENA governance token
 * - Minting and redemption contracts
 * - Insurance fund
 * - Governance contracts
 */

export interface ContractAddresses {
  // Core tokens
  usde: string;
  susde: string;
  ena: string;

  // Minting/Redemption
  minter: string;
  redeemer: string;
  mintingHub: string;

  // Staking
  stakingVault: string;
  cooldownManager: string;

  // Governance
  governor: string;
  timelock: string;
  enaStaking: string;

  // Insurance
  insuranceFund: string;

  // Oracles
  usdeOracle: string;
  susdeOracle: string;

  // Bridge
  bridge?: string;

  // Utility
  multicall: string;
}

export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = {
  ethereum: {
    // Core tokens
    usde: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    susde: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    ena: '0x57e114B691Db790C35207b2e685D4A43181e6061',

    // Minting/Redemption
    minter: '0x2CC440b7C73741BA3e2a72EfBA366c0E0A80ACA0',
    redeemer: '0x0000000000000000000000000000000000000000', // Placeholder
    mintingHub: '0x0000000000000000000000000000000000000000', // Placeholder

    // Staking
    stakingVault: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    cooldownManager: '0x0000000000000000000000000000000000000000', // Placeholder

    // Governance
    governor: '0x0000000000000000000000000000000000000000', // Placeholder
    timelock: '0x0000000000000000000000000000000000000000', // Placeholder
    enaStaking: '0x0000000000000000000000000000000000000000', // Placeholder

    // Insurance
    insuranceFund: '0x0000000000000000000000000000000000000000', // Placeholder

    // Oracles
    usdeOracle: '0x0000000000000000000000000000000000000000', // Placeholder
    susdeOracle: '0x0000000000000000000000000000000000000000', // Placeholder

    // Utility
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
  arbitrum: {
    usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    ena: '0x0000000000000000000000000000000000000000', // Not deployed on Arbitrum
    minter: '0x0000000000000000000000000000000000000000',
    redeemer: '0x0000000000000000000000000000000000000000',
    mintingHub: '0x0000000000000000000000000000000000000000',
    stakingVault: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    cooldownManager: '0x0000000000000000000000000000000000000000',
    governor: '0x0000000000000000000000000000000000000000',
    timelock: '0x0000000000000000000000000000000000000000',
    enaStaking: '0x0000000000000000000000000000000000000000',
    insuranceFund: '0x0000000000000000000000000000000000000000',
    usdeOracle: '0x0000000000000000000000000000000000000000',
    susdeOracle: '0x0000000000000000000000000000000000000000',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
  base: {
    usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    ena: '0x0000000000000000000000000000000000000000',
    minter: '0x0000000000000000000000000000000000000000',
    redeemer: '0x0000000000000000000000000000000000000000',
    mintingHub: '0x0000000000000000000000000000000000000000',
    stakingVault: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    cooldownManager: '0x0000000000000000000000000000000000000000',
    governor: '0x0000000000000000000000000000000000000000',
    timelock: '0x0000000000000000000000000000000000000000',
    enaStaking: '0x0000000000000000000000000000000000000000',
    insuranceFund: '0x0000000000000000000000000000000000000000',
    usdeOracle: '0x0000000000000000000000000000000000000000',
    susdeOracle: '0x0000000000000000000000000000000000000000',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
  optimism: {
    usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    ena: '0x0000000000000000000000000000000000000000',
    minter: '0x0000000000000000000000000000000000000000',
    redeemer: '0x0000000000000000000000000000000000000000',
    mintingHub: '0x0000000000000000000000000000000000000000',
    stakingVault: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    cooldownManager: '0x0000000000000000000000000000000000000000',
    governor: '0x0000000000000000000000000000000000000000',
    timelock: '0x0000000000000000000000000000000000000000',
    enaStaking: '0x0000000000000000000000000000000000000000',
    insuranceFund: '0x0000000000000000000000000000000000000000',
    usdeOracle: '0x0000000000000000000000000000000000000000',
    susdeOracle: '0x0000000000000000000000000000000000000000',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
  bnb: {
    usde: '0x0000000000000000000000000000000000000000', // Check if deployed
    susde: '0x0000000000000000000000000000000000000000',
    ena: '0x0000000000000000000000000000000000000000',
    minter: '0x0000000000000000000000000000000000000000',
    redeemer: '0x0000000000000000000000000000000000000000',
    mintingHub: '0x0000000000000000000000000000000000000000',
    stakingVault: '0x0000000000000000000000000000000000000000',
    cooldownManager: '0x0000000000000000000000000000000000000000',
    governor: '0x0000000000000000000000000000000000000000',
    timelock: '0x0000000000000000000000000000000000000000',
    enaStaking: '0x0000000000000000000000000000000000000000',
    insuranceFund: '0x0000000000000000000000000000000000000000',
    usdeOracle: '0x0000000000000000000000000000000000000000',
    susdeOracle: '0x0000000000000000000000000000000000000000',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
  sepolia: {
    usde: '0x0000000000000000000000000000000000000000', // Testnet placeholder
    susde: '0x0000000000000000000000000000000000000000',
    ena: '0x0000000000000000000000000000000000000000',
    minter: '0x0000000000000000000000000000000000000000',
    redeemer: '0x0000000000000000000000000000000000000000',
    mintingHub: '0x0000000000000000000000000000000000000000',
    stakingVault: '0x0000000000000000000000000000000000000000',
    cooldownManager: '0x0000000000000000000000000000000000000000',
    governor: '0x0000000000000000000000000000000000000000',
    timelock: '0x0000000000000000000000000000000000000000',
    enaStaking: '0x0000000000000000000000000000000000000000',
    insuranceFund: '0x0000000000000000000000000000000000000000',
    usdeOracle: '0x0000000000000000000000000000000000000000',
    susdeOracle: '0x0000000000000000000000000000000000000000',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
};

/**
 * Get contract addresses for a specific network
 */
export function getContractAddresses(network: string): ContractAddresses | undefined {
  return CONTRACT_ADDRESSES[network];
}

/**
 * Get a specific contract address
 */
export function getContractAddress(
  network: string,
  contract: keyof ContractAddresses
): string | undefined {
  const addresses = CONTRACT_ADDRESSES[network];
  return addresses?.[contract];
}

/**
 * Check if a contract is deployed on a network (non-zero address)
 */
export function isContractDeployed(network: string, contract: keyof ContractAddresses): boolean {
  const address = getContractAddress(network, contract);
  return !!address && address !== '0x0000000000000000000000000000000000000000';
}

/**
 * Zero address constant
 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Token decimals
 */
export const TOKEN_DECIMALS = {
  usde: 18,
  susde: 18,
  ena: 18,
  eth: 18,
  steth: 18,
  wsteth: 18,
  weth: 18,
  usdt: 6,
  usdc: 6,
  dai: 18,
};
