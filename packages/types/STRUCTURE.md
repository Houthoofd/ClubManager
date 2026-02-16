# 📦 @clubmanager/types - Structure & Conventions

**Version**: 1.0.0  
**Type**: TypeScript Package  
**Purpose**: Types partagés centralisés pour ClubManager

---

## 📁 Structure du Package

```
packages/types/
├── src/
│   ├── index.ts                      # Point d'entrée principal
│   │
│   ├── core/                         # Types de base (fondamentaux)
│   │   ├── common.ts                # Types communs (Result, Pagination, etc.)
│   │   ├── config.ts                # Types de configuration
│   │   ├── errors.ts                # Types d'erreurs
│   │   ├── graphql.ts               # Types GraphQL de base
│   │   ├── middleware.ts            # Types pour middleware
│   │   ├── query.ts                 # Types pour queries
│   │   ├── services.ts              # Types pour services
│   │   └── index.ts                 # Exports centralisés
│   │
│   ├── domains/                      # Types métier (15 domaines)
│   │   ├── alertes/
│   │   ├── auth/
│   │   ├── commandes/
│   │   ├── compte/
│   │   ├── cours/
│   │   ├── informations/
│   │   ├── inscription/
│   │   ├── magasin/
│   │   ├── messages/
│   │   ├── paiements/
│   │   ├── professeurs/
│   │   ├── statistiques/
│   │   ├── upload/
│   │   ├── utilisateurs/
│   │   ├── verification/
│   │   └── index.ts
│   │
│   └── infrastructure/               # Types d'infrastructure
│       ├── database/                # Types base de données
│       │   ├── auth.types.ts
│       │   └── utilisateurs.types.ts
│       ├── alerts.ts                # Types système d'alertes
│       ├── email.ts                 # Types système email
│       ├── email.graphql.ts         # Types GraphQL email avancé
│       ├── s3.ts                    # Types stockage S3
│       ├── webhooks.ts              # Types webhooks
│       └── index.ts                 # Exports centralisés
│
├── dist/                            # Fichiers compilés (généré)
├── package.json                     # Configuration npm
├── tsconfig.json                    # Configuration TypeScript
└── STRUCTURE.md                     # Ce fichier
```

---

## 🎯 Conventions de Nommage

### Fichiers dans un Domaine

Chaque domaine suit une structure standardisée :

```
domains/<nom-domaine>/
├── index.ts                    # ✅ OBLIGATOIRE - Exports centralisés
├── types.ts                    # ✅ OBLIGATOIRE - Types TypeScript métier
├── validators.ts               # ✅ OBLIGATOIRE - Schémas de validation Zod
├── graphql.typedefs.ts         # ⚠️ CONDITIONNEL - Schémas GraphQL (strings)
├── graphql.types.ts            # ⚠️ CONDITIONNEL - Types TypeScript pour GraphQL
└── service.ts                  # ⚪ OPTIONNEL - Types de service
```

### Différence `graphql.typedefs.ts` vs `graphql.types.ts`

| Fichier | Contenu | Quand l'utiliser |
|---------|---------|------------------|
| `graphql.typedefs.ts` | Schémas GraphQL (strings avec `gql` ou template literals) | Pour définir le schéma GraphQL |
| `graphql.types.ts` | Types TypeScript correspondants aux schémas GraphQL | Pour typer les resolvers et les données |

**Exemple - graphql.typedefs.ts** :
```typescript
export const authTypeDefs = `
  type User {
    id: Int!
    email: String!
    firstName: String!
  }
`;
```

**Exemple - graphql.types.ts** :
```typescript
export interface User {
  id: number;
  email: string;
  firstName: string;
}
```

### Nommage des Exports

| Type | Convention | Exemple |
|------|-----------|---------|
| Types GraphQL | `<domaine>TypeDefs` | `authTypeDefs`, `coursTypeDefs` |
| Interfaces | `PascalCase` | `User`, `Course`, `Payment` |
| Enums | `PascalCase` | `UserRole`, `PaymentStatus` |
| Validators | `camelCaseSchema` | `loginSchema`, `createUserSchema` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `DEFAULT_LIMIT` |

---

## 📦 Utilisation du Package

### Installation Interne

```bash
# Le package est utilisé via workspace
npm install @clubmanager/types
```

### Import Recommandé (Namespace)

```typescript
// ✅ RECOMMANDÉ - Évite les conflits de noms
import { Auth, Magasin, Cours } from '@clubmanager/types';

const user: Auth.User = { ... };
const product: Magasin.Produit = { ... };
const course: Cours.Course = { ... };
```

### Import Direct

```typescript
// ⚠️ ATTENTION - Peut causer des conflits
import { User } from '@clubmanager/types';
// Problème : Quel User ? Auth.User ? Utilisateurs.User ?
```

### Import de Types Core

```typescript
import { Result, PaginatedResult, AppError } from '@clubmanager/types';
```

### Import de GraphQL TypeDefs

```typescript
import { 
  authTypeDefs, 
  coursTypeDefs, 
  magasinTypeDefs 
} from '@clubmanager/types';
```

### Import de Types Infrastructure

```typescript
import type {
  EmailSendRequest,
  WebhookRequest,
  AlertConfig
} from '@clubmanager/types';
```

---

## 🏗️ Architecture des Couches

### 1. Core Layer (`core/`)

**Responsabilité** : Types fondamentaux utilisés partout dans l'application.

**Contenu** :
- Types utilitaires génériques (`Result<T>`, `Paginated<T>`)
- Types d'erreurs (`AppError`, `ValidationError`)
- Types de configuration globale
- Types GraphQL de base

**Principe** : Aucune dépendance métier. Doit être réutilisable dans n'importe quel projet.

### 2. Domain Layer (`domains/`)

**Responsabilité** : Types métier spécifiques à chaque domaine fonctionnel.

**Contenu** :
- Entités métier (`User`, `Course`, `Product`)
- DTOs (Data Transfer Objects)
- Types de requêtes/réponses
- Schémas de validation Zod
- Schémas GraphQL

**Principe** : Indépendant de l'infrastructure. Représente la logique métier pure.

### 3. Infrastructure Layer (`infrastructure/`)

**Responsabilité** : Types liés aux services externes et infrastructure technique.

**Contenu** :
- Types pour email (SendGrid)
- Types pour webhooks (Stripe)
- Types pour stockage (S3)
- Types pour base de données
- Types pour alertes et monitoring

**Principe** : Contient les détails d'implémentation technique.

---

## 📝 Conventions de Code

### Types vs Interfaces

```typescript
// ✅ Interface pour les objets extensibles
export interface User {
  id: number;
  email: string;
}

// ✅ Type pour les unions et intersections
export type UserRole = 'admin' | 'user' | 'guest';
export type UserWithRole = User & { role: UserRole };
```

### Optionnel vs Nullable

```typescript
// ✅ Optionnel - La propriété peut ne pas exister
interface User {
  email: string;
  phone?: string;  // peut être undefined
}

// ✅ Nullable - La propriété existe mais peut être null
interface User {
  email: string;
  phone: string | null;  // doit être présent (null ou string)
}
```

### Readonly

```typescript
// ✅ Utiliser readonly pour les propriétés immuables
interface Config {
  readonly apiKey: string;
  readonly baseUrl: string;
}
```

### Generic Types

```typescript
// ✅ Nommer les génériques de manière explicite
export interface Result<TData = unknown, TError = Error> {
  success: boolean;
  data?: TData;
  error?: TError;
}

// ✅ Contraindre les génériques si nécessaire
export interface Repository<T extends { id: number }> {
  findById(id: number): Promise<T>;
}
```

---

## 🔧 Validation avec Zod

### Convention

Tous les types validables doivent avoir un schéma Zod correspondant dans `validators.ts`.

```typescript
// types.ts
export interface LoginInput {
  email: string;
  password: string;
}

// validators.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Inférer le type depuis le schéma (optionnel)
export type LoginInput = z.infer<typeof loginSchema>;
```

### Nommage des Schémas

| Type de schéma | Convention | Exemple |
|----------------|-----------|---------|
| Input | `<action><Entity>Schema` | `createUserSchema`, `updateCourseSchema` |
| Output | `<entity>Schema` | `userSchema`, `courseSchema` |
| Nested | `<entity><Field>Schema` | `userAddressSchema` |

---

## 📊 Exports

### index.ts Principal

Le fichier `src/index.ts` exporte :

1. **Tout de core** - `export * from './core'`
2. **Types infrastructure sélectifs** - Types spécifiques
3. **GraphQL TypeDefs** - Tous les typedefs
4. **Namespaces domaines** - `export * as Auth from './domains/auth'`

### index.ts de Domaine

Chaque `domains/<domaine>/index.ts` doit exporter :

```typescript
// Exports nommés (tout sauf les imports de dépendances)
export * from './types.js';
export * from './validators.js';

// GraphQL (si présent)
export { authTypeDefs } from './graphql.typedefs.js';
export type * from './graphql.types.js';

// Service types (si présent)
export type * from './service.js';
```

---

## 🔄 Processus de Build

### Compilation

```bash
npm run build
```

Génère les fichiers `.js`, `.d.ts` et `.d.ts.map` dans `dist/`.

### Configuration TypeScript

- **Module** : ESM (`"type": "module"`)
- **Target** : ES2020+
- **Strict** : Activé
- **Declaration** : Activé (génère .d.ts)

### Package Exports

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./graphql": "./dist/core/graphql.js",
    "./domains/*": "./dist/domains/*.js"
  }
}
```

---

## ✅ Checklist - Ajouter un Nouveau Domaine

- [ ] Créer le dossier `src/domains/<nom>/`
- [ ] Créer `index.ts` avec exports
- [ ] Créer `types.ts` avec les interfaces
- [ ] Créer `validators.ts` avec les schémas Zod
- [ ] (Optionnel) Créer `graphql.typedefs.ts` avec les schémas GraphQL
- [ ] (Optionnel) Créer `graphql.types.ts` avec les types GraphQL
- [ ] Ajouter l'export namespace dans `src/index.ts`
- [ ] Ajouter le typeDef dans `src/index.ts` (si GraphQL)
- [ ] Compiler avec `npm run build`
- [ ] Tester l'import dans l'API

---

## 📚 Ressources

- **Documentation complète** : Voir `/docs/TYPES_PACKAGE_README.md`
- **Changelog** : Voir `/docs/TYPES_PACKAGE_CHANGELOG.md`
- **Architecture** : Voir `/docs/ARCHITECTURE_ANALYSIS.md`

---

## 🎯 Objectifs de ce Package

1. **Centralisation** : Un seul endroit pour tous les types
2. **Réutilisabilité** : Types partagés entre API, frontend, jobs, etc.
3. **Type Safety** : Éviter les erreurs de typage
4. **Documentation** : Les types servent de documentation
5. **Validation** : Schémas Zod pour validation runtime

---

**Dernière mise à jour** : Février 2025  
**Mainteneur** : Équipe ClubManager