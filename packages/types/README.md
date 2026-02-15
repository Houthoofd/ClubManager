# @clubmanager/types

> Package centralisé de types TypeScript pour l'application ClubManager

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Vue d'ensemble

Ce package fournit tous les types TypeScript, validators Zod et définitions GraphQL pour l'application ClubManager, organisés selon les principes du **Domain-Driven Design (DDD)**.

## 🏗️ Architecture

```
packages/types/src/
├── core/                    # Types système centraux
│   ├── common.ts           # Pagination, sorting, filtering
│   ├── errors.ts           # Error codes, ErrorResponse
│   ├── config.ts           # Configuration app
│   ├── middleware.ts       # Auth, rate-limit, validation
│   ├── services.ts         # Session, Audit, Auth base
│   ├── query.ts            # API response types
│   └── graphql.ts          # GraphQL re-exports
│
├── infrastructure/          # Services d'infrastructure
│   ├── email.ts            # Email types (SendGrid)
│   ├── s3.ts               # Storage types (AWS S3)
│   ├── webhooks.ts         # Stripe webhooks
│   └── database/           # Database types
│
└── domains/                # 15 domaines métier
    ├── alertes/
    ├── auth/
    ├── commandes/
    ├── compte/
    ├── cours/
    ├── informations/
    ├── inscription/
    ├── magasin/
    ├── messages/
    ├── paiements/
    ├── professeurs/
    ├── statistiques/
    ├── upload/
    ├── utilisateurs/
    └── verification/
```

Chaque domaine contient:
- `types.ts` - Interfaces et types TypeScript
- `validators.ts` - Schémas de validation Zod
- `graphql.typedefs.ts` - Définitions GraphQL
- `graphql.types.ts` - Types GraphQL générés
- `index.ts` - Exports consolidés

## 🎯 Guide d'utilisation

### Méthode recommandée : Imports par namespace

Pour éviter les conflits de noms entre domaines, **utilisez toujours les imports par namespace** :

```typescript
import { Auth, Magasin, Cours, Utilisateurs } from '@clubmanager/types';

// Utilisation claire et sans ambiguïté
const loginData: Auth.LoginInput = {
  email: 'user@example.com',
  password: 'secret'
};

const product: Magasin.Produit = {
  id: 1,
  nom: 'Kimono',
  prix: 50,
  stock: 10
};

const user: Utilisateurs.Utilisateur = {
  id: 123,
  email: 'user@example.com',
  nom: 'Dupont',
  prenom: 'Jean'
};
```

### Imports directs (alternative)

Pour des cas spécifiques, vous pouvez importer directement depuis un domaine :

```typescript
import type { Produit, Categorie } from '@clubmanager/types/domains/magasin';
import type { LoginInput } from '@clubmanager/types/domains/auth';
```

### Types Core (imports directs)

Les types système sont importés directement :

```typescript
import { 
  PaginationInput, 
  PaginatedResponse,
  ErrorResponse,
  SortOrder
} from '@clubmanager/types';
```

### Validators Zod

```typescript
import { 
  loginSchema, 
  registerSchema 
} from '@clubmanager/types/domains/auth/validators';

// Validation
const result = loginSchema.safeParse(data);
if (result.success) {
  // data est valide et typé
  const { email, password } = result.data;
}
```

### GraphQL TypeDefs

```typescript
import { authTypeDefs } from '@clubmanager/types/domains/auth';
import { magasinTypeDefs } from '@clubmanager/types/domains/magasin';

const typeDefs = [
  authTypeDefs,
  magasinTypeDefs,
  // ...
];
```

## 📦 Namespaces disponibles

### Domaines métier

- **`Alertes`** - Gestion des alertes système
- **`Auth`** - Authentification et autorisation
- **`Commandes`** - Gestion des commandes
- **`Compte`** - Gestion du compte utilisateur
- **`Cours`** - Gestion des cours et inscriptions
- **`Informations`** - Informations et actualités
- **`Inscription`** - Demandes d'inscription
- **`Magasin`** - Boutique en ligne (produits, catégories, stocks)
- **`Messages`** - Messagerie interne
- **`Paiements`** - Gestion des paiements et échéances
- **`Professeurs`** - Gestion des professeurs
- **`Statistiques`** - Statistiques et rapports
- **`Upload`** - Gestion des fichiers
- **`Utilisateurs`** - Gestion des utilisateurs
- **`Verification`** - Vérification des comptes

### Infrastructure

- **Email** - Types pour SendGrid
- **S3** - Types pour AWS S3
- **Webhooks** - Types pour Stripe webhooks

## 📝 Convention de nommage

Le package suit une convention stricte pour garantir la cohérence :

### Pattern général : `[module].[type].ts`

```
types.ts              # Types et interfaces
validators.ts         # Schémas Zod
graphql.typedefs.ts   # Définitions GraphQL
graphql.types.ts      # Types générés GraphQL
service.ts            # Service types
index.ts              # Exports
```

### Sous-modules : `[submodule].[type].ts`

```
stock.types.ts
stock.validators.ts
echeances.validators.ts
confirmation.graphql.typedefs.ts
```

### Exemples par domaine

#### ✅ Auth
```
auth/
├── types.ts
├── validators.ts
├── graphql.types.ts
├── graphql.typedefs.ts
└── index.ts
```

#### ✅ Magasin
```
magasin/
├── types.ts
├── validators.ts
├── graphql.typedefs.ts
├── stock.types.ts
├── stock.graphql.typedefs.ts
└── index.ts
```

#### ✅ Paiements
```
paiements/
├── types.ts
├── validators.ts
├── graphql.typedefs.ts
├── echeances.types.ts
├── echeances.validators.ts
├── echeances.graphql.typedefs.ts
└── index.ts
```

## 🚀 Installation & Build

```bash
# Installer les dépendances
npm install

# Build du package
npm run build

# Build en mode watch (développement)
npm run build:watch

# Vérifier les types
npm run type-check
```

## ✅ Statut

- ✅ **Compilation TypeScript** : 0 erreurs
- ✅ **Structure DDD** : 15 domaines organisés
- ✅ **Tests** : Tous les imports fonctionnels
- ✅ **Documentation** : Complète et à jour
- ✅ **Production Ready** : Prêt pour utilisation

## 📚 Documentation complémentaire

- **[CHANGELOG.md](./CHANGELOG.md)** - Historique des changements
- **[../../docs/TODO.md](../../docs/TODO.md)** - TODO du projet
- **[../../docs/VALIDATORS_RESOLUTION.md](../../docs/VALIDATORS_RESOLUTION.md)** - Résolution des validators

## 🤝 Contribution

### Ajouter un nouveau domaine

1. Créer le dossier dans `src/domains/[nouveau-domaine]/`
2. Créer les fichiers selon la convention :
   - `types.ts`
   - `validators.ts`
   - `graphql.typedefs.ts`
   - `index.ts`
3. Exporter le namespace dans `src/domains/index.ts`
4. Mettre à jour `src/index.ts`

### Ajouter des types à un domaine existant

1. Modifier le fichier approprié selon la convention
2. Exporter dans `index.ts` du domaine
3. Documenter dans ce README si nécessaire

## 📄 License

MIT

---

**Version:** 2.0.0  
**Dernière mise à jour:** 2024  
**Maintenu par:** Équipe ClubManager
