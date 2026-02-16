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

📊 TABLES MIGRÉES (39 au total)
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