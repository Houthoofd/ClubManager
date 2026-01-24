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

### 4. **Migration Base de Données**
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
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── routes/
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
├── infrastructure/             # Couche infra
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrations/
│   │   └── seeds/
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

### Phase 2: Refactoring Routes Paiements (Semaine 2)
- [ ] Découper paiements2.ts en modules
- [ ] Migrer vers nouvelle structure
- [ ] Ajouter tests unitaires
- [ ] Tests d'intégration

### Phase 3: Refactoring Utilisateurs (Semaine 3)
- [ ] Fusionner utilisateur2 + utilisateurs
- [ ] Créer UserRepository
- [ ] Créer UserService
- [ ] Migrer routes
- [ ] Tests complets

### Phase 4: Migration Uploads S3 (Semaine 4)
- [ ] Migrer upload avatars vers S3
- [ ] Migrer images cours
- [ ] Migrer images produits
- [ ] Cleanup ancien système de fichiers
- [ ] Tests E2E upload

### Phase 5: Autres Modules (Semaines 5-6)
- [ ] Refactorer module cours
- [ ] Refactorer module messagerie
- [ ] Refactorer module magasin
- [ ] Refactorer services email

### Phase 6: Base de Données (Semaines 7-8)
- [ ] Benchmark coûts alternatives RDS
- [ ] POC Aurora Serverless
- [ ] Plan de migration
- [ ] Migration progressive
- [ ] Tests de charge
- [ ] Rollback plan

### Phase 7: Tests & Documentation (Semaine 9)
- [ ] Augmenter couverture tests >80%
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Documentation architecture
- [ ] Guide de déploiement

### Phase 8: Optimisations (Semaine 10)
- [ ] Performance profiling
- [ ] Optimisation requêtes DB
- [ ] CDN pour assets S3
- [ ] Monitoring & logs (CloudWatch)

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
4. **Type-safe**: TypeScript strict mode
5. **Tests d'abord**: TDD quand possible
6. **Documentation**: JSDoc pour toutes les fonctions publiques

## 🚀 Quick Wins

1. Migrer uploads vers S3 (impact immédiat)
2. Découper paiements2.ts (maintenabilité)
3. Setup tests automatisés (qualité)
4. Évaluer Aurora Serverless (économies)
