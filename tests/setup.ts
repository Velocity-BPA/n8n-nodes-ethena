/**
 * Jest Test Setup
 *
 * Configures the test environment for n8n-nodes-ethena
 */

// Set test timeout
jest.setTimeout(30000);

// Mock console.error to reduce noise during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.testAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
global.testPrivateKey = '0x0000000000000000000000000000000000000000000000000000000000000001';

declare global {
  var testAddress: string;
  var testPrivateKey: string;
}
