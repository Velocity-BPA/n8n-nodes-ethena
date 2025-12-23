/**
 * Cooldown Utilities Tests
 */

import {
  calculateCooldownStatus,
  formatDuration,
  calculateCooldownEndDate,
  isCooldownComplete,
  validateCooldownAmount,
  DEFAULT_COOLDOWN_DURATION,
} from '../nodes/Ethena/utils/cooldownUtils';

describe('Cooldown Utilities', () => {
  describe('calculateCooldownStatus', () => {
    it('should return inactive status for zero start time', () => {
      const status = calculateCooldownStatus(0, 0, BigInt(0));
      expect(status.isActive).toBe(false);
      expect(status.canWithdraw).toBe(false);
    });

    it('should calculate active cooldown status', () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 3600; // 1 hour ago
      const endTime = now + 3600; // 1 hour from now
      const amount = BigInt('1000000000000000000');

      const status = calculateCooldownStatus(startTime, endTime, amount, now);

      expect(status.isActive).toBe(true);
      expect(status.canWithdraw).toBe(false);
      expect(status.remainingSeconds).toBe(3600);
      expect(status.progress).toBe(50);
    });

    it('should indicate withdrawal ready when cooldown complete', () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 7200; // 2 hours ago
      const endTime = now - 3600; // 1 hour ago (completed)
      const amount = BigInt('1000000000000000000');

      const status = calculateCooldownStatus(startTime, endTime, amount, now);

      expect(status.isActive).toBe(true);
      expect(status.canWithdraw).toBe(true);
      expect(status.remainingSeconds).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format duration with days', () => {
      expect(formatDuration(86400 + 3600 + 60)).toBe('1d 1h 1m');
    });

    it('should format duration without days', () => {
      expect(formatDuration(3665)).toBe('1h 1m 5s');
    });

    it('should return "Ready" for zero or negative', () => {
      expect(formatDuration(0)).toBe('Ready');
      expect(formatDuration(-100)).toBe('Ready');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(7200 + 1800)).toBe('2h 30m');
    });
  });

  describe('calculateCooldownEndDate', () => {
    it('should calculate end date from start timestamp', () => {
      const startTimestamp = 1700000000;
      const endDate = calculateCooldownEndDate(startTimestamp);
      
      expect(endDate).toBeInstanceOf(Date);
      expect(endDate.getTime()).toBe((startTimestamp + DEFAULT_COOLDOWN_DURATION) * 1000);
    });

    it('should use custom duration', () => {
      const startTimestamp = 1700000000;
      const customDuration = 86400; // 1 day
      const endDate = calculateCooldownEndDate(startTimestamp, customDuration);
      
      expect(endDate.getTime()).toBe((startTimestamp + customDuration) * 1000);
    });
  });

  describe('isCooldownComplete', () => {
    it('should return true when cooldown has expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = now - 100; // 100 seconds ago
      expect(isCooldownComplete(endTime, now)).toBe(true);
    });

    it('should return false when cooldown is active', () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 100; // 100 seconds from now
      expect(isCooldownComplete(endTime, now)).toBe(false);
    });
  });

  describe('validateCooldownAmount', () => {
    it('should validate sufficient balance', () => {
      const result = validateCooldownAmount(
        BigInt('500'),
        BigInt('1000'),
        BigInt('0')
      );
      expect(result.isValid).toBe(true);
      expect(result.maxAmount).toBe(BigInt('1000'));
    });

    it('should reject zero amount', () => {
      const result = validateCooldownAmount(
        BigInt('0'),
        BigInt('1000'),
        BigInt('0')
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should reject amount exceeding available balance', () => {
      const result = validateCooldownAmount(
        BigInt('1500'),
        BigInt('1000'),
        BigInt('0')
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('should account for existing cooldown', () => {
      const result = validateCooldownAmount(
        BigInt('800'),
        BigInt('1000'),
        BigInt('500') // Already 500 in cooldown
      );
      expect(result.isValid).toBe(false);
      expect(result.maxAmount).toBe(BigInt('500'));
    });
  });

  describe('DEFAULT_COOLDOWN_DURATION', () => {
    it('should be 7 days in seconds', () => {
      expect(DEFAULT_COOLDOWN_DURATION).toBe(7 * 24 * 60 * 60);
    });
  });
});
