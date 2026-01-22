# Guide des Tests Redis Cache

Ce document explique comment exécuter et comprendre les tests de l'implémentation Redis Cache pour le système multi-tenant ClubManager.

## 📋 Table des Matières

- [Aperçu](#aperçu)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Exécution des Tests](#exécution-des-tests)
- [Structure des Tests](#structure-des-tests)
- [Interprétation des Résultats](#interprétation-des-résultats)
- [Dépannage](#dépannage)
- [CI/CD](#cicd)

## 📊 Aperçu

La suite de tests couvre l'ensemble de l'implémentation Redis Cache :

- **Services** : cache.service, tenant-cache.service, user-cache.service, rate-limiter.service
- **Middlewares** : rate-limit.middleware, response-cache.middleware
- **Intégration** : Tests E2E avec Redis et Prisma
- **Performance** : Benchmarks et tests de charge

### Statistiques

- **Fichiers de tests** : 9
- **Tests unitaires** : ~200+
- **Tests d'intégration** : ~50+
- **Tests E2E** : ~15+
- **Couverture cible** : >80%

## 🔧 Prérequis

### 1. Services Requis

```bash
# Redis (requis pour tous les tests)
docker-compose up -d redis

# PostgreSQL (requis pour tests d'intégration)
docker-compose up -d postgres
```

### 2. Variables d'Environnement

Créez un fichier `.env.test` ou configurez ces variables :

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Database (pour tests d'intégration)
DATABASE_URL="postgresql://user:password@localhost:5432/clubmanager_test"

# Test Environment
NODE_ENV=test
```

### 3. Installation des Dépendances

```bash
npm install
```

## 🚀 Exécution des Tests

### Tests Complets

```bash
# Tous les tests
npm test

# Avec couverture
npm test:coverage

# Mode watch (re-exécute sur changement)
npm test:watch
```

### Tests par Catégorie

```bash
# Tous les tests de cache
npm run test:cache

# Services uniquement
npm run test:cache:services

# Middlewares uniquement
npm run test:cache:middlewares

# Tests d'intégration
npm run test:cache:integration

# Tests de performance
npm run test:cache:performance
```

### Tests Spécifiques

```bash
# Un fichier spécifique
npm test -- cache.service.test.ts

# Un test nommé
npm test -- -t "should set and get a value"

# Par pattern
npm test -- --testNamePattern="Cache"

# Verbose
npm test -- --verbose
```

### Options Utiles

```bash
# Exécuter en séquentiel (pour debugging)
npm test -- --runInBand

# Arrêter à la première erreur
npm test -- --bail

# Forcer la couleur dans les logs
npm test -- --colors

# Mise à jour des snapshots
npm test -- -u
```

## 📁 Structure des Tests

```
src/cache/__tests__/
├── services/                           # Tests unitaires des services
│   ├── cache.service.test.ts          # Service de cache de base (150+ tests)
│   ├── tenant-cache.service.test.ts   # Cache tenant (80+ tests)
│   ├── user-cache.service.test.ts     # Cache utilisateur (90+ tests)
│   └── rate-limiter.service.test.ts   # Rate limiter (100+ tests)
│
├── middlewares/                        # Tests des middlewares Express
│   ├── rate-limit.middleware.test.ts  # Middleware rate limiting (60+ tests)
│   └── response-cache.middleware.test.ts # Middleware cache HTTP (70+ tests)
│
├── integration/                        # Tests d'intégration
│   ├── redis.integration.test.ts      # Tests E2E Redis complets (50+ tests)
│   ├── performance.test.ts            # Benchmarks et charge (30+ tests)
│   └── scenarios.e2e.test.ts          # Scénarios réels utilisateur (15+ tests)
│
├── helpers/                            # Utilitaires de test
│   └── test-helpers.ts                # Mocks, generators, benchmarks
│
└── README.md                           # Documentation détaillée
```

## 📊 Interprétation des Résultats

### Sortie Console

```
PASS  src/cache/__tests__/services/cache.service.test.ts
  CacheService
    Basic Operations
      ✓ should set and get a value (45ms)
      ✓ should return null for non-existent key (12ms)
      ✓ should delete a key (23ms)
    TTL and Expiration
      ✓ should respect TTL (2534ms)
      ✓ should get TTL for a key (18ms)
    ...

Test Suites: 9 passed, 9 total
Tests:       287 passed, 287 total
Snapshots:   0 total
Time:        45.231s
```

### Rapport de Couverture

```bash
npm test:coverage
```

Ouvre `coverage/lcov-report/index.html` pour voir le rapport détaillé.

**Objectifs de couverture :**
- Statements : >80%
- Branches : >75%
- Functions : >80%
- Lines : >80%

### Tests de Performance

Les tests de performance affichent des métriques détaillées :

```
=== Redis Performance Tests ===

Cache Write Performance
  ✓ 1000 sequential writes: 1245ms (803 ops/sec)
  ✓ 1000 concurrent writes: 892ms (1121 ops/sec)
  ✓ 10 batches of 100 writes: 456ms (2193 ops/sec)

Cache Read Performance
  ✓ 1000 sequential reads: 678ms (1475 ops/sec)
  ✓ 1000 concurrent reads: 345ms (2899 ops/sec)

Latency Tests
  ✓ Latency percentiles:
    - p50: 3ms
    - p95: 12ms
    - p99: 28ms
    - max: 45ms
```

## 🐛 Dépannage

### Problème : Redis Non Disponible

**Symptôme :**
```
Redis not available for tests - skipping
```

**Solutions :**
1. Vérifier que Redis tourne :
   ```bash
   docker-compose ps redis
   ```
2. Démarrer Redis :
   ```bash
   docker-compose up -d redis
   ```
3. Tester la connexion :
   ```bash
   redis-cli ping
   ```

### Problème : Timeout des Tests

**Symptôme :**
```
Timeout - Async callback was not invoked within the 30000 ms timeout
```

**Solutions :**
1. Augmenter le timeout dans `jest.config.cjs` :
   ```javascript
   testTimeout: 60000, // 60 secondes
   ```
2. Vérifier les connexions Redis/Prisma
3. Utiliser `--runInBand` pour débugger :
   ```bash
   npm test -- --runInBand
   ```

### Problème : Erreurs de Connexion Base de Données

**Symptôme :**
```
Error: P1001: Can't reach database server
```

**Solutions :**
1. Vérifier PostgreSQL :
   ```bash
   docker-compose up -d postgres
   ```
2. Vérifier `DATABASE_URL` dans `.env`
3. Créer la base de test :
   ```bash
   npx prisma db push
   ```

### Problème : Tests Qui Échouent Aléatoirement

**Symptôme :**
Tests qui passent parfois mais échouent d'autres fois

**Solutions :**
1. Nettoyer Redis avant les tests :
   ```bash
   redis-cli FLUSHDB
   ```
2. Vérifier les `beforeEach` et `afterEach`
3. Utiliser `--runInBand` :
   ```bash
   npm test -- --runInBand
   ```

### Problème : Fuites de Mémoire

**Symptôme :**
Les tests deviennent de plus en plus lents

**Solutions :**
1. Vérifier que `afterAll` déconnecte :
   ```typescript
   afterAll(async () => {
     await disconnectRedis();
     await prisma.$disconnect();
   });
   ```
2. Nettoyer les données de test :
   ```typescript
   beforeEach(async () => {
     await cacheService.deletePattern('test:*');
   });
   ```

### Problème : Port Déjà Utilisé

**Symptôme :**
```
Error: EADDRINUSE: address already in use
```

**Solutions :**
1. Trouver le processus :
   ```bash
   netstat -ano | findstr :6379
   ```
2. Arrêter Redis :
   ```bash
   docker-compose stop redis
   ```
3. Utiliser un port différent dans `.env.test`

## 🔄 CI/CD

### GitHub Actions

Exemple de workflow `.github/workflows/test-redis.yml` :

```yaml
name: Redis Cache Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: clubmanager_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Database
        run: npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/clubmanager_test

      - name: Run Tests
        run: npm run test:cache
        env:
          NODE_ENV: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/clubmanager_test

      - name: Generate Coverage Report
        run: npm run test:coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: redis-cache
```

### GitLab CI

Exemple de `.gitlab-ci.yml` :

```yaml
test:redis:
  stage: test
  image: node:18-alpine
  services:
    - redis:7-alpine
    - postgres:15-alpine
  variables:
    REDIS_HOST: redis
    REDIS_PORT: 6379
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/clubmanager_test
    POSTGRES_DB: clubmanager_test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  before_script:
    - npm ci
    - npx prisma db push
  script:
    - npm run test:cache
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## 📈 Métriques de Qualité

### Objectifs de Performance

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Write ops/sec | >100 | ~1000+ |
| Read ops/sec | >200 | ~2500+ |
| Latence p50 | <10ms | ~3ms |
| Latence p95 | <50ms | ~12ms |
| Latence p99 | <100ms | ~28ms |
| Cache hit rate | >80% | ~85-95% |

### Standards de Qualité

- ✅ Tous les tests doivent passer
- ✅ Couverture de code >80%
- ✅ Pas de fuites mémoire
- ✅ Performance acceptable (voir métriques)
- ✅ Aucune erreur ESLint dans les tests
- ✅ Documentation à jour

## 📚 Ressources Supplémentaires

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [Redis Testing Best Practices](https://redis.io/topics/testing)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [README des Tests](./src/cache/__tests__/README.md)

## 🤝 Contribution

### Ajouter de Nouveaux Tests

1. Créer le fichier dans le bon répertoire
2. Suivre la structure existante
3. Utiliser les helpers dans `test-helpers.ts`
4. Documenter les nouveaux tests
5. Vérifier la couverture
6. Soumettre une PR

### Template de Test

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cacheService } from '../../cache.service.js';
import { waitForRedis, disconnectRedis } from '../../../db/redis.client.js';

describe('NouveauService', () => {
  beforeAll(async () => {
    await waitForRedis(5000);
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    await cacheService.deletePattern('test:*');
  });

  describe('Fonctionnalité X', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test-data';
      
      // Act
      const result = await myFunction(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toBe('expected-value');
    });
  });
});
```

## 📞 Support

Pour toute question ou problème :

1. Consulter ce guide
2. Vérifier les logs des tests
3. Consulter le [README des tests](./src/cache/__tests__/README.md)
4. Créer une issue sur GitHub/GitLab

---

**Dernière mise à jour :** 2024
**Mainteneur :** Équipe Platform API