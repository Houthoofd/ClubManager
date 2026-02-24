# 🏆 ClubManager

Application complète de gestion de club avec frontend React et backend Node.js.

---

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Démarrage Rapide](#démarrage-rapide)
- [CI/CD & Déploiement](#cicd--déploiement)
- [Structure du Projet](#structure-du-projet)
- [Documentation](#documentation)
- [Contribution](#contribution)

---

## 🎯 Vue d'ensemble

ClubManager est une plateforme moderne de gestion de club offrant :

- 👥 Gestion des membres et adhésions
- 📅 Planification d'événements et activités
- 💳 Paiements en ligne (Stripe)
- 📊 Tableaux de bord et analytics
- 🔐 Authentification sécurisée (JWT)
- 📱 Interface responsive (mobile-first)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │   Database   │  │
│  │  React/Vite  │    │  Node.js     │    │    MySQL     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ Push/PR triggers CI/CD
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                            │
│  Tests → Build → Docker Images → Deploy                     │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Production Environment                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Frontend        │         │  Backend         │         │
│  │  S3 + CloudFront │◄───────►│  EC2 + Docker    │         │
│  └──────────────────┘         └────────┬─────────┘         │
│                                         │                    │
│                              ┌──────────▼─────────┐         │
│                              │  RDS MySQL + Redis │         │
│                              └────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technologies

### Frontend
- **Framework :** React 18.3
- **Build Tool :** Vite 6
- **UI Library :** PatternFly React
- **State Management :** Zustand + React Query
- **GraphQL Client :** Apollo Client
- **Styling :** CSS Modules
- **Testing :** Vitest + Testing Library
- **Type Safety :** TypeScript 5.8

### Backend
- **Runtime :** Node.js 18+
- **Framework :** Express.js
- **Database ORM :** Prisma
- **Database :** MySQL 8.0
- **Cache :** Redis 7
- **Authentication :** JWT
- **Validation :** Zod
- **API :** GraphQL + REST
- **Testing :** Jest
- **Type Safety :** TypeScript

### DevOps & Infrastructure
- **CI/CD :** GitHub Actions
- **Container Registry :** GitHub Container Registry (GHCR)
- **Cloud Provider :** AWS
- **Frontend Hosting :** S3 + CloudFront
- **Backend Hosting :** EC2 + Docker
- **Monitoring :** Sentry + CloudWatch
- **Database :** AWS RDS MySQL

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js ≥ 18
- MySQL 8.0
- Redis 7
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone https://github.com/your-org/ClubManager.git
cd ClubManager

# Installer les dépendances
npm install

# Configuration des variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Setup de la base de données
npm run db-setup

# Démarrer en développement
npm run start:front:dev    # Frontend (port 5173)
npm run start:api:dev      # Backend (port 4000)
```

### Accès à l'application

- **Frontend :** http://localhost:5173
- **Backend API :** http://localhost:4000
- **GraphQL Playground :** http://localhost:4000/graphql

---

## 🚀 CI/CD & Déploiement

### Architecture CI/CD

ClubManager utilise **GitHub Actions** pour un déploiement automatisé vers **AWS** avec les images Docker stockées dans **GHCR**.

```
Push → Tests → Build → Docker Images → Deploy to AWS
                           ↓
                    GHCR (backup/rollback)
```

### Workflows Disponibles

| Workflow | Description | Déclencheur |
|----------|-------------|-------------|
| `ci-cd-aws.yml` | ✅ **Principal** - Tests, build, deploy complet | Push sur `main`/`develop` |
| `ci.yml` | Tests uniquement (frontend + backend) | Tous les PR |
| `cd-release.yml` | Déploiement manuel avec confirmation | Workflow dispatch |
| `auth-tests.yml` | Tests d'authentification spécifiques | Push ou manuel |

### Déploiement en Production

#### Option 1 : Déploiement Automatique (Recommandé)

```bash
# Merge vers main déclenche automatiquement le déploiement
git checkout main
git merge develop
git push origin main

# Suivre le déploiement dans GitHub Actions
# https://github.com/your-org/ClubManager/actions
```

#### Option 2 : Déploiement Manuel

```bash
# Via le script local
chmod +x scripts/deploy-to-s3.sh
./scripts/deploy-to-s3.sh prod

# Via GitHub CLI
gh workflow run "CI/CD - AWS S3 + GHCR" --ref main
```

### Configuration Requise

**Secrets GitHub à configurer :**

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
S3_BUCKET_NAME
CLOUDFRONT_DISTRIBUTION_ID
VITE_API_BASE_URL
VITE_STRIPE_PUBLIC_KEY
EC2_HOST
EC2_USER
EC2_SSH_PRIVATE_KEY
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
REDIS_URL
```

### Rollback

En cas de problème, plusieurs options :

```bash
# Option 1 : Git revert (recommandé)
git revert <commit-sha>
git push origin main

# Option 2 : Script de rollback
./scripts/deploy-to-s3.sh --rollback

# Option 3 : Via GHCR image précédente
docker pull ghcr.io/your-org/clubmanager/frontend:main-abc1234
# Puis redéployer
```

### Coûts Estimés

**Configuration de base (MVP) :**
- Frontend (S3 + CloudFront) : ~$2/mois
- Backend (EC2 t3.small) : ~$17/mois
- Database (RDS MySQL t3.micro) : ~$16/mois
- **Total : ~$35-50/mois**

**Documentation Complète :**
- 📖 [Guide Complet AWS Setup](./docs/AWS_DEPLOYMENT_SETUP.md)
- 🚀 [Quick Start Deployment](./docs/QUICKSTART_AWS_DEPLOYMENT.md)
- 📊 [Comparaison des Options](./docs/DEPLOYMENT_COMPARISON.md)
- 🔄 [CI/CD Overview](./docs/CI_CD_OVERVIEW.md)

---

## 📂 Structure du Projet

```
ClubManager/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── ci-cd-aws.yml   # Workflow principal ⭐
│       ├── ci.yml
│       └── cd-release.yml
├── api/                     # Backend Node.js
│   ├── src/
│   ├── prisma/             # Schema Prisma
│   ├── Dockerfile
│   └── package.json
├── front-end/              # Frontend React
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── packages/               # Packages partagés
│   └── types/             # Types TypeScript communs
├── scripts/               # Scripts utilitaires
│   ├── deploy-to-s3.sh   # Script de déploiement
│   └── seed/             # Scripts de seed DB
├── docs/                  # Documentation
│   ├── AWS_DEPLOYMENT_SETUP.md
│   ├── QUICKSTART_AWS_DEPLOYMENT.md
│   ├── DEPLOYMENT_COMPARISON.md
│   └── CI_CD_OVERVIEW.md
├── docker-compose.yml     # Développement local
├── .env.example
├── .env.aws.example      # Variables AWS
└── README.md
```

---

## 📚 Documentation

### Guides de Déploiement

- 📖 [**Configuration AWS Complète**](./docs/AWS_DEPLOYMENT_SETUP.md) - Setup détaillé S3, CloudFront, IAM
- 🚀 [**Quick Start - Déploiement**](./docs/QUICKSTART_AWS_DEPLOYMENT.md) - Déployer en 5 minutes
- 📊 [**Comparaison des Options**](./docs/DEPLOYMENT_COMPARISON.md) - AWS vs Netlify vs VPS
- 🔄 [**CI/CD Overview**](./docs/CI_CD_OVERVIEW.md) - Architecture complète du pipeline

### Documentation Technique

- [Frontend Documentation](./front-end/README.md)
- [Backend API Documentation](./api/README.md)
- [GraphQL Schema](./front-end/schema.graphql)
- [Database Schema](./api/prisma/schema.prisma)

### Guides de Développement

- [Tests Guide](./front-end/TESTS_QUICKSTART.md)
- [Environment Setup](./front-end/ENVIRONMENT.md)
- [Contributing Guide](./CONTRIBUTING.md) (à venir)

---

## 🧪 Tests

### Frontend

```bash
cd front-end

# Tests unitaires
npm run test

# Tests avec UI
npm run test:ui

# Coverage
npm run test:coverage

# Lint
npm run lint
```

### Backend

```bash
cd api

# Tests
npm run test

# Tests avec watch
npm run test:watch

# Coverage
npm run test:coverage

# Lint
npm run lint
```

### CI/CD Tests

Les tests sont automatiquement exécutés sur chaque PR et push :
- ✅ Linting (ESLint)
- ✅ Unit tests (Vitest/Jest)
- ✅ Integration tests
- ✅ Coverage check (minimum 70%)

---

## 🛡️ Sécurité

- ✅ **Authentification JWT** avec refresh tokens
- ✅ **Validation des données** avec Zod
- ✅ **SQL Injection protection** via Prisma
- ✅ **XSS protection** avec sanitization
- ✅ **CORS** configuré strictement
- ✅ **Rate limiting** sur l'API
- ✅ **HTTPS** forcé en production (CloudFront)
- ✅ **Secrets** gérés via GitHub Secrets / AWS Secrets Manager

---

## 📊 Monitoring

### Production

- **Frontend :** CloudWatch + Sentry
- **Backend :** CloudWatch Logs + Sentry
- **Database :** RDS Performance Insights
- **Infrastructure :** AWS CloudWatch Dashboards

### Métriques Clés

- Response time (p95) : < 200ms
- Error rate : < 0.5%
- Uptime : 99.9%+
- Coverage : 70%+

---

## 🤝 Contribution

### Workflow

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'feat: Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Conventions

- **Commits :** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branches :** `feature/`, `fix/`, `docs/`, `refactor/`
- **Code Style :** ESLint + Prettier (auto-format)
- **Tests :** Obligatoires pour nouvelles features

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

## 👥 Équipe

- **Développement :** [Votre nom]
- **DevOps :** [Nom]
- **Design :** [Nom]

---

## 🔗 Liens Utiles

- [Documentation AWS](https://docs.aws.amazon.com/)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Vite Documentation](https://vitejs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev/)

---

## 📞 Support

- **Issues :** [GitHub Issues](https://github.com/your-org/ClubManager/issues)
- **Discussions :** [GitHub Discussions](https://github.com/your-org/ClubManager/discussions)
- **Email :** support@clubmanager.com

---

**Made with ❤️ by the ClubManager Team**