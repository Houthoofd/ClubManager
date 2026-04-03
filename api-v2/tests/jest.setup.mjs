/**
 * Jest Setup File
 *
 * This file is loaded BEFORE any test files are executed.
 * It ensures that the .env.test environment variables are loaded
 * before any modules (especially Prisma client) are imported.
 *
 * This is critical because:
 * - Prisma client instantiates and connects when first imported
 * - It reads DATABASE_URL from process.env at that moment
 * - If .env.test isn't loaded first, Prisma connects to the wrong database
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to .env.test file
const envTestPath = path.resolve(__dirname, "../.env.test");

// Check if .env.test exists
if (!fs.existsSync(envTestPath)) {
  console.warn("⚠️  Warning: .env.test file not found at:", envTestPath);
  console.warn("⚠️  Tests may fail if DATABASE_URL is not set correctly.");
} else {
  // Load .env.test with override: true to ensure test values take precedence
  const result = dotenv.config({
    path: envTestPath,
    override: true,
  });

  if (result.error) {
    console.error("❌ Error loading .env.test:", result.error);
    throw result.error;
  }

  console.log("✅ Loaded .env.test environment variables");

  // Verify critical test environment variables
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set after loading .env.test");
    throw new Error("DATABASE_URL must be set in .env.test");
  }

  // Log database connection info (without password)
  const dbUrl = process.env.DATABASE_URL;
  const sanitizedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
  console.log("🔗 Database URL:", sanitizedUrl);

  // Set NODE_ENV to test if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "test";
  }

  console.log("🧪 NODE_ENV:", process.env.NODE_ENV);
}

console.log("⚙️  Jest setup complete - ready to run tests");
