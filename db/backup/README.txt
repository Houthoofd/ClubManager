================================================================================
CLUBMANAGER - STRUCTURE DE BACKUP DE LA BASE DE DONNÉES
================================================================================
Date de création: 2025-01-24
Version: 1.0

Ce dossier contient une sauvegarde organisée et structurée de tous les
éléments de la base de données ClubManager, avec chaque composant dans un
fichier séparé pour faciliter la maintenance et le versioning.

================================================================================
STRUCTURE DU DOSSIER
================================================================================

backup/
├── tables/                         # Toutes les tables (38 tables)
│   ├── reference/                  # Tables de référence (6 tables)
│   │   ├── genres.sql
│   │   ├── grades.sql
│   │   ├── status.sql
│   │   ├── plans_tarifaires.sql
│   │   ├── categories.sql
│   │   └── tailles.sql
│   │
│   ├── users/                      # Tables utilisateurs (7 tables)
│   │   ├── utilisateurs.sql
│   │   ├── email_validation_tokens.sql
│   │   ├── password_reset_tokens.sql
│   │   ├── password_reset_attempts.sql
│   │   ├── auth_attempts.sql
│   │   ├── manual_recovery_requests.sql
│   │   └── validation_tokens.sql
│   │
│   ├── courses/                    # Tables cours (6 tables)
│   │   ├── cours_recurrent.sql
│   │   ├── cours.sql
│   │   ├── professeurs.sql
│   │   ├── cours_recurrent_professeur.sql
│   │   ├── inscriptions.sql
│   │   └── reservations.sql
│   │
│   ├── payments/                   # Tables paiements (2 tables)
│   │   ├── paiements.sql
│   │   └── echeances_paiements.sql
│   │
│   ├── store/                      # Tables magasin (6 tables)
│   │   ├── articles.sql
│   │   ├── images.sql
│   │   ├── stocks.sql
│   │   ├── commandes.sql
│   │   ├── commande_articles.sql
│   │   └── mouvements_stock.sql
│   │
│   ├── messaging/                  # Tables messagerie (5 tables)
│   │   ├── messages.sql
│   │   ├── message_status.sql
│   │   ├── types_messages_personnalises.sql
│   │   ├── messages_personnalises.sql
│   │   └── notifications.sql
│   │
│   ├── alerts/                     # Tables alertes (3 tables)
│   │   ├── alertes_types.sql
│   │   ├── alertes_utilisateurs.sql
│   │   └── alertes_actions.sql
│   │
│   ├── groups/                     # Tables groupes (2 tables)
│   │   ├── groupes.sql
│   │   └── groupes_utilisateurs.sql
│   │
│   └── system/                     # Tables système (2 tables)
│       ├── statistiques.sql
│       └── informations.sql
│
├── procedures/                     # Procédures stockées
│   ├── ajouter_cours_recurrent_avec_professeurs.sql
│   ├── create_email_validation_token.sql
│   ├── delete-cours-professeurs.sql
│   ├── delete-pool-connexion.sql
│   ├── generate_token.sql
│   ├── modifier_cours_recurrent_avec_professeurs.sql
│   ├── obtenir_statistiques_frequentation.sql
│   ├── recuperer_userId.sql
│   ├── validate_email_token.sql
│   └── validation-aleatoire.sql
│
├── triggers/                       # Triggers (4 triggers)
│   ├── after_echeance_paiement_update.sql
│   ├── after_insert_user.sql
│   ├── after_utilisateur_update_abonnement.sql
│   └── update_professeur.sql
│
├── events/                         # Event Scheduler
│   └── new-date.sql
│
├── extract_tables.py               # Script d'extraction automatique
└── README.txt                      # Ce fichier

================================================================================
UTILISATION
================================================================================

1. RESTAURATION COMPLÈTE DE LA BASE
   ---------------------------------
   Pour recréer la base de données complète :

   a) Créer la base de données :
      CREATE DATABASE clubmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      USE clubmanager;

   b) Exécuter les tables dans l'ordre :
      - reference/     (pas de dépendances)
      - users/         (dépend de reference)
      - courses/       (dépend de reference + users)
      - payments/      (dépend de reference + users)
      - store/         (dépend de reference)
      - messaging/     (dépend de users)
      - alerts/        (dépend de users)
      - groups/        (dépend de users)
      - system/        (pas de dépendances)

   c) Créer les procédures stockées (fichiers dans procedures/)

   d) Créer les triggers (fichiers dans triggers/)

   e) Créer les events scheduler (fichiers dans events/)

2. RESTAURATION PARTIELLE
   -----------------------
   Pour restaurer seulement certaines tables, exécuter les fichiers SQL
   individuels dans l'ordre des dépendances.

3. MODIFICATION D'UNE TABLE
   -------------------------
   Éditer directement le fichier SQL correspondant, puis :

   DROP TABLE IF EXISTS nom_table;
   SOURCE backup/tables/categorie/nom_table.sql;

4. MISE À JOUR DU BACKUP
   ----------------------
   Pour extraire à nouveau les tables depuis clubmanager.sql :

   cd backup/
   python extract_tables.py

================================================================================
ORDRE DE CRÉATION (RESPECT DES FOREIGN KEYS)
================================================================================

1. Tables sans dépendances :
   - reference/* (genres, grades, status, plans_tarifaires, categories, tailles)
   - system/statistiques
   - system/informations

2. Tables dépendant de reference :
   - users/utilisateurs (→ genres, grades, status, plans_tarifaires)

3. Tables dépendant de users :
   - users/email_validation_tokens (→ utilisateurs)
   - users/password_reset_tokens (→ utilisateurs)
   - users/password_reset_attempts (standalone)
   - users/auth_attempts (standalone)
   - users/manual_recovery_requests (standalone)
   - users/validation_tokens (→ utilisateurs)
   - courses/professeurs (→ grades)
   - groups/groupes (standalone)
   - groups/groupes_utilisateurs (→ utilisateurs, groupes)
   - messaging/messages (→ utilisateurs)
   - messaging/notifications (→ utilisateurs)
   - alerts/alertes_types (standalone)
   - alerts/alertes_utilisateurs (→ utilisateurs, alertes_types)
   - alerts/alertes_actions (→ alertes_utilisateurs, utilisateurs)
   - payments/paiements (→ utilisateurs, plans_tarifaires)

4. Tables dépendant de courses :
   - courses/cours_recurrent (standalone)
   - courses/cours (→ cours_recurrent)
   - courses/cours_recurrent_professeur (→ cours_recurrent, professeurs)
   - courses/inscriptions (→ utilisateurs, cours)
   - courses/reservations (→ utilisateurs, cours)

5. Tables dépendant de payments :
   - payments/echeances_paiements (→ utilisateurs, plans_tarifaires, paiements)

6. Tables dépendant de store :
   - store/articles (→ categories)
   - store/images (→ articles)
   - store/stocks (→ articles, tailles)
   - store/commandes (→ utilisateurs)
   - store/commande_articles (→ commandes, articles, tailles)
   - store/mouvements_stock (→ articles, utilisateurs)

7. Tables dépendant de messaging :
   - messaging/message_status (standalone)
   - messaging/types_messages_personnalises (standalone)
   - messaging/messages_personnalises (→ types_messages_personnalises)

================================================================================
AVANTAGES DE CETTE STRUCTURE
================================================================================

✓ VERSION CONTROL : Chaque fichier peut être versionné individuellement avec Git
✓ MAINTENANCE : Facile de trouver et modifier une table spécifique
✓ BACKUP : Sauvegarde granulaire, facile de restaurer une seule table
✓ DOCUMENTATION : Chaque fichier contient sa propre documentation
✓ COLLABORATION : Plusieurs développeurs peuvent travailler sans conflits
✓ MIGRATION : Facilite la création de scripts de migration incrémentaux
✓ DÉBOGAGE : Isoler et tester une table individuellement
✓ AUDIT : Historique des modifications via Git

================================================================================
NOTES IMPORTANTES
================================================================================

1. ENCODAGE
   - Tous les fichiers sont en UTF-8
   - Les tables utilisent utf8mb4_unicode_ci pour support Unicode complet

2. MOTEUR
   - Toutes les tables utilisent InnoDB pour :
     * Support des transactions
     * Support des foreign keys
     * Meilleure intégrité référentielle

3. TIMESTAMPS
   - La plupart des tables ont created_at et updated_at
   - Les timestamps utilisent CURRENT_TIMESTAMP par défaut

4. SOFT DELETE
   - Certaines tables utilisent un champ 'active' ou 'actif' au lieu de DELETE
   - Permet de conserver l'historique

5. JSON
   - Plusieurs tables stockent des données JSON (donnees_contexte, etc.)
   - MySQL 5.7+ ou MariaDB 10.2+ requis

6. TRIGGERS
   - Des triggers automatiques existent pour :
     * Mettre à jour le total des commandes
     * Calculer les stocks disponibles
     * Gérer les statuts de présence

7. PROCÉDURES STOCKÉES
   - Utilisées pour la logique métier complexe
   - Incluent génération de tokens, statistiques, etc.

8. SÉCURITÉ
   - Ne JAMAIS committer de données sensibles dans ces fichiers
   - Les fichiers contiennent seulement les structures et données de test
   - Utiliser des migrations pour les environnements de production

================================================================================
SCRIPTS UTILES
================================================================================

# Compter le nombre de tables par catégorie
find tables/ -name "*.sql" | cut -d'/' -f2 | sort | uniq -c

# Lister toutes les procédures
ls -1 procedures/

# Trouver les tables qui référencent 'utilisateurs'
grep -r "REFERENCES.*utilisateurs" tables/

# Générer un script de création complet
cat tables/reference/*.sql \
    tables/users/utilisateurs.sql \
    tables/courses/*.sql \
    tables/payments/*.sql \
    tables/store/*.sql \
    tables/messaging/*.sql \
    tables/alerts/*.sql \
    tables/groups/*.sql \
    tables/system/*.sql \
    > full_schema.sql

# Vérifier la syntaxe SQL (nécessite mysql client)
mysql -u root -p --database=clubmanager < tables/reference/genres.sql

================================================================================
MAINTENANCE
================================================================================

Pour maintenir ce backup à jour :

1. Après modification du schéma en production :
   - Exporter la table modifiée
   - Mettre à jour le fichier correspondant
   - Commiter avec un message descriptif

2. Nouvelle table créée :
   - Créer le fichier dans la bonne catégorie
   - Mettre à jour ce README
   - Mettre à jour extract_tables.py si nécessaire

3. Table supprimée :
   - Supprimer le fichier
   - Mettre à jour ce README
   - Documenter la raison de la suppression

4. Vérification périodique :
   - Comparer avec la base de production
   - Vérifier l'intégrité des foreign keys
   - Tester la restauration complète

================================================================================
CONTACT ET SUPPORT
================================================================================

Pour toute question concernant cette structure :
- Consulter TABLES_INVENTAIRE.txt dans le dossier parent
- Consulter la documentation du projet

Dernière mise à jour : 2025-01-24
Créé par : Benoit Houthoofd
Projet : ClubManager - TFE 2025

================================================================================
FIN DU README
================================================================================
