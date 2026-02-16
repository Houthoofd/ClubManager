# Audit Domain

## 📝 Description

Domaine gérant les fonctionnalités liées aux audit.

## 📁 Structure

```
audit/
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
import { Audit, CreateAuditInput } from '@clubmanager/types';
```

### Validation avec Zod

```typescript
import { createAuditSchema, validateAudit } from '@clubmanager/types';

const data = validateAudit(userInput);
```

### GraphQL

```typescript
import { auditTypeDefs } from '@clubmanager/types';
```

## 📚 Types Principaux

- `Audit` - Entité principale
- `CreateAuditInput` - Données de création
- `UpdateAuditInput` - Données de mise à jour
- `AuditFilter` - Filtres de recherche
- `AuditList` - Liste paginée

## ✅ Validators

- `createAuditSchema` - Validation création
- `updateAuditSchema` - Validation mise à jour
- `auditIdSchema` - Validation ID
- `auditFilterSchema` - Validation filtres

## 🔄 Dernière mise à jour

2026-02-16
