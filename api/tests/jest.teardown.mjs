/**
 * Jest Global Teardown
 *
 * This file runs AFTER all test suites have completed.
 * It's responsible for cleaning up resources like database connections.
 */

export default async function globalTeardown() {
  console.log("🧹 Starting global teardown...");

  try {
    // Import MySQL connector to close the connection pool
    const { mysqlConnector } =
      await import("../src/db/connector/mysqlconnector.ts");

    if (mysqlConnector && mysqlConnector.pool) {
      console.log("🔌 Closing MySQL connection pool...");

      await new Promise((resolve, reject) => {
        mysqlConnector.pool.end((err) => {
          if (err) {
            console.warn("⚠️  Warning while closing MySQL pool:", err.message);
            // Don't reject - we still want tests to pass even if pool close fails
            resolve();
          } else {
            console.log("✅ MySQL connection pool closed successfully");
            resolve();
          }
        });
      });
    } else {
      console.log("ℹ️  No MySQL pool to close");
    }
  } catch (error) {
    console.warn("⚠️  Error during MySQL pool cleanup:", error.message);
    // Don't throw - we don't want to fail tests because of cleanup issues
  }

  // Give additional time for any remaining async operations
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("✅ Global teardown complete");
}
