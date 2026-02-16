# Gdpr Domain

## 📝 Description

Domaine gérant les fonctionnalités liées aux gdpr.

## 📁 Structure

```
gdpr/
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
import { Gdpr, CreateGdprInput } from '@clubmanager/types';
```

### Validation avec Zod

```typescript
import { createGdprSchema, validateGdpr } from '@clubmanager/types';

const data = validateGdpr(userInput);
```

### GraphQL

```typescript
import { gdprTypeDefs } from '@clubmanager/types';
```

## 📚 Types Principaux

- `Gdpr` - Entité principale
- `CreateGdprInput` - Données de création
- `UpdateGdprInput` - Données de mise à jour
- `GdprFilter` - Filtres de recherche
- `GdprList` - Liste paginée

## ✅ Validators

- `createGdprSchema` - Validation création
- `updateGdprSchema` - Validation mise à jour
- `gdprIdSchema` - Validation ID
- `gdprFilterSchema` - Validation filtres

## 🔄 Dernière mise à jour

2026-02-16
