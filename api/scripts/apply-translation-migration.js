/**
 * Script to apply the French to English translation migration
 * This script reads and executes the SQL migration file line by line
 */

import mysql from "mysql2/promise";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration (from .env or default values)
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || "localhost",
  port: process.env.DATABASE_PORT || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "clubmanager_test",
};

async function applyMigration() {
  let connection;

  try {
    console.log("🚀 Starting French to English translation migration...\n");
    console.log("🔌 Connecting to database...");
    console.log(
      `   Database: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`,
    );

    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to database\n");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "..",
      "prisma",
      "migrations",
      "20250220_translate_all_to_english",
      "migration.sql",
    );

    console.log("📖 Reading migration file...");
    const sqlContent = await fs.readFile(migrationPath, "utf-8");

    // Parse SQL more carefully
    const lines = sqlContent.split("\n");
    const statements = [];
    let currentStatement = "";

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("--")) {
        continue;
      }

      currentStatement += " " + trimmed;

      // Check if statement is complete (ends with semicolon)
      if (trimmed.endsWith(";")) {
        statements.push(currentStatement.trim().slice(0, -1)); // Remove the semicolon
        currentStatement = "";
      }
    }

    console.log(`   Found ${statements.length} SQL statements to execute\n`);

    console.log("🔄 Executing migration...");
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();

      if (!statement) continue;

      // Show progress
      const statementPreview = statement.substring(0, 80).replace(/\s+/g, " ");
      console.log(`   [${i + 1}/${statements.length}] ${statementPreview}...`);

      try {
        await connection.query(statement);
        successCount++;
      } catch (error) {
        // Some errors are acceptable (like DROP INDEX on non-existent index)
        if (
          error.code === "ER_CANT_DROP_FIELD_OR_KEY" ||
          error.code === "ER_DROP_INDEX_FK" ||
          error.message.includes("check that it exists") ||
          error.message.includes("check that column/key exists")
        ) {
          console.log(
            `      ⚠️  Warning (ignorable): ${error.message.substring(0, 60)}...`,
          );
        } else {
          console.error(`      ❌ Error: ${error.message.substring(0, 80)}...`);
          errors.push({
            statement: i + 1,
            error: error.message,
            sql: statementPreview,
          });
          errorCount++;
        }
      }
    }

    console.log("\n✅ Migration completed!");
    console.log(`   Successfully executed: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`   Errors encountered: ${errorCount} statements`);
    }

    // Display detailed errors if any
    if (errors.length > 0) {
      console.log("\n❌ Detailed errors:");
      errors.forEach((err) => {
        console.log(`   Statement #${err.statement}: ${err.sql}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    // Verify some of the changes
    console.log("\n🔍 Verifying changes...");

    const checks = [
      {
        table: "orders",
        column: "order_number",
        description: "orders.order_number",
      },
      {
        table: "orders",
        column: "order_date",
        description: "orders.order_date",
      },
      {
        table: "payments",
        column: "payment_date",
        description: "payments.payment_date",
      },
      {
        table: "payments",
        column: "subscription_id",
        description: "payments.subscription_id",
      },
      {
        table: "payments",
        column: "order_id",
        description: "payments.order_id",
      },
      {
        table: "payment_schedules",
        column: "due_date",
        description: "payment_schedules.due_date",
      },
    ];

    let verifyCount = 0;
    for (const check of checks) {
      try {
        const [columns] = await connection.query(
          "SHOW COLUMNS FROM ?? LIKE ?",
          [check.table, check.column],
        );

        if (columns.length > 0) {
          console.log(`   ✅ ${check.description} exists`);
          verifyCount++;
        } else {
          console.log(`   ❌ ${check.description} NOT FOUND`);
        }
      } catch (error) {
        console.log(
          `   ❌ Error checking ${check.description}:`,
          error.message,
        );
      }
    }

    console.log(`\n   Verified ${verifyCount}/${checks.length} columns`);

    if (verifyCount === checks.length && errorCount === 0) {
      console.log("\n🎉 Migration completed successfully!");
      console.log("\n📝 Next steps:");
      console.log("   1. Run: cd api && npx prisma db pull");
      console.log("   2. Run: npx prisma generate");
      console.log("   3. Update TypeScript types in packages/types");
    } else if (errorCount > 0) {
      console.log("\n⚠️  Migration completed with errors.");
      console.log(
        "   Please review the errors above and fix them manually if needed.",
      );
      process.exit(1);
    } else {
      console.log("\n⚠️  Migration completed but some columns were not found.");
      console.log("   Please verify the database schema manually.");
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run the migration
applyMigration().catch(console.error);
