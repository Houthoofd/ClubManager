# @clubmanager/types

> 📦 Package TypeScript partagé pour ClubManager - Types, Validators, DTOs et gestion d'erreurs type-safe

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-4631%20passed-success)](./src)
[![Coverage](https://img.shields.io/badge/coverage-99.68%25-brightgreen)](./coverage)
[![License](https://img.shields.io/badge/license-ISC-blue)](./LICENSE)

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Patterns avancés](#-patterns-avancés)
- [Migration depuis legacy](#-migration-depuis-legacy)
- [Tests](#-tests)
- [Contribution](#-contribution)

---

## 🎯 Vue d'ensemble

Ce package centralise **tous les types, validators, DTOs et utilitaires** partagés entre le backend et le frontend de ClubManager. Il garantit une **cohérence totale** et une **type-safety maximale** à travers toute l'application.

### ✨ Caractéristiques principales

- ✅ **39 tables DB** entièrement typées et validées
- ✅ **4631 tests** unitaires (99.68% coverage)
- ✅ **Validation Zod** runtime avec inférence TypeScript automatique
- ✅ **Result Pattern** pour gestion d'erreurs fonctionnelle
- ✅ **Domain Errors** typés avec discriminated unions
- ✅ **Clean Architecture** (Domain / DTOs / Validators)
- ✅ **Zero duplication** entre frontend et backend
- ✅ **ESM & CJS** support

### 🏗️ Architecture

```
@clubmanager/types/
├── shared/           # Utilitaires partagés (Result, Errors)
├── domain/           # Types métier (User, Course, Order, etc.)
├── dtos/             # Data Transfer Objects (API request/response)
├── validators/       # Schémas Zod (validation runtime)
├── constants/        # Constantes (longueurs, limites, regex)
├── enums/            # Énumérations (roles, status)
└── examples/         # Exemples d'utilisation concrets
```

---

## 📦 Installation

```bash
# Dans le monorepo
npm install

# Lien local entre packages
cd packages/types && npm link
cd ../../api && npm link @clubmanager/types
```

---

## 🚀 Utilisation

### 1. **Validation avec Zod**

```typescript
import { createUserSchema, type CreateUserInput } from '@clubmanager/types';

// Validation runtime
const result = createUserSchema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json({
    success: false,
    errors: result.error.errors,
  });
}

// ✅ result.data est maintenant typé comme CreateUserInput
const user = await createUserInDb(result.data);
```

### 2. **Result Pattern (nouveau !)**

Remplace `throw/catch` par un type de retour explicite :

```typescript
import { Result, DomainError } from '@clubmanager/types';

// ❌ OLD WAY
async function findUser(id: number): Promise<User> {
  const user = await db.query('...');
  if (!user) {
    throw new Error('User not found'); // 😱 Erreur cachée !
  }
  return user;
}

// ✅ NEW WAY
async function findUser(id: number): Promise<Result<User, NotFoundError>> {
  const user = await db.query('...');
  
  if (!user) {
    return Result.fail(
      DomainError.notFound({
        entity: 'User',
        id,
        message: `User ${id} not found`,
      })
    );
  }
  
  return Result.ok(user);
}

// Utilisation
const result = await findUser(42);

if (result.isSuccess()) {
  console.log('User:', result.value);
} else {
  console.error('Error:', result.error.message);
}
```

### 3. **Domain Types**

```typescript
import type { User, Course, Order } from '@clubmanager/types';

// Types inférés depuis les validators
function processUser(user: User) {
  console.log(user.userId); // Type-safe !
}
```

### 4. **DTOs (Data Transfer Objects)**

```typescript
import type { 
  CreateUserDto, 
  UserResponseDto,
  UpdateUserDto 
} from '@clubmanager/types';

// Request
app.post('/users', async (req, res) => {
  const createDto: CreateUserDto = req.body;
  // ...
});

// Response
app.get('/users/:id', async (req, res) => {
  const user = await findUser(req.params.id);
  
  const response: UserResponseDto = {
    id: user.id,
    userId: user.userId,
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`,
    // Pas de données sensibles (password, tokens)
  };
  
  res.json(response);
});
```

### 5. **Constants**

```typescript
import { 
  USER_CONSTRAINTS,
  VALID_SORT_ORDERS,
  DEFAULT_PAGE_SIZE 
} from '@clubmanager/types';

// Utiliser les mêmes contraintes que la DB
if (username.length < USER_CONSTRAINTS.USERNAME_MIN_LENGTH) {
  throw new Error('Username too short');
}
```

---

## 🎨 Patterns avancés

### Result Pattern avec chaining

```typescript
import { Result } from '@clubmanager/types';

const result = await validateUserData(req.body)
  .flatMap(data => checkEmailNotExists(data.email))
  .flatMap(data => createUserInDb(data))
  .map(user => mapToDto(user));

// Pattern matching
result.match({
  ok: (user) => res.status(201).json({ success: true, data: user }),
  err: (error) => res.status(getStatusCode(error)).json({ 
    success: false, 
    error: error.message 
  }),
});
```

### Combine multiple Results

```typescript
import { Result } from '@clubmanager/types';

// Fetch multiple users in parallel
const userResults = await Promise.all([
  findUserById(1),
  findUserById(2),
  findUserById(3),
]);

// Combine - fails if ANY fails
const combined = Result.combine(userResults);

if (combined.isSuccess()) {
  const [user1, user2, user3] = combined.value;
  // ...
}
```

### Domain Errors typés

```typescript
import { DomainError, type DomainError as DomainErrorType } from '@clubmanager/types';

function handleError(error: DomainErrorType): ErrorResponse {
  // TypeScript garantit l'exhaustivité
  switch (error._tag) {
    case 'ValidationError':
      return { status: 400, message: error.message, field: error.field };
    case 'NotFoundError':
      return { status: 404, message: `${error.entity} not found` };
    case 'ConflictError':
      return { status: 409, message: error.message };
    case 'UnauthorizedError':
      return { status: 401, message: 'Unauthorized' };
    case 'ForbiddenError':
      return { status: 403, message: 'Forbidden' };
    // ... TypeScript erreur si on oublie un cas
  }
}
```

---

## 📚 Domains disponibles

| Domain | Tables | Validators | Tests | Coverage |
|--------|--------|-----------|-------|----------|
| **Users** | 7 | ✅ | 350+ | 100% |
| **Courses** | 6 | ✅ | 750+ | 100% |
| **Payments** | 3 | ✅ | 450+ | 100% |
| **Store** | 8 | ✅ | 1396+ | 99.18% |
| **Messaging** | 8 | ✅ | 1710+ | 100% |
| **Groups** | 2 | ✅ | 243+ | 100% |
| **Statistics** | 2 | ✅ | 43+ | 97.87% |
| **Lookup** | 3 | ✅ | 46+ | 100% |
| **TOTAL** | **39** | **34** | **4631** | **99.68%** |

---

## 🔄 Migration depuis legacy

### Avant (legacy)

```typescript
import { 
  UserData,           // ❌ Type manuel
  userDataAjoutSchema // ❌ Validation basique
} from '@clubmanager/types';
```

### Après (nouveau)

```typescript
import { 
  User,                // ✅ Type inféré depuis validator
  CreateUser,          // ✅ DTO pour création
  createUserSchema     // ✅ Validation Zod complète
} from '@clubmanager/types';
```

### Guide de migration complet

Voir [`MIGRATION.md`](./docs/MIGRATION.md) pour un guide détaillé.

---

## 🧪 Tests

```bash
# Tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage

# Tests d'un domain spécifique
npm test -- src/validators/users
```

### Écrire des tests

```typescript
import { createUserSchema } from '@clubmanager/types';

describe('User Validation', () => {
  it('should validate valid user data', () => {
    const result = createUserSchema.safeParse({
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'SecureP@ss123',
      date_of_birth: '1990-01-15',
      genre_id: 1,
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = createUserSchema.safeParse({
      email: 'invalid',
      // ...
    });

    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toEqual(['email']);
  });
});
```

---

## 🏗️ Build

```bash
# Build TypeScript
npm run build

# Le build génère :
# - dist/index.js (ESM)
# - dist/index.d.ts (types)
# - dist/**/*.d.ts (tous les types)
```

---

## 📖 Documentation

### Validators

Chaque validator est documenté avec JSDoc :

```typescript
/**
 * Schema for creating a new user
 * 
 * @example
 * ```typescript
 * const result = createUserSchema.safeParse({
 *   email: 'john@example.com',
 *   first_name: 'John',
 *   // ...
 * });
 * ```
 */
export const createUserSchema = z.object({
  email: z.string().email(),
  // ...
});
```

### Examples

Voir [`src/examples/`](./src/examples/) pour des exemples concrets d'utilisation.

---

## 🤝 Contribution

### Structure d'un nouveau domain

```
src/
├── constants/
│   └── my-domain.constants.ts
├── domain/
│   └── my-domain/
│       └── MyEntity.types.ts
├── dtos/
│   └── my-domain/
│       └── index.ts
└── validators/
    └── my-domain/
        ├── my-entity.validators.ts
        └── __tests__/
            └── my-entity.validators.test.ts
```

### Checklist

- [ ] Créer constantes (longueurs, limites)
- [ ] Créer validators Zod
- [ ] Créer domain types (inférés)
- [ ] Créer DTOs (request/response)
- [ ] Écrire tests (>95% coverage)
- [ ] Documenter avec JSDoc
- [ ] Exporter depuis `index.ts`

---

## 📊 Métriques

- **Lines of Code**: ~15,000
- **Files**: 141
- **Tests**: 4,631
- **Coverage**: 99.68%
- **Domains**: 8
- **Validators**: 34
- **Build time**: ~2s

---

## 🔗 Liens utiles

- [Zod Documentation](https://zod.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Result Pattern](https://fsharpforfunandprofit.com/posts/recipe-part2/)

---

## 📝 Changelog

Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique des versions.

---

## 📄 License

ISC © 2024 ClubManager

---

## 🎓 Contexte TFE

Ce package fait partie du **Travail de Fin d'Études** (TFE) sur ClubManager. Il démontre :

- ✅ **Architecture Clean** (separation of concerns)
- ✅ **Domain-Driven Design** (domain types, value objects)
- ✅ **Type Safety** (runtime + compile-time)
- ✅ **Functional Programming** (Result monad, immutabilité)
- ✅ **Test-Driven Development** (99.68% coverage)
- ✅ **Best Practices** (SOLID, DRY, KISS)

### Choix techniques justifiés

| Choix | Justification |
|-------|---------------|
| **Zod** | Validation runtime + inférence types automatique |
| **Result Pattern** | Gestion d'erreurs explicite, pas de throw caché |
| **Monorepo** | Partage de code, versioning cohérent |
| **TypeScript strict** | Maximum de sécurité à la compilation |
| **Jest** | Framework de test standard, intégration TypeScript |
| **Clean Architecture** | Séparation des couches, maintenabilité |

---

**🚀 Ready to use in production!**

Pour toute question : voir [`docs/FAQ.md`](./docs/FAQ.md) ou ouvrir une issue.