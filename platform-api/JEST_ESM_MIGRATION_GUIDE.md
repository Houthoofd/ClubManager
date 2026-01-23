# Guide de Migration Jest ESM

## 📋 Vue d'ensemble

Ce guide explique comment corriger les tests Jest pour qu'ils fonctionnent correctement avec ESM (ECMAScript Modules) et TypeScript.

## ✅ Mises à jour effectuées

### 1. Versions des packages
- **Jest**: `29.7.0` (dernière version stable avec support ESM amélioré)
- **ts-jest**: `29.4.6` (meilleur support TypeScript + ESM)
- **@types/jest**: `29.5.14`

### 2. Configuration Jest (`jest.config.cjs`)
- ✅ Preset optimisé: `ts-jest/presets/default-esm`
- ✅ Configuration `extensionsToTreatAsEsm: [".ts"]`
- ✅ `moduleNameMapper` amélioré pour résolution des imports `.js` → `.ts`
- ✅ Configuration `transform` avec options ESM
- ✅ `setupFilesAfterEnv` configuré avec custom matchers

### 3. Nouveaux helpers de tests
- ✅ `src/__tests__/helpers/mock-helpers.ts` - Utilitaires pour créer des mocks
- ✅ `src/__tests__/setup/jest.setup.ts` - Configuration globale et custom matchers

## 🔧 Comment corriger les mocks dans vos tests

### Problème courant
```typescript
// ❌ NE FONCTIONNE PAS en ESM
jest.mock('../../services/user.service.js');
const userService = require('../../services/user.service.js');
(userService.findUser as jest.Mock).mockResolvedValue({ id: '123' });
```

**Erreur**: `TypeError: mockResolvedValue is not a function`

### ✅ Solution 1: Utiliser les helpers de mocks

```typescript
import { jest } from '@jest/globals';
import { createMockFunction, mockResolvedValue } from '../__tests__/helpers/mock-helpers.js';

// Créer un mock typé
const mockFindUser = createMockFunction<typeof findUser>();
mockResolvedValue(mockFindUser, { id: '123', email: 'test@example.com' });

// Remplacer la fonction originale
jest.mock('../../services/user.service.js', () => ({
  findUser: mockFindUser,
}));
```

### ✅ Solution 2: Mock inline avec jest.fn()

```typescript
import { jest } from '@jest/globals';

// Définir le mock AVANT l'import
const mockFindUser = jest.fn();
const mockCreateUser = jest.fn();

jest.mock('../../services/user.service.js', () => ({
  findUser: mockFindUser,
  createUser: mockCreateUser,
}));

// PUIS importer le module
import { findUser, createUser } from '../../services/user.service.js';

describe('User Tests', () => {
  beforeEach(() => {
    mockFindUser.mockResolvedValue({ id: '123' });
  });

  it('should find user', async () => {
    const user = await findUser('123');
    expect(user).toEqual({ id: '123' });
    expect(mockFindUser).toHaveBeenCalledWith('123');
  });
});
```

### ✅ Solution 3: Mock de modules complets

```typescript
import { jest } from '@jest/globals';
import { createMockPrismaClient } from '../__tests__/helpers/mock-helpers.js';

// Mock Prisma
const mockPrisma = createMockPrismaClient();

jest.mock('../../db/prisma.client.js', () => ({
  prisma: mockPrisma,
  checkDatabaseConnection: jest.fn(),
}));

// Import après le mock
import { prisma, checkDatabaseConnection } from '../../db/prisma.client.js';

describe('Database Tests', () => {
  it('should connect to database', async () => {
    (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
    const result = await checkDatabaseConnection();
    expect(result).toBe(true);
  });
});
```

## 📝 Patterns recommandés

### 1. Structure d'un test ESM

```typescript
// 1. Imports Jest
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// 2. Imports des helpers
import { createMockFunction, createMockRequest, createMockResponse } from '../__tests__/helpers/mock-helpers.js';

// 3. Définir les mocks
const mockFunction = jest.fn();

// 4. Configurer les mocks de modules
jest.mock('../../services/some.service.js', () => ({
  someFunction: mockFunction,
}));

// 5. Imports du code à tester (APRÈS les mocks)
import { functionToTest } from '../../services/some.service.js';

// 6. Tests
describe('My Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work', () => {
    mockFunction.mockReturnValue('result');
    const result = functionToTest();
    expect(result).toBe('result');
  });
});
```

### 2. Mock de Prisma Client

```typescript
import { jest } from '@jest/globals';
import { createMockPrismaClient } from '../__tests__/helpers/mock-helpers.js';

const mockPrisma = createMockPrismaClient();

jest.mock('../../db/prisma.client.js', () => ({
  prisma: mockPrisma,
}));

describe('Prisma Tests', () => {
  it('should find user', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    
    // Test votre service qui utilise prisma
    const result = await mockPrisma.user.findUnique({ where: { id: '1' } });
    expect(result).toEqual(mockUser);
  });
});
```

### 3. Mock de Redis Client

```typescript
import { jest } from '@jest/globals';
import { createMockRedisClient } from '../__tests__/helpers/mock-helpers.js';

const mockRedis = createMockRedisClient();

jest.mock('../../db/redis.client.js', () => ({
  getRedisClient: jest.fn(() => mockRedis),
  redisHealthCheck: jest.fn(),
}));

describe('Redis Tests', () => {
  it('should cache data', async () => {
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue('cached-value');
    
    await mockRedis.set('key', 'value');
    const result = await mockRedis.get('key');
    
    expect(result).toBe('cached-value');
  });
});
```

### 4. Mock d'Express Request/Response

```typescript
import { createMockRequest, createMockResponse, createMockNext } from '../__tests__/helpers/mock-helpers.js';

describe('Middleware Tests', () => {
  it('should process request', async () => {
    const req = createMockRequest({
      body: { name: 'Test' },
      params: { id: '123' },
      headers: { authorization: 'Bearer token' },
    });
    
    const res = createMockResponse();
    const next = createMockNext();
    
    await myMiddleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
```

## 🎯 Custom Matchers disponibles

Le fichier `jest.setup.ts` ajoute des matchers personnalisés :

```typescript
// Vérifier une date valide
expect(new Date()).toBeValidDate();

// Vérifier un UUID valide
expect('123e4567-e89b-12d3-a456-426614174000').toBeValidUUID();

// Vérifier un JWT valide
expect('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U').toBeValidJWT();

// Vérifier qu'un mock a été appelé avec un objet correspondant
expect(mockFn).toHaveBeenCalledWithMatch({ userId: '123' });
```

## 🚀 Scripts npm disponibles

```bash
# Exécuter tous les tests
npm test

# Exécuter avec coverage
npm run test:coverage

# Mode watch
npm run test:watch

# Tests spécifiques par domaine
npm run test:auth          # Tests d'authentification
npm run test:user          # Tests utilisateurs
npm run test:payment       # Tests paiements
npm run test:cache         # Tests cache/Redis

# Tests par type
npm run test:auth:unit         # Tests unitaires auth
npm run test:auth:integration  # Tests intégration auth
npm run test:user:verbose      # Tests user avec output détaillé
```

## 📚 Exemples complets

### Exemple: Test de route avec mocks

```typescript
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createMockUser } from '../__tests__/helpers/mock-helpers.js';

// Définir les mocks
const mockFindUser = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('../../services/members/user/user.service.js', () => ({
  findUser: mockFindUser,
  updateUser: mockUpdateUser,
}));

// Import après mock
import userRouter from '../users.routes.js';

describe('User Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/users', userRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/:id', () => {
    it('should return user', async () => {
      const mockUser = createMockUser({ id: '123' });
      mockFindUser.mockResolvedValue(mockUser);

      const response = await request(app).get('/users/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(mockFindUser).toHaveBeenCalledWith('123');
    });

    it('should return 404 if user not found', async () => {
      mockFindUser.mockResolvedValue(null);

      const response = await request(app).get('/users/999');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user', async () => {
      const existingUser = createMockUser({ id: '123', firstName: 'Old' });
      const updatedUser = { ...existingUser, firstName: 'New' };
      
      mockFindUser.mockResolvedValue(existingUser);
      mockUpdateUser.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch('/users/123')
        .send({ firstName: 'New' });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('New');
      expect(mockUpdateUser).toHaveBeenCalledWith('123', { firstName: 'New' });
    });
  });
});
```

## 🐛 Problèmes courants et solutions

### Problème: "Cannot find module"
**Solution**: Vérifiez que les imports utilisent l'extension `.js` (même pour les fichiers `.ts`)

```typescript
// ❌ Incorrect
import { something } from './module';

// ✅ Correct
import { something } from './module.js';
```

### Problème: "mockResolvedValue is not a function"
**Solution**: Le mock n'est pas correctement initialisé. Utilisez `jest.fn()` ou les helpers.

```typescript
// ❌ Incorrect
jest.mock('./service.js');
import { service } from './service.js';
(service.method as jest.Mock).mockResolvedValue({}); // Erreur!

// ✅ Correct
const mockMethod = jest.fn();
jest.mock('./service.js', () => ({
  service: { method: mockMethod }
}));
mockMethod.mockResolvedValue({});
```

### Problème: Les mocks ne sont pas appliqués
**Solution**: Assurez-vous que `jest.mock()` est appelé AVANT les imports du module.

```typescript
// ✅ Ordre correct
import { jest } from '@jest/globals';

// 1. Définir les mocks
const mockFn = jest.fn();

// 2. Configurer jest.mock
jest.mock('./module.js', () => ({ fn: mockFn }));

// 3. Importer le module (après le mock)
import { fn } from './module.js';
```

### Problème: Types TypeScript incorrects pour les mocks
**Solution**: Utilisez les types Jest appropriés

```typescript
import { jest } from '@jest/globals';

// Type correct pour une fonction mockée
const mockFn = jest.fn() as jest.MockedFunction<typeof originalFn>;

// Type correct pour un module mocké
type MockedModule = {
  [K in keyof OriginalModule]: jest.MockedFunction<OriginalModule[K]>;
};
```

## 📊 Checklist de migration

Pour chaque fichier de test à migrer :

- [ ] Importer `jest` depuis `@jest/globals`
- [ ] Définir les mocks avec `jest.fn()` AVANT les imports
- [ ] Utiliser `jest.mock()` avant d'importer les modules mockés
- [ ] Ajouter l'extension `.js` aux imports (même pour `.ts`)
- [ ] Utiliser les helpers de mocks si disponibles
- [ ] Ajouter `beforeEach(() => jest.clearAllMocks())` pour nettoyer
- [ ] Vérifier que les assertions utilisent les types corrects
- [ ] Tester l'exécution avec `npm test -- path/to/test.ts`

## 🎓 Ressources

- [Documentation Jest ESM](https://jestjs.io/docs/ecmascript-modules)
- [Documentation ts-jest](https://kulshekhar.github.io/ts-jest/)
- [Guide TypeScript + Jest](https://jestjs.io/docs/getting-started#via-ts-jest)

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que vos versions correspondent à celles listées en haut
2. Consultez les exemples dans ce guide
3. Vérifiez l'ordre des imports et des mocks
4. Testez avec un fichier de test simple d'abord

---

**Dernière mise à jour**: Configuration Jest 29.7.0 avec support ESM optimisé