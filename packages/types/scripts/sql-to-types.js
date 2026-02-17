#!/usr/bin/env node

/**
 * 🔄 SQL to TypeScript Types Generator
 *
 * Ce script analyse clubmanager_full.sql et génère automatiquement
 * les types TypeScript correspondants pour chaque table.
 *
 * Usage:
 *   node scripts/sql-to-types.js
 *
 * Options:
 *   --table <name>    Génère uniquement les types pour une table spécifique
 *   --domain <name>   Génère uniquement les types pour un domaine spécifique
 *   --output <path>   Chemin de sortie personnalisé
 *   --dry-run         Affiche le résultat sans créer de fichiers
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping SQL types vers TypeScript types
const SQL_TO_TS_TYPE_MAP = {
  int: "number",
  bigint: "number",
  smallint: "number",
  tinyint: "number | boolean",
  decimal: "number",
  float: "number",
  double: "number",
  varchar: "string",
  char: "string",
  text: "string",
  longtext: "string",
  mediumtext: "string",
  date: "Date | string",
  datetime: "Date | string",
  timestamp: "Date | string",
  time: "string",
  json: "any",
  enum: "string", // sera remplacé par les valeurs réelles
  boolean: "boolean",
};

// Mapping tables vers domaines
const TABLE_TO_DOMAIN_MAP = {
  // Users domain
  users: "utilisateurs",
  user_profiles: "utilisateurs",
  user_security: "utilisateurs",
  user_subscriptions: "utilisateurs",
  user_preferences: "utilisateurs",
  user_sports: "utilisateurs",
  user_roles: "utilisateurs",
  user_alerts: "utilisateurs",
  user_notifications: "utilisateurs",
  user_consents: "utilisateurs",
  user_grade_history: "utilisateurs",
  user_group_members: "utilisateurs",
  user_groups: "utilisateurs",

  // Auth domain
  login_attempts: "auth",
  refresh_tokens_legacy: "auth",
  password_reset_tokens_legacy: "auth",
  validation_tokens_legacy: "auth",
  email_validation_tokens_legacy: "auth",
  manual_recovery_requests_legacy: "auth",
  sms_recovery_codes_legacy: "auth",

  // Events domain (nouveau)
  events: "events",
  event_types: "events",
  event_registrations: "events",
  event_reminders: "events",
  event_team_members: "events",
  event_teams: "events",
  event_documents: "events",
  event_media: "events",
  event_competition_categories: "events",

  // Venues domain (nouveau)
  venues: "venues",

  // Sports domain
  sports: "sports",
  sport_configurations: "sports",
  sport_equipment: "sports",
  sport_statistics: "sports",
  sport_competition_rules: "sports",
  belt_grades: "sports",
  genders: "sports",

  // Cours domain
  course_types: "cours",
  course_instances: "cours",
  recurring_courses: "cours",
  recurring_course_teachers: "cours",
  enrollments: "cours",
  bookings: "cours",

  // Professeurs domain
  teachers: "professeurs",

  // Paiements domain
  payments: "paiements",
  payments_archive: "paiements",
  payment_methods: "paiements",
  payment_schedules: "paiements",
  pricing_plans: "paiements",

  // Commandes domain
  orders: "commandes",
  orders_archive: "commandes",
  order_items: "commandes",
  order_status_history: "commandes",

  // Magasin domain
  shop_articles: "magasin",
  article_categories: "magasin",
  article_images: "magasin",
  article_sizes: "magasin",
  article_stock: "magasin",
  sizes: "magasin",
  stocks: "magasin",

  // Messages domain
  direct_messages: "messages",
  custom_messages: "messages",
  custom_message_types: "messages",
  message_read_status: "messages",

  // Email domain (nouveau)
  email_templates: "email",
  email_template_versions: "email",
  email_template_attachments: "email",
  email_campaigns: "email",
  email_tracking: "email",
  email_link_clicks: "email",
  email_queue_archive: "email",
  emails_archive: "email",

  // Notifications domain (nouveau)
  notification_templates: "notifications",

  // Alertes domain
  alert_types: "alertes",
  alert_actions: "alertes",

  // AB Testing domain (nouveau)
  ab_tests: "abtesting",
  ab_test_variants: "abtesting",
  ab_test_participants: "abtesting",

  // API domain (nouveau)
  api_keys: "api",
  api_key_usage_logs: "api",

  // Audit domain
  audit_trail: "audit",
  audit_logs_archive: "audit",
  archive_statistics: "audit",

  // Sessions domain
  sessions_archive: "sessions",

  // GDPR domain
  account_deletion_requests: "gdpr",
  data_export_requests: "gdpr",

  // Rate Limiting domain (nouveau)
  rate_limit_config: "ratelimit",
  rate_limit_counters: "ratelimit",
  rate_limit_violations: "ratelimit",
  password_reset_rate_limits: "ratelimit",

  // Statistiques domain
  legacy_statistics: "statistiques",
  v_active_students_by_sport: "statistiques",
  v_dashboard_stats: "statistiques",
  v_upcoming_schedule: "statistiques",
};

/**
 * Parse une définition de table SQL
 */
function parseTableDefinition(sqlContent, tableName) {
  // Find the CREATE TABLE statement with better regex handling
  const escapedTableName = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tableRegex = new RegExp(
    `CREATE TABLE \`${escapedTableName}\`[\\s\\S]*?\\([\\s\\S]*?\\)\\s*ENGINE`,
    "i",
  );
  const match = sqlContent.match(tableRegex);

  if (!match) {
    console.warn(`⚠️  Table ${tableName} non trouvée dans le SQL`);
    return null;
  }

  // Extract just the content between parentheses
  const fullMatch = match[0];
  const contentMatch = fullMatch.match(/\(([\s\S]*)\)\s*ENGINE/);
  if (!contentMatch) {
    console.warn(`⚠️  Impossible de parser ${tableName}`);
    return null;
  }

  const tableContent = contentMatch[1];
  const lines = tableContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  const fields = [];
  const enums = {};

  for (const line of lines) {
    // Skip contraintes, clés, etc.
    if (
      line.startsWith("PRIMARY KEY") ||
      line.startsWith("UNIQUE KEY") ||
      line.startsWith("KEY") ||
      line.startsWith("FOREIGN KEY") ||
      line.startsWith("FULLTEXT KEY") ||
      line.startsWith("CONSTRAINT") ||
      line.startsWith("CHECK")
    ) {
      continue;
    }

    // Parse champ
    const fieldMatch = line.match(
      /`([^`]+)`\s+([^\s,]+)(?:\(([^)]+)\))?\s*(.*)/,
    );
    if (fieldMatch) {
      const [, name, type, size, rest] = fieldMatch;

      // Détecter si nullable
      const isNullable = !rest.includes("NOT NULL");

      // Détecter les valeurs ENUM
      let tsType = null;
      if (type === "enum") {
        const enumMatch = rest.match(/enum\(([^)]+)\)/);
        if (enumMatch) {
          const values = enumMatch[1]
            .split(",")
            .map((v) => v.trim().replace(/'/g, '"'));
          enums[name] = values;
          tsType = values.join(" | ");
        }
      } else if (type === "tinyint" && size === "1") {
        tsType = "boolean";
      } else {
        tsType = SQL_TO_TS_TYPE_MAP[type] || "any";
      }

      // Extraire le commentaire si présent
      const commentMatch = rest.match(/COMMENT '([^']+)'/);
      const comment = commentMatch ? commentMatch[1] : null;

      fields.push({
        name,
        type: tsType,
        nullable: isNullable,
        comment,
        sqlType: type,
      });
    }
  }

  return { fields, enums };
}

/**
 * Convertir un nom de table en nom de type TypeScript
 */
function tableNameToTypeName(tableName) {
  return (
    tableName
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") + "DB"
  );
}

/**
 * Générer l'interface TypeScript pour une table
 */
function generateTypeScriptInterface(tableName, tableDefinition) {
  if (!tableDefinition) return null;

  const typeName = tableNameToTypeName(tableName);
  const { fields } = tableDefinition;

  let output = `/**\n * Table: ${tableName}\n */\n`;
  output += `export interface ${typeName} {\n`;

  for (const field of fields) {
    if (field.comment) {
      output += `  /** ${field.comment} */\n`;
    }
    const nullableSuffix = field.nullable ? " | null" : "";
    output += `  ${field.name}: ${field.type}${nullableSuffix};\n`;
  }

  output += `}\n`;

  return output;
}

/**
 * Générer les types Create et Update
 */
function generateCRUDTypes(tableName, tableDefinition) {
  if (!tableDefinition) return "";

  const baseTypeName = tableNameToTypeName(tableName).replace("DB", "");
  const { fields } = tableDefinition;

  let output = "";

  // Create Input Type
  output += `\n/**\n * Input pour créer ${tableName}\n */\n`;
  output += `export interface Create${baseTypeName}Input {\n`;

  for (const field of fields) {
    // Skip auto-increment id, created_at, updated_at
    if (
      field.name === "id" ||
      field.name === "created_at" ||
      field.name === "updated_at"
    ) {
      continue;
    }

    const optional =
      field.nullable ||
      field.name.includes("_at") ||
      field.name.includes("_by");
    const optionalSuffix = optional ? "?" : "";
    const nullableSuffix = field.nullable ? " | null" : "";

    output += `  ${field.name}${optionalSuffix}: ${field.type}${nullableSuffix};\n`;
  }

  output += `}\n`;

  // Update Input Type
  output += `\n/**\n * Input pour mettre à jour ${tableName}\n */\n`;
  output += `export interface Update${baseTypeName}Input {\n`;

  for (const field of fields) {
    // Skip id, created_at
    if (field.name === "id" || field.name === "created_at") {
      continue;
    }

    const nullableSuffix = field.nullable ? " | null" : "";
    output += `  ${field.name}?: ${field.type}${nullableSuffix};\n`;
  }

  output += `}\n`;

  return output;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    table: null,
    domain: null,
    output: null,
    dryRun: false,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--table") options.table = args[++i];
    if (args[i] === "--domain") options.domain = args[++i];
    if (args[i] === "--output") options.output = args[++i];
    if (args[i] === "--dry-run") options.dryRun = true;
  }

  // Lire le fichier SQL
  const sqlPath = path.join(
    __dirname,
    "../../../db/schema/clubmanager_full.sql",
  );
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Fichier SQL non trouvé: ${sqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  // Extraire toutes les tables
  const tableMatches = sqlContent.matchAll(/CREATE TABLE `([^`]+)`/g);
  const tables = Array.from(tableMatches).map((m) => m[1]);

  console.log(`📊 ${tables.length} tables trouvées\n`);

  // Filtrer si nécessaire
  let tablesToProcess = tables;
  if (options.table) {
    tablesToProcess = tables.filter((t) => t === options.table);
  } else if (options.domain) {
    tablesToProcess = tables.filter(
      (t) => TABLE_TO_DOMAIN_MAP[t] === options.domain,
    );
  }

  // Grouper par domaine
  const domainTables = {};
  for (const table of tablesToProcess) {
    const domain = TABLE_TO_DOMAIN_MAP[table] || "unknown";
    if (!domainTables[domain]) {
      domainTables[domain] = [];
    }
    domainTables[domain].push(table);
  }

  // Générer les types pour chaque domaine
  for (const [domain, domainTableList] of Object.entries(domainTables)) {
    console.log(`\n📁 Domaine: ${domain} (${domainTableList.length} tables)`);

    let fileContent = `/**\n * Types Database pour ${domain}\n * Auto-généré depuis clubmanager_full.sql\n * NE PAS MODIFIER MANUELLEMENT\n */\n\n`;

    for (const table of domainTableList) {
      console.log(`  ├─ ${table}`);

      const tableDefinition = parseTableDefinition(sqlContent, table);
      const interfaceCode = generateTypeScriptInterface(table, tableDefinition);
      const crudCode = generateCRUDTypes(table, tableDefinition);

      if (interfaceCode) {
        fileContent += `// ============================================================================\n`;
        fileContent += `// TABLE: ${table}\n`;
        fileContent += `// ============================================================================\n\n`;
        fileContent += interfaceCode;
        fileContent += crudCode;
        fileContent += "\n";
      }
    }

    // Écrire le fichier
    if (!options.dryRun) {
      const outputPath =
        options.output ||
        path.join(
          __dirname,
          `../src/domains/${domain}/database.types.generated.ts`,
        );

      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  📂 Répertoire créé: ${dir}`);
      }

      fs.writeFileSync(outputPath, fileContent);
      console.log(`  ✅ Fichier créé: ${outputPath}`);
    } else {
      console.log(`\n--- PREVIEW (${domain}) ---`);
      console.log(fileContent.substring(0, 500) + "...\n");
    }
  }

  console.log(
    `\n✨ Terminé! ${Object.keys(domainTables).length} domaines traités\n`,
  );
}

main().catch(console.error);
