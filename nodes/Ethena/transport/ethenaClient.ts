/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ethena Blockchain Client
 *
 * Handles all EVM blockchain interactions including:
 * - Token operations (USDe, sUSDe, ENA)
 * - Staking vault operations (ERC-4626)
 * - Minting and redemption
 * - Governance operations
 */

import { ethers, Contract, Wallet, Provider, JsonRpcProvider } from 'ethers';
import {
  getNetworkConfig,
  getDefaultRpcUrl,
  getContractAddress,
} from '../constants';

// ABI fragments for common operations
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// ERC-4626 Vault ABI (sUSDe)
export const ERC4626_ABI = [
  ...ERC20_ABI,
  'function asset() view returns (address)',
  'function totalAssets() view returns (uint256)',
  'function convertToShares(uint256 assets) view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function maxDeposit(address receiver) view returns (uint256)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function deposit(uint256 assets, address receiver) returns (uint256)',
  'function maxMint(address receiver) view returns (uint256)',
  'function previewMint(uint256 shares) view returns (uint256)',
  'function mint(uint256 shares, address receiver) returns (uint256)',
  'function maxWithdraw(address owner) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
  'function maxRedeem(address owner) view returns (uint256)',
  'function previewRedeem(uint256 shares) view returns (uint256)',
  'function redeem(uint256 shares, address receiver, address owner) returns (uint256)',
  'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
  'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
];

// sUSDe specific ABI with cooldown
export const SUSDE_ABI = [
  ...ERC4626_ABI,
  'function cooldownDuration() view returns (uint24)',
  'function cooldowns(address user) view returns (uint104 cooldownEnd, uint152 underlyingAmount)',
  'function unstake(address receiver)',
  'function cooldownAssets(uint256 assets) returns (uint256)',
  'function cooldownShares(uint256 shares) returns (uint256)',
  'event CooldownStarted(address indexed user, uint256 assets, uint256 shares)',
];

// ENA Token ABI
export const ENA_ABI = [
  ...ERC20_ABI,
  'function delegate(address delegatee)',
  'function delegates(address account) view returns (address)',
  'function getVotes(address account) view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function getPastTotalSupply(uint256 blockNumber) view returns (uint256)',
  'event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)',
  'event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)',
];

// Minter ABI
export const MINTER_ABI = [
  'function mint(address collateral, uint256 amount, address receiver) returns (uint256)',
  'function getMintAmount(address collateral, uint256 amount) view returns (uint256)',
  'function getSupportedCollaterals() view returns (address[])',
  'function getMintFee() view returns (uint256)',
  'function getMinMintAmount() view returns (uint256)',
  'function getMaxMintAmount() view returns (uint256)',
  'event Mint(address indexed collateral, address indexed receiver, uint256 collateralAmount, uint256 usdeAmount)',
];

export interface ClientConfig {
  network: string;
  rpcUrl?: string;
  privateKey: string;
  chainId?: number;
}

export interface TransactionOptions {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

/**
 * Main blockchain client for Ethena operations
 */
export class EthenaClient {
  private provider: Provider;
  private wallet: Wallet;
  private network: string;
  private contracts: Map<string, Contract> = new Map();

  constructor(config: ClientConfig) {
    const networkConfig = getNetworkConfig(config.network);
    if (!networkConfig && config.network !== 'custom') {
      throw new Error(`Unsupported network: ${config.network}`);
    }

    const rpcUrl = config.rpcUrl || getDefaultRpcUrl(config.network);
    if (!rpcUrl) {
      throw new Error('RPC URL is required');
    }

    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(config.privateKey, this.provider);
    this.network = config.network;
  }

  /**
   * Get the signer address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get provider instance
   */
  getProvider(): Provider {
    return this.provider;
  }

  /**
   * Get wallet instance
   */
  getWallet(): Wallet {
    return this.wallet;
  }

  /**
   * Get or create a contract instance
   */
  private getContract(address: string, abi: string[]): Contract {
    const key = `${address}-${abi.length}`;
    if (!this.contracts.has(key)) {
      this.contracts.set(key, new Contract(address, abi, this.wallet));
    }
    return this.contracts.get(key)!;
  }

  /**
   * Get USDe contract
   */
  getUsdeContract(): Contract {
    const address = getContractAddress(this.network, 'usde');
    if (!address) throw new Error('USDe not deployed on this network');
    return this.getContract(address, ERC20_ABI);
  }

  /**
   * Get sUSDe contract
   */
  getSusdeContract(): Contract {
    const address = getContractAddress(this.network, 'susde');
    if (!address) throw new Error('sUSDe not deployed on this network');
    return this.getContract(address, SUSDE_ABI);
  }

  /**
   * Get ENA contract
   */
  getEnaContract(): Contract {
    const address = getContractAddress(this.network, 'ena');
    if (!address) throw new Error('ENA not deployed on this network');
    return this.getContract(address, ENA_ABI);
  }

  /**
   * Get Minter contract
   */
  getMinterContract(): Contract {
    const address = getContractAddress(this.network, 'minter');
    if (!address) throw new Error('Minter not deployed on this network');
    return this.getContract(address, MINTER_ABI);
  }

  // ============ USDe Operations ============

  /**
   * Get USDe balance
   */
  async getUsdeBalance(address?: string): Promise<bigint> {
    const contract = this.getUsdeContract();
    return contract.balanceOf(address || this.wallet.address);
  }

  /**
   * Transfer USDe
   */
  async transferUsde(
    to: string,
    amount: bigint,
    options?: TransactionOptions
  ): Promise<ethers.TransactionResponse> {
    const contract = this.getUsdeContract();
    return contract.transfer(to, amount, options);
  }

  /**
   * Approve USDe spending
   */
  async approveUsde(
    spender: string,
    amount: bigint,
    options?: TransactionOptions
  ): Promise<ethers.TransactionResponse> {
    const contract = this.getUsdeContract();
    return contract.approve(spender, amount, options);
  }

  /**
   * Get USDe allowance
   */
  async getUsdeAllowance(owner: string, spender: string): Promise<bigint> {
    const contract = this.getUsdeContract();
    return contract.allowance(owner, spender);
  }

  /**
   * Get USDe total supply
   */
  async getUsdeTotalSupply(): Promise<bigint> {
    const contract = this.getUsdeContract();
    return contract.totalSupply();
  }

  // ============ sUSDe Operations ============

  /**
   * Get sUSDe balance
   */
  async getSusdeBalance(address?: string): Promise<bigint> {
    const contract = this.getSusdeContract();
    return contract.balanceOf(address || this.wallet.address);
  }

  /**
   * Stake USDe to get sUSDe (deposit)
   */
  async stakeUsde(
    assets: bigint,
    receiver?: string,
    options?: TransactionOptions
  ): Promise<ethers.TransactionResponse> {
    const contract = this.getSusdeContract();
    return contract.deposit(assets, receiver || this.wallet.address, options);
  }

  /**
   * Unstake sUSDe to get USDe (redeem)
   */
  async unstakeSusde(
    shares: bigint,
    receiver?: string,
    owner?: string,
    options?: TransactionOptions
  ): Promise<ethers.TransactionResponse> {
    const contract = this.getSusdeContract();
    return contract.redeem(
      shares,
      receiver || this.wallet.address,
      owner || this.wallet.address,
      options
    );
  }

  /**
   * Get sUSDe/USDe exchange rate
   */
  async getSusdeExchangeRate(): Promise<number> {
    const contract = this.getSusdeContract();
    const oneShare = ethers.parseUnits('1', 18);
    const assets = await contract.convertToAssets(oneShare);
    return Number(ethers.formatUnits(assets, 18));
  }

  /**
   * Get sUSDe total assets
   */
  async getSusdeTotalAssets(): Promise<bigint> {
    const contract = this.getSusdeContract();
    return contract.totalAssets();
  }

  /**
   * Preview deposit (how many shares for assets)
   */
  async previewDeposit(assets: bigint): Promise<bigint> {
    const contract = this.getSusdeContract();
    return contract.previewDeposit(assets);
  }

  /**
   * Preview withdraw (how many shares needed for assets)
   */
  async previewWithdraw(assets: bigint): Promise<bigint> {
    const contract = this.getSusdeContract();
    return contract.previewWithdraw(assets);
  }

  /**
   * Get max deposit
   */
  async maxDeposit(receiver?: string): Promise<bigint> {
    const contract = this.getSusdeContract();
    return contract.maxDeposit(receiver || this.wallet.address);
  }

  /**
   * Get max withdraw
   */
  async maxWithdraw(owner?: string): Promise<bigint> {
    const contract = this.getSusdeContract();
    return contract.maxWithdraw(owner || this.wallet.address);
  }

  /**
   * Get cooldown status
   */
  async getCooldownStatus(
    address?: string
  ): Promise<{ cooldownEnd: number; underlyingAmount: bigint }> {
    const contract = this.getSusdeContract();
    const [cooldownEnd, underlyingAmount] = await contract.cooldowns(
      address || this.wallet.address
    );
    return {
      cooldownEnd: Number(cooldownEnd),
      underlyingAmount: BigInt(underlyingAmount),
    };
  }

  /**
   * Initiate cooldown for assets
   */
  async initiateCooldown(
    assets: bigint,
    options?: TransactionOptions
  ): Promise<ethers.TransactionResponse> {
    const contract = this.getSusdeContract();
    return contract.cooldownAssets(assets, options);
  }

  /**
   * Complete unstake after cooldown
   */
  async completeUnstake(
    receiver?: string,
    options?: TransactionOptions
  ): Promise<ethers.TransactionResponse> {
    const contract = this.getSusdeContract();
    return contract.unstake(receiver || this.wallet.address, options);
  }

  // ============ ENA Operations ============

  /**
   * Get ENA balance
   */
  async getEnaBalance(address?: string): Promise<bigint> {
    const contract = this.getEnaContract();
    return contract.balanceOf(address || this.wallet.address);
  }

  /**
   * Delegate ENA voting power
   */
  async delegateEna(
    delegatee: string,
    options?: TransactionOptions
  ): Promise<ethers.TransactionResponse> {
    const contract = this.getEnaContract();
    return contract.delegate(delegatee, options);
  }

  /**
   * Get voting power
   */
  async getVotingPower(address?: string): Promise<bigint> {
    const contract = this.getEnaContract();
    return contract.getVotes(address || this.wallet.address);
  }

  // ============ Utility Operations ============

  /**
   * Get native token balance (ETH)
   */
  async getNativeBalance(address?: string): Promise<bigint> {
    return this.provider.getBalance(address || this.wallet.address);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    to: string,
    data: string,
    value?: bigint
  ): Promise<bigint> {
    return this.provider.estimateGas({
      from: this.wallet.address,
      to,
      data,
      value,
    });
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    txHash: string
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Check if an address is valid
   */
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Format token amount from wei
   */
  static formatAmount(amount: bigint, decimals = 18): string {
    return ethers.formatUnits(amount, decimals);
  }

  /**
   * Parse token amount to wei
   */
  static parseAmount(amount: string, decimals = 18): bigint {
    return ethers.parseUnits(amount, decimals);
  }
}
