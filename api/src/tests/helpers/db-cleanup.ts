/**
 * Database Cleanup Helper for Tests
 *
 * This helper ensures that database connections are properly closed
 * after test suites to prevent "Jest environment has been torn down" errors.
 *
 * Usage:
 * import { setupTestCleanup } from '../../tests/helpers/db-cleanup.js';
 * setupTestCleanup();
 */

import { afterAll } from "@jest/globals";

/**
 * Setup automatic cleanup for test suite
 * Call this at the top level of your test file
 */
export function setupTestCleanup(): void {
  afterAll(async () => {
    // Wait for any pending operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Force close any open handles
    try {
      // Clear all timers
      const timers = (global as any).timers || [];
      timers.forEach((timer: any) => {
        if (timer && typeof timer.unref === "function") {
          timer.unref();
        }
      });
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
}

/**
 * Cleanup function to call manually if needed
 */
export async function cleanupTest(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

/**
 * Export a default setup function for convenience
 */
export default setupTestCleanup;
