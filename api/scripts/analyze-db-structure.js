/**
 * Script to analyze and document the complete database structure
 * Creates a detailed analysis of all tables, columns, indexes, and relationships
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

async function analyzeDatabase() {
  let connection;

  try {
    console.log("🚀 Starting database analysis...\n");
    console.log("🔌 Connecting to database...");
    console.log(
      `   Database: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`,
    );

    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to database\n");

    const analysis = {
      metadata: {
        database: DB_CONFIG.database,
        analyzedAt: new Date().toISOString(),
        server: `${DB_CONFIG.host}:${DB_CONFIG.port}`,
      },
      tables: [],
      views: [],
      summary: {
        totalTables: 0,
        totalViews: 0,
        totalColumns: 0,
        totalIndexes: 0,
        totalForeignKeys: 0,
      },
    };

    // Get all tables
    console.log("📊 Fetching tables and views...");
    const [tables] = await connection.query(
      "SHOW FULL TABLES FROM ??",
      DB_CONFIG.database,
    );

    const tablesList = [];
    const viewsList = [];

    for (const row of tables) {
      const tableName = row[`Tables_in_${DB_CONFIG.database}`];
      const tableType = row.Table_type;

      if (tableType === "VIEW") {
        viewsList.push(tableName);
      } else {
        tablesList.push(tableName);
      }
    }

    analysis.summary.totalTables = tablesList.length;
    analysis.summary.totalViews = viewsList.length;

    console.log(`   Found ${tablesList.length} tables`);
    console.log(`   Found ${viewsList.length} views\n`);

    // Analyze each table
    console.log("🔍 Analyzing tables...\n");
    for (const tableName of tablesList) {
      process.stdout.write(`   📋 ${tableName.padEnd(40)}`);

      const tableInfo = {
        name: tableName,
        columns: [],
        indexes: [],
        foreignKeys: [],
        rowCount: 0,
        engine: null,
        collation: null,
        autoIncrement: null,
      };

      // Get table status
      const [statusRows] = await connection.query(
        "SHOW TABLE STATUS WHERE Name = ?",
        [tableName],
      );
      if (statusRows.length > 0) {
        const status = statusRows[0];
        tableInfo.engine = status.Engine;
        tableInfo.collation = status.Collation;
        tableInfo.autoIncrement = status.Auto_increment;
        tableInfo.rowCount = status.Rows || 0;
      }

      // Get columns
      const [columns] = await connection.query(
        "SHOW FULL COLUMNS FROM ??",
        tableName,
      );

      for (const col of columns) {
        tableInfo.columns.push({
          name: col.Field,
          type: col.Type,
          nullable: col.Null === "YES",
          key: col.Key,
          default: col.Default,
          extra: col.Extra,
          comment: col.Comment || null,
        });
        analysis.summary.totalColumns++;
      }

      // Get indexes
      const [indexes] = await connection.query("SHOW INDEX FROM ??", tableName);

      const indexMap = new Map();
      for (const idx of indexes) {
        if (!indexMap.has(idx.Key_name)) {
          indexMap.set(idx.Key_name, {
            name: idx.Key_name,
            unique: idx.Non_unique === 0,
            type: idx.Index_type,
            columns: [],
          });
          analysis.summary.totalIndexes++;
        }
        indexMap.get(idx.Key_name).columns.push({
          name: idx.Column_name,
          sequence: idx.Seq_in_index,
        });
      }

      tableInfo.indexes = Array.from(indexMap.values());

      // Get foreign keys
      const [foreignKeys] = await connection.query(
        `
        SELECT
          kcu.CONSTRAINT_NAME,
          kcu.COLUMN_NAME,
          kcu.REFERENCED_TABLE_NAME,
          kcu.REFERENCED_COLUMN_NAME,
          rc.UPDATE_RULE,
          rc.DELETE_RULE
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
          ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
          AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
        WHERE kcu.TABLE_SCHEMA = ?
          AND kcu.TABLE_NAME = ?
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY kcu.ORDINAL_POSITION
        `,
        [DB_CONFIG.database, tableName],
      );

      for (const fk of foreignKeys) {
        tableInfo.foreignKeys.push({
          name: fk.CONSTRAINT_NAME,
          column: fk.COLUMN_NAME,
          referencedTable: fk.REFERENCED_TABLE_NAME,
          referencedColumn: fk.REFERENCED_COLUMN_NAME,
          onUpdate: fk.UPDATE_RULE,
          onDelete: fk.DELETE_RULE,
        });
        analysis.summary.totalForeignKeys++;
      }

      analysis.tables.push(tableInfo);
      console.log(
        `✅ (${tableInfo.columns.length} cols, ${tableInfo.rowCount} rows)`,
      );
    }

    // Analyze views
    if (viewsList.length > 0) {
      console.log("\n🔍 Analyzing views...\n");
      for (const viewName of viewsList) {
        process.stdout.write(`   👁️  ${viewName.padEnd(40)}`);

        const viewInfo = {
          name: viewName,
          columns: [],
        };

        // Get view columns
        const [columns] = await connection.query(
          "SHOW FULL COLUMNS FROM ??",
          viewName,
        );

        for (const col of columns) {
          viewInfo.columns.push({
            name: col.Field,
            type: col.Type,
          });
        }

        analysis.views.push(viewInfo);
        console.log(`✅ (${viewInfo.columns.length} cols)`);
      }
    }

    // Write JSON analysis
    const outputPath = path.join(
      __dirname,
      "..",
      "..",
      "db",
      "database-analysis.json",
    );

    console.log("\n📝 Writing analysis to JSON...");
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2), "utf-8");
    console.log(`   ✅ Saved: database-analysis.json`);

    // Create Markdown documentation
    const mdContent = generateMarkdownDoc(analysis);
    const mdPath = path.join(
      __dirname,
      "..",
      "..",
      "db",
      "DATABASE_STRUCTURE.md",
    );

    await fs.writeFile(mdPath, mdContent, "utf-8");
    console.log(`   ✅ Saved: DATABASE_STRUCTURE.md`);

    // Display summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 DATABASE ANALYSIS SUMMARY");
    console.log("=".repeat(60));
    console.log(`Database:        ${DB_CONFIG.database}`);
    console.log(`Total Tables:    ${analysis.summary.totalTables}`);
    console.log(`Total Views:     ${analysis.summary.totalViews}`);
    console.log(`Total Columns:   ${analysis.summary.totalColumns}`);
    console.log(`Total Indexes:   ${analysis.summary.totalIndexes}`);
    console.log(`Total FK:        ${analysis.summary.totalForeignKeys}`);
    console.log("=".repeat(60));

    // Display table categories
    console.log("\n📁 Table Categories:\n");

    const categories = categorizeTable(tablesList);
    for (const [category, tables] of Object.entries(categories)) {
      console.log(`   ${category.padEnd(30)} ${tables.length} tables`);
    }

    console.log("\n✅ Analysis completed successfully!");
  } catch (error) {
    console.error("\n❌ Analysis failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

function categorizeTable(tablesList) {
  const categories = {
    "🔐 Authentication & Security": [],
    "👥 Users & Profiles": [],
    "💰 Payments & Orders": [],
    "🏃 Sports & Activities": [],
    "📅 Events & Bookings": [],
    "📧 Communications": [],
    "📊 Analytics & Reports": [],
    "⚙️ System & Config": [],
    "🗄️ Archives": [],
    "📋 Other": [],
  };

  for (const table of tablesList) {
    if (
      table.includes("login") ||
      table.includes("auth") ||
      table.includes("session") ||
      table.includes("password") ||
      table.includes("security") ||
      table.includes("token")
    ) {
      categories["🔐 Authentication & Security"].push(table);
    } else if (
      table.includes("user") ||
      table.includes("profile") ||
      table.includes("role")
    ) {
      categories["👥 Users & Profiles"].push(table);
    } else if (
      table.includes("payment") ||
      table.includes("order") ||
      table.includes("pricing")
    ) {
      categories["💰 Payments & Orders"].push(table);
    } else if (
      table.includes("sport") ||
      table.includes("course") ||
      table.includes("enrollment") ||
      table.includes("grade") ||
      table.includes("belt")
    ) {
      categories["🏃 Sports & Activities"].push(table);
    } else if (
      table.includes("event") ||
      table.includes("booking") ||
      table.includes("venue")
    ) {
      categories["📅 Events & Bookings"].push(table);
    } else if (
      table.includes("email") ||
      table.includes("message") ||
      table.includes("notification") ||
      table.includes("campaign")
    ) {
      categories["📧 Communications"].push(table);
    } else if (
      table.includes("stat") ||
      table.includes("analytics") ||
      table.includes("tracking") ||
      table.includes("audit")
    ) {
      categories["📊 Analytics & Reports"].push(table);
    } else if (table.includes("archive")) {
      categories["🗄️ Archives"].push(table);
    } else if (
      table.includes("config") ||
      table.includes("setting") ||
      table.includes("rate_limit") ||
      table.includes("api_key")
    ) {
      categories["⚙️ System & Config"].push(table);
    } else {
      categories["📋 Other"].push(table);
    }
  }

  return categories;
}

function generateMarkdownDoc(analysis) {
  let md = [];

  md.push("# ClubManager Database Structure");
  md.push("");
  md.push(`**Database:** ${analysis.metadata.database}`);
  md.push(`**Analyzed:** ${analysis.metadata.analyzedAt}`);
  md.push(`**Server:** ${analysis.metadata.server}`);
  md.push("");
  md.push("---");
  md.push("");
  md.push("## 📊 Summary");
  md.push("");
  md.push(`- **Total Tables:** ${analysis.summary.totalTables}`);
  md.push(`- **Total Views:** ${analysis.summary.totalViews}`);
  md.push(`- **Total Columns:** ${analysis.summary.totalColumns}`);
  md.push(`- **Total Indexes:** ${analysis.summary.totalIndexes}`);
  md.push(`- **Total Foreign Keys:** ${analysis.summary.totalForeignKeys}`);
  md.push("");
  md.push("---");
  md.push("");
  md.push("## 📋 Tables");
  md.push("");

  for (const table of analysis.tables) {
    md.push(`### ${table.name}`);
    md.push("");
    md.push(`- **Engine:** ${table.engine}`);
    md.push(`- **Rows:** ${table.rowCount.toLocaleString()}`);
    md.push(`- **Columns:** ${table.columns.length}`);
    md.push(`- **Indexes:** ${table.indexes.length}`);
    md.push(`- **Foreign Keys:** ${table.foreignKeys.length}`);
    md.push("");

    // Columns
    md.push("#### Columns");
    md.push("");
    md.push("| Name | Type | Nullable | Key | Default | Extra |");
    md.push("|------|------|----------|-----|---------|-------|");

    for (const col of table.columns) {
      const nullable = col.nullable ? "✅" : "❌";
      const key = col.key || "-";
      const def = col.default === null ? "NULL" : col.default || "-";
      const extra = col.extra || "-";

      md.push(
        `| \`${col.name}\` | ${col.type} | ${nullable} | ${key} | ${def} | ${extra} |`,
      );
    }

    md.push("");

    // Indexes
    if (table.indexes.length > 0) {
      md.push("#### Indexes");
      md.push("");
      md.push("| Name | Type | Unique | Columns |");
      md.push("|------|------|--------|---------|");

      for (const idx of table.indexes) {
        const unique = idx.unique ? "✅" : "❌";
        const cols = idx.columns.map((c) => c.name).join(", ");
        md.push(`| \`${idx.name}\` | ${idx.type} | ${unique} | ${cols} |`);
      }

      md.push("");
    }

    // Foreign Keys
    if (table.foreignKeys.length > 0) {
      md.push("#### Foreign Keys");
      md.push("");
      md.push("| Name | Column | References | On Update | On Delete |");
      md.push("|------|--------|------------|-----------|-----------|");

      for (const fk of table.foreignKeys) {
        md.push(
          `| \`${fk.name}\` | \`${fk.column}\` | \`${fk.referencedTable}.${fk.referencedColumn}\` | ${fk.onUpdate} | ${fk.onDelete} |`,
        );
      }

      md.push("");
    }

    md.push("---");
    md.push("");
  }

  // Views
  if (analysis.views.length > 0) {
    md.push("## 👁️ Views");
    md.push("");

    for (const view of analysis.views) {
      md.push(`### ${view.name}`);
      md.push("");
      md.push("| Column | Type |");
      md.push("|--------|------|");

      for (const col of view.columns) {
        md.push(`| \`${col.name}\` | ${col.type} |`);
      }

      md.push("");
      md.push("---");
      md.push("");
    }
  }

  return md.join("\n");
}

// Run the analysis
analyzeDatabase().catch(console.error);
