/**
 * Script to export the database schema and data to SQL file
 * Exports the complete database structure and optionally data
 */

import mysql from "mysql2/promise";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || "localhost",
  port: process.env.DATABASE_PORT || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "clubmanager_test",
};

// Export configuration
const EXPORT_CONFIG = {
  includeData: process.argv.includes("--with-data"),
  schemaOnly: process.argv.includes("--schema-only"),
  outputDir: path.join(__dirname, "..", "..", "db"),
  timestamp: new Date().toISOString().replace(/:/g, "-").split(".")[0],
};

async function exportDatabase() {
  let connection;

  try {
    console.log("🚀 Starting database export...\n");
    console.log("🔌 Connecting to database...");
    console.log(
      `   Database: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`,
    );

    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to database\n");

    // Get all tables
    console.log("📊 Fetching table list...");
    const [tables] = await connection.query(
      "SHOW TABLES FROM ??",
      DB_CONFIG.database,
    );

    const tableNames = tables.map(
      (row) => row[`Tables_in_${DB_CONFIG.database}`],
    );
    console.log(`   Found ${tableNames.length} tables\n`);

    // Build SQL export
    let sqlContent = [];

    // Header
    sqlContent.push("-- ============================================================================");
    sqlContent.push("-- ClubManager Database Export");
    sqlContent.push(`-- Database: ${DB_CONFIG.database}`);
    sqlContent.push(`-- Exported: ${new Date().toISOString()}`);
    sqlContent.push(`-- Tables: ${tableNames.length}`);
    sqlContent.push("-- ============================================================================\n");

    sqlContent.push("SET NAMES utf8mb4;");
    sqlContent.push("SET FOREIGN_KEY_CHECKS = 0;\n");

    // Export each table
    console.log("🔄 Exporting tables...\n");
    for (const tableName of tableNames) {
      console.log(`   📋 Exporting: ${tableName}`);

      // Get CREATE TABLE statement
      const [createResult] = await connection.query(
        `SHOW CREATE TABLE ??`,
        tableName,
      );
      const createStatement = createResult[0]["Create Table"] || createResult[0]["Create View"];

      sqlContent.push(`-- ============================================================================`);
      sqlContent.push(`-- Table: ${tableName}`);
      sqlContent.push(`-- ============================================================================\n`);
      sqlContent.push(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
      sqlContent.push(createStatement + ";\n");

      // Export data if requested
      if (EXPORT_CONFIG.includeData && !createResult[0]["Create View"]) {
        const [rows] = await connection.query(`SELECT * FROM ??`, tableName);

        if (rows.length > 0) {
          sqlContent.push(`-- Data for table: ${tableName}`);
          sqlContent.push(`-- Rows: ${rows.length}\n`);

          // Get column names
          const [columns] = await connection.query(
            `SHOW COLUMNS FROM ??`,
            tableName,
          );
          const columnNames = columns.map((col) => col.Field);

          // Build INSERT statements (batch by 100 rows)
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const values = batch.map((row) => {
              const rowValues = columnNames.map((col) => {
                const value = row[col];
                if (value === null) return "NULL";
                if (typeof value === "number") return value;
                if (value instanceof Date)
                  return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
                if (typeof value === "boolean") return value ? "1" : "0";
                if (Buffer.isBuffer(value))
                  return `0x${value.toString("hex")}`;
                // Escape strings
                return `'${String(value).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
              });
              return `(${rowValues.join(", ")})`;
            });

            sqlContent.push(
              `INSERT INTO \`${tableName}\` (\`${columnNames.join("`, `")}\`) VALUES`,
            );
            sqlContent.push(values.join(",\n") + ";\n");
          }
        }
      }

      sqlContent.push("");
    }

    sqlContent.push("SET FOREIGN_KEY_CHECKS = 1;\n");

    // Add summary at the end
    sqlContent.push("-- ============================================================================");
    sqlContent.push("-- Export Summary");
    sqlContent.push("-- ============================================================================");
    sqlContent.push(`-- Total tables exported: ${tableNames.length}`);
    sqlContent.push(`-- Export includes data: ${EXPORT_CONFIG.includeData ? "YES" : "NO"}`);
    sqlContent.push(`-- Export timestamp: ${new Date().toISOString()}`);
    sqlContent.push("-- ============================================================================");

    // Write to file
    const filename = EXPORT_CONFIG.includeData
      ? `clubmanager_full_${EXPORT_CONFIG.timestamp}.sql`
      : `clubmanager_schema_${EXPORT_CONFIG.timestamp}.sql`;

    const outputPath = path.join(EXPORT_CONFIG.outputDir, filename);

    console.log(`\n📝 Writing SQL export to file...`);
    console.log(`   Output: ${outputPath}`);

    await fs.writeFile(outputPath, sqlContent.join("\n"), "utf-8");

    const stats = await fs.stat(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   Lines: ${sqlContent.length.toLocaleString()}`);

    // Also create a latest symlink/copy
    const latestFilename = EXPORT_CONFIG.includeData
      ? "clubmanager_full_latest.sql"
      : "clubmanager_schema_latest.sql";
    const latestPath = path.join(EXPORT_CONFIG.outputDir, latestFilename);

    await fs.copyFile(outputPath, latestPath);
    console.log(`   Latest: ${latestFilename}`);

    // Create a README in the db folder
    const readmePath = path.join(EXPORT_CONFIG.outputDir, "README.md");
    const readmeContent = `# Database Exports

## Latest Export

- **Schema**: \`${latestFilename}\`
- **Exported**: ${new Date().toISOString()}
- **Tables**: ${tableNames.length}
- **Size**: ${fileSizeMB} MB

## Files

- \`clubmanager_schema_*.sql\` - Schema only exports (structure)
- \`clubmanager_full_*.sql\` - Full exports (structure + data)
- \`*_latest.sql\` - Latest export (always up-to-date)

## Usage

### Import schema only
\`\`\`bash
mysql -u root -p clubmanager_test < clubmanager_schema_latest.sql
\`\`\`

### Import full database
\`\`\`bash
mysql -u root -p clubmanager_test < clubmanager_full_latest.sql
\`\`\`

## Export Script

To create a new export:

\`\`\`bash
# Schema only
cd api
node scripts/export-db-schema.js

# With data
node scripts/export-db-schema.js --with-data
\`\`\`
`;

    await fs.writeFile(readmePath, readmeContent, "utf-8");

    console.log("\n🎉 Export completed successfully!");
    console.log("\n📊 Database Analysis:");
    console.log(`   Total tables: ${tableNames.length}`);
    console.log(`   Export type: ${EXPORT_CONFIG.includeData ? "Full (schema + data)" : "Schema only"}`);
    console.log(`   File size: ${fileSizeMB} MB`);

    // List some key tables
    console.log("\n📋 Key tables found:");
    const keyTables = [
      "users",
      "orders",
      "payments",
      "sports",
      "user_sports",
      "sessions",
      "audit_trail",
    ];

    for (const tableName of keyTables) {
      if (tableNames.includes(tableName)) {
        const [countResult] = await connection.query(
          `SELECT COUNT(*) as count FROM ??`,
          tableName,
        );
        console.log(
          `   ✅ ${tableName.padEnd(20)} - ${countResult[0].count.toLocaleString()} rows`,
        );
      }
    }
  } catch (error) {
    console.error("\n❌ Export failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run the export
exportDatabase().catch(console.error);
