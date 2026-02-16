# 🏆 ClubManager - Système de Gestion de Club

**Version**: 1.0.0  
**Status**: ✅ En développement actif  
**Type**: Épreuve Intégrée / TFE

---

## 📋 Vue d'Ensemble

ClubManager est une application full-stack de gestion de club sportif développée avec les technologies modernes suivantes :

- **Backend**: Node.js, TypeScript, GraphQL, Prisma
- **Base de données**: MySQL
- **Architecture**: Monorepo avec packages partagés
- **Email System**: Système d'envoi avancé avec SendGrid

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- MySQL 8+
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd ClubManager

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Appliquer les migrations
cd api
npx prisma migrate deploy
npx prisma generate

# Démarrer le serveur de développement
npm run dev
```

---

## 📁 Structure du Projet

```
ClubManager/
├── api/                          # API Backend (GraphQL)
│   ├── src/
│   │   ├── routes/              # Routes et resolvers GraphQL
│   │   ├── infrastructure/      # Services externes (email, etc.)
│   │   └── ...
│   └── prisma/                  # Schéma et migrations DB
│
├── packages/
│   └── types/                   # Types TypeScript partagés
│
├── docs/                        # 📚 Documentation complète
│   ├── EXECUTIVE_SUMMARY.md
│   ├── EMAIL_QUICKSTART_GUIDE.md
│   ├── EMAIL_IMPLEMENTATION_SUMMARY.md
│   └── ...
│
└── README.md                    # Ce fichier
```

---

## 📚 Documentation

Toute la documentation est centralisée dans le dossier [`docs/`](./docs/):

### 📖 Guides Principaux

- **[Executive Summary](./docs/EXECUTIVE_SUMMARY.md)** - Vue d'ensemble du système email
- **[Quick Start Email](./docs/EMAIL_QUICKSTART_GUIDE.md)** - Guide de démarrage rapide du système email
- **[Résumé d'Implémentation](./docs/EMAIL_IMPLEMENTATION_SUMMARY.md)** - Détails de l'implémentation email

### 🔧 Documentation Technique

- **[Email System README](./docs/EMAIL_SYSTEM_README.md)** - Documentation technique du système d'email
- **[Architecture Analysis](./docs/ARCHITECTURE_ANALYSIS.md)** - Analyse de l'architecture
- **[Validators Resolution](./docs/VALIDATORS_RESOLUTION.md)** - Résolution des validateurs

### 📅 Planification & Stratégie

- **[Roadmap 12 Semaines](./docs/ROADMAP_12_SEMAINES.md)** - Planification détaillée
- **[Excellence Roadmap](./docs/EXCELLENCE_ROADMAP.md)** - Feuille de route vers l'excellence
- **[Améliorations Suggestions](./docs/AMELIORATIONS_SUGGESTIONS.md)** - Suggestions d'amélioration

### 🎓 TFE

- **[Préparation Défense](./docs/TFE_DEFENSE_PREPARATION.md)** - Préparation pour la défense du TFE
- **[TODO](./docs/TODO.md)** - Liste des tâches

---

## 🎯 Fonctionnalités Principales

### ✅ Système d'Email Avancé

Le système d'email est de niveau entreprise avec :

- ✅ **Queue persistante** - Zéro perte d'emails avec retry automatique
- ✅ **Circuit Breaker** - Protection contre les surcharges
- ✅ **Validation avancée** - Vérification syntaxe, DNS, domaines jetables
- ✅ **A/B Testing** - Tests automatiques de variations
- ✅ **Rate Limiting** - Limitation intelligente par domaine
- ✅ **IP Warmup** - Montée en charge progressive des IPs
- ✅ **Monitoring** - Métriques Prometheus temps réel
- ✅ **Templates HTML** - 23 templates prêts à l'emploi

**Performance**: 95%+ de délivrabilité

---

## 🛠️ Scripts Disponibles

### Backend (API)

```bash
cd api

# Développement
npm run dev              # Démarrer le serveur de développement

# Build
npm run build           # Compiler TypeScript
npm start               # Démarrer en production

# Base de données
npx prisma migrate dev  # Créer et appliquer une migration
npx prisma generate     # Générer le client Prisma
npx prisma studio       # Interface graphique DB

# Tests
npm test                # Lancer les tests
```

### Package Types

```bash
cd packages/types

npm run build           # Compiler le package
```

---

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/clubmanager"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@clubmanager.com"
SENDGRID_FROM_NAME="ClubManager"

# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET="your-secret-key"
```

---

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests e2e
npm run test:e2e
```

---

## 📦 Packages

### @clubmanager/types

Package de types TypeScript partagés entre l'API et le frontend.

- Types de domaine (User, Club, Event, etc.)
- Types d'infrastructure (Email, Alerts, etc.)
- Types GraphQL
- Utilitaires de validation

Voir [`packages/types/README.md`](./packages/types/README.md)

---

## 🤝 Contribution

Ce projet est développé dans le cadre d'une épreuve intégrée. Pour toute question ou suggestion :

1. Consulter la [documentation](./docs/)
2. Vérifier le [TODO](./docs/TODO.md)
3. Contacter l'équipe de développement

---

## 📄 Licence

Projet académique - Tous droits réservés

---

## 🎓 Contexte Académique

Ce projet est développé dans le cadre d'un Travail de Fin d'Études (TFE) / Épreuve Intégrée.

**Objectif**: Créer un système de gestion de club complet avec des fonctionnalités avancées de niveau entreprise.

Voir [TFE_DEFENSE_PREPARATION.md](./docs/TFE_DEFENSE_PREPARATION.md) pour plus de détails.

---

**Dernière mise à jour**: Février 2025