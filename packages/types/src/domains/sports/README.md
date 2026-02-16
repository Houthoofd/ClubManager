# Sports Domain

## 📝 Description

Domaine gérant les fonctionnalités liées aux sports.

## 📁 Structure

```
sports/
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
import { Sports, CreateSportsInput } from '@clubmanager/types';
```

### Validation avec Zod

```typescript
import { createSportsSchema, validateSports } from '@clubmanager/types';

const data = validateSports(userInput);
```

### GraphQL

```typescript
import { sportsTypeDefs } from '@clubmanager/types';
```

## 📚 Types Principaux

- `Sports` - Entité principale
- `CreateSportsInput` - Données de création
- `UpdateSportsInput` - Données de mise à jour
- `SportsFilter` - Filtres de recherche
- `SportsList` - Liste paginée

## ✅ Validators

- `createSportsSchema` - Validation création
- `updateSportsSchema` - Validation mise à jour
- `sportsIdSchema` - Validation ID
- `sportsFilterSchema` - Validation filtres

## 🔄 Dernière mise à jour

2026-02-16
