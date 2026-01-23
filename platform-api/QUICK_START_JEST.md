# 🚀 Quick Start - Jest ESM

## ✅ Mise à jour terminée

Jest a été mis à jour vers **29.7.0** avec support ESM complet. La configuration est fonctionnelle.

## 🎯 Commandes essentielles

```bash
# Tous les tests
npm test

# Avec coverage
npm run test:coverage

# Mode watch
npm run test:watch

# Tests spécifiques
npm test -- path/to/test.ts
npm test -- --testNamePattern="nom du test"

# Tests par domaine
npm run test:auth          # Authentification
npm run test:user          # Utilisateurs
npm run test:payment       # Paiements
npm run test:cache         # Cache/Redis
```

## 📝 Pattern de base pour écrire un test

```typescript
// 1. Imports Jest
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// 2. Imports des helpers
import {
  createMockFunction,
  createMockPrismaClient,
  mockResolvedValue,
} from '../__tests__/helpers/mock-helpers.js';

// 3. Définir les mocks AVANT les imports
const mockFindUser = jest.fn();

jest.mock('../../services/user.service.js', () => ({
  findUser: mockFindUser,
}));

// 4. Importer les modules APRÈS les mocks
import { findUser } from '../../services/user.service.js';

// 5. Écrire les tests
describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find user by id', async () => {
    // Arrange
    mockResolvedValue(mockFindUser, { id: '123', name: 'Test' });

    // Act
    const user = await findUser('123');

    // Assert
    expect(user.id).toBe('123');
    expect(mockFindUser).toHaveBeenCalledWith('123');
  });
});
```

## 🛠️ Helpers disponibles

```typescript
// Mock functions
createMockFunction<T>()
mockResolvedValue(fn, value)
mockRejectedValue(fn, error)
mockReturnValue(fn, value)

// Mock clients
createMockPrismaClient()
createMockRedisClient()

// Mock Express
createMockRequest(overrides)
createMockResponse()
createMockNext()

// Mock data
createMockUser(overrides)
createMockTenant(overrides)
createMockJWTPayload(overrides)
```

## 🎓 Custom matchers

```typescript
expect(date).toBeValidDate()
expect(uuid).toBeValidUUID()
expect(token).toBeValidJWT()
expect(mockFn).toHaveBeenCalledWithMatch({ userId: '123' })
```

## 📚 Exemples et documentation

```bash
# Voir les tests d'exemple (34/35 passent)
npm test -- src/__tests__/examples/example.test.ts

# Lire le guide complet
cat JEST_ESM_MIGRATION_GUIDE.md

# Lire le résumé technique
cat JEST_UPGRADE_SUMMARY.md
```

## ⚠️ Points importants

1. **Toujours** définir les mocks AVANT d'importer les modules
2. **Toujours** utiliser l'extension `.js` dans les imports (même pour `.ts`)
3. **Toujours** importer `jest` depuis `@jest/globals`
4. **Toujours** appeler `jest.clearAllMocks()` dans `beforeEach`

## 🐛 Problèmes courants

### "Cannot find module"
➡️ Vérifiez que vous utilisez `.js` dans les imports

### "mockResolvedValue is not a function"
➡️ Définissez le mock avec `jest.fn()` avant d'utiliser `jest.mock()`

### "Module not found after jest.mock"
➡️ Appelez `jest.mock()` AVANT d'importer le module

## 📊 État actuel

✅ **Configuration fonctionnelle** - Jest 29.7.0 avec ESM  
✅ **Helpers disponibles** - mock-helpers.ts + jest.setup.ts  
✅ **Documentation complète** - 3 guides + exemples  
⚠️ **Migration requise** - ~11 fichiers de tests existants

## 🎯 Next steps

1. Lire `JEST_ESM_MIGRATION_GUIDE.md`
2. Tester l'exemple : `npm test -- src/__tests__/examples/example.test.ts`
3. Migrer les tests existants un par un
4. Valider avec `npm run test:coverage`

## 📞 Aide

- Guide complet : `JEST_ESM_MIGRATION_GUIDE.md` (428 lignes)
- Résumé technique : `JEST_UPGRADE_SUMMARY.md` (426 lignes)
- README complet : `JEST_UPDATE_README.md` (529 lignes)
- Exemple fonctionnel : `src/__tests__/examples/example.test.ts` (552 lignes)

---

**Status** : ✅ Configuration complète et testée  
**Version** : Jest 29.7.0, ts-jest 29.4.6  
**Date** : 23 janvier 2025