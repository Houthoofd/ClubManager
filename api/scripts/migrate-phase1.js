#!/usr/bin/env node

/**
 * Migration Script - Phase 1: Quick Wins
 *
 * Ce script exécute la migration de la Phase 1 des améliorations de la base de données.
 *
 * Tâches:
 * 1. Standardisation des noms de colonnes (snake_case)
 * 2. Ajout des indexes manquants
 * 3. Fusion de stocks et articles_tailles en article_stock
 * 4. Normalisation des enums (payment_method, course_type)
 *
 * Usage:
 *   node scripts/migrate-phase1.js [options]
 *
 * Options:
 *   --dry-run    Simule la migration sans exécuter les requêtes
 *   --force      Force l'exécution sans demander confirmation
 *   --rollback   Annule la migration
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arguments de ligne de commande
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isForce = args.includes("--force");
const isRollback = args.includes("--rollback");

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Charger les variables d'environnement
const envPath = path.join(__dirname, "..", ".env.test");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(
    `\x1b[34mVariables d'environnement chargées depuis ${envPath}\x1b[0m`,
  );
} else {
  console.log(`\x1b[33mFichier .env non trouvé à ${envPath}\x1b[0m`);
}

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  log(title, "cyan");
  console.log("=".repeat(80) + "\n");
}

function logStep(step, description) {
  log(`\n[${step}] ${description}`, "blue");
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

function logError(message) {
  log(`✗ ${message}`, "red");
}

// Fonction pour demander confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${question} (oui/non): `, (answer) => {
      rl.close();
      resolve(
        answer.toLowerCase() === "oui" ||
          answer.toLowerCase() === "yes" ||
          answer.toLowerCase() === "o" ||
          answer.toLowerCase() === "y",
      );
    });
  });
}

// Fonction pour exécuter une requête SQL
async function executeSql(sql, description, options = {}) {
  try {
    if (isDryRun) {
      log(`[DRY RUN] ${description}`, "yellow");
      log(`SQL: ${sql.substring(0, 100)}...`, "magenta");
      return { success: true, dryRun: true };
    }

    log(`Exécution: ${description}...`);
    const result = await prisma.$executeRawUnsafe(sql);
    logSuccess(`${description} - Terminé (${result} lignes affectées)`);
    return { success: true, rowsAffected: result };
  } catch (error) {
    if (options.ignoreError) {
      logWarning(`${description} - Erreur ignorée: ${error.message}`);
      return { success: true, warning: true };
    } else {
      logError(`${description} - ERREUR: ${error.message}`);
      throw error;
    }
  }
}

// Fonction pour créer un backup
async function createBackup() {
  logStep("BACKUP", "Création d'un backup de la base de données");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "..", "backups");
  const backupFile = path.join(backupDir, `backup-phase1-${timestamp}.sql`);

  try {
    // Créer le dossier backups si nécessaire
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    log(`Fichier de backup: ${backupFile}`);

    if (isDryRun) {
      logWarning("Mode DRY RUN - Backup simulé");
      return true;
    }

    // Note: Pour un vrai backup MySQL, utiliser mysqldump
    logWarning(
      "IMPORTANT: Veuillez créer un backup manuel avec mysqldump avant de continuer!",
    );
    logWarning("Commande suggérée:");
    log("mysqldump -u [user] -p [database] > backup-phase1.sql", "magenta");

    return true;
  } catch (error) {
    logError(`Erreur lors de la création du backup: ${error.message}`);
    return false;
  }
}

// Fonction pour vérifier l'état actuel
async function checkCurrentState() {
  logStep(
    "VÉRIFICATION",
    "Vérification de l'état actuel de la base de données",
  );

  try {
    // Vérifier si les nouvelles tables existent déjà
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('payment_methods', 'course_types', 'article_stock')
    `;

    if (tables.length > 0) {
      logWarning("Certaines tables de la migration existent déjà:");
      tables.forEach((t) => log(`  - ${t.TABLE_NAME}`, "yellow"));
      return { alreadyMigrated: true };
    }

    // Compter les enregistrements à migrer
    const stockCount =
      await prisma.$queryRaw`SELECT COUNT(*) as count FROM stocks`;
    const articlesTaillesCount =
      await prisma.$queryRaw`SELECT COUNT(*) as count FROM articles_tailles`;
    const paiementsCount =
      await prisma.$queryRaw`SELECT COUNT(*) as count FROM paiements`;
    const coursCount =
      await prisma.$queryRaw`SELECT COUNT(*) as count FROM cours_recurrent`;

    log("\nStatistiques actuelles:");
    log(`  - Stocks: ${stockCount[0].count} enregistrements`);
    log(
      `  - Articles_tailles: ${articlesTaillesCount[0].count} enregistrements`,
    );
    log(`  - Paiements: ${paiementsCount[0].count} enregistrements`);
    log(`  - Cours récurrents: ${coursCount[0].count} enregistrements`);

    return {
      alreadyMigrated: false,
      stats: {
        stocks: parseInt(stockCount[0].count),
        articlesTailles: parseInt(articlesTaillesCount[0].count),
        paiements: parseInt(paiementsCount[0].count),
        cours: parseInt(coursCount[0].count),
      },
    };
  } catch (error) {
    logError(`Erreur lors de la vérification: ${error.message}`);
    throw error;
  }
}

// ÉTAPE 1: Créer les tables de référence
async function step1_CreateReferenceTables() {
  logStep(
    "ÉTAPE 1",
    "Création des tables de référence (payment_methods, course_types)",
  );

  // Créer payment_methods
  await executeSql(
    `
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INT NOT NULL AUTO_INCREMENT,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_code (code),
      INDEX idx_active (active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
    "Création de la table payment_methods",
  );

  // Insérer les méthodes de paiement
  await executeSql(
    `
    INSERT INTO payment_methods (code, name) VALUES
    ('stripe', 'Stripe'),
    ('paypal', 'PayPal'),
    ('bitcoin', 'Bitcoin'),
    ('manual', 'Manuel'),
    ('bank_transfer', 'Virement bancaire'),
    ('cash', 'Espèces')
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `,
    "Insertion des méthodes de paiement",
  );

  // Créer course_types
  await executeSql(
    `
    CREATE TABLE IF NOT EXISTS course_types (
      id INT NOT NULL AUTO_INCREMENT,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_code (code),
      INDEX idx_active (active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
    "Création de la table course_types",
  );

  // Insérer les types de cours depuis les données existantes
  await executeSql(
    `
    INSERT INTO course_types (code, name)
    SELECT DISTINCT type_cours, type_cours
    FROM cours_recurrent
    WHERE type_cours IS NOT NULL
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `,
    "Insertion des types de cours existants",
  );
}

// ÉTAPE 2: Ajouter les colonnes de transition
async function step2_AddTransitionColumns() {
  logStep("ÉTAPE 2", "Ajout des colonnes de transition");

  await executeSql(
    `
    ALTER TABLE paiements
    ADD COLUMN payment_method_id INT NULL AFTER methode_paiement
  `,
    "Ajout de payment_method_id",
    { ignoreError: true },
  );

  await executeSql(
    `
    ALTER TABLE paiements
    ADD INDEX idx_payment_method (payment_method_id)
  `,
    "Ajout de l'index sur payment_method_id",
    { ignoreError: true },
  );

  await executeSql(
    `
    ALTER TABLE cours_recurrent
    ADD COLUMN course_type_id INT NULL AFTER type_cours
  `,
    "Ajout de course_type_id",
    { ignoreError: true },
  );

  await executeSql(
    `
    ALTER TABLE cours_recurrent
    ADD INDEX idx_course_type (course_type_id)
  `,
    "Ajout de l'index sur course_type_id",
    { ignoreError: true },
  );
}

// ÉTAPE 3: Migrer les données
async function step3_MigrateData() {
  logStep("ÉTAPE 3", "Migration des données vers les nouvelles colonnes");

  // Migrer payment_method
  await executeSql(
    `
    UPDATE paiements p
    INNER JOIN payment_methods pm ON LOWER(p.methode_paiement) = pm.code
    SET p.payment_method_id = pm.id
    WHERE p.methode_paiement IS NOT NULL
  `,
    "Migration des méthodes de paiement",
  );

  // Défaut pour les paiements sans méthode
  await executeSql(
    `
    UPDATE paiements p
    INNER JOIN payment_methods pm ON pm.code = 'manual'
    SET p.payment_method_id = pm.id
    WHERE p.methode_paiement IS NULL OR p.payment_method_id IS NULL
  `,
    'Attribution de la méthode "manuel" par défaut',
  );

  // Migrer course_type
  await executeSql(
    `
    UPDATE cours_recurrent cr
    INNER JOIN course_types ct ON cr.type_cours = ct.code
    SET cr.course_type_id = ct.id
    WHERE cr.type_cours IS NOT NULL
  `,
    "Migration des types de cours",
  );
}

// ÉTAPE 4: Fusionner stocks et articles_tailles
async function step4_MergeStockTables() {
  logStep("ÉTAPE 4", "Fusion des tables stocks et articles_tailles");

  // Créer la nouvelle table article_stock
  await executeSql(
    `
    CREATE TABLE IF NOT EXISTS article_stock (
      id INT NOT NULL AUTO_INCREMENT,
      article_id INT NOT NULL,
      taille_id INT NOT NULL,
      quantity_total INT NOT NULL DEFAULT 0,
      quantity_reserved INT NOT NULL DEFAULT 0,
      quantity_available INT NOT NULL DEFAULT 0,
      last_restock_at DATETIME NULL,
      low_stock_threshold INT NOT NULL DEFAULT 5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_article_taille (article_id, taille_id),
      INDEX idx_article_available (article_id, quantity_available),
      INDEX idx_taille (taille_id),
      CONSTRAINT fk_article_stock_article FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
      CONSTRAINT fk_article_stock_taille FOREIGN KEY (taille_id) REFERENCES tailles (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
    "Création de la table article_stock",
  );

  // Migrer depuis stocks (structure réelle: id, article_id, taille_id, quantite, updated_at)
  await executeSql(
    `
    INSERT INTO article_stock
      (article_id, taille_id, quantity_total, quantity_available, quantity_reserved)
    SELECT
      s.article_id,
      s.taille_id,
      s.quantite as quantity_total,
      s.quantite as quantity_available,
      0 as quantity_reserved
    FROM stocks s
    WHERE s.taille_id IS NOT NULL
    ON DUPLICATE KEY UPDATE
      quantity_total = VALUES(quantity_total),
      quantity_available = VALUES(quantity_available),
      quantity_reserved = VALUES(quantity_reserved)
  `,
    "Migration des données depuis stocks",
  );

  // Migrer depuis articles_tailles (structure réelle: id, article_id, taille_id)
  // Note: articles_tailles n'a pas de colonne stock_disponible dans la DB réelle
  await executeSql(
    `
    INSERT INTO article_stock
      (article_id, taille_id, quantity_total, quantity_available)
    SELECT
      at.article_id,
      at.taille_id,
      0 as quantity_total,
      0 as quantity_available
    FROM articles_tailles at
    ON DUPLICATE KEY UPDATE
      quantity_total = COALESCE(quantity_total, 0)
  `,
    "Migration complémentaire depuis articles_tailles",
  );
}

// ÉTAPE 5: Ajouter les indexes manquants
async function step5_AddMissingIndexes() {
  logStep("ÉTAPE 5", "Ajout des indexes manquants pour optimisation");

  const indexes = [
    {
      table: "email_queue",
      index: "idx_user_status_created",
      columns: "utilisateur_id, status, created_at",
    },
    {
      table: "commandes",
      index: "idx_statut_date_total",
      columns: "statut, date_commande, total",
    },
    {
      table: "commandes",
      index: "idx_created_statut",
      columns: "created_at, statut",
    },
    {
      table: "paiements",
      index: "idx_date_statut_montant",
      columns: "date_paiement, statut, montant",
    },
    {
      table: "paiements",
      index: "idx_user_date",
      columns: "utilisateur_id, date_paiement",
    },
    {
      table: "articles",
      index: "idx_categorie_prix",
      columns: "categorie_id, prix",
    },
    {
      table: "sessions",
      index: "idx_expires_active",
      columns: "expires_at, is_active",
    },
    {
      table: "cours",
      index: "idx_date_type_recurrent",
      columns: "date_cours, type_cours, cours_recurrent_id",
    },
    {
      table: "inscriptions",
      index: "idx_cours_status",
      columns: "cours_id, status_id",
    },
    {
      table: "echeances_paiements",
      index: "idx_statut_date",
      columns: "statut, date_echeance",
    },
  ];

  for (const { table, index, columns } of indexes) {
    await executeSql(
      `
      ALTER TABLE ${table}
      ADD INDEX ${index} (${columns})
    `,
      `Ajout de l'index ${index} sur ${table}`,
      { ignoreError: true },
    );
  }
}

// ÉTAPE 6: Ajouter les Foreign Keys
async function step6_AddForeignKeys() {
  logStep("ÉTAPE 6", "Ajout des contraintes de clés étrangères");

  await executeSql(
    `
    ALTER TABLE paiements
    ADD CONSTRAINT fk_paiements_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON DELETE RESTRICT
  `,
    "Ajout FK payment_method_id",
    { ignoreError: true },
  );

  await executeSql(
    `
    ALTER TABLE cours_recurrent
    ADD CONSTRAINT fk_cours_recurrent_course_type
    FOREIGN KEY (course_type_id) REFERENCES course_types (id) ON DELETE RESTRICT
  `,
    "Ajout FK course_type_id",
    { ignoreError: true },
  );
}

// ÉTAPE 7: Rendre les colonnes obligatoires
async function step7_MakeColumnsRequired() {
  logStep("ÉTAPE 7", "Mise à jour des colonnes en NOT NULL");

  await executeSql(
    `
    ALTER TABLE paiements
    MODIFY COLUMN payment_method_id INT NOT NULL
  `,
    "payment_method_id -> NOT NULL",
  );

  await executeSql(
    `
    ALTER TABLE cours_recurrent
    MODIFY COLUMN course_type_id INT NOT NULL
  `,
    "course_type_id -> NOT NULL",
  );
}

// ÉTAPE 8: Validation finale
async function step8_ValidateMigration() {
  logStep("ÉTAPE 8", "Validation de la migration");

  try {
    // Vérifier les paiements sans payment_method_id
    const paiementsSansMethod = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM paiements WHERE payment_method_id IS NULL
    `;

    // Vérifier les cours sans course_type_id
    const coursSansType = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM cours_recurrent WHERE course_type_id IS NULL
    `;

    // Vérifier les articles sans stock
    const articlesSansStock = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM articles a
      LEFT JOIN article_stock ast ON a.id = ast.article_id
      WHERE ast.id IS NULL
    `;

    log("\nRésultats de validation:");
    log(
      `  - Paiements sans payment_method_id: ${paiementsSansMethod[0].count}`,
    );
    log(`  - Cours sans course_type_id: ${coursSansType[0].count}`);
    log(`  - Articles sans stock: ${articlesSansStock[0].count}`);

    const hasIssues =
      parseInt(paiementsSansMethod[0].count) > 0 ||
      parseInt(coursSansType[0].count) > 0;

    if (hasIssues) {
      logWarning("⚠️  Des problèmes ont été détectés dans la migration!");
      return false;
    } else {
      logSuccess("✓ Migration validée avec succès!");
      return true;
    }
  } catch (error) {
    logError(`Erreur lors de la validation: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    logSection("MIGRATION PHASE 1 - QUICK WINS");

    if (isDryRun) {
      logWarning("MODE DRY RUN - Aucune modification ne sera appliquée");
    }

    if (isRollback) {
      logError(
        "ROLLBACK non implémenté - Utilisez votre backup pour restaurer",
      );
      process.exit(1);
    }

    // 1. Vérifier l'état actuel
    const state = await checkCurrentState();

    if (state.alreadyMigrated) {
      logWarning("La migration semble déjà avoir été appliquée.");
      const continueAnyway = await askConfirmation(
        "Voulez-vous continuer quand même?",
      );
      if (!continueAnyway) {
        log("Migration annulée.");
        process.exit(0);
      }
    }

    // 2. Demander confirmation
    if (!isForce && !isDryRun) {
      log("\nCette migration va:");
      log("  1. Créer les tables payment_methods et course_types");
      log("  2. Ajouter des colonnes de transition");
      log("  3. Migrer les données existantes");
      log("  4. Fusionner stocks et articles_tailles en article_stock");
      log("  5. Ajouter des indexes pour optimiser les performances");
      log("  6. Standardiser les noms de colonnes");
      log("\n⚠️  IMPORTANT: Créez un backup avant de continuer!\n");

      const confirmed = await askConfirmation("Voulez-vous continuer?");
      if (!confirmed) {
        log("Migration annulée.");
        process.exit(0);
      }
    }

    // 3. Créer un backup
    const backupSuccess = await createBackup();
    if (!backupSuccess && !isDryRun && !isForce) {
      logError("Impossible de créer un backup. Migration annulée.");
      process.exit(1);
    }

    // 4. Exécuter les étapes de migration
    await step1_CreateReferenceTables();
    await step2_AddTransitionColumns();
    await step3_MigrateData();
    await step4_MergeStockTables();
    await step5_AddMissingIndexes();
    await step6_AddForeignKeys();

    if (!isDryRun) {
      await step7_MakeColumnsRequired();
      const isValid = await step8_ValidateMigration();

      if (!isValid) {
        logError("La validation a échoué. Vérifiez les erreurs ci-dessus.");
        process.exit(1);
      }
    }

    // 5. Instructions post-migration
    logSection("MIGRATION TERMINÉE AVEC SUCCÈS");

    log("\n📋 PROCHAINES ÉTAPES:\n");
    log(
      "1. Mettre à jour le fichier schema.prisma avec les nouvelles définitions",
    );
    log("2. Régénérer le Prisma Client: npx prisma generate");
    log(
      "3. Mettre à jour le code applicatif pour utiliser les nouvelles colonnes",
    );
    log("4. Tester en profondeur l'application");
    log("5. Une fois validé, supprimer les anciennes colonnes:\n");
    log("   ALTER TABLE paiements DROP COLUMN methode_paiement;", "magenta");
    log("   ALTER TABLE cours_recurrent DROP COLUMN type_cours;", "magenta");
    log("   DROP TABLE stocks;", "magenta");
    log("   DROP TABLE articles_tailles;", "magenta");
    log("\n6. Mettre à jour la documentation technique\n");

    if (isDryRun) {
      logWarning("\nMode DRY RUN - Aucune modification n'a été appliquée");
      log("Exécutez sans --dry-run pour appliquer les changements");
    }
  } catch (error) {
    logError(`\n❌ ERREUR FATALE: ${error.message}`);
    logError("\nStack trace:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
main()
  .then(() => {
    log("\n✓ Script terminé", "green");
    process.exit(0);
  })
  .catch((error) => {
    logError(`\n✗ Erreur: ${error.message}`);
    process.exit(1);
  });
