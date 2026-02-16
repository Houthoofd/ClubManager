#!/usr/bin/env node

/**
 * ============================================================================
 * SCRIPT DE MISE À JOUR AUTOMATIQUE DU SCHEMA.PRISMA FR → EN
 * ============================================================================
 * Description: Met à jour automatiquement les @@map() dans schema.prisma
 * Usage: node 04_update_prisma_schema.js
 * Prérequis: Node.js installé
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");

// Configuration
const SCHEMA_PATH = path.join(__dirname, "../../../api/prisma/schema.prisma");
const BACKUP_PATH = path.join(
  __dirname,
  "../../../api/prisma/schema.prisma.backup",
);

// Mapping des noms de tables FR → EN
const TABLE_MAPPINGS = {
  // Commerce et Articles
  articles: "shop_articles",
  commandes: "orders",
  commande_articles: "order_items",
  historique_statuts_commande: "order_status_history",
  categories: "article_categories",
  tailles: "sizes",
  images: "article_images",

  // Cours et Planning
  cours: "course_instances",
  cours_recurrent: "recurring_courses",
  cours_recurrent_professeur: "recurring_course_teachers",
  reservations: "bookings",
  inscriptions: "enrollments",

  // Paiements
  paiements: "payments",
  echeances_paiements: "payment_schedules",
  plans_tarifaires: "pricing_plans",

  // Utilisateurs et Authentification
  utilisateurs: "users",
  professeurs: "teachers",
  genres: "genders",
  grades: "belt_grades",

  // Groupes et Permissions
  groupes: "user_groups",
  groupes_utilisateurs: "user_group_members",
  status: "user_roles",

  // Messages et Notifications
  messages: "direct_messages",
  messages_personnalises: "custom_messages",
  message_status: "message_read_status",
  types_messages_personnalises: "custom_message_types",

  // Sécurité et Tokens
  password_reset_tokens: "password_reset_tokens_legacy",
  email_validation_tokens: "email_validation_tokens_legacy",
  validation_tokens: "validation_tokens_legacy",
  refresh_tokens: "refresh_tokens_legacy",
  sms_recovery_codes: "sms_recovery_codes_legacy",
  manual_recovery_requests: "manual_recovery_requests_legacy",
  auth_attempts: "login_attempts",
  password_reset_attempts: "password_reset_rate_limits",

  // Alertes
  alertes_utilisateurs: "user_alerts",
  alertes_types: "alert_types",
  alertes_actions: "alert_actions",

  // Notifications
  notifications: "user_notifications",

  // Statistiques
  statistiques: "legacy_statistics",
};

// Mapping des noms de modèles Prisma suggérés
const MODEL_NAME_SUGGESTIONS = {
  articles: "ShopArticle",
  commandes: "Order",
  commande_articles: "OrderItem",
  historique_statuts_commande: "OrderStatusHistory",
  categories: "ArticleCategory",
  tailles: "Size",
  images: "ArticleImage",
  cours: "CourseInstance",
  cours_recurrent: "RecurringCourse",
  cours_recurrent_professeur: "RecurringCourseTeacher",
  reservations: "Booking",
  inscriptions: "Enrollment",
  paiements: "Payment",
  echeances_paiements: "PaymentSchedule",
  plans_tarifaires: "PricingPlan",
  utilisateurs: "User",
  professeurs: "Teacher",
  genres: "Gender",
  grades: "BeltGrade",
  groupes: "UserGroup",
  groupes_utilisateurs: "UserGroupMember",
  status: "UserRole",
  messages: "DirectMessage",
  messages_personnalises: "CustomMessage",
  message_status: "MessageReadStatus",
  types_messages_personnalises: "CustomMessageType",
  password_reset_tokens: "PasswordResetTokenLegacy",
  email_validation_tokens: "EmailValidationTokenLegacy",
  validation_tokens: "ValidationTokenLegacy",
  refresh_tokens: "RefreshTokenLegacy",
  sms_recovery_codes: "SmsRecoveryCodeLegacy",
  manual_recovery_requests: "ManualRecoveryRequestLegacy",
  auth_attempts: "LoginAttempt",
  password_reset_attempts: "PasswordResetRateLimit",
  alertes_utilisateurs: "UserAlert",
  alertes_types: "AlertType",
  alertes_actions: "AlertAction",
  notifications: "UserNotification",
  statistiques: "LegacyStatistic",
};

/**
 * Crée une sauvegarde du schema.prisma
 */
function createBackup() {
  console.log("📦 Création du backup...");
  if (fs.existsSync(SCHEMA_PATH)) {
    fs.copyFileSync(SCHEMA_PATH, BACKUP_PATH);
    console.log(`✅ Backup créé: ${BACKUP_PATH}`);
  } else {
    console.error(`❌ Fichier schema.prisma introuvable: ${SCHEMA_PATH}`);
    process.exit(1);
  }
}

/**
 * Met à jour les @@map() dans le schema
 */
function updateSchemaMappings() {
  console.log("\n🔄 Mise à jour du schema.prisma...");

  let content = fs.readFileSync(SCHEMA_PATH, "utf8");
  let changesCount = 0;

  // Remplacer chaque mapping
  Object.entries(TABLE_MAPPINGS).forEach(([oldName, newName]) => {
    // Pattern pour trouver @@map("old_name")
    const pattern = new RegExp(`@@map\\("${oldName}"\\)`, "g");
    const matches = content.match(pattern);

    if (matches) {
      content = content.replace(pattern, `@@map("${newName}")`);
      changesCount += matches.length;
      console.log(`  ✓ ${oldName} → ${newName}`);
    }
  });

  // Sauvegarder le fichier modifié
  fs.writeFileSync(SCHEMA_PATH, content, "utf8");

  console.log(`\n✅ ${changesCount} mappings mis à jour dans schema.prisma`);
}

/**
 * Génère un rapport de migration
 */
function generateMigrationReport() {
  console.log("\n📊 RAPPORT DE MIGRATION");
  console.log("═".repeat(80));

  console.log("\n🔧 Actions effectuées:");
  console.log("  ✅ Backup créé: schema.prisma.backup");
  console.log("  ✅ Mappings @@map() mis à jour");
  console.log(`  ✅ ${Object.keys(TABLE_MAPPINGS).length} tables migrées`);

  console.log("\n⚠️  ACTIONS REQUISES:");
  console.log("  1. Exécuter: npx prisma generate");
  console.log("  2. Redémarrer votre application");
  console.log("  3. Tester toutes les fonctionnalités");

  console.log("\n💡 RECOMMANDATIONS (optionnel):");
  console.log(
    "  Pour renommer également les modèles Prisma (ex: articles → ShopArticle):",
  );
  console.log("  - Éditer manuellement schema.prisma");
  console.log("  - Mettre à jour le code applicatif en conséquence");
  console.log("  - Exemples de noms suggérés:");

  Object.entries(MODEL_NAME_SUGGESTIONS)
    .slice(0, 10)
    .forEach(([old, suggested]) => {
      console.log(`    • model ${old} → model ${suggested}`);
    });
  console.log("    • ... (voir script pour liste complète)");

  console.log("\n🔄 Pour annuler les changements:");
  console.log("  cp api/prisma/schema.prisma.backup api/prisma/schema.prisma");
  console.log("  npx prisma generate");

  console.log("\n📚 Documentation:");
  console.log(
    "  Voir: db/migrations/naming_standardization/README_MIGRATION.txt",
  );

  console.log("\n═".repeat(80));
}

/**
 * Génère un fichier README pour la migration
 */
function generateReadme() {
  const readme = `
MIGRATION FR → EN - GUIDE COMPLET
═══════════════════════════════════════════════════════════════════════

📋 RÉSUMÉ
─────────
Ce dossier contient tous les scripts pour migrer la base de données
ClubManager du français vers l'anglais (standardisation).

🗂️ FICHIERS
───────────
1. 01_rename_tables_fr_to_en.sql     → Migration SQL principale
2. 02_rollback_rename_tables.sql     → Script de rollback (annulation)
3. 03_remove_compatibility_views.sql → Suppression des vues (après migration)
4. 04_update_prisma_schema.js        → Mise à jour automatique de schema.prisma

📊 ORDRE D'EXÉCUTION
────────────────────

ÉTAPE 1: BACKUP OBLIGATOIRE
  mysqldump -u root clubmanager_test > backup_pre_rename_tables.sql

ÉTAPE 2: MIGRATION SQL
  mysql -u root clubmanager_test < 01_rename_tables_fr_to_en.sql

  Durée: ~2 minutes
  Impact: Crée des vues de compatibilité (transition en douceur)

ÉTAPE 3: MISE À JOUR PRISMA
  node 04_update_prisma_schema.js
  npx prisma generate

  Durée: ~30 secondes
  Impact: Met à jour les @@map() dans schema.prisma

ÉTAPE 4: MISE À JOUR DU CODE APPLICATIF (progressif)

  L'application continue de fonctionner grâce aux vues de compatibilité.
  Migrez progressivement votre code:

  AVANT (avec vues):
    const articles = await prisma.articles.findMany();

  APRÈS (nouveau nom):
    const articles = await prisma.shopArticles.findMany();

  Astuce: Utilisez la recherche globale dans votre IDE:
    - Chercher: "prisma.articles"
    - Remplacer: "prisma.shopArticles"

ÉTAPE 5: TEST COMPLET
  - Tester toutes les fonctionnalités
  - Vérifier les logs d'erreur
  - Valider les requêtes en base

ÉTAPE 6: SUPPRESSION DES VUES (après 100% migration code)
  mysql -u root clubmanager_test < 03_remove_compatibility_views.sql

  ⚠️ À faire uniquement quand tout le code est migré!

🔄 ROLLBACK (EN CAS DE PROBLÈME)
─────────────────────────────────
  mysql -u root clubmanager_test < 02_rollback_rename_tables.sql

  OU restaurer le backup:
  mysql -u root clubmanager_test < backup_pre_rename_tables.sql

📊 TABLES MIGRÉES (${Object.keys(TABLE_MAPPINGS).length} au total)
───────────────────

Commerce:
  articles → shop_articles
  commandes → orders
  commande_articles → order_items
  categories → article_categories
  tailles → sizes
  images → article_images

Cours:
  cours → course_instances
  cours_recurrent → recurring_courses
  inscriptions → enrollments
  reservations → bookings

Paiements:
  paiements → payments
  echeances_paiements → payment_schedules
  plans_tarifaires → pricing_plans

Utilisateurs:
  utilisateurs → users
  professeurs → teachers
  genres → genders
  grades → belt_grades

Groupes:
  groupes → user_groups
  groupes_utilisateurs → user_group_members
  status → user_roles

Messages:
  messages → direct_messages
  messages_personnalises → custom_messages
  notifications → user_notifications

Alertes:
  alertes_utilisateurs → user_alerts
  alertes_types → alert_types
  alertes_actions → alert_actions

📈 GAINS ATTENDUS
─────────────────
✅ Cohérence totale du nommage (100% EN)
✅ Meilleure lisibilité internationale
✅ Conformité standards industrie
✅ Facilite maintenance future
✅ Améliore onboarding nouveaux devs

⏱️ DURÉE TOTALE ESTIMÉE
────────────────────────
  - Migration SQL: 2 minutes
  - Update Prisma: 30 secondes
  - Migration code: 2-4 heures (selon taille projet)
  - Tests: 1-2 heures

🆘 SUPPORT
──────────
En cas de problème:
  1. Vérifier les logs MySQL
  2. Consulter les vues créées (SHOW FULL TABLES WHERE Table_type = 'VIEW')
  3. Tester une requête manuelle: SELECT * FROM shop_articles LIMIT 1
  4. Si bloqué: exécuter le rollback

═══════════════════════════════════════════════════════════════════════
`;

  const readmePath = path.join(__dirname, "README_MIGRATION.txt");
  fs.writeFileSync(readmePath, readme.trim(), "utf8");
  console.log(`\n📄 README créé: ${readmePath}`);
}

/**
 * Script principal
 */
function main() {
  console.log("");
  console.log("═".repeat(80));
  console.log("  MIGRATION SCHEMA.PRISMA FR → EN");
  console.log("═".repeat(80));
  console.log("");

  try {
    // Créer le backup
    createBackup();

    // Mettre à jour les mappings
    updateSchemaMappings();

    // Générer le README
    generateReadme();

    // Afficher le rapport
    generateMigrationReport();

    console.log("\n🎉 Migration terminée avec succès!\n");
  } catch (error) {
    console.error("\n❌ ERREUR lors de la migration:");
    console.error(error.message);
    console.error("\n🔄 Restauration du backup...");

    if (fs.existsSync(BACKUP_PATH)) {
      fs.copyFileSync(BACKUP_PATH, SCHEMA_PATH);
      console.log("✅ Backup restauré");
    }

    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { TABLE_MAPPINGS, MODEL_NAME_SUGGESTIONS };
