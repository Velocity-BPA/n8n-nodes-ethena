/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Cooldown Utilities for Ethena Protocol
 *
 * Manages the cooldown/unstaking period for sUSDe.
 * When users want to redeem sUSDe for USDe, they must
 * first initiate a cooldown period before withdrawal.
 */

/**
 * Cooldown status interface
 */
export interface CooldownStatus {
  isActive: boolean;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  amount: bigint; // sUSDe amount in cooldown
  canWithdraw: boolean;
  remainingSeconds: number;
  remainingFormatted: string;
  progress: number; // 0-100
}

/**
 * Default cooldown duration in seconds (currently 7 days)
 */
export const DEFAULT_COOLDOWN_DURATION = 7 * 24 * 60 * 60;

/**
 * Calculate cooldown status from on-chain data
 */
export function calculateCooldownStatus(
  cooldownStart: number,
  cooldownEnd: number,
  cooldownAmount: bigint,
  currentTimestamp?: number
): CooldownStatus {
  const now = currentTimestamp || Math.floor(Date.now() / 1000);

  const isActive = cooldownStart > 0 && cooldownAmount > 0n;
  const canWithdraw = isActive && now >= cooldownEnd;
  const remainingSeconds = Math.max(0, cooldownEnd - now);
  const totalDuration = cooldownEnd - cooldownStart;
  const elapsed = now - cooldownStart;
  const progress = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;

  return {
    isActive,
    startTime: cooldownStart,
    endTime: cooldownEnd,
    amount: cooldownAmount,
    canWithdraw,
    remainingSeconds,
    remainingFormatted: formatDuration(remainingSeconds),
    progress: Math.round(progress * 100) / 100,
  };
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Ready';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

/**
 * Calculate when cooldown will complete
 */
export function calculateCooldownEndDate(
  startTimestamp: number,
  durationSeconds = DEFAULT_COOLDOWN_DURATION
): Date {
  return new Date((startTimestamp + durationSeconds) * 1000);
}

/**
 * Check if cooldown has expired
 */
export function isCooldownComplete(cooldownEnd: number, currentTimestamp?: number): boolean {
  const now = currentTimestamp || Math.floor(Date.now() / 1000);
  return now >= cooldownEnd;
}

/**
 * Estimate gas for cooldown operations
 */
export const COOLDOWN_GAS_ESTIMATES = {
  initiateCooldown: 150000n,
  completeCooldown: 200000n,
  cancelCooldown: 80000n,
};

/**
 * Cooldown events for trigger tracking
 */
export enum CooldownEvent {
  INITIATED = 'cooldown_initiated',
  COMPLETED = 'cooldown_completed',
  CANCELLED = 'cooldown_cancelled',
  EXPIRED = 'cooldown_expired',
}

/**
 * Parse cooldown event from contract logs
 */
export function parseCooldownEvent(
  eventName: string,
  args: Record<string, unknown>
): {
  event: CooldownEvent;
  user: string;
  amount: bigint;
  timestamp: number;
} | null {
  const eventMap: Record<string, CooldownEvent> = {
    CooldownStarted: CooldownEvent.INITIATED,
    CooldownCompleted: CooldownEvent.COMPLETED,
    CooldownCancelled: CooldownEvent.CANCELLED,
  };

  const event = eventMap[eventName];
  if (!event) return null;

  return {
    event,
    user: args.user as string,
    amount: BigInt(args.amount as string),
    timestamp: Number(args.timestamp) || Math.floor(Date.now() / 1000),
  };
}

/**
 * Calculate optimal cooldown timing
 * (e.g., to maximize yield before unstaking)
 */
export function calculateOptimalCooldownStart(
  targetWithdrawDate: Date,
  cooldownDuration = DEFAULT_COOLDOWN_DURATION
): Date {
  const targetTimestamp = Math.floor(targetWithdrawDate.getTime() / 1000);
  const startTimestamp = targetTimestamp - cooldownDuration;
  return new Date(startTimestamp * 1000);
}

/**
 * Validate cooldown amount
 */
export function validateCooldownAmount(
  requestedAmount: bigint,
  availableBalance: bigint,
  existingCooldownAmount: bigint
): {
  isValid: boolean;
  error?: string;
  maxAmount: bigint;
} {
  const availableForCooldown = availableBalance - existingCooldownAmount;

  if (requestedAmount <= 0n) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0',
      maxAmount: availableForCooldown,
    };
  }

  if (requestedAmount > availableForCooldown) {
    return {
      isValid: false,
      error: `Insufficient balance. Maximum available: ${availableForCooldown}`,
      maxAmount: availableForCooldown,
    };
  }

  return {
    isValid: true,
    maxAmount: availableForCooldown,
  };
}

/**
 * Batch cooldown status check for multiple users
 */
export function batchCooldownStatus(
  cooldowns: Array<{
    user: string;
    startTime: number;
    endTime: number;
    amount: bigint;
  }>
): Map<string, CooldownStatus> {
  const results = new Map<string, CooldownStatus>();

  for (const cooldown of cooldowns) {
    results.set(
      cooldown.user,
      calculateCooldownStatus(cooldown.startTime, cooldown.endTime, cooldown.amount)
    );
  }

  return results;
}
