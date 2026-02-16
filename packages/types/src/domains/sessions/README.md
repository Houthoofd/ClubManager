# Sessions Domain

## 📝 Description

Domaine gérant les fonctionnalités liées aux sessions.

## 📁 Structure

```
sessions/
├── index.ts              # Point d'entrée
├── types.ts              # Types métier
├── validators.ts         # Schémas Zod
├── graphql.typedefs.ts   # Schémas GraphQL
├── graphql.types.ts      # Types pour resolvers
└── README.md            # Cette documentation
```

## 🚀 Usage

### Import des types

```typescript
import { Sessions, CreateSessionsInput } from '@clubmanager/types';
```

### Validation avec Zod

```typescript
import { createSessionsSchema, validateSessions } from '@clubmanager/types';

const data = validateSessions(userInput);
```

### GraphQL

```typescript
import { sessionsTypeDefs } from '@clubmanager/types';
```

## 📚 Types Principaux

- `Sessions` - Entité principale
- `CreateSessionsInput` - Données de création
- `UpdateSessionsInput` - Données de mise à jour
- `SessionsFilter` - Filtres de recherche
- `SessionsList` - Liste paginée

## ✅ Validators

- `createSessionsSchema` - Validation création
- `updateSessionsSchema` - Validation mise à jour
- `sessionsIdSchema` - Validation ID
- `sessionsFilterSchema` - Validation filtres

## 🔄 Dernière mise à jour

2026-02-16
