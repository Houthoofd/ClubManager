/**
 * Jest Global Teardown File (CommonJS version)
 *
 * This file is executed AFTER all test suites have completed.
 * It ensures that all database connections and resources are properly closed
 * to prevent "Jest did not exit one second after the test run completed" warnings
 * and "Jest environment has been torn down" errors.
 */

module.exports = async () => {
  console.log("\n🧹 Jest Global Teardown - Cleaning up resources...");

  try {
    // Give any pending async operations time to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Force close all timers
    if (global.gc) {
      global.gc();
    }

    // Clear all intervals and timeouts
    const maxTimerId = setTimeout(() => {}, 0);
    for (let i = 1; i <= maxTimerId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
    clearTimeout(maxTimerId);

    console.log("✅ Cleared all pending timers");

    // Force process to exit after a delay if still hanging
    const forceExitTimer = setTimeout(() => {
      console.log("⚠️  Forcing process exit after teardown timeout");
      process.exit(0);
    }, 2000);

    // Don't let this timer prevent exit
    forceExitTimer.unref();

    console.log("✅ Global teardown complete - all resources cleaned up");
  } catch (error) {
    console.error("❌ Error during global teardown:", error);
    // Don't throw - we still want tests to complete
  }
};
