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

  // Check if Phase 3 was completed
  const phase3Check = await querySQL(
    "SHOW TABLES LIKE 'audit_logs_archive'",
    'Vérification Phase 3 (audit_logs_archive)'
  );

  if (!phase3Check || phase3Check.length === 0) {
    logWarning('La Phase 3 ne semble pas avoir été exécutée (tables archives).');
  } else {
    logSuccess('Phase 3 détectée');
  }

  // Check if Phase 4 already executed
  const phase4Check = await querySQL(
    "SHOW TABLES LIKE 'email_templates'",
    'Vérification si Phase 4 déjà exécutée'
  );

  if (phase4Check && phase4Check.length > 0) {
    logWarning('La table email_templates existe déjà. Phase 4 peut-être déjà exécutée.');
    return false;
  }

  return true;
}

async function createEmailTemplateTables() {
  logSection('ÉTAPE 1: CRÉATION DES TABLES EMAIL TEMPLATES');

  const tables = [
    {
      name: 'email_templates',
      sql: `
        CREATE TABLE IF NOT EXISTS email_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_key VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(200) NOT NULL,
          description TEXT NULL,
          subject VARCHAR(500) NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT NULL,
          available_variables JSON NULL,
          category ENUM('TRANSACTIONAL', 'MARKETING', 'NOTIFICATION', 'SYSTEM') DEFAULT 'TRANSACTIONAL',
          active BOOLEAN DEFAULT TRUE,
          is_default BOOLEAN DEFAULT FALSE,
          version INT DEFAULT 1,
          parent_template_id INT NULL,
          preview_data JSON NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_template_key (template_key),
          INDEX idx_category (category),
          INDEX idx_active (active),
          INDEX idx_version (version, parent_template_id),
          INDEX idx_created_by (created_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'email_template_attachments',
      sql: `
        CREATE TABLE IF NOT EXISTS email_template_attachments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_id INT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size_bytes INT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,
          INDEX idx_template_id (template_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'email_template_versions',
      sql: `
        CREATE TABLE IF NOT EXISTS email_template_versions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_id INT NOT NULL,
          version INT NOT NULL,
          subject VARCHAR(500) NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT NULL,
          change_description TEXT NULL,
          created_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,
          UNIQUE KEY uk_template_version (template_id, version),
          INDEX idx_template_id (template_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createABTestTables() {
  logSection('ÉTAPE 2: CRÉATION DES TABLES AB TESTS');

  const tables = [
    {
      name: 'ab_tests',
      sql: `
        CREATE TABLE IF NOT EXISTS ab_tests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT NULL,
          test_type ENUM('EMAIL_SUBJECT', 'EMAIL_CONTENT', 'LANDING_PAGE', 'CTA_BUTTON', 'PRICING', 'OTHER') NOT NULL,
          resource_type VARCHAR(100) NULL,
          resource_id VARCHAR(100) NULL,
          status ENUM('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
          start_date TIMESTAMP NULL,
          end_date TIMESTAMP NULL,
          traffic_split_percentage INT DEFAULT 50,
          primary_metric VARCHAR(100) NOT NULL,
          winner_variant_id INT NULL,
          confidence_level DECIMAL(5, 2) NULL,
          created_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_status (status),
          INDEX idx_test_type (test_type),
          INDEX idx_dates (start_date, end_date),
          INDEX idx_created_by (created_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'ab_test_variants',
      sql: `
        CREATE TABLE IF NOT EXISTS ab_test_variants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_id INT NOT NULL,
          variant_name VARCHAR(50) NOT NULL,
          content JSON NOT NULL,
          email_template_id INT NULL,
          custom_subject VARCHAR(500) NULL,
          participants_count INT DEFAULT 0,
          conversions_count INT DEFAULT 0,
          conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
          FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
          UNIQUE KEY uk_test_variant (test_id, variant_name),
          INDEX idx_test_id (test_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'ab_test_participants',
      sql: `
        CREATE TABLE IF NOT EXISTS ab_test_participants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_id INT NOT NULL,
          variant_id INT NOT NULL,
          user_id INT NULL,
          session_id VARCHAR(255) NULL,
          participated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          converted BOOLEAN DEFAULT FALSE,
          converted_at TIMESTAMP NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
          FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_test_variant (test_id, variant_id),
          INDEX idx_user_id (user_id),
          INDEX idx_session_id (session_id),
          INDEX idx_converted (converted),
          INDEX idx_participated_at (participated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createEmailMetricsTables() {
  logSection('ÉTAPE 3: CRÉATION DES TABLES EMAIL METRICS');

  const tables = [
    {
      name: 'email_campaigns',
      sql: `
        CREATE TABLE IF NOT EXISTS email_campaigns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT NULL,
          template_id INT NULL,
          status ENUM('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED') DEFAULT 'DRAFT',
          scheduled_at TIMESTAMP NULL,
          started_at TIMESTAMP NULL,
          completed_at TIMESTAMP NULL,
          target_segment JSON NULL,
          recipient_count INT DEFAULT 0,
          emails_sent INT DEFAULT 0,
          emails_delivered INT DEFAULT 0,
          emails_bounced INT DEFAULT 0,
          emails_opened INT DEFAULT 0,
          emails_clicked INT DEFAULT 0,
          unsubscribes INT DEFAULT 0,
          spam_reports INT DEFAULT 0,
          delivery_rate DECIMAL(5, 2) DEFAULT 0.00,
          open_rate DECIMAL(5, 2) DEFAULT 0.00,
          click_rate DECIMAL(5, 2) DEFAULT 0.00,
          bounce_rate DECIMAL(5, 2) DEFAULT 0.00,
          unsubscribe_rate DECIMAL(5, 2) DEFAULT 0.00,
          ab_test_id INT NULL,
          created_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
          FOREIGN KEY (ab_test_id) REFERENCES ab_tests(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_status (status),
          INDEX idx_scheduled_at (scheduled_at),
          INDEX idx_template_id (template_id),
          INDEX idx_ab_test_id (ab_test_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'email_tracking',
      sql: `
        CREATE TABLE IF NOT EXISTS email_tracking (
          id VARCHAR(255) PRIMARY KEY,
          campaign_id INT NULL,
          email_id VARCHAR(255) NULL,
          user_id INT NULL,
          email_address VARCHAR(255) NOT NULL,
          sent_at TIMESTAMP NULL,
          delivered_at TIMESTAMP NULL,
          bounced_at TIMESTAMP NULL,
          bounce_type ENUM('HARD', 'SOFT', 'COMPLAINT') NULL,
          bounce_reason TEXT NULL,
          opened BOOLEAN DEFAULT FALSE,
          first_opened_at TIMESTAMP NULL,
          open_count INT DEFAULT 0,
          last_opened_at TIMESTAMP NULL,
          clicked BOOLEAN DEFAULT FALSE,
          first_clicked_at TIMESTAMP NULL,
          click_count INT DEFAULT 0,
          last_clicked_at TIMESTAMP NULL,
          unsubscribed BOOLEAN DEFAULT FALSE,
          unsubscribed_at TIMESTAMP NULL,
          marked_as_spam BOOLEAN DEFAULT FALSE,
          spam_reported_at TIMESTAMP NULL,
          tracking_pixel_loaded BOOLEAN DEFAULT FALSE,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_campaign_id (campaign_id),
          INDEX idx_user_id (user_id),
          INDEX idx_email_address (email_address),
          INDEX idx_opened (opened),
          INDEX idx_clicked (clicked),
          INDEX idx_sent_at (sent_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'email_link_clicks',
      sql: `
        CREATE TABLE IF NOT EXISTS email_link_clicks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tracking_id VARCHAR(255) NOT NULL,
          campaign_id INT NULL,
          url TEXT NOT NULL,
          url_hash VARCHAR(64) NOT NULL,
          link_label VARCHAR(255) NULL,
          clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          FOREIGN KEY (tracking_id) REFERENCES email_tracking(id) ON DELETE CASCADE,
          FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
          INDEX idx_tracking_id (tracking_id),
          INDEX idx_campaign_id (campaign_id),
          INDEX idx_url_hash (url_hash),
          INDEX idx_clicked_at (clicked_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createRateLimitTables() {
  logSection('ÉTAPE 4: CRÉATION DES TABLES RATE LIMITING');

  const tables = [
    {
      name: 'rate_limit_config',
      sql: `
        CREATE TABLE IF NOT EXISTS rate_limit_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          rule_name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT NULL,
          endpoint_pattern VARCHAR(255) NOT NULL,
          method VARCHAR(10) NULL,
          requests_per_minute INT NULL,
          requests_per_hour INT NULL,
          requests_per_day INT NULL,
          scope ENUM('GLOBAL', 'IP', 'USER', 'API_KEY') DEFAULT 'IP',
          action ENUM('THROTTLE', 'BLOCK', 'LOG_ONLY') DEFAULT 'THROTTLE',
          block_duration_seconds INT DEFAULT 3600,
          whitelist JSON NULL,
          blacklist JSON NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_endpoint_pattern (endpoint_pattern),
          INDEX idx_active (active),
          INDEX idx_scope (scope)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'rate_limit_violations',
      sql: `
        CREATE TABLE IF NOT EXISTS rate_limit_violations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          rule_id INT NOT NULL,
          identifier VARCHAR(255) NOT NULL,
          identifier_type ENUM('IP', 'USER', 'API_KEY') NOT NULL,
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          current_count INT NOT NULL,
          limit_exceeded INT NOT NULL,
          window_type ENUM('MINUTE', 'HOUR', 'DAY') NOT NULL,
          action_taken ENUM('THROTTLED', 'BLOCKED', 'LOGGED') NOT NULL,
          blocked_until TIMESTAMP NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          violated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (rule_id) REFERENCES rate_limit_config(id) ON DELETE CASCADE,
          INDEX idx_rule_id (rule_id),
          INDEX idx_identifier (identifier, identifier_type),
          INDEX idx_violated_at (violated_at),
          INDEX idx_blocked_until (blocked_until)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'rate_limit_counters',
      sql: `
        CREATE TABLE IF NOT EXISTS rate_limit_counters (
          id VARCHAR(255) PRIMARY KEY,
          rule_id INT NOT NULL,
          identifier VARCHAR(255) NOT NULL,
          window_start TIMESTAMP NOT NULL,
          window_end TIMESTAMP NOT NULL,
          request_count INT DEFAULT 0,
          last_request_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (rule_id) REFERENCES rate_limit_config(id) ON DELETE CASCADE,
          INDEX idx_rule_identifier (rule_id, identifier),
          INDEX idx_window_end (window_end)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createNotificationAndAPITables() {
  logSection('ÉTAPE 5: CRÉATION DES TABLES NOTIFICATIONS & API KEYS');

  const tables = [
    {
      name: 'notification_templates',
      sql: `
        CREATE TABLE IF NOT EXISTS notification_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_key VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(200) NOT NULL,
          notification_type ENUM('IN_APP', 'PUSH', 'SMS', 'EMAIL') NOT NULL,
          title VARCHAR(255) NULL,
          message TEXT NOT NULL,
          available_variables JSON NULL,
          priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
          category VARCHAR(100) NULL,
          action_url VARCHAR(500) NULL,
          action_label VARCHAR(100) NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_template_key (template_key),
          INDEX idx_notification_type (notification_type),
          INDEX idx_category (category),
          INDEX idx_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'api_keys',
      sql: `
        CREATE TABLE IF NOT EXISTS api_keys (
          id INT AUTO_INCREMENT PRIMARY KEY,
          key_hash VARCHAR(255) NOT NULL UNIQUE,
          key_prefix VARCHAR(20) NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT NULL,
          user_id INT NULL,
          scopes JSON NULL,
          allowed_ips JSON NULL,
          rate_limit_override INT NULL,
          active BOOLEAN DEFAULT TRUE,
          last_used_at TIMESTAMP NULL,
          usage_count BIGINT DEFAULT 0,
          expires_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
          INDEX idx_key_hash (key_hash),
          INDEX idx_user_id (user_id),
          INDEX idx_active (active),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'api_key_usage_logs',
      sql: `
        CREATE TABLE IF NOT EXISTS api_key_usage_logs (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          api_key_id INT NOT NULL,
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          status_code INT NOT NULL,
          response_time_ms INT NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
          INDEX idx_api_key_id (api_key_id),
          INDEX idx_endpoint (endpoint),
          INDEX idx_created_at (created_at),
          INDEX idx_status_code (status_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function insertDefaultData() {
  logSection('ÉTAPE 6: INSERTION DES DONNÉES PAR DÉFAUT');

  // Email templates
  await executeSQL(
    `INSERT INTO email_templates (template_key, name, category, subject, html_content, available_variables, active) VALUES
    ('welcome_email', 'Email de bienvenue', 'TRANSACTIONAL', 'Bienvenue {{user_name}} !',
     '<h1>Bienvenue {{user_name}}</h1><p>Merci de vous être inscrit à notre club de karaté.</p>',
     '["user_name", "club_name"]', TRUE),
    ('password_reset', 'Réinitialisation mot de passe', 'TRANSACTIONAL', 'Réinitialisation de votre mot de passe',
     '<h1>Réinitialisation de mot de passe</h1><p>Cliquez sur le lien suivant : <a href="{{reset_link}}">Réinitialiser</a></p>',
     '["user_name", "reset_link", "expires_in"]', TRUE),
    ('payment_confirmation', 'Confirmation de paiement', 'TRANSACTIONAL', 'Confirmation de paiement - {{amount}}€',
     '<h1>Paiement confirmé</h1><p>Merci {{user_name}}, votre paiement de {{amount}}€ a été reçu.</p>',
     '["user_name", "amount", "payment_date", "payment_method"]', TRUE),
    ('course_reminder', 'Rappel de cours', 'NOTIFICATION', 'Rappel : Cours de {{course_type}} demain',
     '<h1>N''oubliez pas votre cours !</h1><p>Votre cours de {{course_type}} aura lieu {{course_date}} à {{course_time}}.</p>',
     '["user_name", "course_type", "course_date", "course_time", "location"]', TRUE),
    ('subscription_expiring', 'Abonnement expirant', 'NOTIFICATION', 'Votre abonnement expire bientôt',
     '<h1>Renouvellement d''abonnement</h1><p>Votre abonnement expire le {{expiry_date}}.</p>',
     '["user_name", "expiry_date", "plan_name", "renewal_link"]', TRUE)`,
    'Insertion des templates d\'emails par défaut'
  );

  // Notification templates
  await executeSQL(
    `INSERT INTO notification_templates (template_key, name, notification_type, title, message, category, priority, available_variables, active) VALUES
    ('new_message', 'Nouveau message', 'IN_APP', 'Nouveau message de {{sender_name}}',
     'Vous avez reçu un nouveau message de {{sender_name}}', 'message', 'NORMAL', '["sender_name"]', TRUE),
    ('payment_received', 'Paiement reçu', 'IN_APP', 'Paiement confirmé',
     'Votre paiement de {{amount}}€ a été reçu avec succès', 'payment', 'NORMAL', '["amount"]', TRUE),
    ('course_cancelled', 'Cours annulé', 'IN_APP', 'Cours annulé',
     'Le cours du {{date}} à {{time}} a été annulé', 'course', 'HIGH', '["date", "time"]', TRUE)`,
    'Insertion des templates de notifications par défaut'
  );

  // Rate limiting config
  await executeSQL(
    `INSERT INTO rate_limit_config (rule_name, endpoint_pattern, scope, requests_per_minute, requests_per_hour, requests_per_day, action, active) VALUES
    ('auth_endpoints', '/api/auth/*', 'IP', 5, 20, 100, 'THROTTLE', TRUE),
    ('api_global', '/api/*', 'USER', 60, 1000, 10000, 'THROTTLE', TRUE),
    ('payment_endpoints', '/api/payments/*', 'USER', 10, 50, 200, 'BLOCK', TRUE),
    ('public_endpoints', '/api/public/*', 'IP', 100, 1000, NULL, 'LOG_ONLY', TRUE)`,
    'Insertion des règles de rate limiting par défaut'
  );

  return true;
}

async function createAnalyticsViews() {
  logSection('ÉTAPE 7: CRÉATION DES VUES ANALYTICS');

  const views = [
    {
      name: 'v_campaign_performance',
      sql: `
        CREATE OR REPLACE VIEW v_campaign_performance AS
        SELECT c.id, c.name, c.status, c.emails_sent, c.emails_delivered,
          c.emails_opened, c.emails_clicked, c.open_rate, c.click_rate, c.delivery_rate,
          t.name AS template_name, ab.name AS ab_test_name,
          c.created_at, c.completed_at,
          TIMESTAMPDIFF(HOUR, c.started_at, c.completed_at) AS duration_hours
        FROM email_campaigns c
        LEFT JOIN email_templates t ON t.id = c.template_id
        LEFT JOIN ab_tests ab ON ab.id = c.ab_test_id
        WHERE c.status IN ('SENT', 'SENDING')
      `
    },
    {
      name: 'v_template_usage_stats',
      sql: `
        CREATE OR REPLACE VIEW v_template_usage_stats AS
        SELECT t.id, t.template_key, t.name, t.category,
          COUNT(DISTINCT c.id) AS campaigns_count,
          SUM(c.emails_sent) AS total_emails_sent,
          AVG(c.open_rate) AS avg_open_rate,
          AVG(c.click_rate) AS avg_click_rate,
          MAX(c.created_at) AS last_used_at
        FROM email_templates t
        LEFT JOIN email_campaigns c ON c.template_id = t.id
        WHERE t.active = TRUE
        GROUP BY t.id, t.template_key, t.name, t.category
      `
    },
    {
      name: 'v_api_key_stats',
      sql: `
        CREATE OR REPLACE VIEW v_api_key_stats AS
        SELECT k.id, k.name, k.key_prefix, k.user_id, k.active,
          k.usage_count, k.last_used_at,
          COUNT(DISTINCT l.id) AS logs_count,
          AVG(l.response_time_ms) AS avg_response_time_ms,
          k.expires_at
        FROM api_keys k
        LEFT JOIN api_key_usage_logs l ON l.api_key_id = k.id AND l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY k.id, k.name, k.key_prefix, k.user_id, k.active, k.usage_count, k.last_used_at, k.expires_at
      `
    }
  ];

  for (const view of views) {
    await executeSQL(view.sql, `Création vue ${view.name}`);
  }

  return true;
}

async function validateMigration() {
  logSection('ÉTAPE 8: VALIDATION');

  const tables = await querySQL(
    `SELECT TABLE_NAME, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
     AND (TABLE_NAME LIKE 'email_template%' OR TABLE_NAME LIKE 'ab_test%' OR
          TABLE_NAME LIKE 'email_campaign%' OR TABLE_NAME LIKE 'email_tracking%' OR
          TABLE_NAME LIKE 'email_link%' OR TABLE_NAME LIKE 'rate_limit%' OR
          TABLE_NAME LIKE 'notification_template%' OR TABLE_NAME LIKE 'api_key%')
     ORDER BY TABLE_NAME`,
    'Vérification des tables créées'
  );

  if (tables) {
    console.table(tables);
  }

  // Check default data
  const emailTemplates = await querySQL(
    'SELECT template_key, name, category, active FROM email_templates',
    'Vérification des templates d\'emails'
  );

  if (emailTemplates) {
    console.table(emailTemplates);
  }

  const notifTemplates = await querySQL(
    'SELECT template_key, name, notification_type, category FROM notification_templates',
    'Vérification des templates de notifications'
  );

  if (notifTemplates) {
    console.table(notifTemplates);
  }

  const rateLimits = await querySQL(
    'SELECT rule_name, endpoint_pattern, requests_per_minute, active FROM rate_limit_config',
    'Vérification des règles de rate limiting'
  );

  if (rateLimits) {
    console.table(rateLimits);
  }

  return true;
}

async function runMigration(dryRun = false) {
  const startTime = Date.now();

  log('\n' + '█'.repeat(80), 'bright');
  log('  MIGRATION PHASE 4 - FEATURES', 'bright');
  log('  Email Templates, AB Tests, Metrics, Rate Limiting', 'bright');
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
      log('1. Création des tables email templates', 'yellow');
      log('2. Création des tables AB tests', 'yellow');
      log('3. Création des tables email metrics', 'yellow');
      log('4. Création des tables rate limiting', 'yellow');
      log('5. Création des tables notifications & API keys', 'yellow');
      log('6. Insertion des données par défaut', 'yellow');
      log('7. Création des vues analytics', 'yellow');
      log('8. Validation', 'yellow');
      return true;
    }

    await createEmailTemplateTables();
    await createABTestTables();
    await createEmailMetricsTables();
    await createRateLimitTables();
    await createNotificationAndAPITables();
    await insertDefaultData();
    await createAnalyticsViews();
    await validateMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection('✓ MIGRATION PHASE 4 TERMINÉE AVEC SUCCÈS');
    log(`Durée totale: ${duration}s`, 'green');
    log('\nProchaines étapes:', 'cyan');
    log('1. Mettre à jour le schema.prisma avec les nouveaux modèles', 'cyan');
    log('2. Exécuter: npx prisma generate', 'cyan');
    log('3. Créer les services (EmailTemplateService, ABTestService, etc.)', 'cyan');
    log('4. Créer les endpoints API', 'cyan');
    log('5. Implémenter le tracking des emails', 'cyan');
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
  console.log('\n⚠️  ATTENTION: Cette migration va créer des tables pour les templates, AB tests, metrics, etc.');
  console.log('Utilisez --dry-run pour un test sans modifications');
  console.log('Utilisez --force pour exécuter la migration réelle\n');
  process.exit(0);
}

runMigration(dryRun).then(success => {
  process.exit(success ? 0 : 1);
});
