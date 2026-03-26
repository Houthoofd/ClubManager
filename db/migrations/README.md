# 📂 MIGRATIONS DE BASE DE DONNÉES

Ce dossier contient les scripts de migration pour améliorer progressivement la base de données ClubManager.

---

## 📋 LISTE DES MIGRATIONS

| Migration | Date | Statut | Description |
|-----------|------|--------|-------------|
| `01_add_indexes.sql` | 2025-01-25 | ⏳ À appliquer | Ajout des INDEX pour optimisation performances |
| `02_optimize_types.sql` | À venir | 📝 Planifié | Optimisation des types de données (VARCHAR → ENUM) |
| `03_add_timestamps.sql` | À venir | 📝 Planifié | Ajout timestamps manquants sur tables secondaires |
| `04_add_check_constraints.sql` | À venir | 📝 Planifié | Ajout contraintes CHECK (optionnel) |

---

## 🚀 COMMENT APPLIQUER UNE MIGRATION

### ⚠️ PROCÉDURE OBLIGATOIRE

**Ne JAMAIS appliquer directement en production !**

### Étape 1 : Backup complet

```bash
# Créer backup avec timestamp
mysqldump -u root -p clubmanager > ../backup/clubmanager_avant_migration_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que le backup existe et n'est pas vide
ls -lh ../backup/clubmanager_avant_migration_*.sql
```

### Étape 2 : Environnement de test

```bash
# Créer base de test (si n'existe pas)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS clubmanager_test;"

# Restaurer backup en test
mysql -u root -p clubmanager_test < ../backup/clubmanager_avant_migration_*.sql

# Vérifier que la restauration a fonctionné
mysql -u root -p clubmanager_test -e "SHOW TABLES; SELECT COUNT(*) FROM utilisateurs;"
```

### Étape 3 : Appliquer migration en TEST

```bash
# Exécuter la migration
mysql -u root -p clubmanager_test < 01_add_indexes.sql

# Vérifier qu'il n'y a pas d'erreurs
echo $?  # Doit retourner 0
```

### Étape 4 : Tester les performances

```bash
# Tester avec EXPLAIN
mysql -u root -p clubmanager_test << EOF
EXPLAIN SELECT * FROM utilisateurs WHERE email = 'test@example.com';
EXPLAIN SELECT * FROM paiements WHERE utilisateur_id = 154 ORDER BY date_paiement DESC;
EXPLAIN SELECT * FROM inscriptions WHERE cours_id = 42 AND status_id = 1;
EOF
```

**Résultat attendu :** `type = 'ref'` et `key = 'idx_...'` (utilise l'index)

### Étape 5 : Tests API/Backend

```bash
# Lancer tests unitaires
cd ../../api
npm test

# Lancer tests d'intégration
npm run test:integration
```

### Étape 6 : Application en PRODUCTION

**Seulement si tous les tests passent ✅**

```bash
# Planifier fenêtre de maintenance (heures creuses)
# Exemple: Dimanche 2h00 du matin

# Backup final
mysqldump -u root -p clubmanager > ../backup/clubmanager_PROD_avant_migration_$(date +%Y%m%d_%H%M%S).sql

# Appliquer migration
mysql -u root -p clubmanager < 01_add_indexes.sql

# Vérifier
mysql -u root -p clubmanager -e "SELECT COUNT(DISTINCT INDEX_NAME) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'clubmanager' AND INDEX_NAME LIKE 'idx_%';"
```

### Étape 7 : Monitoring post-migration

```bash
# Activer slow query log
mysql -u root -p clubmanager << EOF
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
EOF

# Surveiller les logs pendant 24-48h
tail -f /var/log/mysql/slow-query.log
```

---

## 📊 DÉTAILS DES MIGRATIONS

### 01_add_indexes.sql

**Objectif :** Améliorer les performances des requêtes fréquentes

**Impact :**
- ✅ Temps de réponse x10 à x100 plus rapide
- ✅ Réduction de la charge CPU/RAM
- ✅ Meilleure scalabilité

**Index ajoutés :** ~150 index sur 23 tables

**Tables concernées :**
- `utilisateurs` (11 index) - Login, recherche
- `paiements` (7 index) - Reporting financier
- `inscriptions` (6 index) - Présences
- `cours` (5 index) - Planning
- `commandes` (6 index) - E-commerce
- `stocks` (3 index) - Gestion inventaire
- `messages` (5 index) - Messagerie
- `notifications` (4 index) - Notifications
- `alertes_utilisateurs` (6 index) - Alertes système
- + 14 autres tables

**Temps d'exécution estimé :** 5-15 minutes

**Espace disque requis :** +10-20% de la taille actuelle

**Rollback :**
```sql
-- Supprimer tous les index créés
DROP INDEX idx_users_email ON utilisateurs;
DROP INDEX idx_users_username ON utilisateurs;
-- ... (voir liste complète dans le script)
```

---

### 02_optimize_types.sql (À venir)

**Objectif :** Optimiser les types de données pour réduire l'espace disque

**Exemples :**
- `VARCHAR(255)` → `ENUM(...)` pour valeurs fixes
- `DATE` → `DATETIME` quand l'heure importe
- `INT(11)` → `TINYINT` pour petites valeurs
- `TEXT` → `VARCHAR(500)` pour textes courts

**Gain estimé :** -15% espace disque, +5% performances

---

### 03_add_timestamps.sql (À venir)

**Objectif :** Ajouter `created_at` et `updated_at` sur tables manquantes

**Tables concernées :**
- `message_status`
- `alertes_types`
- `types_messages_personnalises`

**Gain :** Meilleur audit trail, traçabilité

---

### 04_add_check_constraints.sql (À venir)

**Objectif :** Ajouter validation au niveau DB

**Exemples :**
- `prix > 0` (paiements, articles)
- `heure_fin > heure_debut` (cours)
- `quantite >= 0` (stocks)
- `email REGEXP '^[^@]+@[^@]+\.[^@]+$'`

**Gain :** Validation données + sécurité

---

## 🛠️ ROLLBACK D'UNE MIGRATION

Si une migration échoue ou cause des problèmes :

### Option 1 : Restaurer le backup

```bash
# Arrêter API/Backend
systemctl stop clubmanager-api  # ou équivalent

# Restaurer backup
mysql -u root -p clubmanager < ../backup/clubmanager_avant_migration_YYYYMMDD.sql

# Redémarrer API
systemctl start clubmanager-api
```

### Option 2 : Rollback manuel (INDEX uniquement)

```bash
# Exécuter script de rollback (si fourni)
mysql -u root -p clubmanager < 01_add_indexes_ROLLBACK.sql
```

---

## 📝 CONVENTION DE NOMMAGE

### Fichiers de migration

Format : `XX_description_courte.sql`

- `XX` : Numéro séquentiel (01, 02, 03, ...)
- `description_courte` : snake_case, max 50 caractères
- Extension : `.sql`

**Exemples :**
- ✅ `01_add_indexes.sql`
- ✅ `02_optimize_types.sql`
- ❌ `add-indexes.sql` (pas de numéro)
- ❌ `1_indexes.sql` (numéro à 1 chiffre)

### Index

Format : `idx_<table>_<colonnes>`

**Exemples :**
- `idx_users_email`
- `idx_paiements_user_date`
- `idx_inscriptions_cours_status`

### Foreign Keys (déjà dans SCHEMA_CONSOLIDATE.sql)

Format : `fk_<table>_<relation>`

**Exemples :**
- `fk_users_genre`
- `fk_paiements_user`

### Contraintes CHECK

Format : `check_<table>_<condition>`

**Exemples :**
- `check_paiements_montant_positif`
- `check_cours_heure_valide`

---

## 📚 DOCUMENTATION ASSOCIÉE

- **État des Foreign Keys :** `../STATUS_FOREIGN_KEYS.md`
- **Recommandations complètes :** `../AMELIORATIONS_RECOMMANDEES.md`
- **État actuel & actions :** `../ETAT_ACTUEL_ET_ACTIONS.md`
- **Schéma principal :** `../creation/SCHEMA_CONSOLIDATE.sql`

---

## ⚠️ AVERTISSEMENTS

### Migrations avec ALTER TABLE

Les migrations qui modifient la structure des tables (ALTER TABLE) peuvent :

1. **Verrouiller la table** pendant l'exécution
2. **Bloquer les requêtes** (SELECT, INSERT, UPDATE, DELETE)
3. **Prendre du temps** sur grosses tables (>100k lignes)

**Solution :** Utiliser `pt-online-schema-change` (Percona Toolkit) pour migrations sans downtime

```bash
# Exemple avec pt-online-schema-change
pt-online-schema-change \
  --alter "ADD INDEX idx_users_email (email)" \
  D=clubmanager,t=utilisateurs \
  --execute
```

### Ordre d'application

**IMPORTANT :** Les migrations doivent être appliquées **dans l'ordre** (01, 02, 03, ...)

Ne pas sauter de migration !

---

## 📊 SUIVI DES MIGRATIONS

### Table de suivi (à créer)

```sql
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('success', 'failed', 'rolled_back') DEFAULT 'success',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_migration` (`migration`)
) ENGINE=InnoDB;

-- Enregistrer une migration
INSERT INTO migrations (migration, status) VALUES ('01_add_indexes.sql', 'success');
```

### Vérifier les migrations appliquées

```sql
SELECT * FROM migrations ORDER BY applied_at DESC;
```

---

## 🔗 LIENS UTILES

- [MySQL ALTER TABLE](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [MySQL Index Hints](https://dev.mysql.com/doc/refman/8.0/en/index-hints.html)
- [EXPLAIN Documentation](https://dev.mysql.com/doc/refman/8.0/en/explain.html)
- [Percona Toolkit](https://www.percona.com/software/database-tools/percona-toolkit)

---

**Dernière mise à jour :** 25 janvier 2025  
**Responsable :** Benoit Houthoofd  
**Contact :** (votre email/contact)
