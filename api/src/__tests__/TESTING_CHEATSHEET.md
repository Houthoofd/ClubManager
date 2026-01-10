# 🧪 Testing Cheatsheet - ClubManager

> Référence rapide pour l'écriture et l'exécution des tests

## 🚀 Commandes Rapides

### Exécuter les Tests

```bash
# Tous les tests des repositories
npm run test:db:windows

# Module spécifique
npx jest src/__tests__/db/clients/alertes
npx jest src/__tests__/db/clients/auth
npx jest src/__tests__/db/clients/commandes
npx jest src/__tests__/db/clients/cours

# Avec couverture
npx jest --coverage src/__tests__/db/clients

# Mode watch (auto-reload)
npx jest --watch src/__tests__/db/clients/alertes

# Script personnalisé
node scripts/run-repository-tests.js [module] [--coverage] [--watch]
```

### Filtrer les Tests

```bash
# Par nom de test
npx jest --testNamePattern="should return user"

# Par fichier
npx jest cours.test.ts

# Tests qui ont échoué
npx jest --onlyFailures
```

## 📝 Structure d'un Test

### Template de Base

```typescript
import { jest } from '@jest/globals';
import { MyRepository } from '../../../../db/clients/my-module/repository.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';

// Mock des dépendances
jest.mock('../../../../db/connector/mysqlconnector.js');

describe('MyRepository', () => {
  let repository: MyRepository;
  let mockConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MyRepository();
    mockConnector = (MysqlConnector as any).getInstance();
  });

  describe('myMethod', () => {
    it('should return data when successful', async () => {
      // Arrange
      const mockData = { id: 1, name: 'Test' };
      mockConnector.query = jest.fn((sql, params, callback) => {
        callback(null, [mockData]);
      });

      // Act
      const result = await repository.myMethod(1);

      // Assert
      expect(result).toEqual(mockData);
      expect(mockConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1],
        expect.any(Function)
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockConnector.query = jest.fn((sql, params, callback) => {
        callback(dbError, null);
      });

      // Act & Assert
      await expect(repository.myMethod(1)).rejects.toThrow('Database error');
    });

    it('should handle null values', async () => {
      mockConnector.query = jest.fn((sql, params, callback) => {
        callback(null, null);
      });

      const result = await repository.myMethod(999);

      expect(result).toBeNull();
    });
  });
});
```

## 🎯 Patterns de Test

### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
it('should do something', async () => {
  // Arrange - Préparation
  const mockData = { id: 1 };
  mockRepo.method = jest.fn().mockResolvedValue(mockData);

  // Act - Action
  const result = await repository.method(1);

  // Assert - Vérification
  expect(result).toEqual(mockData);
});
```

### 2. Test de Succès

```typescript
it('should return data successfully', async () => {
  mockRepo.findById = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

  const result = await repository.findById(1);

  expect(result).toBeDefined();
  expect(result.id).toBe(1);
  expect(result.name).toBe('Test');
});
```

### 3. Test d'Erreur

```typescript
it('should handle database errors', async () => {
  const error = new Error('Connection failed');
  mockRepo.findById = jest.fn().mockRejectedValue(error);

  await expect(repository.findById(1)).rejects.toThrow('Connection failed');
});
```

### 4. Test de Cas Limite

```typescript
it('should handle empty results', async () => {
  mockRepo.findAll = jest.fn().mockResolvedValue([]);
  
  const result = await repository.findAll();
  
  expect(result).toEqual([]);
  expect(result).toHaveLength(0);
});

it('should handle null values', async () => {
  mockRepo.findById = jest.fn().mockResolvedValue(null);
  
  const result = await repository.findById(999);
  
  expect(result).toBeNull();
});

it('should handle undefined values', async () => {
  mockRepo.findById = jest.fn().mockResolvedValue(undefined);
  
  const result = await repository.findById(999);
  
  expect(result).toBeUndefined();
});
```

### 5. Test de Validation

```typescript
it('should validate input data', () => {
  const validResult = repository.validate({ id: 1, name: 'Test' });
  expect(validResult).toBe(true);

  const invalidResult = repository.validate({ id: -1 });
  expect(invalidResult).toBe(false);
});
```

### 6. Test d'Intégration

```typescript
it('should handle complete workflow', async () => {
  // Create
  mockWriteRepo.create = jest.fn().mockResolvedValue(1);
  const id = await repository.create({ name: 'Test' });
  expect(id).toBe(1);

  // Read
  mockReadRepo.findById = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
  const item = await repository.findById(id);
  expect(item).toBeDefined();

  // Update
  mockWriteRepo.update = jest.fn().mockResolvedValue(true);
  const updated = await repository.update(id, { name: 'Updated' });
  expect(updated).toBe(true);

  // Delete
  mockWriteRepo.delete = jest.fn().mockResolvedValue(true);
  const deleted = await repository.delete(id);
  expect(deleted).toBe(true);
});
```

## 🔍 Assertions Courantes

### Égalité

```typescript
expect(result).toBe(5);                    // Égalité stricte (===)
expect(result).toEqual({ id: 1 });         // Égalité profonde
expect(result).toStrictEqual({ id: 1 });   // Égalité stricte profonde
expect(result).not.toBe(10);               // Négation
```

### Types

```typescript
expect(result).toBeDefined();              // Défini (not undefined)
expect(result).toBeUndefined();            // Undefined
expect(result).toBeNull();                 // Null
expect(result).toBeTruthy();               // Truthy
expect(result).toBeFalsy();                // Falsy
expect(result).toBeInstanceOf(MyClass);    // Instance de classe
```

### Nombres

```typescript
expect(result).toBeGreaterThan(5);         // Plus grand que
expect(result).toBeGreaterThanOrEqual(5);  // Plus grand ou égal
expect(result).toBeLessThan(10);           // Plus petit que
expect(result).toBeLessThanOrEqual(10);    // Plus petit ou égal
expect(result).toBeCloseTo(0.3, 5);        // Proche de (décimaux)
```

### Chaînes

```typescript
expect(result).toMatch(/pattern/);         // Correspond au pattern
expect(result).toContain('substring');     // Contient
expect(result).toHaveLength(5);            // Longueur
expect(result).toStartWith('prefix');      // Commence par
expect(result).toEndWith('suffix');        // Finit par
```

### Tableaux

```typescript
expect(result).toHaveLength(3);            // Longueur
expect(result).toContain(item);            // Contient l'élément
expect(result).toContainEqual({ id: 1 });  // Contient l'objet
expect(result).toEqual(expect.arrayContaining([1, 2])); // Contient ces éléments
```

### Objets

```typescript
expect(result).toHaveProperty('id');       // A la propriété
expect(result).toHaveProperty('id', 1);    // A la propriété avec valeur
expect(result).toMatchObject({ id: 1 });   // Correspond partiellement
expect(result).toEqual({                   // Égalité avec matchers
  id: expect.any(Number),
  name: expect.any(String)
});
```

### Promesses

```typescript
await expect(promise).resolves.toBe(value);      // Résout avec valeur
await expect(promise).rejects.toThrow(error);    // Rejette avec erreur
await expect(promise).resolves.toMatchObject({}); // Résout avec objet
```

### Fonctions

```typescript
expect(mockFn).toHaveBeenCalled();              // Appelée
expect(mockFn).toHaveBeenCalledTimes(2);        // Appelée N fois
expect(mockFn).toHaveBeenCalledWith(arg1, arg2); // Appelée avec args
expect(mockFn).toHaveBeenLastCalledWith(arg);   // Dernier appel avec args
expect(mockFn).toHaveBeenNthCalledWith(2, arg); // Nième appel avec args
```

## 🎭 Mocking

### Mock Simple

```typescript
const mockFn = jest.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ id: 1 }); // Pour async
mockFn.mockRejectedValue(new Error('Failed')); // Pour erreur async
```

### Mock avec Implémentation

```typescript
mockRepo.findById = jest.fn().mockImplementation((id) => {
  if (id === 1) return Promise.resolve({ id: 1, name: 'Test' });
  return Promise.resolve(null);
});
```

### Mock de Module

```typescript
jest.mock('../../../../db/connector/mysqlconnector.js');
```

### Spy

```typescript
const spy = jest.spyOn(repository, 'method');
spy.mockReturnValue('mocked value');

// Vérifications
expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith(expectedArg);

// Restaurer
spy.mockRestore();
```

## 🛠️ Utilitaires Jest

### Setup et Cleanup

```typescript
beforeEach(() => {
  // Avant chaque test
  jest.clearAllMocks();
});

afterEach(() => {
  // Après chaque test
});

beforeAll(() => {
  // Une fois avant tous les tests
});

afterAll(() => {
  // Une fois après tous les tests
});
```

### Skip et Only

```typescript
it.skip('should be skipped', () => {
  // Ce test sera ignoré
});

it.only('should be the only one', () => {
  // Seul ce test sera exécuté
});

describe.skip('Skipped suite', () => {
  // Toute la suite sera ignorée
});
```

### Test Parametrés

```typescript
test.each([
  [1, 2, 3],
  [2, 3, 5],
  [3, 4, 7],
])('should add %i + %i to equal %i', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

## ⚡ Astuces

### 1. Nettoyer les Mocks

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Nettoie les appels et résultats
  // jest.resetAllMocks(); // + réinitialise l'implémentation
  // jest.restoreAllMocks(); // + restaure l'implémentation originale
});
```

### 2. Tester les Callbacks

```typescript
it('should call callback', (done) => {
  repository.methodWithCallback((result) => {
    expect(result).toBeDefined();
    done();
  });
});
```

### 3. Timeout Personnalisé

```typescript
it('should handle long operation', async () => {
  // Test code
}, 10000); // 10 secondes
```

### 4. Matcher Personnalisé

```typescript
expect.extend({
  toBeValidEmail(received) {
    const pass = /\S+@\S+\.\S+/.test(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid email`
    };
  }
});

expect('test@example.com').toBeValidEmail();
```

## 📋 Checklist d'un Bon Test

- [ ] Test isolé (pas de dépendances externes)
- [ ] Nom descriptif et clair
- [ ] AAA Pattern appliqué
- [ ] Mock approprié des dépendances
- [ ] Assertions précises
- [ ] Cas de succès testé
- [ ] Cas d'erreur testé
- [ ] Cas limites testés
- [ ] Rapide (< 1s idéalement)
- [ ] Déterministe (résultat stable)

## 🚫 Anti-Patterns à Éviter

```typescript
// ❌ MAL - Test trop générique
it('should work', () => {
  expect(result).toBeTruthy();
});

// ✅ BIEN - Test spécifique
it('should return user with id 1', () => {
  expect(result).toEqual({ id: 1, name: 'John' });
});

// ❌ MAL - Plusieurs assertions non liées
it('should do everything', () => {
  expect(a).toBe(1);
  expect(b).toBe(2);
  expect(c).toBe(3);
});

// ✅ BIEN - Une responsabilité par test
it('should set a to 1', () => {
  expect(a).toBe(1);
});

// ❌ MAL - Tests dépendants
it('test 1', () => { globalVar = 1; });
it('test 2', () => { expect(globalVar).toBe(1); });

// ✅ BIEN - Tests indépendants
beforeEach(() => { setup(); });
it('test 1', () => { /* ... */ });
it('test 2', () => { /* ... */ });
```

## 📊 Couverture

### Voir la Couverture

```bash
# Rapport dans le terminal
npx jest --coverage

# Rapport HTML
npx jest --coverage --coverageReporters=html
# Puis ouvrir: coverage/lcov-report/index.html
```

### Objectifs de Couverture

```javascript
// jest.config.cjs
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    }
  }
};
```

## 🔗 Ressources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [README_TESTS.md](./db/clients/README_TESTS.md) - Documentation complète du projet
- [QUICK_START.md](./db/clients/QUICK_START.md) - Guide de démarrage rapide

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2024  
**Équipe**: ClubManager Development Team