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

  // Check if events system already exists
  const eventsCheck = await querySQL(
    "SHOW TABLES LIKE 'events'",
    'Vérification si système événements déjà installé'
  );

  if (eventsCheck && eventsCheck.length > 0) {
    logWarning('La table events existe déjà. Migration peut-être déjà exécutée.');
    return false;
  }

  return true;
}

async function createMainTables() {
  logSection('ÉTAPE 1: CRÉATION DES TABLES PRINCIPALES');

  const tables = [
    {
      name: 'event_types',
      sql: `
        CREATE TABLE IF NOT EXISTS event_types (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          icon VARCHAR(50) NULL,
          color VARCHAR(20) NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_code (code),
          INDEX idx_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'venues',
      sql: `
        CREATE TABLE IF NOT EXISTS venues (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(100) DEFAULT 'Belgique',
          latitude DECIMAL(10, 8) NULL,
          longitude DECIMAL(11, 8) NULL,
          phone VARCHAR(20) NULL,
          email VARCHAR(100) NULL,
          website VARCHAR(500) NULL,
          capacity INT NULL,
          facilities JSON NULL,
          wheelchair_accessible BOOLEAN DEFAULT FALSE,
          public_transport_info TEXT NULL,
          parking_info TEXT NULL,
          notes TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_city (city),
          INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'events',
      sql: `
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_type_id INT NOT NULL,
          venue_id INT NULL,
          title VARCHAR(200) NOT NULL,
          slug VARCHAR(250) NOT NULL UNIQUE,
          description TEXT NULL,
          short_description VARCHAR(500) NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          start_time TIME NULL,
          end_time TIME NULL,
          timezone VARCHAR(50) DEFAULT 'Europe/Brussels',
          organizer_name VARCHAR(200) NULL,
          organizer_email VARCHAR(100) NULL,
          organizer_phone VARCHAR(20) NULL,
          organizer_website VARCHAR(500) NULL,
          min_participants INT NULL,
          max_participants INT NULL,
          current_participants INT DEFAULT 0,
          registration_required BOOLEAN DEFAULT TRUE,
          registration_start_date TIMESTAMP NULL,
          registration_end_date TIMESTAMP NULL,
          registration_fee DECIMAL(10, 2) NULL,
          categories JSON NULL,
          belt_levels JSON NULL,
          age_min INT NULL,
          age_max INT NULL,
          status ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED') DEFAULT 'DRAFT',
          visibility ENUM('PUBLIC', 'MEMBERS_ONLY', 'PRIVATE') DEFAULT 'PUBLIC',
          featured BOOLEAN DEFAULT FALSE,
          cover_image_url VARCHAR(500) NULL,
          banner_image_url VARCHAR(500) NULL,
          meta_title VARCHAR(200) NULL,
          meta_description VARCHAR(500) NULL,
          external_url VARCHAR(500) NULL,
          facebook_event_url VARCHAR(500) NULL,
          deleted_at TIMESTAMP NULL,
          deleted_by INT NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE RESTRICT,
          FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          FOREIGN KEY (updated_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_event_type (event_type_id),
          INDEX idx_venue (venue_id),
          INDEX idx_slug (slug),
          INDEX idx_dates (start_date, end_date),
          INDEX idx_status (status),
          INDEX idx_visibility (visibility),
          INDEX idx_featured (featured),
          INDEX idx_deleted_at (deleted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createRegistrationTables() {
  logSection('ÉTAPE 2: CRÉATION DES TABLES INSCRIPTIONS');

  const tables = [
    {
      name: 'event_registrations',
      sql: `
        CREATE TABLE IF NOT EXISTS event_registrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          user_id INT NOT NULL,
          status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST', 'REJECTED') DEFAULT 'PENDING',
          participant_first_name VARCHAR(100) NULL,
          participant_last_name VARCHAR(100) NULL,
          participant_email VARCHAR(100) NULL,
          participant_phone VARCHAR(20) NULL,
          participant_date_of_birth DATE NULL,
          participant_belt_level VARCHAR(50) NULL,
          category VARCHAR(100) NULL,
          payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'WAIVED') DEFAULT 'PENDING',
          payment_amount DECIMAL(10, 2) NULL,
          payment_id INT NULL,
          emergency_contact_name VARCHAR(100) NULL,
          emergency_contact_phone VARCHAR(20) NULL,
          medical_info TEXT NULL,
          terms_accepted BOOLEAN DEFAULT FALSE,
          photo_consent BOOLEAN DEFAULT FALSE,
          notes TEXT NULL,
          admin_notes TEXT NULL,
          registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          confirmed_at TIMESTAMP NULL,
          cancelled_at TIMESTAMP NULL,
          cancellation_reason TEXT NULL,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
          FOREIGN KEY (payment_id) REFERENCES paiements(id) ON DELETE SET NULL,
          UNIQUE KEY uk_event_user (event_id, user_id),
          INDEX idx_event_id (event_id),
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_payment_status (payment_status),
          INDEX idx_registered_at (registered_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'event_teams',
      sql: `
        CREATE TABLE IF NOT EXISTS event_teams (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          team_name VARCHAR(200) NOT NULL,
          captain_user_id INT NULL,
          club_name VARCHAR(200) NULL,
          category VARCHAR(100) NULL,
          status ENUM('REGISTERED', 'CONFIRMED', 'CANCELLED') DEFAULT 'REGISTERED',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (captain_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_event_id (event_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'event_team_members',
      sql: `
        CREATE TABLE IF NOT EXISTS event_team_members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          team_id INT NOT NULL,
          user_id INT NULL,
          first_name VARCHAR(100) NULL,
          last_name VARCHAR(100) NULL,
          belt_level VARCHAR(50) NULL,
          role ENUM('MEMBER', 'CAPTAIN', 'SUBSTITUTE') DEFAULT 'MEMBER',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES event_teams(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_team_id (team_id),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createResultsTables() {
  logSection('ÉTAPE 3: CRÉATION DES TABLES RÉSULTATS');

  const tables = [
    {
      name: 'event_competition_categories',
      sql: `
        CREATE TABLE IF NOT EXISTS event_competition_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT NULL,
          age_min INT NULL,
          age_max INT NULL,
          gender ENUM('MALE', 'FEMALE', 'MIXED', 'ANY') DEFAULT 'ANY',
          belt_level_min VARCHAR(50) NULL,
          belt_level_max VARCHAR(50) NULL,
          weight_class VARCHAR(100) NULL,
          max_participants INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          INDEX idx_event_id (event_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'event_results',
      sql: `
        CREATE TABLE IF NOT EXISTS event_results (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          category_id INT NULL,
          registration_id INT NOT NULL,
          rank INT NULL,
          medal ENUM('GOLD', 'SILVER', 'BRONZE', 'NONE') NULL,
          score DECIMAL(10, 2) NULL,
          points INT NULL,
          time_seconds DECIMAL(10, 2) NULL,
          technical_score DECIMAL(10, 2) NULL,
          artistic_score DECIMAL(10, 2) NULL,
          wins INT DEFAULT 0,
          losses INT DEFAULT 0,
          draws INT DEFAULT 0,
          notes TEXT NULL,
          judges_comments TEXT NULL,
          validated BOOLEAN DEFAULT FALSE,
          validated_by INT NULL,
          validated_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES event_competition_categories(id) ON DELETE SET NULL,
          FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
          FOREIGN KEY (validated_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_event_id (event_id),
          INDEX idx_category_id (category_id),
          INDEX idx_registration_id (registration_id),
          INDEX idx_rank (rank),
          INDEX idx_medal (medal)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'event_team_results',
      sql: `
        CREATE TABLE IF NOT EXISTS event_team_results (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          team_id INT NOT NULL,
          rank INT NULL,
          medal ENUM('GOLD', 'SILVER', 'BRONZE', 'NONE') NULL,
          total_points INT DEFAULT 0,
          wins INT DEFAULT 0,
          losses INT DEFAULT 0,
          draws INT DEFAULT 0,
          notes TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (team_id) REFERENCES event_teams(id) ON DELETE CASCADE,
          INDEX idx_event_id (event_id),
          INDEX idx_team_id (team_id),
          INDEX idx_rank (rank)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createMediaTables() {
  logSection('ÉTAPE 4: CRÉATION DES TABLES MÉDIAS');

  const tables = [
    {
      name: 'event_media',
      sql: `
        CREATE TABLE IF NOT EXISTS event_media (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          media_type ENUM('PHOTO', 'VIDEO', 'DOCUMENT') NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_size_bytes BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          thumbnail_url VARCHAR(500) NULL,
          title VARCHAR(200) NULL,
          description TEXT NULL,
          alt_text VARCHAR(500) NULL,
          display_order INT DEFAULT 0,
          is_featured BOOLEAN DEFAULT FALSE,
          visibility ENUM('PUBLIC', 'MEMBERS_ONLY', 'PRIVATE') DEFAULT 'PUBLIC',
          uploaded_by INT NULL,
          uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (uploaded_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_event_id (event_id),
          INDEX idx_media_type (media_type),
          INDEX idx_visibility (visibility),
          INDEX idx_display_order (display_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'event_documents',
      sql: `
        CREATE TABLE IF NOT EXISTS event_documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          document_type ENUM('RULES', 'SCHEDULE', 'CERTIFICATE', 'INVOICE', 'FORM', 'OTHER') NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_size_bytes BIGINT NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT NULL,
          visibility ENUM('PUBLIC', 'MEMBERS_ONLY', 'REGISTERED_ONLY', 'PRIVATE') DEFAULT 'PUBLIC',
          version VARCHAR(20) NULL,
          language VARCHAR(10) DEFAULT 'fr',
          uploaded_by INT NULL,
          uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (uploaded_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
          INDEX idx_event_id (event_id),
          INDEX idx_document_type (document_type),
          INDEX idx_visibility (visibility)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création de la table ${table.name}`);
  }

  return true;
}

async function createRemindersTables() {
  logSection('ÉTAPE 5: CRÉATION DES TABLES RAPPELS');

  const sql = `
    CREATE TABLE IF NOT EXISTS event_reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      reminder_type ENUM('REGISTRATION_OPEN', 'REGISTRATION_CLOSING', 'EVENT_APPROACHING', 'EVENT_TODAY', 'CUSTOM') NOT NULL,
      send_at TIMESTAMP NOT NULL,
      days_before INT NULL,
      target_audience ENUM('ALL_REGISTERED', 'CONFIRMED_ONLY', 'PENDING_ONLY', 'ALL_MEMBERS', 'CUSTOM') NOT NULL,
      subject VARCHAR(500) NULL,
      message TEXT NULL,
      notification_channels JSON NULL,
      status ENUM('PENDING', 'SENT', 'CANCELLED', 'FAILED') DEFAULT 'PENDING',
      sent_at TIMESTAMP NULL,
      sent_count INT DEFAULT 0,
      created_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
      INDEX idx_event_id (event_id),
      INDEX idx_send_at (send_at),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await executeSQL(sql, 'Création de la table event_reminders');

  return true;
}

async function insertDefaultData() {
  logSection('ÉTAPE 6: INSERTION DES DONNÉES PAR DÉFAUT');

  await executeSQL(
    `INSERT INTO event_types (code, name, description, icon, color, active) VALUES
    ('TOURNAMENT', 'Tournoi', 'Compétition de karaté avec classement', 'trophy', '#FFD700', TRUE),
    ('STAGE', 'Stage', 'Stage de formation et perfectionnement', 'graduation-cap', '#4CAF50', TRUE),
    ('SEMINAR', 'Séminaire', 'Séminaire technique avec expert', 'book-open', '#2196F3', TRUE),
    ('GALA', 'Gala', 'Démonstration et spectacle', 'star', '#9C27B0', TRUE),
    ('CHAMPIONSHIP', 'Championnat', 'Championnat régional ou national', 'award', '#FF5722', TRUE),
    ('TRAINING_CAMP', 'Camp d''entraînement', 'Camp intensif de plusieurs jours', 'tent', '#FF9800', TRUE),
    ('EXAM', 'Examen de passage', 'Passage de grade officiel', 'certificate', '#00BCD4', TRUE),
    ('SOCIAL', 'Événement social', 'Fête, barbecue, activité sociale', 'users', '#E91E63', TRUE),
    ('CHARITY', 'Événement caritatif', 'Événement de collecte de fonds', 'heart', '#F44336', TRUE),
    ('EXHIBITION', 'Exhibition', 'Démonstration publique', 'eye', '#607D8B', TRUE)`,
    'Insertion des types d\'événements par défaut'
  );

  return true;
}

async function createViews() {
  logSection('ÉTAPE 7: CRÉATION DES VUES ANALYTICS');

  const views = [
    {
      name: 'v_upcoming_events',
      sql: `
        CREATE OR REPLACE VIEW v_upcoming_events AS
        SELECT e.id, e.title, e.slug, e.start_date, e.end_date, e.start_time,
          et.name AS event_type, v.name AS venue_name, v.city,
          e.current_participants, e.max_participants, e.status, e.visibility, e.featured,
          DATEDIFF(e.start_date, CURDATE()) AS days_until_event
        FROM events e
        LEFT JOIN event_types et ON et.id = e.event_type_id
        LEFT JOIN venues v ON v.id = e.venue_id
        WHERE e.status = 'PUBLISHED' AND e.deleted_at IS NULL AND e.start_date >= CURDATE()
        ORDER BY e.start_date ASC
      `
    },
    {
      name: 'v_event_statistics',
      sql: `
        CREATE OR REPLACE VIEW v_event_statistics AS
        SELECT e.id, e.title,
          COUNT(DISTINCT er.id) AS total_registrations,
          COUNT(DISTINCT CASE WHEN er.status = 'CONFIRMED' THEN er.id END) AS confirmed_registrations,
          COUNT(DISTINCT CASE WHEN er.status = 'PENDING' THEN er.id END) AS pending_registrations,
          COUNT(DISTINCT CASE WHEN er.status = 'CANCELLED' THEN er.id END) AS cancelled_registrations,
          COUNT(DISTINCT CASE WHEN er.payment_status = 'PAID' THEN er.id END) AS paid_registrations,
          SUM(CASE WHEN er.payment_status = 'PAID' THEN er.payment_amount ELSE 0 END) AS total_revenue,
          COUNT(DISTINCT em.id) AS media_count,
          COUNT(DISTINCT res.id) AS results_count
        FROM events e
        LEFT JOIN event_registrations er ON er.event_id = e.id
        LEFT JOIN event_media em ON em.event_id = e.id
        LEFT JOIN event_results res ON res.event_id = e.id
        WHERE e.deleted_at IS NULL
        GROUP BY e.id, e.title
      `
    },
    {
      name: 'v_participant_rankings',
      sql: `
        CREATE OR REPLACE VIEW v_participant_rankings AS
        SELECT u.id AS user_id, u.first_name, u.last_name,
          COUNT(DISTINCT er.event_id) AS events_participated,
          COUNT(DISTINCT CASE WHEN res.medal = 'GOLD' THEN res.id END) AS gold_medals,
          COUNT(DISTINCT CASE WHEN res.medal = 'SILVER' THEN res.id END) AS silver_medals,
          COUNT(DISTINCT CASE WHEN res.medal = 'BRONZE' THEN res.id END) AS bronze_medals,
          SUM(COALESCE(res.points, 0)) AS total_points
        FROM utilisateurs u
        JOIN event_registrations er ON er.user_id = u.id
        LEFT JOIN event_results res ON res.registration_id = er.id
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY total_points DESC
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
     AND (TABLE_NAME LIKE 'event%' OR TABLE_NAME LIKE 'venue%')
     ORDER BY TABLE_NAME`,
    'Vérification des tables créées'
  );

  if (tables) {
    console.table(tables);
  }

  const eventTypes = await querySQL(
    'SELECT code, name, icon, color, active FROM event_types ORDER BY name',
    'Vérification des types d\'événements'
  );

  if (eventTypes) {
    console.table(eventTypes);
  }

  return true;
}

async function runMigration(dryRun = false) {
  const startTime = Date.now();

  log('\n' + '█'.repeat(80), 'bright');
  log('  MIGRATION EVENTS SYSTEM', 'bright');
  log('  Événements extérieurs (tournois, stages, galas, etc.)', 'bright');
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
      log('1. Création des tables principales (event_types, venues, events)', 'yellow');
      log('2. Création des tables inscriptions', 'yellow');
      log('3. Création des tables résultats', 'yellow');
      log('4. Création des tables médias', 'yellow');
      log('5. Création des tables rappels', 'yellow');
      log('6. Insertion des données par défaut (10 types d\'événements)', 'yellow');
      log('7. Création des vues analytics', 'yellow');
      log('8. Validation', 'yellow');
      return true;
    }

    await createMainTables();
    await createRegistrationTables();
    await createResultsTables();
    await createMediaTables();
    await createRemindersTables();
    await insertDefaultData();
    await createViews();
    await validateMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection('✓ MIGRATION EVENTS SYSTEM TERMINÉE AVEC SUCCÈS');
    log(`Durée totale: ${duration}s`, 'green');
    log('\nProchaines étapes:', 'cyan');
    log('1. Mettre à jour le schema.prisma avec les nouveaux modèles', 'cyan');
    log('2. Exécuter: npx prisma generate', 'cyan');
    log('3. Créer EventService, RegistrationService, ResultsService', 'cyan');
    log('4. Créer les endpoints API CRUD pour événements', 'cyan');
    log('5. Implémenter le système d\'inscription', 'cyan');
    log('6. Créer le calendrier public d\'événements', 'cyan');
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
  console.log('\n⚠️  ATTENTION: Cette migration va créer le système complet d\'événements.');
  console.log('Utilisez --dry-run pour un test sans modifications');
  console.log('Utilisez --force pour exécuter la migration réelle\n');
  process.exit(0);
}

runMigration(dryRun).then(success => {
  process.exit(success ? 0 : 1);
});
