#!/usr/bin/env node

/**
 * Generate TypeScript types from SQL schema
 * Organizes tables into logical domains with English names
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Domain organization - maps tables to logical domains
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

// SQL type to TypeScript type mapping
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

  // Extract comment from table
  const commentMatch = sql.match(/COMMENT\s*=?\s*['"](.*?)['"]/i);
  const tableComment = commentMatch ? commentMatch[1] : "";

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

    // Extract comment
    const colCommentMatch = trimmed.match(/COMMENT\s+['"](.*?)['"]/);
    const comment = colCommentMatch ? colCommentMatch[1] : "";

    // Check for default value
    const defaultMatch = trimmed.match(/DEFAULT\s+([^,\s]+|'[^']*'|"[^"]*")/i);
    let defaultValue = defaultMatch
      ? defaultMatch[1].replace(/['"]/g, "")
      : null;
    if (defaultValue === "NULL") defaultValue = null;

    columns.push({
      name: columnName,
      sqlType,
      enumValues,
      nullable,
      comment,
      defaultValue,
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
 * Convert table name to PascalCase type name
 */
function toPascalCase(str) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Convert table name to camelCase
 */
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Generate TypeScript interface for a table
 */
function generateInterface(table) {
  const typeName = toPascalCase(table.name);
  let code = "";

  if (table.comment) {
    code += `/**\n * ${table.comment}\n */\n`;
  }

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

  // Generate Insert type (without auto-increment id and timestamps)
  const insertFields = table.columns.filter(
    (col) =>
      col.name !== "id" &&
      !col.name.includes("_at") &&
      col.defaultValue === null,
  );

  if (insertFields.length > 0) {
    code += `export interface ${typeName}Insert {\n`;
    for (const col of insertFields) {
      const tsType = sqlTypeToTS(col);
      const optional = col.nullable ? "?" : "";
      code += `  ${col.name}${optional}: ${tsType};\n`;
    }
    code += "}\n\n";
  }

  // Generate Update type (all fields optional except id)
  code += `export interface ${typeName}Update {\n`;
  for (const col of table.columns) {
    if (col.name === "id") continue;
    const tsType = sqlTypeToTS(col);
    code += `  ${col.name}?: ${tsType};\n`;
  }
  code += "}\n\n";

  return code;
}

/**
 * Generate GraphQL type definitions for all tables in a domain
 */
function generateGraphQL(tables) {
  let code = `/**\n * GraphQL type definitions\n * These are template strings that can be used with graphql-tag\n */\n\n`;

  for (const table of tables) {
    const typeName = toPascalCase(table.name);

    code += `export const ${typeName}TypeDefs = \`\n`;
    code += `  type ${typeName} {\n`;

    for (const col of table.columns) {
      let gqlType = "String";
      if (sqlTypeToTS(col).includes("number")) gqlType = "Int";
      if (sqlTypeToTS(col).includes("boolean")) gqlType = "Boolean";
      if (col.sqlType === "json") gqlType = "JSON";

      const required = !col.nullable ? "!" : "";
      if (col.comment) {
        code += `    # ${col.comment}\n`;
      }
      code += `    ${col.name}: ${gqlType}${required}\n`;
    }

    code += `  }\n\n`;

    // Input types
    code += `  input ${typeName}Input {\n`;
    for (const col of table.columns) {
      if (col.name === "id" || col.name.includes("_at")) continue;

      let gqlType = "String";
      if (sqlTypeToTS(col).includes("number")) gqlType = "Int";
      if (sqlTypeToTS(col).includes("boolean")) gqlType = "Boolean";
      if (col.sqlType === "json") gqlType = "JSON";

      code += `    ${col.name}: ${gqlType}\n`;
    }
    code += `  }\n`;

    code += `\`;\n\n`;
  }

  return code;
}

/**
 * Generate Zod validators for all tables in a domain
 */
function generateValidators(tables) {
  let code = `/**\n * Zod validators\n */\n\nimport { z } from 'zod';\n\n`;

  for (const table of tables) {
    const typeName = toPascalCase(table.name);
    const schemaName = toCamelCase(table.name);

    code += `export const ${schemaName}Schema = z.object({\n`;

    for (const col of table.columns) {
      let zodType = "z.string()";

      if (sqlTypeToTS(col).includes("number")) {
        zodType = "z.number()";
      } else if (sqlTypeToTS(col).includes("boolean")) {
        zodType = "z.boolean()";
      } else if (col.enumValues) {
        zodType = `z.enum([${col.enumValues.map((v) => `'${v}'`).join(", ")}])`;
      } else if (col.sqlType === "json") {
        zodType = "z.record(z.any())";
      } else if (col.sqlType.includes("text")) {
        zodType = "z.string()";
      }

      if (col.nullable) {
        zodType += ".nullable()";
      }

      if (col.comment) {
        code += `  /** ${col.comment} */\n`;
      }
      code += `  ${col.name}: ${zodType},\n`;
    }

    code += `});\n\n`;

    // Create schema - omit only columns that exist
    const omitFields = ["id"];
    const hasCreatedAt = table.columns.some((c) => c.name === "created_at");
    const hasUpdatedAt = table.columns.some((c) => c.name === "updated_at");

    if (hasCreatedAt) omitFields.push("created_at");
    if (hasUpdatedAt) omitFields.push("updated_at");

    const omitObj = omitFields.map((f) => `${f}: true`).join(", ");
    code += `export const ${schemaName}CreateSchema = ${schemaName}Schema.omit({ ${omitObj} });\n\n`;
    code += `export const ${schemaName}UpdateSchema = ${schemaName}Schema.partial().required({ id: true });\n\n`;
  }

  return code;
}

/**
 * Generate domain index file
 */
function generateDomainIndex(domainName, tables) {
  let code = `/**\n * ${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Domain\n */\n\n`;

  // Export types
  code += `// Database Types\n`;
  code += `export * from './database.types.generated.js';\n\n`;

  // Export GraphQL
  code += `// GraphQL Type Definitions\n`;
  code += `export * from './graphql.js';\n\n`;

  // Export validators
  code += `// Zod Validators\n`;
  code += `export * from './validators.js';\n`;

  return code;
}

/**
 * Generate test file for a domain
 */
function generateTests(tables, domainName) {
  let code = `/**\n * Tests for ${domainName} domain\n * @generated - Auto-generated from SQL schema\n */\n\n`;
  code += `import { describe, it, expect } from '@jest/globals';\n`;
  code += `import * as ${toCamelCase(domainName)} from '../index.js';\n\n`;

  for (const table of tables) {
    const typeName = toPascalCase(table.name);
    const schemaName = toCamelCase(table.name);

    code += `describe('${typeName}', () => {\n`;

    // Test 1: Schema validation with valid data
    code += `  describe('${schemaName}Schema', () => {\n`;
    code += `    it('should validate correct ${typeName} data', () => {\n`;
    code += `      const validData: ${toCamelCase(domainName)}.${typeName} = {\n`;

    for (const col of table.columns) {
      const tsType = sqlTypeToTS(col);
      let exampleValue;

      if (col.name === "id") {
        exampleValue = "1";
      } else if (col.enumValues) {
        exampleValue = `'${col.enumValues[0]}'`;
      } else if (tsType.includes("number")) {
        exampleValue =
          col.name.includes("price") || col.name.includes("amount")
            ? "99.99"
            : "1";
      } else if (tsType.includes("boolean")) {
        exampleValue = "true";
      } else if (col.name.includes("_at")) {
        exampleValue = `'2024-01-01T00:00:00Z'`;
      } else if (col.name.includes("date")) {
        exampleValue = `'2024-01-01'`;
      } else if (col.name.includes("email")) {
        exampleValue = `'test@example.com'`;
      } else if (col.name.includes("url")) {
        exampleValue = `'https://example.com'`;
      } else if (col.sqlType === "json") {
        exampleValue = "{}";
      } else {
        exampleValue = `'test_${col.name}'`;
      }

      code += `        ${col.name}: ${exampleValue},\n`;
    }

    code += `      };\n\n`;
    code += `      const result = ${toCamelCase(domainName)}.${schemaName}Schema.safeParse(validData);\n`;
    code += `      expect(result.success).toBe(true);\n`;
    code += `    });\n\n`;

    // Test 2: Required fields
    const requiredFields = table.columns.filter(
      (col) => !col.nullable && col.name !== "id",
    );
    if (requiredFields.length > 0) {
      code += `    it('should fail when required fields are missing', () => {\n`;
      code += `      const invalidData = {};\n`;
      code += `      const result = ${toCamelCase(domainName)}.${schemaName}Schema.safeParse(invalidData);\n`;
      code += `      expect(result.success).toBe(false);\n`;
      code += `    });\n\n`;
    }

    // Test 3: Enum validation
    const enumCols = table.columns.filter((col) => col.enumValues);
    for (const enumCol of enumCols) {
      code += `    it('should validate ${enumCol.name} enum values', () => {\n`;
      code += `      const validValues = [${enumCol.enumValues.map((v) => `'${v}'`).join(", ")}];\n`;
      code += `      validValues.forEach(value => {\n`;
      code += `        const result = ${toCamelCase(domainName)}.${schemaName}Schema.shape.${enumCol.name}.safeParse(value);\n`;
      code += `        expect(result.success).toBe(true);\n`;
      code += `      });\n\n`;
      code += `      const invalidResult = ${toCamelCase(domainName)}.${schemaName}Schema.shape.${enumCol.name}.safeParse('invalid_value');\n`;
      code += `      expect(invalidResult.success).toBe(false);\n`;
      code += `    });\n\n`;
    }

    code += `  });\n\n`;

    // Test 4: Create schema (omits id and timestamps)
    const hasCreateSchema = table.columns.some(
      (c) =>
        c.name !== "id" && !c.name.includes("_at") && c.defaultValue === null,
    );
    if (hasCreateSchema) {
      code += `  describe('${schemaName}CreateSchema', () => {\n`;
      code += `    it('should validate data for creating ${typeName}', () => {\n`;
      code += `      const createData = {\n`;

      const createFields = table.columns.filter(
        (col) =>
          col.name !== "id" &&
          !col.name.includes("_at") &&
          col.defaultValue === null,
      );

      for (const col of createFields.slice(0, 3)) {
        // Just first 3 fields for brevity
        const tsType = sqlTypeToTS(col);
        let exampleValue;

        if (col.enumValues) {
          exampleValue = `'${col.enumValues[0]}'`;
        } else if (tsType.includes("number")) {
          exampleValue = "1";
        } else if (tsType.includes("boolean")) {
          exampleValue = "true";
        } else if (col.sqlType === "json") {
          exampleValue = "{}";
        } else {
          exampleValue = `'test'`;
        }

        code += `        ${col.name}: ${exampleValue},\n`;
      }

      code += `      };\n\n`;
      code += `      const result = ${toCamelCase(domainName)}.${schemaName}CreateSchema.safeParse(createData);\n`;
      code += `      expect(result.success).toBe(true);\n`;
      code += `    });\n`;
      code += `  });\n\n`;
    }

    // Test 5: Update schema (partial validation)
    code += `  describe('${schemaName}UpdateSchema', () => {\n`;
    code += `    it('should validate partial data for updating ${typeName}', () => {\n`;
    code += `      const updateData = {\n`;
    code += `        id: 1,\n`;

    const updateField = table.columns.find(
      (c) => c.name !== "id" && !c.name.includes("_at"),
    );
    if (updateField) {
      const tsType = sqlTypeToTS(updateField);
      let exampleValue = tsType.includes("number") ? "2" : `'updated'`;
      code += `        ${updateField.name}: ${exampleValue},\n`;
    }

    code += `      };\n\n`;
    code += `      const result = ${toCamelCase(domainName)}.${schemaName}UpdateSchema.safeParse(updateData);\n`;
    code += `      expect(result.success).toBe(true);\n`;
    code += `    });\n\n`;

    code += `    it('should require id field for updates', () => {\n`;
    code += `      const invalidData = {};\n`;
    code += `      const result = ${toCamelCase(domainName)}.${schemaName}UpdateSchema.safeParse(invalidData);\n`;
    code += `      expect(result.success).toBe(false);\n`;
    code += `    });\n`;
    code += `  });\n`;
    code += `});\n\n`;
  }

  return code;
}

/**
 * Main generator function
 */
async function generateTypes() {
  console.log("🚀 Starting TypeScript types generation from SQL schema...\n");

  // Read SQL file
  const sqlPath = path.join(
    __dirname,
    "../../../db/schema/clubmanager_simplified.sql",
  );

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, "utf-8");

  // Extract all CREATE TABLE statements
  const createTableRegex =
    /DROP TABLE IF EXISTS.*?;\s*CREATE TABLE[\s\S]+?(?=DROP TABLE|SET FOREIGN_KEY_CHECKS|$)/gi;
  const createStatements = sqlContent.match(createTableRegex) || [];

  console.log(`📋 Found ${createStatements.length} CREATE TABLE statements\n`);

  // Parse all tables
  const tables = [];
  for (const stmt of createStatements) {
    const table = parseCreateTable(stmt);
    if (table) {
      tables.push(table);
      console.log(
        `✅ Parsed table: ${table.name} (${table.columns.length} columns)`,
      );
    }
  }

  console.log(`\n📊 Total tables parsed: ${tables.length}\n`);

  // Group tables by domain
  const domainTables = {};
  for (const [domain, tableNames] of Object.entries(DOMAIN_MAP)) {
    domainTables[domain] = tables.filter((t) => tableNames.includes(t.name));
  }

  // Clean old domains
  const domainsDir = path.join(__dirname, "../src/domains");
  if (fs.existsSync(domainsDir)) {
    const oldDomains = fs.readdirSync(domainsDir).filter((d) => {
      const stat = fs.statSync(path.join(domainsDir, d));
      return stat.isDirectory();
    });

    console.log(`🧹 Removing ${oldDomains.length} old domain directories...\n`);
    for (const oldDomain of oldDomains) {
      const domainPath = path.join(domainsDir, oldDomain);
      fs.rmSync(domainPath, { recursive: true, force: true });
      console.log(`   ❌ Removed: ${oldDomain}`);
    }
    console.log("");
  }

  // Generate files for each domain
  for (const [domainName, domainTablesList] of Object.entries(domainTables)) {
    if (domainTablesList.length === 0) continue;

    console.log(
      `📦 Generating domain: ${domainName} (${domainTablesList.length} tables)`,
    );

    const domainDir = path.join(domainsDir, domainName);
    fs.mkdirSync(domainDir, { recursive: true });

    // Generate database.types.generated.ts
    let typesContent = `/**\n * Generated TypeScript types for ${domainName} domain\n * @generated - Do not edit manually\n */\n\n`;
    for (const table of domainTablesList) {
      typesContent += generateInterface(table);
    }
    fs.writeFileSync(
      path.join(domainDir, "database.types.generated.ts"),
      typesContent,
    );
    console.log(`   ✅ database.types.generated.ts`);

    // Generate graphql.ts
    const graphqlContent = generateGraphQL(domainTablesList);
    fs.writeFileSync(path.join(domainDir, "graphql.ts"), graphqlContent);
    console.log(`   ✅ graphql.ts`);

    // Generate validators.ts
    const validatorsContent = generateValidators(domainTablesList);
    fs.writeFileSync(path.join(domainDir, "validators.ts"), validatorsContent);
    console.log(`   ✅ validators.ts`);

    // Generate index.ts
    const indexContent = generateDomainIndex(domainName, domainTablesList);
    fs.writeFileSync(path.join(domainDir, "index.ts"), indexContent);
    console.log(`   ✅ index.ts`);

    // Generate tests
    const testsDir = path.join(domainDir, "__tests__");
    fs.mkdirSync(testsDir, { recursive: true });
    const testsContent = generateTests(domainTablesList, domainName);
    fs.writeFileSync(
      path.join(testsDir, `${domainName}.test.ts`),
      testsContent,
    );
    console.log(`   ✅ __tests__/${domainName}.test.ts\n`);
  }

  // Generate main domains index
  console.log("📝 Generating main domains/index.ts...");
  let domainsIndexContent = `/**\n * All domain exports\n */\n\n`;
  for (const domainName of Object.keys(domainTables)) {
    if (domainTables[domainName].length > 0) {
      domainsIndexContent += `export * as ${toCamelCase(domainName)} from './${domainName}/index.js';\n`;
    }
  }
  fs.writeFileSync(path.join(domainsDir, "index.ts"), domainsIndexContent);
  console.log("   ✅ domains/index.ts\n");

  // Update main index.ts
  console.log("📝 Updating main src/index.ts...");
  const mainIndexContent =
    `/**\n * @clubmanager/types - Main exports\n */\n\n` +
    `export * from './domains/index.js';\n` +
    `export * from './core/graphql.js';\n`;
  fs.writeFileSync(path.join(__dirname, "../src/index.ts"), mainIndexContent);
  console.log("   ✅ src/index.ts\n");

  console.log("✨ Generation complete!\n");
  console.log("📊 Summary:");
  console.log(
    `   - Domains created: ${Object.keys(domainTables).filter((d) => domainTables[d].length > 0).length}`,
  );
  console.log(`   - Tables processed: ${tables.length}`);
  console.log(
    `   - Total files generated: ${Object.keys(domainTables).filter((d) => domainTables[d].length > 0).length * 5 + 2}\n`,
  );
}

// Run generator
generateTypes().catch(console.error);
