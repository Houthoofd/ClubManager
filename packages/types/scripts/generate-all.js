#!/usr/bin/env node

/**
 * 🚀 ClubManager - Unified Type Generator
 *
 * Generates TypeScript types, Zod validators, GraphQL schemas, and tests
 * from the SQL database schema.
 *
 * Features:
 * - ✅ Automatic type generation from SQL
 * - ✅ Zod validators with proper schemas
 * - ✅ GraphQL type definitions
 * - ✅ Automatic test generation
 * - ✅ Fixed: DEFAULT values handled correctly in Insert types
 * - ✅ Fixed: Comment escaping
 * - ✅ Domain-based organization
 *
 * Usage:
 *   node scripts/generate-all.js
 *   node scripts/generate-all.js --domain users
 *   node scripts/generate-all.js --table users
 *   node scripts/generate-all.js --watch
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const DOMAIN_MAP = {
  users: [
    "genders",
    "users",
    "user_profiles",
    "user_security",
    "password_reset_tokens",
    "account_deletion_requests",
  ],
  activities: [
    "activity_categories",
    "activities",
    "activity_levels",
    "user_activities",
  ],
  sessions: ["instructors", "session_types", "sessions", "session_enrollments"],
  memberships: ["membership_plans", "memberships", "payments"],
  shop: ["product_categories", "products", "orders", "order_items"],
  communications: [
    "messages",
    "announcements",
    "notifications",
    "email_logs",
    "email_templates",
    "alerts",
  ],
  events: ["event_types", "events", "event_registrations"],
  documents: ["documents"],
  gdpr: ["user_consents"],
  settings: ["settings"],
  statistics: [
    "attendance_stats",
    "financial_stats",
    "activity_stats",
    "club_stats",
  ],
  audit: ["audit_logs"],
};

const TYPE_MAP = {
  int: "number",
  bigint: "number",
  tinyint: "number",
  smallint: "number",
  mediumint: "number",
  integer: "number",
  float: "number",
  double: "number",
  decimal: "number",
  numeric: "number",
  varchar: "string",
  char: "string",
  text: "string",
  mediumtext: "string",
  longtext: "string",
  tinytext: "string",
  date: "string",
  datetime: "string",
  timestamp: "string",
  time: "string",
  year: "number",
  json: "Record<string, any>",
  boolean: "boolean",
  blob: "Buffer",
  binary: "Buffer",
  varbinary: "Buffer",
};

// ============================================================================
// SQL PARSING
// ============================================================================

/**
 * Parse SQL CREATE TABLE statement
 */
function parseCreateTable(sql) {
  const tableMatch = sql.match(
    /CREATE TABLE [`']?(\w+)[`']?\s*\(([\s\S]+?)\)\s*ENGINE/i,
  );
  if (!tableMatch) return null;

  const tableName = tableMatch[1];
  const columnsDef = tableMatch[2];

  // Extract comment from table (search after ENGINE to get table comment, not column comment)
  const tableCommentMatch = sql.match(
    /ENGINE=\w+[^;]*COMMENT\s*=?\s*['"](.+?)(?<!\\)['"]/i,
  );
  const tableComment = tableCommentMatch
    ? tableCommentMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"')
    : "";

  // Parse columns
  const columns = [];
  const lines = columnsDef.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip constraints, keys, etc.
    if (
      trimmed.startsWith("PRIMARY KEY") ||
      trimmed.startsWith("UNIQUE KEY") ||
      trimmed.startsWith("KEY") ||
      trimmed.startsWith("CONSTRAINT") ||
      trimmed.startsWith("FOREIGN KEY") ||
      trimmed.startsWith("FULLTEXT KEY") ||
      trimmed.startsWith("CHECK") ||
      !trimmed
    ) {
      continue;
    }

    // Parse column definition
    const colMatch = trimmed.match(/^[`']?(\w+)[`']?\s+(\w+)(\([^)]+\))?/);
    if (!colMatch) continue;

    const columnName = colMatch[1];
    const sqlType = colMatch[2].toLowerCase();

    // Check for ENUM
    const enumMatch = trimmed.match(/enum\((.*?)\)/i);
    let enumValues = null;
    if (enumMatch) {
      enumValues = enumMatch[1]
        .split(",")
        .map((v) => v.trim().replace(/['"]/g, ""));
    }

    // Check if nullable
    const notNull = /NOT NULL/i.test(trimmed);
    const nullable = !notNull && !/PRIMARY KEY/i.test(trimmed);

    // Extract comment (FIX: proper escaping)
    // Match COMMENT 'text' or COMMENT "text", handling escaped quotes inside
    const colCommentMatch = trimmed.match(/COMMENT\s+['"](.+?)(?<!\\)['"]/);
    let comment = colCommentMatch ? colCommentMatch[1] : "";
    // Fix escaped characters
    comment = comment
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    // Check for default value (FIX: better detection)
    const defaultMatch = trimmed.match(
      /DEFAULT\s+([^,\s]+|'[^']*'|"[^"]*"|CURRENT_TIMESTAMP|NULL)/i,
    );
    let defaultValue = null;
    let hasDefault = false;

    if (defaultMatch) {
      hasDefault = true;
      const rawDefault = defaultMatch[1].replace(/['"]/g, "");
      if (rawDefault === "NULL") {
        defaultValue = null;
      } else if (rawDefault === "CURRENT_TIMESTAMP") {
        defaultValue = "CURRENT_TIMESTAMP";
      } else {
        defaultValue = rawDefault;
      }
    }

    // Check for AUTO_INCREMENT
    const isAutoIncrement = /AUTO_INCREMENT/i.test(trimmed);

    // Check if it's an ON UPDATE CURRENT_TIMESTAMP field
    const hasOnUpdate = /ON UPDATE CURRENT_TIMESTAMP/i.test(trimmed);

    columns.push({
      name: columnName,
      sqlType,
      enumValues,
      nullable,
      comment,
      defaultValue,
      hasDefault,
      isAutoIncrement,
      hasOnUpdate,
    });
  }

  return {
    name: tableName,
    comment: tableComment,
    columns,
  };
}

/**
 * Convert SQL type to TypeScript type
 */
function sqlTypeToTS(column) {
  if (column.enumValues) {
    return column.enumValues.map((v) => `'${v}'`).join(" | ");
  }

  const baseType = TYPE_MAP[column.sqlType] || "any";

  // Handle tinyint(1) as boolean
  if (column.sqlType === "tinyint") {
    return "boolean";
  }

  return baseType;
}

/**
 * Convert SQL type to Zod schema
 */
function sqlTypeToZod(column) {
  if (column.enumValues) {
    const values = column.enumValues.map((v) => `"${v}"`).join(", ");
    return `z.enum([${values}])`;
  }

  let zodType;
  switch (column.sqlType) {
    case "int":
    case "bigint":
    case "smallint":
    case "mediumint":
    case "integer":
    case "float":
    case "double":
    case "decimal":
    case "numeric":
    case "year":
      zodType = "z.number()";
      break;
    case "varchar":
    case "char":
    case "text":
    case "mediumtext":
    case "longtext":
    case "tinytext":
    case "date":
    case "datetime":
    case "timestamp":
    case "time":
      zodType = "z.string()";
      break;
    case "tinyint":
      zodType = "z.boolean()";
      break;
    case "json":
      zodType = "z.record(z.any())";
      break;
    case "blob":
    case "binary":
    case "varbinary":
      zodType = "z.instanceof(Buffer)";
      break;
    default:
      zodType = "z.any()";
  }

  return zodType;
}

/**
 * Convert SQL type to GraphQL type
 */
function sqlTypeToGraphQL(column) {
  if (column.enumValues) {
    return "String"; // Enums will be defined separately
  }

  switch (column.sqlType) {
    case "int":
    case "bigint":
    case "smallint":
    case "mediumint":
    case "integer":
    case "year":
      return "Int";
    case "float":
    case "double":
    case "decimal":
    case "numeric":
      return "Float";
    case "tinyint":
      return "Boolean";
    default:
      return "String";
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function toPascalCase(str) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ============================================================================
// CODE GENERATORS
// ============================================================================

/**
 * Generate TypeScript interfaces
 */
function generateInterface(table) {
  const typeName = toPascalCase(table.name);
  let code = "";

  if (table.comment) {
    code += `/**\n * ${table.comment}\n */\n`;
  }

  // Main interface
  code += `export interface ${typeName} {\n`;
  for (const col of table.columns) {
    if (col.comment) {
      code += `  /** ${col.comment} */\n`;
    }
    const tsType = sqlTypeToTS(col);
    const optional = col.nullable ? "?" : "";
    code += `  ${col.name}${optional}: ${tsType};\n`;
  }
  code += "}\n\n";

  // Insert type - FIX: exclude auto-increment, timestamps, and fields with defaults
  const insertFields = table.columns.filter((col) => {
    // Exclude auto-increment fields
    if (col.isAutoIncrement) return false;
    // Exclude created_at and updated_at
    if (col.name === "created_at" || col.name === "updated_at") return false;
    // Include all other fields
    return true;
  });

  if (insertFields.length > 0) {
    code += `export interface ${typeName}Insert {\n`;
    for (const col of insertFields) {
      if (col.comment) {
        code += `  /** ${col.comment} */\n`;
      }
      const tsType = sqlTypeToTS(col);
      // FIX: Make optional if nullable OR has default value
      const optional = col.nullable || col.hasDefault ? "?" : "";
      code += `  ${col.name}${optional}: ${tsType};\n`;
    }
    code += "}\n\n";
  }

  // Update type (all fields optional except id)
  code += `export interface ${typeName}Update {\n`;
  for (const col of table.columns) {
    if (col.name === "id") continue;
    if (col.comment) {
      code += `  /** ${col.comment} */\n`;
    }
    const tsType = sqlTypeToTS(col);
    code += `  ${col.name}?: ${tsType};\n`;
  }
  code += "}\n\n";

  return code;
}

/**
 * Generate GraphQL schema
 */
function generateGraphQL(tables) {
  let code = `import { gql } from 'graphql-tag';\n\n`;
  code += `export const typeDefs = gql\`\n`;

  for (const table of tables) {
    const typeName = toPascalCase(table.name);

    code += `  # ${table.comment || table.name}\n`;
    code += `  type ${typeName} {\n`;

    for (const col of table.columns) {
      const gqlType = sqlTypeToGraphQL(col);
      const required = !col.nullable && !col.hasDefault ? "!" : "";
      const comment = col.comment ? ` # ${col.comment}` : "";
      code += `    ${col.name}: ${gqlType}${required}${comment}\n`;
    }

    code += `  }\n\n`;
  }

  code += `\`;\n`;
  return code;
}

/**
 * Generate Zod validators
 */
function generateValidators(table) {
  const typeName = toPascalCase(table.name);
  const schemaName = `${toCamelCase(table.name)}Schema`;

  let code = "";

  // Base schema
  code += `/**\n * ${table.comment || table.name}\n */\n`;
  code += `export const ${schemaName} = z.object({\n`;

  for (const col of table.columns) {
    let zodType = sqlTypeToZod(col);

    // Add optional/nullable
    if (col.nullable) {
      zodType += ".nullable()";
    }
    if (col.nullable || col.hasDefault) {
      zodType += ".optional()";
    }

    const comment = col.comment ? ` // ${col.comment}` : "";
    code += `  ${col.name}: ${zodType},${comment}\n`;
  }

  code += `});\n\n`;

  // Create schema - omit auto fields and fields with defaults
  const omitFields = [];
  if (table.columns.some((c) => c.name === "id" && c.isAutoIncrement)) {
    omitFields.push("id");
  }
  if (table.columns.some((c) => c.name === "created_at")) {
    omitFields.push("created_at");
  }
  if (table.columns.some((c) => c.name === "updated_at")) {
    omitFields.push("updated_at");
  }

  if (omitFields.length > 0) {
    const omitObj = `{ ${omitFields.map((f) => `${f}: true`).join(", ")} }`;
    code += `export const ${toCamelCase(table.name)}CreateSchema = ${schemaName}.omit(${omitObj});\n\n`;
  } else {
    code += `export const ${toCamelCase(table.name)}CreateSchema = ${schemaName};\n\n`;
  }

  // Update schema - partial
  code += `export const ${toCamelCase(table.name)}UpdateSchema = ${schemaName}.partial().omit({ id: true });\n\n`;

  return code;
}

/**
 * Generate domain index file
 */
function generateDomainIndex(domain, tables) {
  let code = `/**\n * ${domain.charAt(0).toUpperCase() + domain.slice(1)} Domain\n */\n\n`;
  code += `export * from './${domain}.types.js';\n`;
  code += `export * from './${domain}.validators.js';\n`;
  code += `export * from './${domain}.graphql.js';\n`;
  return code;
}

/**
 * Generate tests
 */
function generateTests(table) {
  const typeName = toPascalCase(table.name);
  const schemaName = `${toCamelCase(table.name)}Schema`;
  const createSchemaName = `${toCamelCase(table.name)}CreateSchema`;

  let code = `import { describe, it, expect } from '@jest/globals';\n`;
  // Find the domain for this table
  let domainName = "unknown";
  for (const [domain, tables] of Object.entries(DOMAIN_MAP)) {
    if (tables.includes(table.name)) {
      domainName = domain;
      break;
    }
  }
  code += `import { ${schemaName}, ${createSchemaName} } from '../${domainName}.validators.js';\n\n`;

  code += `describe('${typeName} Validators', () => {\n`;

  // Test base schema
  code += `  describe('${schemaName}', () => {\n`;
  code += `    it('should validate a valid ${table.name}', () => {\n`;
  code += `      const valid${typeName} = {\n`;

  for (const col of table.columns) {
    const tsType = sqlTypeToTS(col);
    let exampleValue;

    if (col.enumValues) {
      exampleValue = `'${col.enumValues[0]}'`;
    } else if (tsType === "number") {
      exampleValue = col.name === "id" ? "1" : "0";
    } else if (tsType === "boolean") {
      exampleValue = col.defaultValue === "1" ? "true" : "false";
    } else if (tsType === "string") {
      if (col.name.includes("email")) {
        exampleValue = "'test@example.com'";
      } else if (col.name.includes("url")) {
        exampleValue = "'https://example.com'";
      } else if (col.name.includes("date") || col.name.includes("_at")) {
        exampleValue = "'2024-01-01T00:00:00Z'";
      } else if (col.name.includes("time")) {
        exampleValue = "'12:00:00'";
      } else {
        exampleValue = `'test ${col.name}'`;
      }
    } else if (tsType === "Record<string, any>") {
      exampleValue = "{}";
    } else {
      exampleValue = "null";
    }

    if (!col.nullable && !col.hasDefault) {
      code += `        ${col.name}: ${exampleValue},\n`;
    }
  }

  code += `      };\n\n`;
  code += `      const result = ${schemaName}.safeParse(valid${typeName});\n`;
  code += `      expect(result.success).toBe(true);\n`;
  code += `    });\n`;

  // Test required fields
  const requiredFields = table.columns.filter(
    (c) => !c.nullable && !c.hasDefault && !c.isAutoIncrement,
  );

  if (requiredFields.length > 0) {
    code += `\n    it('should fail without required fields', () => {\n`;
    code += `      const result = ${schemaName}.safeParse({});\n`;
    code += `      expect(result.success).toBe(false);\n`;
    code += `    });\n`;
  }

  code += `  });\n\n`;

  // Test create schema
  code += `  describe('${createSchemaName}', () => {\n`;
  code += `    it('should validate a valid create input', () => {\n`;
  code += `      const validCreate = {\n`;

  const createFields = table.columns.filter(
    (c) =>
      !c.isAutoIncrement &&
      c.name !== "created_at" &&
      c.name !== "updated_at" &&
      !c.nullable &&
      !c.hasDefault,
  );

  for (const col of createFields) {
    const tsType = sqlTypeToTS(col);
    let exampleValue;

    if (col.enumValues) {
      exampleValue = `'${col.enumValues[0]}'`;
    } else if (tsType === "number") {
      exampleValue = "1";
    } else if (tsType === "boolean") {
      exampleValue = "true";
    } else if (tsType === "string") {
      if (col.name.includes("email")) {
        exampleValue = "'test@example.com'";
      } else {
        exampleValue = `'test ${col.name}'`;
      }
    } else if (tsType === "Record<string, any>") {
      exampleValue = "{}";
    } else {
      exampleValue = "null";
    }

    code += `        ${col.name}: ${exampleValue},\n`;
  }

  code += `      };\n\n`;
  code += `      const result = ${createSchemaName}.safeParse(validCreate);\n`;
  code += `      expect(result.success).toBe(true);\n`;
  code += `    });\n`;
  code += `  });\n`;
  code += `});\n`;

  return code;
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

async function generateAll(options = {}) {
  console.log("🚀 ClubManager Type Generator\n");

  // Read SQL schema
  const sqlPath = path.join(
    __dirname,
    "../../../db/schema/clubmanager_simplified.sql",
  );

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL schema not found: ${sqlPath}`);
    process.exit(1);
  }

  console.log(`📖 Reading schema: ${sqlPath}`);
  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  // Extract all CREATE TABLE statements
  const createTableRegex = /CREATE TABLE.*?ENGINE=\w+/gis;
  const createStatements = sqlContent.match(createTableRegex) || [];

  console.log(`📊 Found ${createStatements.length} tables\n`);

  // Parse all tables
  const tables = [];
  for (const sql of createStatements) {
    const table = parseCreateTable(sql);
    if (table) {
      tables.push(table);
    }
  }

  // Group tables by domain
  const domainTables = {};
  for (const [domain, tableNames] of Object.entries(DOMAIN_MAP)) {
    domainTables[domain] = tables.filter((t) => tableNames.includes(t.name));
  }

  // Filter if specific domain/table requested
  if (options.domain) {
    const filtered = {};
    filtered[options.domain] = domainTables[options.domain];
    Object.keys(domainTables).forEach((key) => {
      if (key !== options.domain) delete domainTables[key];
    });
  }

  if (options.table) {
    const filtered = {};
    for (const [domain, dtables] of Object.entries(domainTables)) {
      const filteredTables = dtables.filter((t) => t.name === options.table);
      if (filteredTables.length > 0) {
        filtered[domain] = filteredTables;
      }
    }
    Object.assign(domainTables, filtered);
  }

  // Generate files for each domain
  const domainsDir = path.join(__dirname, "../src/domains");

  // Clean old generated files (optional)
  if (options.clean && fs.existsSync(domainsDir)) {
    console.log("🧹 Cleaning old generated files...\n");
    for (const domain of Object.keys(domainTables)) {
      const domainPath = path.join(domainsDir, domain);
      if (fs.existsSync(domainPath)) {
        fs.rmSync(domainPath, { recursive: true, force: true });
      }
    }
  }

  for (const [domain, dtables] of Object.entries(domainTables)) {
    if (dtables.length === 0) continue;

    console.log(`📁 Domain: ${domain} (${dtables.length} tables)`);

    const domainDir = path.join(domainsDir, domain);
    fs.mkdirSync(domainDir, { recursive: true });

    // Generate database types
    let typesContent = `/**\n * Generated TypeScript types for ${domain} domain\n * @generated - Do not edit manually\n */\n\n`;
    for (const table of dtables) {
      typesContent += generateInterface(table);
    }
    fs.writeFileSync(path.join(domainDir, `${domain}.types.ts`), typesContent);
    console.log(`  ✅ ${domain}.types.ts`);

    // Generate GraphQL schema
    const graphqlContent = generateGraphQL(dtables);
    fs.writeFileSync(
      path.join(domainDir, `${domain}.graphql.ts`),
      graphqlContent,
    );
    console.log(`  ✅ ${domain}.graphql.ts`);

    // Generate validators (single import for all tables in domain)
    let validatorsContent = `import { z } from 'zod';\n\n`;
    for (const table of dtables) {
      validatorsContent += generateValidators(table);
      validatorsContent += "\n";
    }
    fs.writeFileSync(
      path.join(domainDir, `${domain}.validators.ts`),
      validatorsContent,
    );
    console.log(`  ✅ ${domain}.validators.ts`);

    // Generate domain index
    const indexContent = generateDomainIndex(domain, dtables);
    fs.writeFileSync(path.join(domainDir, "index.ts"), indexContent);
    console.log(`  ✅ index.ts`);

    // Generate tests
    const testsDir = path.join(domainDir, "__tests__");
    fs.mkdirSync(testsDir, { recursive: true });

    for (const table of dtables) {
      const testsContent = generateTests(table);
      fs.writeFileSync(
        path.join(testsDir, `${table.name}.test.ts`),
        testsContent,
      );
    }
    console.log(`  ✅ __tests__/ (${dtables.length} test files)`);

    console.log("");
  }

  // Generate domains index
  let domainsIndexContent = `/**\n * Domain exports\n */\n\n`;
  for (const domain of Object.keys(domainTables)) {
    domainsIndexContent += `export * as ${toCamelCase(domain)} from './${domain}/index.js';\n`;
  }
  fs.writeFileSync(path.join(domainsDir, "index.ts"), domainsIndexContent);

  // Generate main index
  const mainIndexContent = `/**\n * @clubmanager/types\n * Auto-generated database types\n */\n\nexport * from './domains/index.js';\n`;
  fs.writeFileSync(path.join(__dirname, "../src/index.ts"), mainIndexContent);

  console.log("✨ Generation complete!\n");
  console.log(
    `📦 Generated files for ${Object.keys(domainTables).length} domains`,
  );
  console.log(`📊 Total tables processed: ${tables.length}`);
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--domain" && args[i + 1]) {
    options.domain = args[++i];
  } else if (args[i] === "--table" && args[i + 1]) {
    options.table = args[++i];
  } else if (args[i] === "--clean") {
    options.clean = true;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
🚀 ClubManager Type Generator

Usage:
  node scripts/generate-all.js [options]

Options:
  --domain <name>   Generate only for specific domain
  --table <name>    Generate only for specific table
  --clean           Clean old files before generation
  --help, -h        Show this help

Examples:
  node scripts/generate-all.js
  node scripts/generate-all.js --domain users
  node scripts/generate-all.js --table users --clean
`);
    process.exit(0);
  }
}

generateAll(options).catch(console.error);
