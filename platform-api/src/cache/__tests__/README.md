# Tests Redis Cache - Documentation

Ce répertoire contient tous les tests pour l'implémentation Redis Cache du système multi-tenant.

## Structure des Tests

```
__tests__/
├── services/                    # Tests des services
│   ├── cache.service.test.ts
│   ├── tenant-cache.service.test.ts
│   ├── user-cache.service.test.ts
│   └── rate-limiter.service.test.ts
├── middlewares/                 # Tests des middlewares
│   ├── rate-limit.middleware.test.ts
│   └── response-cache.middleware.test.ts
├── integration/                 # Tests d'intégration
│   ├── redis.integration.test.ts
│   └── performance.test.ts
└── README.md                    # Ce fichier
```

## Types de Tests

### 1. Tests Unitaires (Services)

Tests des services de cache isolés :

- **cache.service.test.ts** : Tests du service de cache de base
  - Opérations CRUD (get, set, delete)
  - TTL et expiration
  - Opérations batch (mget, mset)
  - Pattern cache-aside (getOrSet)
  - Compteurs et statistiques
  - Sets et sorted sets
  - Locks distribués

- **tenant-cache.service.test.ts** : Tests du cache tenant
  - Cache des données tenant par ID et slug
  - Lookup tenant ID
  - Settings et features tenant
  - Invalidation de cache
  - Isolation multi-tenant
  - Cache warming

- **user-cache.service.test.ts** : Tests du cache utilisateur
  - Profils utilisateur
  - Sessions utilisateur
  - Permissions
  - Tokens (refresh, reset, verification)
  - Tracking utilisateurs en ligne
  - Préférences utilisateur
  - Activité utilisateur

- **rate-limiter.service.test.ts** : Tests du rate limiter
  - Algorithme token bucket
  - Algorithme sliding window
  - Rate limiting par IP
  - Rate limiting par tenant
  - Rate limiting par utilisateur
  - Rate limiting par API key
  - Whitelist/Blacklist IP
  - Réinitialisation des limites

### 2. Tests des Middlewares

Tests des middlewares Express :

- **rate-limit.middleware.test.ts** : Tests du middleware de rate limiting
  - Rate limiting par IP
  - Rate limiting par tenant
  - Rate limiting par utilisateur
  - Rate limiting pour authentification
  - Rate limiting combiné
  - Headers de réponse
  - Gestion des erreurs

- **response-cache.middleware.test.ts** : Tests du middleware de cache de réponse
  - Cache de réponses GET
  - Cache par tenant
  - Cache par utilisateur
  - Cache par query parameters
  - Skip cache
  - Invalidation
  - Headers (X-Cache, Cache-Control)

### 3. Tests d'Intégration

Tests end-to-end avec Redis réel :

- **redis.integration.test.ts** : Tests d'intégration Redis complets
  - Connexion et santé Redis
  - Intégration avec Prisma
  - Isolation multi-tenant
  - Cohérence des données
  - Opérations complexes
  - Gestion de la mémoire

- **performance.test.ts** : Tests de performance et charge
  - Benchmarks d'écriture
  - Benchmarks de lecture
  - Opérations mixtes
  - Stress tests
  - Latence (p50, p95, p99)
  - Throughput
  - Hit rate du cache

## Prérequis

### Variables d'environnement

Assurez-vous que ces variables sont configurées dans votre `.env` :

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Database (pour les tests d'intégration)
DATABASE_URL="postgresql://user:password@localhost:5432/clubmanager_test"
```

### Services requis

1. **Redis** : Doit être en cours d'exécution
   ```bash
   docker-compose up -d redis
   ```

2. **PostgreSQL** : Pour les tests d'intégration
   ```bash
   docker-compose up -d postgres
   ```

## Lancer les Tests

### Tous les tests
```bash
npm test
```

### Tests unitaires uniquement
```bash
npm test -- src/cache/__tests__/services
```

### Tests des middlewares
```bash
npm test -- src/cache/__tests__/middlewares
```

### Tests d'intégration
```bash
npm test -- src/cache/__tests__/integration/redis.integration.test.ts
```

### Tests de performance
```bash
npm test -- src/cache/__tests__/integration/performance.test.ts
```

### Tests avec couverture
```bash
npm test -- --coverage
```

### Mode watch
```bash
npm test -- --watch
```

### Tests spécifiques
```bash
# Un fichier spécifique
npm test -- cache.service.test.ts

# Un test spécifique
npm test -- -t "should set and get a value"

# Par pattern
npm test -- --testNamePattern="Cache"
```

## Configuration Jest

Le projet utilise Jest avec les paramètres suivants :

- **Timeout** : 30 secondes par test
- **Environment** : Node.js
- **Transform** : ts-jest pour TypeScript
- **Module** : ESM (ECMAScript Modules)

## Bonnes Pratiques

### 1. Isolation des Tests

Chaque test doit :
- Nettoyer ses données avant (`beforeEach`)
- Nettoyer ses données après (`afterEach`)
- Ne pas dépendre d'autres tests
- Utiliser des clés uniques avec préfixes

```typescript
beforeEach(async () => {
  await cacheService.deletePattern('test:*');
});
```

### 2. Gestion des Connexions

- Établir la connexion Redis dans `beforeAll`
- Fermer les connexions dans `afterAll`
- Vérifier la disponibilité de Redis

```typescript
beforeAll(async () => {
  try {
    await waitForRedis(5000);
  } catch (error) {
    console.warn('Redis not available - skipping tests');
  }
});

afterAll(async () => {
  await disconnectRedis();
  await prisma.$disconnect();
});
```

### 3. Tests Asynchrones

Toujours utiliser `async/await` pour les opérations Redis :

```typescript
it('should cache data', async () => {
  await cacheService.set('key', 'value', { ttl: 60 });
  const result = await cacheService.get('key');
  expect(result).toBe('value');
});
```

### 4. Assertions

Utiliser des assertions claires et spécifiques :

```typescript
// ✓ Bon
expect(result.allowed).toBe(true);
expect(result.remaining).toBeGreaterThan(0);

// ✗ Éviter
expect(result).toBeTruthy();
```

### 5. Données de Test

- Utiliser des données réalistes
- Nettoyer après les tests
- Utiliser des timestamps pour l'unicité

```typescript
const testTenant = await prisma.tenant.create({
  data: {
    name: 'Test Tenant',
    slug: `test-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
  },
});
```

## Métriques de Performance

### Benchmarks Attendus

Les tests de performance vérifient ces seuils :

| Opération | Throughput Minimum | Latence p95 |
|-----------|-------------------|-------------|
| Write (concurrent) | 100 ops/sec | < 50ms |
| Read (concurrent) | 200 ops/sec | < 30ms |
| Rate limit check | 100 ops/sec | < 50ms |
| Batch operations | 300 ops/sec | < 100ms |

### Hit Rate du Cache

Les tests vérifient que le cache maintient :
- **Hit rate** : > 80%
- **Response time** : < 10ms pour les hits

## Dépannage

### Redis non disponible

```
Redis not available for tests - skipping
```

**Solution** : Démarrer Redis
```bash
docker-compose up -d redis
```

### Timeout des tests

```
Timeout - Async callback was not invoked within the 30000 ms timeout
```

**Solutions** :
1. Augmenter le timeout dans `jest.config.cjs`
2. Vérifier que Redis est accessible
3. Optimiser les requêtes lentes

### Erreurs de connexion

```
Error: Redis connection failed
```

**Solutions** :
1. Vérifier `REDIS_HOST` et `REDIS_PORT`
2. Vérifier que Redis accepte les connexions
3. Vérifier le firewall

### Conflits de clés

```
Key already exists
```

**Solution** : Améliorer le nettoyage dans `beforeEach` :
```typescript
beforeEach(async () => {
  await cacheService.deletePattern('test:*');
  await cacheService.deletePattern('perf:*');
});
```

### Fuites de mémoire

Si les tests deviennent lents :
1. Vérifier que `afterAll` ferme les connexions
2. Nettoyer les données de test
3. Utiliser `--runInBand` pour exécuter séquentiellement

```bash
npm test -- --runInBand
```

## Tests CI/CD

Les tests sont exécutés dans le pipeline CI/CD :

```yaml
# .github/workflows/test.yml
- name: Start Redis
  run: docker-compose up -d redis

- name: Run Cache Tests
  run: npm test -- src/cache/__tests__
  env:
    REDIS_HOST: localhost
    REDIS_PORT: 6379
```

## Couverture de Code

Objectifs de couverture :
- **Statements** : > 80%
- **Branches** : > 75%
- **Functions** : > 80%
- **Lines** : > 80%

Générer le rapport :
```bash
npm test -- --coverage
```

Voir le rapport HTML :
```bash
open coverage/lcov-report/index.html
```

## Contribution

### Ajouter de Nouveaux Tests

1. Créer le fichier dans le bon répertoire
2. Suivre la structure existante
3. Ajouter la documentation
4. Vérifier la couverture
5. Exécuter tous les tests

### Template de Test

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cacheService } from '../../cache.service.js';
import { waitForRedis, disconnectRedis } from '../../../db/redis.client.js';

describe('MonService', () => {
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
    it('should do something', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await myFunction(input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

## Ressources

- [Documentation Redis](https://redis.io/documentation)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Redis Testing Guide](https://redis.io/topics/testing)

## Support

Pour toute question ou problème :
1. Vérifier cette documentation
2. Consulter les logs des tests
3. Vérifier la configuration Redis
4. Créer une issue sur le projet