/**
 * Constants Tests
 */

import {
  NETWORKS,
  getNetworkConfig,
  getDefaultRpcUrl,
  getChainId,
  isNetworkSupported,
  getSupportedNetworks,
  getTxExplorerUrl,
  getAddressExplorerUrl,
} from '../nodes/Ethena/constants/networks';

import {
  CONTRACT_ADDRESSES,
  getContractAddresses,
  getContractAddress,
  isContractDeployed,
  ZERO_ADDRESS,
  TOKEN_DECIMALS,
} from '../nodes/Ethena/constants/contracts';

import {
  COLLATERALS,
  getCollaterals,
  getCollateralInfo,
  getEnabledCollaterals,
  getLSTCollaterals,
  isCollateralSupported,
} from '../nodes/Ethena/constants/collaterals';

describe('Network Constants', () => {
  describe('NETWORKS', () => {
    it('should have ethereum network', () => {
      expect(NETWORKS.ethereum).toBeDefined();
      expect(NETWORKS.ethereum.chainId).toBe(1);
    });

    it('should have all required network properties', () => {
      const network = NETWORKS.ethereum;
      expect(network.name).toBeDefined();
      expect(network.chainId).toBeDefined();
      expect(network.rpcUrls).toBeDefined();
      expect(network.blockExplorer).toBeDefined();
      expect(network.multicallAddress).toBeDefined();
    });
  });

  describe('getNetworkConfig', () => {
    it('should return config by network name', () => {
      const config = getNetworkConfig('ethereum');
      expect(config?.chainId).toBe(1);
    });

    it('should return config by chain ID', () => {
      const config = getNetworkConfig(42161);
      expect(config?.name).toBe('Arbitrum One');
    });

    it('should return undefined for unknown network', () => {
      const config = getNetworkConfig('unknown');
      expect(config).toBeUndefined();
    });
  });

  describe('getDefaultRpcUrl', () => {
    it('should return RPC URL for supported network', () => {
      const url = getDefaultRpcUrl('ethereum');
      expect(url).toContain('http');
    });

    it('should return empty string for unknown network', () => {
      const url = getDefaultRpcUrl('unknown');
      expect(url).toBe('');
    });
  });

  describe('getChainId', () => {
    it('should return chain ID for ethereum', () => {
      expect(getChainId('ethereum')).toBe(1);
    });

    it('should return chain ID for arbitrum', () => {
      expect(getChainId('arbitrum')).toBe(42161);
    });
  });

  describe('isNetworkSupported', () => {
    it('should return true for supported networks', () => {
      expect(isNetworkSupported('ethereum')).toBe(true);
      expect(isNetworkSupported('arbitrum')).toBe(true);
    });

    it('should return false for unsupported networks', () => {
      expect(isNetworkSupported('unknown')).toBe(false);
    });
  });

  describe('getSupportedNetworks', () => {
    it('should return array of network keys', () => {
      const networks = getSupportedNetworks();
      expect(networks).toContain('ethereum');
      expect(networks).toContain('arbitrum');
    });
  });

  describe('getTxExplorerUrl', () => {
    it('should return explorer URL for transaction', () => {
      const url = getTxExplorerUrl('ethereum', '0x123');
      expect(url).toBe('https://etherscan.io/tx/0x123');
    });
  });

  describe('getAddressExplorerUrl', () => {
    it('should return explorer URL for address', () => {
      const url = getAddressExplorerUrl('ethereum', '0x123');
      expect(url).toBe('https://etherscan.io/address/0x123');
    });
  });
});

describe('Contract Constants', () => {
  describe('CONTRACT_ADDRESSES', () => {
    it('should have ethereum addresses', () => {
      expect(CONTRACT_ADDRESSES.ethereum).toBeDefined();
      expect(CONTRACT_ADDRESSES.ethereum.usde).toBeDefined();
    });
  });

  describe('getContractAddresses', () => {
    it('should return all addresses for network', () => {
      const addresses = getContractAddresses('ethereum');
      expect(addresses?.usde).toBeDefined();
      expect(addresses?.susde).toBeDefined();
    });
  });

  describe('getContractAddress', () => {
    it('should return specific contract address', () => {
      const address = getContractAddress('ethereum', 'usde');
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('isContractDeployed', () => {
    it('should return true for deployed contracts', () => {
      expect(isContractDeployed('ethereum', 'usde')).toBe(true);
    });

    it('should return false for zero address', () => {
      // Assuming some contract is not deployed
      expect(isContractDeployed('bnb', 'usde')).toBe(false);
    });
  });

  describe('ZERO_ADDRESS', () => {
    it('should be 42 characters', () => {
      expect(ZERO_ADDRESS).toBe('0x0000000000000000000000000000000000000000');
    });
  });

  describe('TOKEN_DECIMALS', () => {
    it('should have correct decimals', () => {
      expect(TOKEN_DECIMALS.usde).toBe(18);
      expect(TOKEN_DECIMALS.susde).toBe(18);
      expect(TOKEN_DECIMALS.usdt).toBe(6);
    });
  });
});

describe('Collateral Constants', () => {
  describe('COLLATERALS', () => {
    it('should have ethereum collaterals', () => {
      expect(COLLATERALS.ethereum).toBeDefined();
    });

    it('should have stETH on ethereum', () => {
      expect(COLLATERALS.ethereum.stETH).toBeDefined();
      expect(COLLATERALS.ethereum.stETH.isLST).toBe(true);
    });
  });

  describe('getCollaterals', () => {
    it('should return all collaterals for network', () => {
      const collaterals = getCollaterals('ethereum');
      expect(Object.keys(collaterals).length).toBeGreaterThan(0);
    });

    it('should return empty object for unknown network', () => {
      const collaterals = getCollaterals('unknown');
      expect(Object.keys(collaterals).length).toBe(0);
    });
  });

  describe('getCollateralInfo', () => {
    it('should return collateral info', () => {
      const info = getCollateralInfo('ethereum', 'stETH');
      expect(info?.symbol).toBe('stETH');
      expect(info?.decimals).toBe(18);
    });
  });

  describe('getEnabledCollaterals', () => {
    it('should return only enabled collaterals', () => {
      const enabled = getEnabledCollaterals('ethereum');
      expect(enabled.length).toBeGreaterThan(0);
      enabled.forEach((c) => expect(c.enabled).toBe(true));
    });
  });

  describe('getLSTCollaterals', () => {
    it('should return only LST collaterals', () => {
      const lsts = getLSTCollaterals('ethereum');
      expect(lsts.length).toBeGreaterThan(0);
      lsts.forEach((c) => expect(c.isLST).toBe(true));
    });
  });

  describe('isCollateralSupported', () => {
    it('should return true for supported collateral', () => {
      expect(isCollateralSupported('ethereum', 'stETH')).toBe(true);
    });

    it('should return false for unsupported collateral', () => {
      expect(isCollateralSupported('ethereum', 'UNKNOWN')).toBe(false);
    });
  });
});
