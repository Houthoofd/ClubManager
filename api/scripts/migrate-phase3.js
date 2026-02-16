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

// ANSI color codes
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

  // Check if Phase 2 was completed
  const phase2Check = await querySQL(
    "SHOW TABLES LIKE 'user_profiles'",
    'Vérification Phase 2 (user_profiles)'
  );

  if (!phase2Check || phase2Check.length === 0) {
    logWarning('La Phase 2 ne semble pas avoir été exécutée.');
    return false;
  } else {
    logSuccess('Phase 2 détectée');
  }

  // Check if Phase 3 already executed
  const phase3Check = await querySQL(
    "SHOW TABLES LIKE 'audit_logs_archive'",
    'Vérification si Phase 3 déjà exécutée'
  );

  if (phase3Check && phase3Check.length > 0) {
    logWarning('La table audit_logs_archive existe déjà. Phase 3 peut-être déjà exécutée.');
    return false;
  }

  return true;
}

async function createArchiveTables() {
  logSection('ÉTAPE 1: CRÉATION DES TABLES D\'ARCHIVES');

  const tables = [
    {
      name: 'audit_logs_archive',
      sql: `
        CREATE TABLE IF NOT EXISTS audit_logs_archive (
          id VARCHAR(255) PRIMARY KEY,
          event_type VARCHAR(100) NOT NULL,
          user_id INT NULL,
          resource_type VARCHAR(100) NULL,
          resource_id VARCHAR(100) NULL,
          action VARCHAR(50) NOT NULL,
          details JSON NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMP NOT NULL,
          archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_archived_created_at (created_at),
          INDEX idx_archived_user_id (user_id),
          INDEX idx_archived_event_type (event_type),
          INDEX idx_archived_at (archived_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'emails_archive',
      sql: `
        CREATE TABLE IF NOT EXISTS emails_archive (
          id VARCHAR(255) PRIMARY KEY,
          to_email VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NULL,
          template_title VARCHAR(100) NULL,
          variables JSON NULL,
          html_content TEXT NULL,
          status ENUM('SENT', 'FAILED', 'BOUNCED', 'DELIVERED') NOT NULL,
          sent_at TIMESTAMP NULL,
          delivered_at TIMESTAMP NULL,
          opened_at TIMESTAMP NULL,
          clicked_at TIMESTAMP NULL,
          bounced_at TIMESTAMP NULL,
          error_message TEXT NULL,
          provider_message_id VARCHAR(255) NULL,
          user_id INT NULL,
          created_at TIMESTAMP NOT NULL,
          archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_archived_created_at (created_at),
          INDEX idx_archived_user_id (user_id),
          INDEX idx_archived_status (status),
          INDEX idx_archived_at (archived_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'email_queue_archive',
      sql: `
        CREATE TABLE IF NOT EXISTS email_queue_archive (
          id INT PRIMARY KEY,
          to_email VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NULL,
          template_title VARCHAR(100) NULL,
          variables JSON NULL,
          html_content TEXT NULL,
          attempts INT DEFAULT 0,
          max_attempts INT DEFAULT 5,
          status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
          priority INT DEFAULT 0,
          created_at TIMESTAMP NOT NULL,
          processed_at TIMESTAMP NULL,
          last_error TEXT NULL,
          user_id INT NULL,
          archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_archived_created_at (created_at),
          INDEX idx_archived_status (status),
          INDEX idx_archived_at (archived_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'sessions_archive',
      sql: `
        CREATE TABLE IF NOT EXISTS sessions_archive (
          id VARCHAR(255) PRIMARY KEY,
          token VARCHAR(255) NOT NULL,
          user_id INT NOT NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL,
          last_activity TIMESTAMP NULL,
          archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_archived_user_id (user_id),
          INDEX idx_archived_created_at (created_at),
          INDEX idx_archived_at (archived_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createStoredProcedures() {
  logSection('ÉTAPE 2: CRÉATION DES PROCÉDURES STOCKÉES');

  const procedures = [
    {
      name: 'archive_old_audit_logs',
      drop: 'DROP PROCEDURE IF EXISTS archive_old_audit_logs',
      create: `
        CREATE PROCEDURE archive_old_audit_logs(IN months_old INT)
        BEGIN
          DECLARE archived_count INT;
          INSERT INTO audit_logs_archive
            (id, event_type, user_id, resource_type, resource_id, action, details,
             ip_address, user_agent, created_at)
          SELECT id, event_type, user_id, resource_type, resource_id, action, details,
            ip_address, user_agent, created_at
          FROM audit_logs
          WHERE created_at < DATE_SUB(NOW(), INTERVAL months_old MONTH)
          AND NOT EXISTS (
            SELECT 1 FROM audit_logs_archive WHERE audit_logs_archive.id = audit_logs.id
          );
          SET archived_count = ROW_COUNT();
          DELETE FROM audit_logs
          WHERE created_at < DATE_SUB(NOW(), INTERVAL months_old MONTH);
          SELECT CONCAT('Archived ', archived_count, ' audit log records') AS result;
        END
      `
    },
    {
      name: 'archive_old_emails',
      drop: 'DROP PROCEDURE IF EXISTS archive_old_emails',
      create: `
        CREATE PROCEDURE archive_old_emails(IN months_old INT)
        BEGIN
          DECLARE archived_count INT;
          INSERT INTO emails_archive
            (id, to_email, subject, template_title, variables, html_content, status,
             sent_at, delivered_at, opened_at, clicked_at, bounced_at, error_message,
             provider_message_id, user_id, created_at)
          SELECT id, \`to\`, subject, template_title, variables, html_content, status,
            sent_at, delivered_at, opened_at, clicked_at, bounced_at, error_message,
            provider_message_id, utilisateur_id, created_at
          FROM emails
          WHERE created_at < DATE_SUB(NOW(), INTERVAL months_old MONTH)
          AND status IN ('SENT', 'DELIVERED', 'FAILED', 'BOUNCED')
          AND NOT EXISTS (
            SELECT 1 FROM emails_archive WHERE emails_archive.id = emails.id
          );
          SET archived_count = ROW_COUNT();
          DELETE FROM emails
          WHERE created_at < DATE_SUB(NOW(), INTERVAL months_old MONTH)
          AND status IN ('SENT', 'DELIVERED', 'FAILED', 'BOUNCED');
          SELECT CONCAT('Archived ', archived_count, ' email records') AS result;
        END
      `
    },
    {
      name: 'archive_completed_email_queue',
      drop: 'DROP PROCEDURE IF EXISTS archive_completed_email_queue',
      create: `
        CREATE PROCEDURE archive_completed_email_queue(IN months_old INT)
        BEGIN
          DECLARE archived_count INT;
          INSERT INTO email_queue_archive
            (id, to_email, subject, template_title, variables, html_content, attempts,
             max_attempts, status, priority, created_at, processed_at, last_error, user_id)
          SELECT id, \`to\`, subject, template_title, variables, html_content, attempts,
            max_attempts, status, priority, created_at, processed_at, last_error, utilisateur_id
          FROM email_queue
          WHERE processed_at < DATE_SUB(NOW(), INTERVAL months_old MONTH)
          AND status IN ('COMPLETED', 'FAILED')
          AND NOT EXISTS (
            SELECT 1 FROM email_queue_archive WHERE email_queue_archive.id = email_queue.id
          );
          SET archived_count = ROW_COUNT();
          DELETE FROM email_queue
          WHERE processed_at < DATE_SUB(NOW(), INTERVAL months_old MONTH)
          AND status IN ('COMPLETED', 'FAILED');
          SELECT CONCAT('Archived ', archived_count, ' email queue records') AS result;
        END
      `
    },
    {
      name: 'archive_expired_sessions',
      drop: 'DROP PROCEDURE IF EXISTS archive_expired_sessions',
      create: `
        CREATE PROCEDURE archive_expired_sessions(IN months_old INT)
        BEGIN
          DECLARE archived_count INT;
          INSERT INTO sessions_archive
            (id, token, user_id, ip_address, user_agent, expires_at, created_at, last_activity)
          SELECT id, token, user_id, ip_address, user_agent, expires_at, created_at, last_activity
          FROM Session
          WHERE expires_at < DATE_SUB(NOW(), INTERVAL months_old MONTH)
          AND NOT EXISTS (
            SELECT 1 FROM sessions_archive WHERE sessions_archive.id = Session.id
          );
          SET archived_count = ROW_COUNT();
          DELETE FROM Session
          WHERE expires_at < DATE_SUB(NOW(), INTERVAL months_old MONTH);
          SELECT CONCAT('Archived ', archived_count, ' session records') AS result;
        END
      `
    },
    {
      name: 'cleanup_expired_data_exports',
      drop: 'DROP PROCEDURE IF EXISTS cleanup_expired_data_exports',
      create: `
        CREATE PROCEDURE cleanup_expired_data_exports()
        BEGIN
          DECLARE deleted_count INT;
          UPDATE data_export_requests
          SET status = 'EXPIRED'
          WHERE expires_at < NOW()
          AND status = 'COMPLETED';
          SET deleted_count = ROW_COUNT();
          SELECT CONCAT('Marked ', deleted_count, ' data export requests as expired') AS result;
        END
      `
    },
    {
      name: 'cleanup_expired_tokens',
      drop: 'DROP PROCEDURE IF EXISTS cleanup_expired_tokens',
      create: `
        CREATE PROCEDURE cleanup_expired_tokens()
        BEGIN
          DECLARE deleted_count INT DEFAULT 0;
          DELETE FROM password_reset_tokens WHERE expires_at < NOW();
          SET deleted_count = deleted_count + ROW_COUNT();
          DELETE FROM email_validation_tokens WHERE expires_at < NOW();
          SET deleted_count = deleted_count + ROW_COUNT();
          DELETE FROM refresh_tokens WHERE expires_at < NOW();
          SET deleted_count = deleted_count + ROW_COUNT();
          DELETE FROM sms_recovery_codes WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 DAY);
          SET deleted_count = deleted_count + ROW_COUNT();
          SELECT CONCAT('Deleted ', deleted_count, ' expired tokens') AS result;
        END
      `
    }
  ];

  for (const proc of procedures) {
    await executeSQL(proc.drop, `Suppression ancienne procédure ${proc.name}`);
    await executeSQL(proc.create, `Création procédure ${proc.name}`);
  }

  return true;
}

async function addIndexes() {
  logSection('ÉTAPE 3: AJOUT DES INDEX');

  const indexes = [
    "ALTER TABLE audit_logs ADD INDEX idx_created_at_for_archive (created_at)",
    "ALTER TABLE emails ADD INDEX idx_created_at_status_for_archive (created_at, status)",
    "ALTER TABLE email_queue ADD INDEX idx_processed_status_for_archive (processed_at, status)",
    "ALTER TABLE Session ADD INDEX idx_expires_at_for_archive (expires_at)",
    "ALTER TABLE password_reset_tokens ADD INDEX idx_expires_at (expires_at)",
    "ALTER TABLE email_validation_tokens ADD INDEX idx_expires_at (expires_at)",
    "ALTER TABLE refresh_tokens ADD INDEX idx_expires_at (expires_at)",
    "ALTER TABLE sms_recovery_codes ADD INDEX idx_created_at (created_at)",
    "ALTER TABLE data_export_requests ADD INDEX idx_expires_status (expires_at, status)"
  ];

  for (const sql of indexes) {
    await executeSQL(sql, 'Ajout index');
  }

  return true;
}

async function createScheduledEvents() {
  logSection('ÉTAPE 4: CRÉATION DES ÉVÉNEMENTS PLANIFIÉS');

  // Enable event scheduler
  await executeSQL("SET GLOBAL event_scheduler = ON", "Activation de l'event scheduler");

  const events = [
    {
      name: 'evt_archive_audit_logs',
      drop: 'DROP EVENT IF EXISTS evt_archive_audit_logs',
      create: `
        CREATE EVENT evt_archive_audit_logs
        ON SCHEDULE EVERY 1 DAY
        STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR)
        DO CALL archive_old_audit_logs(6)
      `
    },
    {
      name: 'evt_archive_emails',
      drop: 'DROP EVENT IF EXISTS evt_archive_emails',
      create: `
        CREATE EVENT evt_archive_emails
        ON SCHEDULE EVERY 1 DAY
        STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 3 HOUR)
        DO CALL archive_old_emails(3)
      `
    },
    {
      name: 'evt_archive_email_queue',
      drop: 'DROP EVENT IF EXISTS evt_archive_email_queue',
      create: `
        CREATE EVENT evt_archive_email_queue
        ON SCHEDULE EVERY 1 DAY
        STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 3 HOUR + INTERVAL 30 MINUTE)
        DO CALL archive_completed_email_queue(1)
      `
    },
    {
      name: 'evt_archive_sessions',
      drop: 'DROP EVENT IF EXISTS evt_archive_sessions',
      create: `
        CREATE EVENT evt_archive_sessions
        ON SCHEDULE EVERY 1 DAY
        STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 4 HOUR)
        DO CALL archive_expired_sessions(1)
      `
    },
    {
      name: 'evt_cleanup_data_exports',
      drop: 'DROP EVENT IF EXISTS evt_cleanup_data_exports',
      create: `
        CREATE EVENT evt_cleanup_data_exports
        ON SCHEDULE EVERY 1 HOUR
        STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
        DO CALL cleanup_expired_data_exports()
      `
    },
    {
      name: 'evt_cleanup_tokens',
      drop: 'DROP EVENT IF EXISTS evt_cleanup_tokens',
      create: `
        CREATE EVENT evt_cleanup_tokens
        ON SCHEDULE EVERY 6 HOUR
        STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
        DO CALL cleanup_expired_tokens()
      `
    }
  ];

  for (const event of events) {
    await executeSQL(event.drop, `Suppression ancien événement ${event.name}`);
    await executeSQL(event.create, `Création événement ${event.name}`);
  }

  return true;
}

async function createStatsTables() {
  logSection('ÉTAPE 5: CRÉATION TABLE STATISTIQUES');

  const sql = `
    CREATE TABLE IF NOT EXISTS archive_statistics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_name VARCHAR(100) NOT NULL,
      records_archived INT NOT NULL,
      records_deleted INT NOT NULL,
      execution_time_ms INT NULL,
      archived_from_date DATE NOT NULL,
      archived_to_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_table_name (table_name),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await executeSQL(sql, 'Création table archive_statistics');

  const procSql = `
    CREATE PROCEDURE log_archive_stats(
      IN p_table_name VARCHAR(100),
      IN p_archived INT,
      IN p_deleted INT,
      IN p_exec_time INT,
      IN p_from_date DATE,
      IN p_to_date DATE
    )
    BEGIN
      INSERT INTO archive_statistics
        (table_name, records_archived, records_deleted, execution_time_ms,
         archived_from_date, archived_to_date)
      VALUES
        (p_table_name, p_archived, p_deleted, p_exec_time, p_from_date, p_to_date);
    END
  `;

  await executeSQL('DROP PROCEDURE IF EXISTS log_archive_stats', 'Suppression ancienne procédure');
  await executeSQL(procSql, 'Création procédure log_archive_stats');

  return true;
}

async function createMonitoringViews() {
  logSection('ÉTAPE 6: CRÉATION DES VUES DE MONITORING');

  const views = [
    {
      name: 'v_table_sizes',
      sql: `
        CREATE OR REPLACE VIEW v_table_sizes AS
        SELECT 'audit_logs' AS table_name, COUNT(*) AS record_count,
          MIN(created_at) AS oldest_record, MAX(created_at) AS newest_record,
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at)) AS days_range
        FROM audit_logs
        UNION ALL
        SELECT 'audit_logs_archive', COUNT(*), MIN(created_at), MAX(created_at),
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at))
        FROM audit_logs_archive
        UNION ALL
        SELECT 'emails', COUNT(*), MIN(created_at), MAX(created_at),
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at))
        FROM emails
        UNION ALL
        SELECT 'emails_archive', COUNT(*), MIN(created_at), MAX(created_at),
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at))
        FROM emails_archive
        UNION ALL
        SELECT 'email_queue', COUNT(*), MIN(created_at), MAX(created_at),
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at))
        FROM email_queue
        UNION ALL
        SELECT 'email_queue_archive', COUNT(*), MIN(created_at), MAX(created_at),
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at))
        FROM email_queue_archive
        UNION ALL
        SELECT 'Session', COUNT(*), MIN(created_at), MAX(created_at),
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at))
        FROM Session
        UNION ALL
        SELECT 'sessions_archive', COUNT(*), MIN(created_at), MAX(created_at),
          TIMESTAMPDIFF(DAY, MIN(created_at), MAX(created_at))
        FROM sessions_archive
      `
    },
    {
      name: 'v_recent_archive_stats',
      sql: `
        CREATE OR REPLACE VIEW v_recent_archive_stats AS
        SELECT table_name,
          SUM(records_archived) AS total_archived,
          SUM(records_deleted) AS total_deleted,
          AVG(execution_time_ms) AS avg_exec_time_ms,
          COUNT(*) AS execution_count,
          MAX(created_at) AS last_run
        FROM archive_statistics
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY table_name
        ORDER BY last_run DESC
      `
    }
  ];

  for (const view of views) {
    await executeSQL(view.sql, `Création vue ${view.name}`);
  }

  return true;
}

async function validateMigration() {
  logSection('ÉTAPE 7: VALIDATION');

  // Check procedures
  const procedures = await querySQL(
    `SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED, LAST_ALTERED
     FROM information_schema.ROUTINES
     WHERE ROUTINE_SCHEMA = DATABASE()
     AND (ROUTINE_NAME LIKE 'archive_%' OR ROUTINE_NAME LIKE 'cleanup_%')
     ORDER BY ROUTINE_NAME`,
    'Vérification des procédures'
  );

  if (procedures) {
    console.table(procedures);
  }

  // Check events
  const events = await querySQL(
    `SELECT EVENT_NAME, INTERVAL_VALUE, INTERVAL_FIELD, STATUS, STARTS, LAST_EXECUTED
     FROM information_schema.EVENTS
     WHERE EVENT_SCHEMA = DATABASE()
     AND EVENT_NAME LIKE 'evt_%'
     ORDER BY EVENT_NAME`,
    'Vérification des événements'
  );

  if (events) {
    console.table(events);
  }

  // Check archive tables
  const tables = await querySQL(
    `SELECT TABLE_NAME, TABLE_ROWS,
       ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME LIKE '%_archive'
     ORDER BY TABLE_NAME`,
    'Vérification des tables d\'archives'
  );

  if (tables) {
    console.table(tables);
  }

  return true;
}

async function runMigration(dryRun = false) {
  const startTime = Date.now();

  log('\n' + '█'.repeat(80), 'bright');
  log('  MIGRATION PHASE 3 - PERFORMANCE', 'bright');
  log('  Archivage et Partitionnement', 'bright');
  log('█'.repeat(80) + '\n', 'bright');

  if (dryRun) {
    logWarning('MODE DRY-RUN : Aucune modification ne sera appliquée');
  }

  try {
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk && !dryRun) {
      logError('Les pré-requis ne sont pas satisfaits. Arrêt de la migration.');
      return false;
    }

    if (dryRun) {
      log('\nEn mode dry-run, les étapes suivantes seraient exécutées:', 'yellow');
      log('1. Création des tables d\'archives', 'yellow');
      log('2. Création des procédures stockées', 'yellow');
      log('3. Ajout des index', 'yellow');
      log('4. Création des événements planifiés', 'yellow');
      log('5. Création table statistiques', 'yellow');
      log('6. Création vues de monitoring', 'yellow');
      log('7. Validation', 'yellow');
      return true;
    }

    await createArchiveTables();
    await createStoredProcedures();
    await addIndexes();
    await createScheduledEvents();
    await createStatsTables();
    await createMonitoringViews();
    await validateMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection('✓ MIGRATION PHASE 3 TERMINÉE AVEC SUCCÈS');
    log(`Durée totale: ${duration}s`, 'green');
    log('\nProchaines étapes:', 'cyan');
    log('1. Tester les procédures manuellement: CALL archive_old_audit_logs(6);', 'cyan');
    log('2. Vérifier les événements: SHOW EVENTS;', 'cyan');
    log('3. Monitorer: SELECT * FROM v_table_sizes;', 'cyan');
    log('4. Passer à la Phase 4 (Features)', 'cyan');
    return true;

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
  console.log('\n⚠️  ATTENTION: Cette migration va créer des procédures stockées et des événements planifiés.');
  console.log('Utilisez --dry-run pour un test sans modifications');
  console.log('Utilisez --force pour exécuter la migration réelle\n');
  process.exit(0);
}

runMigration(dryRun).then(success => {
  process.exit(success ? 0 : 1);
});
