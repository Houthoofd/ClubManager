# Teachers Domain

## 📝 Description

Domaine gérant les fonctionnalités liées aux teachers.

## 📁 Structure

```
teachers/
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
import { Teachers, CreateTeachersInput } from '@clubmanager/types';
```

### Validation avec Zod

```typescript
import { createTeachersSchema, validateTeachers } from '@clubmanager/types';

const data = validateTeachers(userInput);
```

### GraphQL

```typescript
import { teachersTypeDefs } from '@clubmanager/types';
```

## 📚 Types Principaux

- `Teachers` - Entité principale
- `CreateTeachersInput` - Données de création
- `UpdateTeachersInput` - Données de mise à jour
- `TeachersFilter` - Filtres de recherche
- `TeachersList` - Liste paginée

## ✅ Validators

- `createTeachersSchema` - Validation création
- `updateTeachersSchema` - Validation mise à jour
- `teachersIdSchema` - Validation ID
- `teachersFilterSchema` - Validation filtres

## 🔄 Dernière mise à jour

2026-02-22
