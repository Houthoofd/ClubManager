import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '../.env.test');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

function logStep(step, description) {
  log(`[${step}] ${description}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

async function executeSQL(sql, description) {
  try {
    logStep('SQL', description);
    await prisma.$executeRawUnsafe(sql);
    logSuccess(`${description} - OK`);
    return true;
  } catch (error) {
    logError(`${description} - ERREUR: ${error.message}`);
    return false;
  }
}

async function querySQL(sql, description) {
  try {
    logStep('QUERY', description);
    const result = await prisma.$queryRawUnsafe(sql);
    logSuccess(`${description} - OK`);
    return result;
  } catch (error) {
    logError(`${description} - ERREUR: ${error.message}`);
    return null;
  }
}

async function checkPrerequisites() {
  logSection('VÉRIFICATION DES PRÉ-REQUIS');

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    logSuccess('Connexion à la base de données OK');
  } catch (error) {
    logError(`Impossible de se connecter à la base de données: ${error.message}`);
    return false;
  }

  // Check if Phase 1 was completed
  const tables = await querySQL(
    "SHOW TABLES LIKE 'payment_methods'",
    'Vérification Phase 1 (payment_methods)'
  );

  if (!tables || tables.length === 0) {
    logWarning('La Phase 1 ne semble pas avoir été exécutée. Continuer quand même ? (Oui/Non)');
    // In production, you might want to wait for user input here
  } else {
    logSuccess('Phase 1 détectée');
  }

  // Check if Phase 2 already executed
  const phase2Check = await querySQL(
    "SHOW TABLES LIKE 'user_profiles'",
    'Vérification si Phase 2 déjà exécutée'
  );

  if (phase2Check && phase2Check.length > 0) {
    logWarning('La table user_profiles existe déjà. Phase 2 peut-être déjà exécutée.');
    return false;
  }

  return true;
}

async function createBackup() {
  logSection('CRÉATION DU BACKUP');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, `../backups/backup-phase2-${timestamp}.txt`);

  log(`Note: Pour un backup complet, exécutez manuellement:`, 'yellow');
  log(`mysqldump -u [user] -p [database] > ${backupFile}`, 'yellow');

  return true;
}

async function createNewTables() {
  logSection('ÉTAPE 1: CRÉATION DES NOUVELLES TABLES');

  const tables = [
    {
      name: 'user_profiles',
      sql: `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          grade_id INT NULL,
          bio TEXT NULL,
          avatar_url VARCHAR(500) NULL,
          phone VARCHAR(20) NULL,
          emergency_contact_name VARCHAR(100) NULL,
          emergency_contact_phone VARCHAR(20) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_grade_id (grade_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'user_security',
      sql: `
        CREATE TABLE IF NOT EXISTS user_security (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          email_verified_at TIMESTAMP NULL,
          last_login_at TIMESTAMP NULL,
          failed_login_attempts INT DEFAULT 0,
          locked_until TIMESTAMP NULL,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          two_factor_secret VARCHAR(255) NULL,
          password_changed_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_email_verified (email_verified),
          INDEX idx_locked_until (locked_until),
          INDEX idx_last_login (last_login_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'user_subscriptions',
      sql: `
        CREATE TABLE IF NOT EXISTS user_subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          abonnement_id INT NULL,
          status_id INT NULL DEFAULT 1,
          stripe_customer_id VARCHAR(255) NULL UNIQUE,
          stripe_subscription_id VARCHAR(255) NULL,
          subscription_start_at TIMESTAMP NULL,
          subscription_end_at TIMESTAMP NULL,
          auto_renew BOOLEAN DEFAULT TRUE,
          cancellation_reason TEXT NULL,
          cancelled_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_abonnement_id (abonnement_id),
          INDEX idx_status_id (status_id),
          INDEX idx_stripe_customer (stripe_customer_id),
          INDEX idx_stripe_subscription (stripe_subscription_id),
          INDEX idx_subscription_end (subscription_end_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'user_preferences',
      sql: `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          language VARCHAR(10) DEFAULT 'fr',
          timezone VARCHAR(50) DEFAULT 'Europe/Brussels',
          notifications_email BOOLEAN DEFAULT TRUE,
          notifications_sms BOOLEAN DEFAULT FALSE,
          notifications_push BOOLEAN DEFAULT TRUE,
          theme VARCHAR(20) DEFAULT 'light',
          date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_language (language)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createGDPRTables() {
  logSection('ÉTAPE 2: CRÉATION DES TABLES GDPR');

  const tables = [
    {
      name: 'user_consents',
      sql: `
        CREATE TABLE IF NOT EXISTS user_consents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          consent_type ENUM('MARKETING', 'ANALYTICS', 'TERMS', 'PRIVACY', 'DATA_PROCESSING') NOT NULL,
          given BOOLEAN NOT NULL DEFAULT FALSE,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          given_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          revoked_at TIMESTAMP NULL,
          version VARCHAR(20) NULL COMMENT 'Version des CGU/CGV acceptées',
          INDEX idx_user_id (user_id),
          INDEX idx_consent_type (consent_type),
          INDEX idx_given (given),
          INDEX idx_user_consent (user_id, consent_type, given),
          INDEX idx_given_at (given_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'data_export_requests',
      sql: `
        CREATE TABLE IF NOT EXISTS data_export_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED') DEFAULT 'PENDING',
          requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          processing_started_at TIMESTAMP NULL,
          completed_at TIMESTAMP NULL,
          expires_at TIMESTAMP NULL,
          file_path VARCHAR(500) NULL,
          file_size_bytes BIGINT NULL,
          request_ip VARCHAR(45) NULL,
          download_count INT DEFAULT 0,
          last_downloaded_at TIMESTAMP NULL,
          error_message TEXT NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_expires_at (expires_at),
          INDEX idx_requested_at (requested_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'account_deletion_requests',
      sql: `
        CREATE TABLE IF NOT EXISTS account_deletion_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          status ENUM('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
          reason TEXT NULL,
          requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          approved_at TIMESTAMP NULL,
          approved_by INT NULL COMMENT 'Admin user ID',
          completed_at TIMESTAMP NULL,
          rejection_reason TEXT NULL,
          request_ip VARCHAR(45) NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_requested_at (requested_at),
          INDEX idx_approved_by (approved_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function migrateData() {
  logSection('ÉTAPE 3: MIGRATION DES DONNÉES');

  // Migrate to user_profiles
  await executeSQL(
    `
    INSERT INTO user_profiles (user_id, grade_id, created_at, updated_at)
    SELECT id, grade_id, date_inscription, date_inscription
    FROM utilisateurs
    WHERE NOT EXISTS (
      SELECT 1 FROM user_profiles WHERE user_profiles.user_id = utilisateurs.id
    )
    `,
    'Migration vers user_profiles'
  );

  // Migrate to user_security
  await executeSQL(
    `
    INSERT INTO user_security (
      user_id, password, email_verified, email_verified_at, created_at, updated_at
    )
    SELECT
      id,
      password,
      COALESCE(email_verified, FALSE),
      email_verified_at,
      date_inscription,
      date_inscription
    FROM utilisateurs
    WHERE NOT EXISTS (
      SELECT 1 FROM user_security WHERE user_security.user_id = utilisateurs.id
    )
    `,
    'Migration vers user_security'
  );

  // Migrate to user_subscriptions
  await executeSQL(
    `
    INSERT INTO user_subscriptions (
      user_id, abonnement_id, status_id, stripe_customer_id,
      stripe_subscription_id, created_at, updated_at
    )
    SELECT
      id,
      abonnement_id,
      status_id,
      stripe_customer_id,
      stripe_subscription_id,
      date_inscription,
      date_inscription
    FROM utilisateurs
    WHERE NOT EXISTS (
      SELECT 1 FROM user_subscriptions WHERE user_subscriptions.user_id = utilisateurs.id
    )
    `,
    'Migration vers user_subscriptions'
  );

  // Migrate to user_preferences
  await executeSQL(
    `
    INSERT INTO user_preferences (user_id, created_at, updated_at)
    SELECT id, date_inscription, date_inscription
    FROM utilisateurs
    WHERE NOT EXISTS (
      SELECT 1 FROM user_preferences WHERE user_preferences.user_id = utilisateurs.id
    )
    `,
    'Migration vers user_preferences'
  );

  return true;
}

async function addForeignKeys() {
  logSection('ÉTAPE 4: AJOUT DES FOREIGN KEYS');

  const foreignKeys = [
    {
      table: 'user_profiles',
      constraint: 'fk_user_profiles_user',
      sql: `ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user
            FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
            ON DELETE CASCADE ON UPDATE RESTRICT`
    },
    {
      table: 'user_profiles',
      constraint: 'fk_user_profiles_grade',
      sql: `ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_grade
            FOREIGN KEY (grade_id) REFERENCES grades(id)
            ON DELETE SET NULL ON UPDATE RESTRICT`
    },
    {
      table: 'user_security',
      constraint: 'fk_user_security_user',
      sql: `ALTER TABLE user_security ADD CONSTRAINT fk_user_security_user
            FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
            ON DELETE CASCADE ON UPDATE RESTRICT`
    },
    {
      table: 'user_subscriptions',
      constraint: 'fk_user_subscriptions_user',
      sql: `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_user
            FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
            ON DELETE CASCADE ON UPDATE RESTRICT`
    },
    {
      table: 'user_subscriptions',
      constraint: 'fk_user_subscriptions_abonnement',
      sql: `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_abonnement
            FOREIGN KEY (abonnement_id) REFERENCES plans_tarifaires(id)
            ON DELETE SET NULL ON UPDATE RESTRICT`
    },
    {
      table: 'user_subscriptions',
      constraint: 'fk_user_subscriptions_status',
      sql: `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_status
            FOREIGN KEY (status_id) REFERENCES status(id)
            ON DELETE SET NULL ON UPDATE RESTRICT`
    },
    {
      table: 'user_preferences',
      constraint: 'fk_user_preferences_user',
      sql: `ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_user
            FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
            ON DELETE CASCADE ON UPDATE RESTRICT`
    },
    {
      table: 'user_consents',
      constraint: 'fk_user_consents_user',
      sql: `ALTER TABLE user_consents ADD CONSTRAINT fk_user_consents_user
            FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
            ON DELETE CASCADE ON UPDATE RESTRICT`
    },
    {
      table: 'data_export_requests',
      constraint: 'fk_data_export_requests_user',
      sql: `ALTER TABLE data_export_requests ADD CONSTRAINT fk_data_export_requests_user
            FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
            ON DELETE CASCADE ON UPDATE RESTRICT`
    },
    {
      table: 'account_deletion_requests',
      constraint: 'fk_account_deletion_requests_user',
      sql: `ALTER TABLE account_deletion_requests ADD CONSTRAINT fk_account_deletion_requests_user
            FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
            ON DELETE CASCADE ON UPDATE RESTRICT`
    },
    {
      table: 'account_deletion_requests',
      constraint: 'fk_account_deletion_requests_approver',
      sql: `ALTER TABLE account_deletion_requests ADD CONSTRAINT fk_account_deletion_requests_approver
            FOREIGN KEY (approved_by) REFERENCES utilisateurs(id)
            ON DELETE SET NULL ON UPDATE RESTRICT`
    }
  ];

  for (const fk of foreignKeys) {
    // Check if FK already exists
    const exists = await querySQL(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = '${fk.table}'
       AND CONSTRAINT_NAME = '${fk.constraint}'`,
      `Vérification FK ${fk.constraint}`
    );

    if (!exists || exists.length === 0) {
      await executeSQL(fk.sql, `Ajout FK ${fk.constraint}`);
    } else {
      logWarning(`FK ${fk.constraint} existe déjà`);
    }
  }

  return true;
}

async function addSoftDelete() {
  logSection('ÉTAPE 5: AJOUT DU SOFT DELETE');

  const tables = [
    { name: 'utilisateurs', afterColumn: 'active' },
    { name: 'cours', afterColumn: 'professeur_id' },
    { name: 'articles', afterColumn: 'stock_min' },
    { name: 'commandes', afterColumn: 'created_at' },
    { name: 'paiements', afterColumn: 'webhook_id' },
    { name: 'cours_recurrent', afterColumn: 'fin_saison' }
  ];

  for (const table of tables) {
    // Check if column already exists
    const exists = await querySQL(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = '${table.name}'
       AND COLUMN_NAME = 'deleted_at'`,
      `Vérification colonne deleted_at sur ${table.name}`
    );

    if (!exists || exists.length === 0) {
      await executeSQL(
        `ALTER TABLE ${table.name}
         ADD COLUMN deleted_at TIMESTAMP NULL,
         ADD COLUMN deleted_by INT NULL,
         ADD INDEX idx_deleted_at (deleted_at)`,
        `Ajout soft delete sur ${table.name}`
      );
    } else {
      logWarning(`Colonne deleted_at existe déjà sur ${table.name}`);
    }
  }

  return true;
}

async function markDeprecatedColumns() {
  logSection('ÉTAPE 6: MARQUAGE DES COLONNES DEPRECATED');

  const modifications = [
    "ALTER TABLE utilisateurs MODIFY COLUMN password VARCHAR(255) COMMENT 'DEPRECATED: Use user_security.password'",
    "ALTER TABLE utilisateurs MODIFY COLUMN email_verified BOOLEAN COMMENT 'DEPRECATED: Use user_security.email_verified'",
    "ALTER TABLE utilisateurs MODIFY COLUMN email_verified_at TIMESTAMP NULL COMMENT 'DEPRECATED: Use user_security.email_verified_at'",
    "ALTER TABLE utilisateurs MODIFY COLUMN grade_id INT NULL COMMENT 'DEPRECATED: Use user_profiles.grade_id'",
    "ALTER TABLE utilisateurs MODIFY COLUMN abonnement_id INT NULL COMMENT 'DEPRECATED: Use user_subscriptions.abonnement_id'",
    "ALTER TABLE utilisateurs MODIFY COLUMN status_id INT NULL COMMENT 'DEPRECATED: Use user_subscriptions.status_id'",
    "ALTER TABLE utilisateurs MODIFY COLUMN stripe_customer_id VARCHAR(255) NULL COMMENT 'DEPRECATED: Use user_subscriptions.stripe_customer_id'",
    "ALTER TABLE utilisateurs MODIFY COLUMN stripe_subscription_id VARCHAR(255) NULL COMMENT 'DEPRECATED: Use user_subscriptions.stripe_subscription_id'"
  ];

  for (const sql of modifications) {
    await executeSQL(sql, 'Marquage colonne deprecated');
  }

  return true;
}

async function createDefaultConsents() {
  logSection('ÉTAPE 7: CRÉATION DES CONSENTEMENTS PAR DÉFAUT');

  await executeSQL(
    `
    INSERT INTO user_consents (user_id, consent_type, given, given_at, version)
    SELECT id, 'TERMS', TRUE, date_inscription, '1.0'
    FROM utilisateurs
    WHERE NOT EXISTS (
      SELECT 1 FROM user_consents
      WHERE user_consents.user_id = utilisateurs.id
      AND user_consents.consent_type = 'TERMS'
    )
    `,
    'Création consentements TERMS pour utilisateurs existants'
  );

  return true;
}

async function validateMigration() {
  logSection('ÉTAPE 8: VALIDATION DE LA MIGRATION');

  // Count records
  const counts = await querySQL(
    `
    SELECT 'utilisateurs' AS table_name, COUNT(*) AS count FROM utilisateurs
    UNION ALL SELECT 'user_profiles', COUNT(*) FROM user_profiles
    UNION ALL SELECT 'user_security', COUNT(*) FROM user_security
    UNION ALL SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
    UNION ALL SELECT 'user_preferences', COUNT(*) FROM user_preferences
    UNION ALL SELECT 'user_consents', COUNT(*) FROM user_consents
    `,
    'Comptage des enregistrements'
  );

  if (counts) {
    console.table(counts);
  }

  // Check for missing records
  const missing = await querySQL(
    `
    SELECT 'Missing user_profiles' AS check_name, COUNT(*) AS missing_count
    FROM utilisateurs u LEFT JOIN user_profiles up ON up.user_id = u.id WHERE up.id IS NULL
    UNION ALL
    SELECT 'Missing user_security', COUNT(*)
    FROM utilisateurs u LEFT JOIN user_security us ON us.user_id = u.id WHERE us.id IS NULL
    UNION ALL
    SELECT 'Missing user_subscriptions', COUNT(*)
    FROM utilisateurs u LEFT JOIN user_subscriptions sub ON sub.user_id = u.id WHERE sub.id IS NULL
    UNION ALL
    SELECT 'Missing user_preferences', COUNT(*)
    FROM utilisateurs u LEFT JOIN user_preferences pref ON pref.user_id = u.id WHERE pref.id IS NULL
    `,
    'Vérification des enregistrements manquants'
  );

  if (missing) {
    console.table(missing);

    const hasMissing = missing.some(row => row.missing_count > 0);
    if (hasMissing) {
      logError('Des enregistrements manquent dans les nouvelles tables !');
      return false;
    }
  }

  logSuccess('Validation réussie : toutes les données ont été migrées');
  return true;
}

async function runMigration(dryRun = false) {
  const startTime = Date.now();

  log('\n' + '█'.repeat(80), 'bright');
  log('  MIGRATION PHASE 2 - STRUCTURE', 'bright');
  log('  Split utilisateurs + Soft Delete + GDPR', 'bright');
  log('█'.repeat(80) + '\n', 'bright');

  if (dryRun) {
    logWarning('MODE DRY-RUN : Aucune modification ne sera appliquée');
  }

  try {
    // Pre-checks
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk && !dryRun) {
      logError('Les pré-requis ne sont pas satisfaits. Arrêt de la migration.');
      return false;
    }

    await createBackup();

    if (dryRun) {
      log('\nEn mode dry-run, les étapes suivantes seraient exécutées:', 'yellow');
      log('1. Création des nouvelles tables (user_profiles, user_security, etc.)', 'yellow');
      log('2. Création des tables GDPR', 'yellow');
      log('3. Migration des données', 'yellow');
      log('4. Ajout des foreign keys', 'yellow');
      log('5. Ajout du soft delete', 'yellow');
      log('6. Marquage des colonnes deprecated', 'yellow');
      log('7. Création des consentements par défaut', 'yellow');
      log('8. Validation', 'yellow');
      return true;
    }

    // Execute migration steps
    await createNewTables();
    await createGDPRTables();
    await migrateData();
    await addForeignKeys();
    await addSoftDelete();
    await markDeprecatedColumns();
    await createDefaultConsents();

    const validationOk = await validateMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (validationOk) {
      logSection('✓ MIGRATION PHASE 2 TERMINÉE AVEC SUCCÈS');
      log(`Durée totale: ${duration}s`, 'green');
      log('\nProchaines étapes:', 'cyan');
      log('1. Mettre à jour le schema.prisma avec les nouveaux modèles', 'cyan');
      log('2. Exécuter: npx prisma generate', 'cyan');
      log('3. Mettre à jour le code application pour utiliser les nouvelles tables', 'cyan');
      log('4. Tester en profondeur', 'cyan');
      log('5. Après stabilisation: supprimer les colonnes deprecated (Phase 2B)', 'cyan');
      return true;
    } else {
      logError('La validation a échoué. Vérifiez les erreurs ci-dessus.');
      return false;
    }

  } catch (error) {
    logError(`Erreur critique: ${error.message}`);
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (!dryRun && !force) {
  console.log('\n⚠️  ATTENTION: Cette migration va modifier la structure de la base de données.');
  console.log('Utilisez --dry-run pour un test sans modifications');
  console.log('Utilisez --force pour exécuter la migration réelle\n');
  process.exit(0);
}

runMigration(dryRun).then(success => {
  process.exit(success ? 0 : 1);
});
