# 🥋 ClubManager - Installation Base de Données Ultra-Complète

## 📋 Vue d'ensemble

Ce répertoire contient les scripts SQL complets pour installer la base de données **ClubManager** avec toutes les tables et données de test enrichies.

### 📦 Fichiers disponibles

| Fichier | Description | Tables | Données de test |
|---------|-------------|--------|-----------------|
| `clubmanager_complete.sql` | Version de base | 88+ | 10 utilisateurs |
| **`clubmanager_ultra_complete.sql`** | ⭐ **VERSION RECOMMANDÉE** | 88+ | **34 utilisateurs + données enrichies** |

---

## 🚀 Installation Rapide

### Prérequis
- MySQL 8.0+ ou MariaDB 10.5+
- Accès root à MySQL
- Laragon, XAMPP, WAMP ou installation MySQL native

### Installation en 1 commande

```bash
mysql -u root < db/creation/clubmanager_ultra_complete.sql
```

### Installation avec mot de passe

```bash
mysql -u root -p < db/creation/clubmanager_ultra_complete.sql
```

### Installation via Laragon Terminal

```bash
cd C:\laragon\www\votre-projet
mysql -u root < db/creation/clubmanager_ultra_complete.sql
```

---

## 📊 Contenu de la Base de Données

### 🗂️ Tables Principales (88+)

#### Tables Core
- `sports` - Sports disponibles (Karaté, Judo, Taekwondo, Kung Fu, Boxe)
- `grades` - Grades/ceintures par sport
- `utilisateurs` - Utilisateurs (admin, professeurs, élèves)
- `genres` - Genres (M/F/X)
- `status` - Statuts des membres

#### Tables Utilisateurs
- `user_security` - Sécurité 2FA et verification email
- `user_profiles` - Profils détaillés (bio, contacts urgence, notes médicales)
- `user_subscriptions` - Abonnements (mensuel/annuel)
- `user_sports` - Sports pratiqués par utilisateur
- `user_grade_history` - Historique des passages de grades
- `user_consents` - Consentements RGPD
- `user_preferences` - Préférences utilisateur

#### Tables Cours
- `course_types` - Types de cours (enfants, ados, adultes, etc.)
- `locations` - Lieux d'entraînement (5 dojos)
- `cours_recurrent` - Cours récurrents (planning hebdomadaire)
- `cours` - Instances de cours (sessions individuelles)
- `cours_professeurs` - Assignation professeurs-cours
- `inscriptions` - Inscriptions élèves aux cours
- `presences` - Présences/absences aux cours

#### Tables Paiements
- `payment_methods` - Méthodes de paiement (7 méthodes)
- `paiements` - Transactions et paiements
- `stripe_payment_intents` - Intégration Stripe

#### Tables Événements
- `evenements` - Événements (compétitions, stages, examens)
- `event_registrations` - Inscriptions aux événements

#### Tables Communication
- `email_templates` - Templates d'emails (6 templates)
- `email_queue` - File d'attente d'envoi
- `notifications` - Notifications utilisateur
- `notification_preferences` - Préférences de notification
- `messages` - Messagerie interne

#### Tables Système
- `sessions` - Sessions utilisateur actives
- `validation_tokens` - Tokens (email verification, password reset)
- `audit_logs` - Logs d'audit complets
- `webhook_logs` - Logs webhooks (Stripe, etc.)
- `system_settings` - Paramètres système
- `api_keys` - Clés API

#### Tables Boutique
- `produits` - Produits (kimonos, ceintures, etc.)
- `tailles` - Tailles disponibles
- `stocks` - Gestion des stocks
- `commandes` - Commandes boutique
- `categories` - Catégories de produits

#### Tables Complémentaires
- `documents` - Documents uploadés
- `media_files` - Fichiers média
- `certificats_medicaux` - Certificats médicaux
- `absences` - Absences déclarées
- `comments` - Système de commentaires
- `ratings` - Système d'évaluation
- `sport_equipment` - Équipement sportif
- `sport_statistics` - Statistiques par sport
- `statistiques` - Statistiques générales
- `venues` - Salles et lieux
- `types_messages_personnalises` - Templates de messages

---

## 👥 Données de Test Enrichies

### Utilisateurs (34 au total)

#### 🔑 Administrateur (1)
| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@clubmanager.com | Admin123! | Admin système |

#### 👨‍🏫 Professeurs (8)
| Email | Sport | Niveau |
|-------|-------|--------|
| hiroshi.tanaka@clubmanager.com | Karaté | Expert 3ème Dan |
| marie.dubois@clubmanager.com | Judo | Expert 2ème Dan |
| wei.chen@clubmanager.com | Kung Fu | Maître |
| minji.park@clubmanager.com | Taekwondo | Expert 4ème Dan |
| carlos.martinez@clubmanager.com | Karaté | Expert 2ème Dan |
| linh.nguyen@clubmanager.com | Judo | Expert 1er Dan |
| david.johnson@clubmanager.com | Boxe | Champion |
| sophie.lambert@clubmanager.com | Karaté | Expert 1er Dan |

**Mot de passe pour tous les professeurs :** `Admin123!`

#### 👦👧 Élèves (25)
- **6 pratiquants de Karaté** (du débutant à la ceinture bleue)
- **6 pratiquants de Judo** (du débutant à la ceinture verte)
- **4 pratiquants de Taekwondo** (débutants et intermédiaires)
- **2 pratiquants de Kung Fu** (débutants)
- **7 pratiquants de Boxe** (tous niveaux)

**Mot de passe pour tous les élèves :** `Admin123!`

### 🥋 Sports (5)
1. **Karaté** - 13 grades (9 Kyus + 4 Dans)
2. **Judo** - 10 grades (blanc à noir 1er Dan)
3. **Taekwondo** - 6 grades (blanc à noir 1er Dan)
4. **Kung Fu** - Système traditionnel
5. **Boxe** - Niveaux débutant à avancé

### 📅 Cours (20 cours récurrents)
- **Lundi** : 3 cours (Karaté enfants, ados, adultes)
- **Mardi** : 2 cours (Judo enfants, ados)
- **Mercredi** : 3 cours (Karaté enfants, avancés, adultes + Taekwondo enfants)
- **Jeudi** : 3 cours (Karaté ados, avancé + Judo adultes)
- **Vendredi** : 3 cours (Judo enfants, ados + Boxe fitness)
- **Samedi** : 6 cours (Karaté, Judo, Taekwondo, Kung Fu - enfants et adultes)

### 💰 Paiements (30+ transactions)
- 24 abonnements annuels (150€ Karaté/TKD, 140€ Judo, 160€ Boxe, 165€ Kung Fu)
- 4 abonnements mensuels (50-55€)
- Paiements événements (passages de grade, compétitions)
- Paiements boutique (kimonos, ceintures)

**Total encaissé :** ~4,500€ (données de test)

### 🎯 Événements (10)
1. **Championnat Régional de Karaté** - 15 déc 2024
2. **Tournoi de Judo Coupe d'Hiver** - 20 jan 2025
3. **Stage Intensif Taekwondo** - 10-11 fév 2025
4. **Démonstration Kung Fu** - 5 mars 2025
5. **Passage de Grade Karaté** - 22 mars 2025
6. **Passage de Grade Judo** - 29 mars 2025
7. **Stage Boxe Française** - 12-13 avril 2025
8. **Gala des Arts Martiaux** - 10 mai 2025
9. **Barbecue de Fin d'Année** - 28 juin 2025
10. **Journée Portes Ouvertes** - 6 sept 2025

### 📧 Templates Email (6 templates actifs)
- `WELCOME_EMAIL` - Email de bienvenue
- `COURSE_REMINDER` - Rappel de cours
- `PAYMENT_CONFIRMATION` - Confirmation de paiement
- `GRADING_RESULT` - Résultat passage de grade
- `EVENT_REGISTRATION` - Confirmation inscription événement
- `PASSWORD_RESET` - Réinitialisation mot de passe

### 🏪 Boutique (10 produits)
- Kimonos (enfants/adultes) : 45-65€
- Protections : 35-50€
- Ceintures : 8€
- Accessoires : 20-30€

---

## 🔧 Après l'Installation

### 1️⃣ Vérification de l'installation

```sql
USE clubmanager;

-- Vérifier les tables
SHOW TABLES;

-- Compter les utilisateurs
SELECT role, COUNT(*) as total 
FROM utilisateurs 
GROUP BY role;

-- Compter les sports
SELECT name, COUNT(*) as nb_grades 
FROM sports s 
LEFT JOIN grades g ON s.id = g.sport_id 
GROUP BY s.id;
```

### 2️⃣ Installer les Stored Procedures (optionnel mais recommandé)

```bash
cd api/prisma/migrations/quick_wins_and_procedures
mysql -u root clubmanager < INSTALL_ALL_PROCEDURES.sql
```

**24 procédures disponibles :**
- Authentification (login, register, verify_email)
- Gestion cours (create/update/enroll/attendance)
- Paiements (process_payment, refund)
- Événements (register_event)
- Analytics (get_stats, generate_reports)
- RGPD (export/delete user data)

### 3️⃣ Configurer Prisma

```bash
cd api

# Mettre à jour le schéma Prisma depuis la DB
npx prisma db pull

# Générer le client Prisma
npx prisma generate

# Optionnel : Ouvrir Prisma Studio
npx prisma studio
```

### 4️⃣ Configurer les variables d'environnement

Créez/modifiez votre fichier `.env` :

```env
# Database
DATABASE_URL="mysql://root@localhost:3306/clubmanager"

# JWT
JWT_SECRET="votre_secret_jwt_super_securise"
JWT_EXPIRES_IN="7d"

# Email (si vous activez les emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"

# Stripe (pour les paiements en ligne)
STRIPE_PUBLIC_KEY="pk_test_xxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"

# App
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

### 5️⃣ Lancer l'application

```bash
# Démarrer le backend
cd api
npm install
npm run dev

# Démarrer le frontend (dans un autre terminal)
cd ../frontend
npm install
npm run dev
```

---

## 📱 Accès à l'Application

### Interface Web
- Frontend : `http://localhost:5173`
- Backend API : `http://localhost:3000`
- Prisma Studio : `http://localhost:5555` (après `npx prisma studio`)

### Connexion Test
1. **Admin complet**
   - Email : `admin@clubmanager.com`
   - Pass : `Admin123!`

2. **Professeur de Karaté**
   - Email : `hiroshi.tanaka@clubmanager.com`
   - Pass : `Admin123!`

3. **Élève avec historique**
   - Email : `lucas.martin@email.com` (Karaté - Ceinture orange)
   - Pass : `Admin123!`

---

## 🛠️ Maintenance et Gestion

### Backup de la base de données

```bash
# Backup complet
mysqldump -u root clubmanager > backup_clubmanager_$(date +%Y%m%d).sql

# Backup avec compression
mysqldump -u root clubmanager | gzip > backup_clubmanager_$(date +%Y%m%d).sql.gz

# Backup structure seule (sans données)
mysqldump -u root --no-data clubmanager > structure_only.sql
```

### Restauration

```bash
mysql -u root clubmanager < backup_clubmanager_20240216.sql
```

### Réinitialisation complète

```bash
# Supprimer et réinstaller
mysql -u root -e "DROP DATABASE IF EXISTS clubmanager;"
mysql -u root < db/creation/clubmanager_ultra_complete.sql
```

### Nettoyage des données de test

```sql
-- Supprimer uniquement les données de test (garder la structure)
USE clubmanager;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE presences;
TRUNCATE TABLE inscriptions;
TRUNCATE TABLE cours;
TRUNCATE TABLE cours_professeurs;
TRUNCATE TABLE cours_recurrent;
TRUNCATE TABLE paiements;
TRUNCATE TABLE event_registrations;
TRUNCATE TABLE evenements;
TRUNCATE TABLE user_grade_history;
TRUNCATE TABLE user_sports;
TRUNCATE TABLE user_subscriptions;
TRUNCATE TABLE user_profiles;
TRUNCATE TABLE user_security;
TRUNCATE TABLE sessions;
TRUNCATE TABLE notifications;
TRUNCATE TABLE audit_logs;

-- Garder seulement l'admin
DELETE FROM utilisateurs WHERE id > 1;

SET FOREIGN_KEY_CHECKS = 1;
```

---

## 📚 Documentation Complémentaire

### Structure des fichiers
```
db/creation/
├── README.md                          ← Ce fichier
├── clubmanager_complete.sql           ← Version de base (10 users)
└── clubmanager_ultra_complete.sql     ← Version enrichie (34+ users) ⭐

api/prisma/
├── schema.prisma                      ← Schéma Prisma
└── migrations/
    ├── quick_wins_and_procedures/     ← 24 stored procedures
    └── phase_2_optimizations/         ← Optimisations avancées

database/
├── FULL_DATABASE_INSTALL.sql          ← Installation générée (auto)
├── generate_install_script.py         ← Générateur Python
└── README.md                          ← Documentation technique
```

### Stored Procedures importantes

```sql
-- Authentification
CALL sp_user_login('admin@clubmanager.com', 'Admin123!', @user_id, @token, @message);

-- Inscription à un cours
CALL sp_enroll_in_course(10, 1, @success, @message);

-- Marquer présence
CALL sp_mark_attendance(1, 10, 'PRESENT', @success, @message);

-- Traiter un paiement
CALL sp_process_payment(10, 150.00, 'EUR', 2, 'SUBSCRIPTION', @payment_id, @message);

-- Stats du club
CALL sp_get_club_statistics(@total_members, @active_courses, @revenue);
```

### Index et Performances
- **163 index stratégiques** installés
- Optimisations sur les requêtes fréquentes :
  - Recherche utilisateurs par email/nom
  - Filtrage cours par date/sport
  - Historique présences par élève
  - Paiements par statut/utilisateur
- **15 index dupliqués** identifiés (voir `phase_2_optimizations`)

---

## ❓ FAQ & Troubleshooting

### ❌ Erreur : "Access denied for user 'root'"

**Solution :**
```bash
# Sous Windows/Laragon
mysql -u root -p

# Ou spécifier le mot de passe
mysql -u root -pVOTRE_MOT_DE_PASSE < clubmanager_ultra_complete.sql
```

### ❌ Erreur : "Database already exists"

**Solution :**
```bash
# Supprimer l'ancienne base d'abord
mysql -u root -e "DROP DATABASE IF EXISTS clubmanager;"
mysql -u root < db/creation/clubmanager_ultra_complete.sql
```

### ❌ Erreur : "Cannot add foreign key constraint"

**Cause :** Ordre incorrect des tables ou clés étrangères manquantes.

**Solution :** Le script gère automatiquement cela avec `SET FOREIGN_KEY_CHECKS = 0;`

### ⚠️ Tables manquantes après installation

```sql
-- Vérifier le nombre de tables
SELECT COUNT(*) FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'clubmanager';

-- Devrait retourner 88+
```

### 🐌 Requêtes lentes

```sql
-- Vérifier les index
SHOW INDEX FROM utilisateurs;

-- Analyser une requête
EXPLAIN SELECT * FROM utilisateurs WHERE email = 'test@example.com';
```

### 🔒 Problèmes de connexion Prisma

```bash
# Régénérer le client Prisma
cd api
rm -rf node_modules/.prisma
npx prisma generate

# Tester la connexion
npx prisma db execute --stdin < test_connection.sql
```

---

## 🎯 Cas d'Usage Réels

### Scénario 1 : Nouvel élève s'inscrit

```sql
-- 1. Créer l'utilisateur
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, ...) VALUES (...);

-- 2. Créer son profil
INSERT INTO user_profiles (user_id, sport_id, ...) VALUES (...);

-- 3. L'inscrire à un cours
INSERT INTO inscriptions (utilisateur_id, cours_recurrent_id, ...) VALUES (...);

-- 4. Enregistrer le paiement
INSERT INTO paiements (utilisateur_id, montant, statut, ...) VALUES (...);
```

### Scénario 2 : Passage de grade

```sql
-- 1. Enregistrer le nouveau grade
INSERT INTO user_grade_history (user_id, sport_id, grade_id, obtained_at, ...) 
VALUES (10, 1, 4, NOW(), ...);

-- 2. Notifier l'élève
INSERT INTO notifications (user_id, type, title, message, ...) 
VALUES (10, 'GRADING_RESULT', 'Félicitations!', '...', ...);

-- 3. Envoyer l'email
INSERT INTO email_queue (recipient_email, template_id, variables, ...) 
VALUES ('email@example.com', 4, '{"grade": "Ceinture verte"}', ...);
```

### Scénario 3 : Rapport de présences mensuel

```sql
-- Présences d'un élève sur le mois
SELECT c.date, c.titre, p.statut
FROM presences p
JOIN cours c ON p.cours_id = c.id
WHERE p.utilisateur_id = 10
  AND MONTH(c.date) = MONTH(NOW())
ORDER BY c.date DESC;
```

---

## 🚀 Pour Aller Plus Loin

### Phase 2 : Optimisations Avancées

Si vous souhaitez optimiser davantage la base de données :

```bash
cd api/prisma/migrations/phase_2_optimizations
mysql -u root clubmanager < INSTALL_PHASE_2_OPTIMIZATIONS.sql
mysql -u root clubmanager < VERIFY_PHASE_2.sql
```

**Inclut :**
- Suppression de 15 index dupliqués
- Ajout de 3 foreign keys manquantes
- Migration de colonnes dépréciées
- Vue de compatibilité `v_utilisateurs_full`

### Tests et Validation

```bash
# Tester l'installation
cd database
mysql -u root clubmanager < TEST_INSTALLATION.sql

# Vérifier la cohérence
mysql -u root clubmanager < VERIFY_INSTALLATION.sql
```

### Monitoring et Analytics

```sql
-- Dashboard admin - Stats en temps réel
SELECT 
  (SELECT COUNT(*) FROM utilisateurs WHERE role = 'eleve') as total_eleves,
  (SELECT COUNT(*) FROM cours WHERE statut = 'SCHEDULED') as cours_a_venir,
  (SELECT SUM(montant) FROM paiements WHERE statut = 'COMPLETED') as revenu_total,
  (SELECT COUNT(*) FROM presences WHERE statut = 'PRESENT' AND DATE(created_at) = CURDATE()) as presences_aujourdhui;
```

---

## 📞 Support & Contribution

### Besoin d'aide ?

1. **Documentation technique** : `database/README.md`
2. **Guide d'optimisation** : `api/prisma/migrations/phase_2_optimizations/README.md`
3. **Exemples TypeScript** : `api/src/shared/stored-procedures.ts`

### Signaler un problème

Si vous rencontrez un problème avec l'installation :
1. Vérifiez les logs MySQL
2. Consultez la section Troubleshooting ci-dessus
3. Créez une issue avec :
   - Version MySQL utilisée
   - Message d'erreur complet
   - Commande exécutée

### Contribuer

Pour améliorer les scripts SQL :
1. Forkez le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements
4. Push et créez une Pull Request

---

## 📄 Licence & Crédits

**Projet :** ClubManager - Système de Gestion de Club d'Arts Martiaux  
**Version:** 2.0.0 (Ultra Complete Edition)  
**Date:** Février 2024  
**Auteur:** ClubManager Team  

**Technologies utilisées :**
- MySQL 8.0+
- Prisma ORM
- Node.js / TypeScript
- Stripe (paiements)

---

## ✅ Checklist Post-Installation

- [ ] Base de données créée avec succès
- [ ] 88+ tables présentes
- [ ] 34 utilisateurs insérés (1 admin + 8 profs + 25 élèves)
- [ ] 5 sports configurés avec grades
- [ ] 20 cours récurrents programmés
- [ ] 30+ paiements de test
- [ ] 10 événements planifiés
- [ ] Stored procedures installées (optionnel)
- [ ] Prisma configuré (`npx prisma generate`)
- [ ] Variables d'environnement (.env)
- [ ] Connexion test réussie (admin@clubmanager.com)
- [ ] Application lancée et fonctionnelle

---

**🎉 Félicitations ! Votre base de données ClubManager est opérationnelle !**

Pour toute question, consultez la documentation technique ou les exemples de code fournis.

**Bon développement ! 🥋🥊**