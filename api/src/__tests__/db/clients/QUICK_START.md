# 🚀 Guide de Démarrage Rapide - Tests des Repositories

Ce guide vous permet de démarrer rapidement avec les tests des repositories du projet ClubManager.

## 📦 Installation

Les dépendances de test sont déjà installées avec le projet. Si besoin, réinstallez-les :

```bash
cd ClubManager/api
npm install
```

## ⚡ Exécution Rapide

### Tous les tests des repositories
```bash
npm run test:db:windows
```

### Tests d'un module spécifique

```bash
# Tests Alertes
npx jest src/__tests__/db/clients/alertes

# Tests Auth
npx jest src/__tests__/db/clients/auth

# Tests Commandes
npx jest src/__tests__/db/clients/commandes

# Tests Cours
npx jest src/__tests__/db/clients/cours

# Tests Compte
npx jest src/__tests__/db/clients/compte

# Tests Informations
npx jest src/__tests__/db/clients/informations
```

### Avec le script personnalisé

```bash
# Tous les tests
node scripts/run-repository-tests.js

# Module spécifique
node scripts/run-repository-tests.js alertes
node scripts/run-repository-tests.js auth
node scripts/run-repository-tests.js commandes
node scripts/run-repository-tests.js cours

# Avec couverture
node scripts/run-repository-tests.js --coverage
node scripts/run-repository-tests.js alertes --coverage

# Mode watch (auto-reload)
node scripts/run-repository-tests.js --watch
node scripts/run-repository-tests.js alertes --watch

# Mode verbose
node scripts/run-repository-tests.js alertes --verbose
```

## 📊 Voir la Couverture

```bash
# Générer le rapport de couverture
npx jest --coverage src/__tests__/db/clients

# Voir le rapport HTML (après génération)
# Ouvrir: ClubManager/api/coverage/lcov-report/index.html
```

## 🎯 Tests Disponibles

| Module | Tests | Description |
|--------|-------|-------------|
| **Alertes** | 23 | Dashboard, alertes actives, statistiques |
| **Auth** | 47 | Authentification, tokens, sécurité |
| **Commandes** | 68 | CRUD, statistiques, validation |
| **Cours** | 69 | Gestion complète des cours |
| **Total** | **207+** | Tests unitaires complets |

## 🔧 Commandes Utiles

### Exécuter un test spécifique
```bash
npx jest src/__tests__/db/clients/alertes/alertes.test.ts
```

### Exécuter les tests avec pattern
```bash
npx jest --testNamePattern="should return user alerts"
```

### Mode watch (développement)
```bash
npx jest --watch src/__tests__/db/clients/alertes
```

### Exécuter un seul test (dans le fichier)
```typescript
// Utiliser .only
it.only('should return data', async () => {
  // Ce test sera le seul à s'exécuter
});
```

### Ignorer un test (temporairement)
```typescript
// Utiliser .skip
it.skip('should do something', async () => {
  // Ce test sera ignoré
});
```

## 📝 Structure d'un Test

```typescript
import { jest } from '@jest/globals';
import { MonRepository } from '../../../../db/clients/mon-module/repository.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';

// Mock des dépendances
jest.mock('../../../../db/connector/mysqlconnector.js');

describe('MonRepository', () => {
  let repository: MonRepository;
  let mockConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MonRepository();
    mockConnector = (MysqlConnector as any).getInstance();
  });

  describe('maMethode', () => {
    it('should return data when successful', async () => {
      // Arrange
      const mockData = { id: 1, name: 'Test' };
      mockConnector.query = jest.fn((sql, params, callback) => {
        callback(null, [mockData]);
      });

      // Act
      const result = await repository.maMethode(1);

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
      await expect(repository.maMethode(1)).rejects.toThrow('Database error');
    });
  });
});
```

## 🐛 Debugging

### Afficher les logs
```bash
# Avec verbose
npx jest --verbose src/__tests__/db/clients/alertes

# Voir tous les détails
DEBUG=* npx jest src/__tests__/db/clients/alertes
```

### Déboguer dans VS Code

Créer `.vscode/launch.json` :
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--config",
        "jest.config.cjs",
        "${file}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "NODE_ENV": "test",
        "NODE_OPTIONS": "--experimental-vm-modules"
      }
    }
  ]
}
```

Puis mettre un breakpoint et appuyer sur F5.

## 📈 Améliorer un Test

### 1. Ajouter un nouveau cas de test
```typescript
describe('maMethode', () => {
  // Tests existants...

  it('should handle edge case with empty array', async () => {
    mockConnector.query = jest.fn((sql, params, callback) => {
      callback(null, []);
    });

    const result = await repository.maMethode(1);

    expect(result).toEqual([]);
  });
});
```

### 2. Tester les cas limites
```typescript
it('should handle null values', async () => {
  mockConnector.query = jest.fn((sql, params, callback) => {
    callback(null, null);
  });

  const result = await repository.maMethode(1);

  expect(result).toBeNull();
});

it('should handle negative IDs', async () => {
  const result = await repository.maMethode(-1);
  expect(result).toBeNull();
});
```

### 3. Améliorer les assertions
```typescript
// Au lieu de
expect(result).toBeTruthy();

// Utiliser des assertions plus précises
expect(result).toEqual({
  id: expect.any(Number),
  name: expect.any(String),
  created_at: expect.any(Date)
});
```

## 🎓 Bonnes Pratiques

### ✅ À FAIRE
- Toujours nettoyer les mocks dans `beforeEach()`
- Tester les cas de succès ET d'erreur
- Utiliser des noms de tests descriptifs
- Tester les cas limites (null, undefined, empty)
- Isoler chaque test (pas de dépendances entre tests)

### ❌ À ÉVITER
- Ne pas utiliser de vraie base de données dans les tests unitaires
- Ne pas laisser de `.only()` dans le code commité
- Ne pas tester les détails d'implémentation
- Ne pas oublier de tester les erreurs
- Ne pas créer de tests trop complexes

## 🔗 Ressources

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [README complet des tests](./README_TESTS.md)

## 💡 Astuces

### Exécuter les tests plus rapidement
```bash
# Utiliser --maxWorkers pour limiter les processus
npx jest --maxWorkers=2 src/__tests__/db/clients

# Utiliser le cache
npx jest --cache src/__tests__/db/clients
```

### Voir uniquement les tests qui échouent
```bash
npx jest --onlyFailures src/__tests__/db/clients
```

### Générer un rapport JSON
```bash
npx jest --json --outputFile=test-results.json src/__tests__/db/clients
```

## 🆘 Problèmes Courants

### Erreur: Cannot find module
```bash
# Nettoyer le cache Jest
npx jest --clearCache

# Réinstaller les dépendances
npm install
```

### Timeout des tests
```typescript
// Augmenter le timeout d'un test spécifique
it('should handle long operation', async () => {
  // Test code
}, 60000); // 60 secondes

// Ou globalement dans jest.config.cjs
testTimeout: 30000
```

### Tests qui passent en isolation mais échouent ensemble
```bash
# Exécuter les tests en série
npx jest --runInBand src/__tests__/db/clients
```

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier la [documentation complète](./README_TESTS.md)
2. Vérifier la configuration Jest dans `jest.config.cjs`
3. Consulter l'équipe de développement

---

**Happy Testing! 🎉**