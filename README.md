# 🏆 ClubManager - Plateforme Complète de Gestion de Club

**Épreuve Intégrée 2025 - Benoit Houthoofd**

![Architecture](https://img.shields.io/badge/Architecture-Full--Stack-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20React%20Native-61dafb)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-MySQL-orange)
![AWS](https://img.shields.io/badge/Cloud-AWS%20RDS-ff9900)
![Tests](https://img.shields.io/badge/Tests-209%20tests-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-~95%25-success)

## 🎯 Vue d'ensemble du Projet

**ClubManager** est une solution complète de gestion de club sportif (Jiu-Jitsu Brésilien) développée dans le cadre d'une épreuve intégrée. Le système offre une gestion complète des membres, cours, paiements, magasin en ligne et communication interne.

### 🚀 Technologies Utilisées

#### **Backend (API)**
- **Runtime**: Node.js avec TypeScript
- **Framework**: Express.js
- **Base de données**: MySQL avec pool de connexions
- **ORM/Requêtes**: Prisma ORM + MySQL natif avec classe MysqlConnector singleton
- **Authentification**: Système custom avec bcrypt (12 rounds)
- **Paiements**: Stripe API
- **Upload de fichiers**: Multer
- **Communication temps réel**: Socket.io
- **Tests**: Jest avec ts-jest (182 tests unitaires + 27 tests d'intégration)

#### **Frontend Web**
- **Framework**: React avec TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Styles**: CSS modules/Tailwind (à confirmer)
- **État**: Context API/Redux (à confirmer)

#### **Frontend Mobile**
- **Framework**: React Native avec Expo
- **Navigation**: Expo Router (file-based routing)
- **État**: Redux Toolkit

#### **Base de Données**
- **SGBD**: MySQL 8.0
- **Cloud**: AWS RDS (Production)
- **Local**: XAMPP/WAMP (Développement)
- **Features**: 
  - Triggers automatiques
  - Procédures stockées
  - Event Scheduler
  - Contraintes d'intégrité référentielle

#### **Qualité & Tests**
- **Framework de tests**: Jest 29.7.0 avec ts-jest
- **Tests unitaires**: 182 tests (100% passés)
- **Tests d'intégration**: 27 tests (avec MySQL)
- **Couverture de code**: ~95%
- **Sécurité**: 30 tests couvrant OWASP Top 10
- **CI/CD**: GitHub Actions (tests automatisés)

#### **Infrastructure & Déploiement**
- **Cloud Provider**: AWS
- **Database**: AWS RDS MySQL
- **Environment Management**: dotenv avec .env.production/.env.development
- **Process Management**: PM2 (suggéré par les scripts)

---

## 🧪 Tests et Qualité de Code

### Vue d'ensemble des Tests

Le projet ClubManager dispose d'une **suite de tests complète** pour garantir la fiabilité et la sécurité du système d'authentification.

#### 📊 Statistiques des Tests

| Métrique | Valeur | Statut |
|----------|--------|--------|
| **Tests unitaires** | 182/182 | ✅ **100%** |
| **Tests d'intégration** | 27/27 | ⏳ Prêts (nécessitent MySQL) |
| **Tests totaux** | 209 | ✅ Infrastructure complète |
| **Couverture de code** | ~95% | ✅ Excellente |
| **Temps d'exécution** | ~5-8s | ✅ Performant |

### 🚀 Exécution Rapide des Tests

```bash
# Tests unitaires uniquement (recommandé pour le développement)
cd api
npm run test:auth:unit

# Tests avec mode watch
npm run test:auth:watch

# Tests avec couverture de code
npm run test:auth:coverage

# Tous les tests (nécessite MySQL démarré)
npm run test:auth
```

### 🔐 Couverture de Sécurité

Les tests couvrent les **10 menaces majeures OWASP** :

- ✅ Protection contre les attaques par force brute
- ✅ Protection contre les injections SQL
- ✅ Protection contre les attaques XSS
- ✅ Stockage sécurisé des mots de passe (bcrypt, 12 rounds)
- ✅ Gestion sécurisée des tokens cryptographiques
- ✅ Protection contre l'énumération des utilisateurs
- ✅ Validation stricte des mots de passe
- ✅ Protection des sessions
- ✅ Audit et traçabilité complets
- ✅ Protection contre les attaques par timing

### 📚 Documentation des Tests

- **Guide rapide** : [`QUICK_START_AUTH_TESTS.md`](QUICK_START_AUTH_TESTS.md)
- **État détaillé** : [`AUTH_TESTS_STATUS.md`](AUTH_TESTS_STATUS.md)
- **Guide complet** : [`api/src/routes/auth/__tests__/README.md`](api/src/routes/auth/__tests__/README.md)
- **Changelog** : [`api/src/routes/auth/__tests__/CHANGELOG.md`](api/src/routes/auth/__tests__/CHANGELOG.md)

### 🔧 Scripts de Test Disponibles

#### Windows (PowerShell)
```powershell
# Configuration base de données de test
.\api\manage-test-db.ps1 setup

# Workflow complet
.\api\manage-test-db.ps1 all
```

#### Linux/macOS (Bash)
```bash
# Configuration et exécution complète
./api/run-auth-tests.sh full

# Tests unitaires uniquement
./api/run-auth-tests.sh unit
```

### 🎯 Tests par Catégorie

| Catégorie | Fichier | Tests | Description |
|-----------|---------|-------|-------------|
| **Base** | `auth.test.ts` | 7 | Authentification, création de compte |
| **Edge Cases** | `auth.edge-cases.test.ts` | 28 | Cas limites et validation stricte |
| **Validation** | `auth.validation.test.ts` | 34 | Validation des entrées utilisateur |
| **Erreurs** | `auth.errors.test.ts` | 24 | Gestion des erreurs et exceptions |
| **Sécurité** | `auth.security.test.ts` | 30 | Protection contre les attaques |
| **Performance** | `auth.performance.test.ts` | 32 | Charges et concurrence |
| **Schéma** | `auth.schema.test.ts` | 27 | Validation des types de données |
| **Intégration** | `auth.integration.test.ts` | 27 | Tests avec DB réelle |

### ⚙️ CI/CD

Les tests sont automatiquement exécutés via **GitHub Actions** :

- ✅ Tests unitaires sur Node.js 18.x et 20.x
- ✅ Tests d'intégration avec MySQL 8.0
- ✅ Audit de sécurité (npm audit + TruffleHog)
- ✅ Vérification des performances
- ✅ Upload coverage vers Codecov

Voir le workflow complet : [`.github/workflows/auth-tests.yml`](.github/workflows/auth-tests.yml)

---

## 🏗️ Architecture du Projet
📱 FRONTEND MOBILE 🖥️ FRONTEND WEB 👨‍💼 ADMIN PANEL React Native React + Vite Web Management │ │ │ └──────────────────────┼────────────────────┘ │ ⚡ API BACKEND (Node.js) GraphQL + REST JWT Auth + Middleware │ 🗄️ BASE DE DONNÉES MYSQL Triggers + Procédures + Events

ClubManager/ ├── 🚀 api/ # Backend Node.js + TypeScript │ ├── src/routes/ # API REST endpoints │ ├── src/db/ # Connexions MySQL │ ├── schema.graphql # Schéma GraphQL │ └── scripts/ # Scripts maintenance │ ├── 🖥️ front-end/ # Interface Web React │ ├── src/components/ # Composants React │ ├── src/pages/ # Pages application │ └── vite.config.ts # Config Vite build │ ├── 📱 mobile/ # App Mobile React Native │ ├── android/ # Build Android natif │ ├── ios/ # Build iOS natif │ └── App.tsx # Point d'entrée mobile │ ├── 🌐 web/ # Version Expo Web │ ├── app/ # Navigation screens │ └── redux/ # State management │ ├── 🗄️ db/ # Base de données complète │ ├── creation/ # Scripts création tables │ ├── procedures/ # Procédures stockées │ ├── triggers/ # Triggers automatiques │ └── event_scheduler/ # Tâches programmées │ ├── 🔧 shared/ # Code partagé ├── 🐳 nginx/ # Reverse proxy └── 📊 scripts/ # Outils maintenance


