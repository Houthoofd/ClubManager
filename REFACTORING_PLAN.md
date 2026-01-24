# Plan de Refactoring - TFE ClubManager

**Date**: 24 janvier 2026  
**Branch**: new-architectur-aws  
**Objectif**: Moderniser l'architecture, réduire les coûts AWS, améliorer la maintenabilité

## 🎯 Objectifs Principaux

### 1. **Amélioration de la Lisibilité**
- Découper les gros fichiers (>500 lignes) en modules plus petits
- Organiser le code par fonctionnalité (feature-based)
- Améliorer la séparation des responsabilités

### 2. **Tests**
- Augmenter la couverture de tests (actuellement partielle)
- Tests unitaires pour tous les services
- Tests d'intégration pour les routes critiques
- Tests E2E pour les flux utilisateurs principaux

### 3. **Migration Stockage S3**
- Remplacer le stockage local par AWS S3
- Upload d'avatars utilisateurs
- Upload d'images de cours
- Gestion des photos de produits magasin
- Optimisation des coûts de stockage

### 4. **Migration GraphQL + Prisma**
- **Remplacer REST par GraphQL**:
  - API unifiée et type-safe
  - Réduction du sur-fetching/under-fetching
  - Subscriptions en temps réel (chat, notifications)
  - Apollo Server ou Yoga GraphQL
- **Migration vers Prisma ORM**:
  - Remplacer les queries SQL brutes
  - Type-safety complet avec TypeScript
  - Migrations versionnées automatiques
  - Query builder intuitif
  - Relations simplifiées

### 5. **Migration Base de Données**
- **Problème actuel**: RDS coûte 45€/mois
- **Solutions à évaluer**:
  - Aurora Serverless v2 (pay-per-use)
  - RDS avec instance plus petite + read replicas
  - Base hébergée sur EC2 avec backups S3
  - Migration partielle vers DynamoDB (données non-relationnelles)

## 📊 Fichiers Prioritaires à Refactoriser

### Routes (critiques - beaucoup de logique métier)
1. **paiements2.ts** (2187 lignes) - À découper en:
   - `payments/create.ts`
   - `payments/update.ts`
   - `payments/list.ts`
   - `payments/validate.ts`
   - `payments/webhooks.ts`

2. **paiements.ts** (1596 lignes) - Fusionner avec paiements2 puis découper

3. **stripe.ts** (1072 lignes) - À découper en:
   - `stripe/checkout.ts`
   - `stripe/subscriptions.ts`
   - `stripe/webhooks.ts`
   - `stripe/customers.ts`

4. **utilisateurs.ts** (910 lignes) - Découper en routes CRUD séparées

### DB Clients (couche données)
1. **utilisateur2.ts** (1453 lignes) + **utilisateurs.ts** (1247 lignes)
   - Fusionner et découper par responsabilité
   - Créer des repositories distincts

2. **paiements.ts** (1205 lignes) - Séparer queries et business logic

3. **inscription.ts** (1171 lignes) - Découper le processus d'inscription

4. **cours.ts** (1169 lignes) - Séparer CRUD de la logique métier

### Services
1. **emailClient.ts** (1219 lignes) - À découper en:
   - `email/sender.ts`
   - `email/templates.ts`
   - `email/validation.ts`

2. **emailValidationService.ts** (766 lignes) - Optimiser

## 🏗️ Nouvelle Architecture Proposée

```
api/src/
├── modules/                    # Organisation par feature
│   ├── auth/
│   │   ├── resolvers/         # GraphQL resolvers
│   │   ├── services/
│   │   ├── validators/
│   │   ├── schema.graphql
│   │   └── __tests__/
│   ├── users/
│   ├── payments/
│   ├── courses/
│   ├── store/
│   └── messaging/
├── shared/                     # Code partagé
│   ├── middleware/
│   ├── utils/
│   ├── types/
│   ├── constants/
│   └── config/
├── graphql/                    # GraphQL core
│   ├── schema.graphql         # Schéma global
│   ├── context.ts             # Context builder
│   ├── scalars/               # Custom scalars
│   └── directives/            # Custom directives
├── infrastructure/             # Couche infra
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── client.ts
│   ├── storage/
│   │   ├── s3-client.ts
│   │   └── local-storage.ts (fallback)
│   ├── email/
│   │   └── sendgrid-client.ts
│   └── cache/
│       └── redis-client.ts (futur)
└── server.ts
```

## 🔧 Étapes de Migration

### Phase 1: Configuration & Infrastructure (Semaine 1)
- [ ] Setup AWS S3 bucket
- [ ] Créer service S3 avec AWS SDK v3
- [ ] Configurer environnement (variables, credentials)
- [ ] Tests du client S3
- [ ] **Setup Prisma ORM**
- [ ] Introspection schéma DB existant
- [ ] Générer schema.prisma initial
- [ ] Premier test de migration

### Phase 2: Migration Prisma (Semaines 2-3)
- [ ] Définir schéma Prisma complet
- [ ] Créer migrations initiales
- [ ] Migrer utilisateurs vers Prisma
- [ ] Migrer cours vers Prisma
- [ ] Migrer paiements vers Prisma
- [ ] Migrer magasin vers Prisma
- [ ] Tests de migration

### Phase 3: Setup GraphQL (Semaine 4)
- [ ] Installer Apollo Server / GraphQL Yoga
- [ ] Définir schéma GraphQL de base
- [ ] Setup context avec Prisma client
- [ ] Créer resolvers de test
- [ ] Setup GraphQL Playground/Studio
- [ ] Tests GraphQL queries/mutations

### Phase 4: Migration Routes → GraphQL (Semaines 5-7)
- [ ] **Auth module**: mutations login/register/logout
- [ ] **Users module**: queries + mutations CRUD
- [ ] **Courses module**: queries + mutations + subscriptions
- [ ] **Payments module**: mutations + webhooks Stripe
- [ ] **Store module**: queries + mutations produits
- [ ] **Messaging module**: queries + subscriptions temps réel
- [ ] Tests d'intégration GraphQL

### Phase 5: Migration Uploads S3 (Semaine 8)
- [ ] Migrer upload avatars vers S3
- [ ] Migrer images cours
- [ ] Migrer images produits
- [ ] GraphQL mutations pour uploads (multipart)
- [ ] Cleanup ancien système de fichiers
- [ ] Tests E2E upload

### Phase 6: Optimisations GraphQL (Semaine 9)
- [ ] DataLoader pour N+1 queries
- [ ] Query complexity analysis
- [ ] Rate limiting GraphQL
- [ ] Caching avec Redis
- [ ] Monitoring performances

### Phase 7: Base de Données (Semaine 10)
- [ ] Benchmark coûts alternatives RDS
- [ ] POC Aurora Serverless
- [ ] Migration Prisma vers nouvelle DB
- [ ] Tests de charge
- [ ] Rollback plan

### Phase 8: Tests & Documentation (Semaine 11)
- [ ] Augmenter couverture tests >80%
- [ ] Documentation GraphQL Schema (descriptions)
- [ ] Documentation architecture
- [ ] Guide de migration frontend
- [ ] Guide de déploiement

### Phase 9: Migration Frontend (Semaine 12)
- [ ] Setup Apollo Client frontend
- [ ] Remplacer fetch/axios par GraphQL queries
- [ ] Setup subscriptions WebSocket
- [ ] Tests frontend intégration
- [ ] Performance optimization

## 💰 Estimation Coûts AWS (optimisés)

### Coûts Actuels
- RDS MySQL: 45€/mois
- **Total**: ~45€/mois

### Coûts Projetés
- Aurora Serverless v2: ~15-25€/mois (selon usage)
- S3 Standard (100GB): ~2,30€/mois
- S3 Requests: ~0,50€/mois
- Data Transfer: ~1-2€/mois
- **Total estimé**: ~20-30€/mois

**Économie potentielle**: 15-25€/mois (33-55%)

## 📝 Principes de Refactoring

1. **Single Responsibility**: Un fichier = une responsabilité
2. **Max 300 lignes** par fichier (idéal: 150-200)
3. **DRY**: Factoriser le code dupliqué
4. **Type-safe**: TypeScript strict mode + Prisma + GraphQL
5. **Tests d'abord**: TDD quand possible
6. **Documentation**: JSDoc + GraphQL schema descriptions
7. **GraphQL Best Practices**:
   - Queries pour lecture
   - Mutations pour écriture
   - Subscriptions pour temps réel
   - DataLoader pour optimisation N+1

## 🚀 Quick Wins

1. Setup Prisma (type-safety immédiate)
2. Migrer une route simple vers GraphQL (POC)
3. Setup tests automatisés (qualité)
4. Migrer uploads vers S3 (impact immédiat)
5. Évaluer Aurora Serverless (économies)

## 🛠️ Stack Technique Cible

### Backend
- **Runtime**: Node.js + TypeScript
- **API**: GraphQL (Apollo Server / Yoga)
- **ORM**: Prisma
- **Database**: MySQL/PostgreSQL (Aurora Serverless)
- **Storage**: AWS S3
- **Email**: SendGrid
- **Payments**: Stripe
- **Testing**: Jest + Supertest
- **Validation**: Zod

### Frontend (à adapter)
- **GraphQL Client**: Apollo Client
- **Cache**: Apollo InMemory Cache
- **Real-time**: GraphQL Subscriptions (WebSocket)

## 📦 Dépendances à Ajouter

```bash
# Prisma
npm install @prisma/client
npm install -D prisma

# GraphQL
npm install graphql @apollo/server
npm install graphql-scalars graphql-upload-minimal
npm install -D @graphql-codegen/cli @graphql-codegen/typescript

# DataLoader (optimisation)
npm install dataloader

# AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 🔄 Stratégie de Migration Progressive

1. **Coexistence REST + GraphQL** pendant la transition
2. **Prisma + anciennes queries SQL** en parallèle
3. **Migration par module** (non big-bang)
4. **Feature flags** pour basculer progressivement
5. **Monitoring double** (REST + GraphQL)
6. **Rollback facile** à chaque étape
