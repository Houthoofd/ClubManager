# 🚀 Guide du Générateur de Domaine

Ce guide explique comment utiliser le générateur automatique de domaines pour `@clubmanager/types`.

---

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Utilisation de base](#utilisation-de-base)
4. [Options avancées](#options-avancées)
5. [Exemples pratiques](#exemples-pratiques)
6. [Validation](#validation)
7. [Personnalisation](#personnalisation)
8. [Dépannage](#dépannage)

---

## 🎯 Introduction

Le **générateur de domaine** automatise la création de nouveaux domaines dans `packages/types` en respectant **automatiquement** toutes les conventions architecturales du projet.

### ✅ Ce qu'il fait pour vous :

- Génère la structure complète d'un domaine
- Crée tous les fichiers avec templates pré-remplis
- Applique les conventions de nommage
- Ajoute JSDoc systématiquement
- Sépare correctement types/validators/GraphQL
- Met à jour les exports automatiquement
- Valide la conformité architecturale

### 🎨 Structure générée :

```
domains/mon-domaine/
├── types.ts              ✅ Types TypeScript métier
├── validators.ts         ✅ Schémas Zod + validation
├── graphql.typedefs.ts   📘 Schémas GraphQL (optionnel)
├── graphql.types.ts      📘 Types pour resolvers (optionnel)
├── service.ts            🔵 Interfaces service (optionnel)
├── database.types.ts     🔵 Types DB snake_case (optionnel)
├── index.ts              ✅ Point d'entrée
└── README.md             📚 Documentation
```

---

## 📦 Installation

Le générateur est déjà installé dans le package. Aucune installation supplémentaire nécessaire.

### Prérequis :

- Node.js >= 16
- Package `@clubmanager/types` installé

---

## 🚀 Utilisation de base

### Commande minimale :

```bash
npm run generate:domain <nom-domaine>
```

**Exemple :**

```bash
npm run generate:domain evenements
```

Cela génère :
- ✅ `types.ts` - Types métier
- ✅ `validators.ts` - Schémas Zod
- ✅ `index.ts` - Exports
- ✅ `README.md` - Documentation

### Avec GraphQL :

```bash
npm run generate:domain evenements -- --with-graphql
```

Ajoute :
- 📘 `graphql.typedefs.ts` - Schémas GraphQL
- 📘 `graphql.types.ts` - Types resolvers

---

## 🎨 Options avancées

### Toutes les options disponibles :

| Option | Description | Génère |
|--------|-------------|--------|
| `--with-graphql` | Ajoute support GraphQL | `graphql.typedefs.ts` + `graphql.types.ts` |
| `--with-service` | Ajoute interfaces service | `service.ts` |
| `--with-database` | Ajoute types DB | `database.types.ts` |
| `--with-subdomain` | Ajoute un sous-domaine exemple | `items/` |
| `--skip-validators` | Ne génère pas validators.ts | ⚠️ Non recommandé |
| `--dry-run` | Simule sans créer fichiers | Prévisualisation |
| `--help`, `-h` | Affiche l'aide | - |

### Exemples combinés :

```bash
# Domaine complet avec GraphQL + Service + Database
npm run generate:domain evenements -- --with-graphql --with-service --with-database

# Domaine avec sous-domaine
npm run generate:domain magasin -- --with-graphql --with-subdomain

# Test (dry-run) avant génération
npm run generate:domain test-domain -- --dry-run --with-graphql
```

---

## 📚 Exemples pratiques

### Exemple 1 : Domaine simple (sans GraphQL)

**Cas d'usage :** Types métier uniquement

```bash
npm run generate:domain commandes
```

**Fichiers créés :**
```
commandes/
├── types.ts          # Commande, CreateCommandeInput, etc.
├── validators.ts     # createCommandeSchema, etc.
├── index.ts          # Exports
└── README.md         # Doc
```

**Utilisation :**
```typescript
import { Commande, createCommandeSchema } from '@clubmanager/types';

const data = createCommandeSchema.parse(userInput);
```

---

### Exemple 2 : Domaine GraphQL complet

**Cas d'usage :** API GraphQL avec resolvers

```bash
npm run generate:domain cours -- --with-graphql
```

**Fichiers créés :**
```
cours/
├── types.ts              # Cours, CreateCoursInput, etc.
├── validators.ts         # createCoursSchema, etc.
├── graphql.typedefs.ts   # type Cours { ... }
├── graphql.types.ts      # CoursContext, GetCoursArgs, etc.
├── index.ts
└── README.md
```

**Utilisation :**
```typescript
// Types métier
import { Cours, CreateCoursInput } from '@clubmanager/types';

// GraphQL
import { coursTypeDefs } from '@clubmanager/types';

// Resolvers
import type { GetCoursArgs, CoursContext } from '@clubmanager/types';
```

---

### Exemple 3 : Domaine avec service

**Cas d'usage :** Logique métier complexe

```bash
npm run generate:domain paiements -- --with-graphql --with-service
```

**Fichiers créés :**
```
paiements/
├── types.ts
├── validators.ts
├── graphql.typedefs.ts
├── graphql.types.ts
├── service.ts            # PaiementService interface
├── index.ts
└── README.md
```

**Utilisation :**
```typescript
import type { PaiementService, PaiementServiceConfig } from '@clubmanager/types';

class MyPaiementService implements PaiementService {
  async create(input: CreatePaiementInput): Promise<Paiement> {
    // ...
  }
}
```

---

### Exemple 4 : Domaine avec types Database

**Cas d'usage :** Mapping DB différent du métier

```bash
npm run generate:domain utilisateurs -- --with-graphql --with-database
```

**Fichiers créés :**
```
utilisateurs/
├── types.ts              # camelCase métier
├── validators.ts
├── graphql.typedefs.ts
├── graphql.types.ts
├── database.types.ts     # snake_case DB
├── index.ts
└── README.md
```

**Utilisation :**
```typescript
import type { Utilisateur } from '@clubmanager/types';           // Métier
import type { UtilisateurDB } from '@clubmanager/types';         // DB

// Mapper DB → Métier
function mapToUtilisateur(db: UtilisateurDB): Utilisateur {
  return {
    id: db.id,
    nom: db.nom,
    createdAt: db.created_at, // snake → camel
  };
}
```

---

### Exemple 5 : Domaine avec sous-domaine

**Cas d'usage :** Domaine complexe avec sous-modules

```bash
npm run generate:domain magasin -- --with-graphql --with-subdomain
```

**Fichiers créés :**
```
magasin/
├── types.ts
├── validators.ts
├── graphql.typedefs.ts
├── graphql.types.ts
├── index.ts
├── README.md
└── items/                  # Sous-domaine
    ├── types.ts
    ├── validators.ts
    └── index.ts
```

**Utilisation :**
```typescript
import { Magasin } from '@clubmanager/types';
import { MagasinItems } from '@clubmanager/types'; // Namespace

const item: MagasinItems.Item = { ... };
```

---

## ✅ Validation

### Valider un domaine généré :

```bash
npm run validate:domain <nom-domaine>
```

**Exemple :**
```bash
npm run validate:domain evenements
```

### Ce que la validation vérifie :

✅ **Fichiers obligatoires**
- Présence de `types.ts`, `validators.ts`, `index.ts`

✅ **Séparation Zod**
- Aucun schéma Zod dans `types.ts`
- Schémas Zod présents dans `validators.ts`

✅ **Consistance GraphQL**
- Si GraphQL : `typedefs.ts` ET `types.ts` présents
- Pattern C (standard)

✅ **Exports**
- `index.ts` exporte tous les fichiers
- Extensions `.js` dans imports

✅ **Conventions nommage**
- Domaine en kebab-case
- Fichiers correctement nommés

✅ **Documentation**
- JSDoc présent dans fichiers principaux

### Résultat validation :

```
============================================
VALIDATION DU DOMAINE: evenements
============================================

✓ Le domaine 'evenements' existe

Fichiers obligatoires:
  ✓ types.ts présent
  ✓ validators.ts présent
  ✓ index.ts présent
  ✓ README.md présent

Consistance GraphQL:
  ✓ Pattern C: typedefs + types présents

Séparation Zod:
  ✓ Aucun schéma Zod dans types.ts
  ✓ validators.ts contient des schémas Zod

Export dans domains/index.ts:
  ✓ Export présent dans domains/index.ts

============================================
RÉSUMÉ DE VALIDATION
============================================

✓ VALIDATION RÉUSSIE !
  Aucune erreur, aucun avertissement
```

---

## 🔧 Personnalisation

### Modifier les templates

Les templates sont dans `scripts/generate-domain.js` :

```javascript
const templates = {
  types: (domainName) => { ... },
  validators: (domainName) => { ... },
  graphqlTypedefs: (domainName) => { ... },
  // ...
};
```

Pour personnaliser :
1. Éditer `scripts/generate-domain.js`
2. Modifier la section `templates`
3. Regénérer avec vos nouveaux templates

### Ajouter des options

Dans `scripts/generate-domain.js`, section `parseArgs()` :

```javascript
const options = {
  withGraphql: args.includes('--with-graphql'),
  withService: args.includes('--with-service'),
  // Ajouter vos options ici
  withCustom: args.includes('--with-custom'),
};
```

---

## 🛠️ Workflow complet

### 1. Générer le domaine

```bash
npm run generate:domain evenements -- --with-graphql
```

### 2. Valider

```bash
npm run validate:domain evenements
```

### 3. Personnaliser

Éditer les fichiers générés selon vos besoins :
- Ajuster les types dans `types.ts`
- Ajouter des validations dans `validators.ts`
- Compléter le schéma GraphQL dans `graphql.typedefs.ts`

### 4. Mettre à jour `src/index.ts`

Si GraphQL, ajouter manuellement :

```typescript
// src/index.ts
import { evenementsTypeDefs } from "./domains/evenements/index.js";

export const allTypeDefs = [
  baseTypeDefs,
  authTypeDefs,
  // ... autres typedefs
  evenementsTypeDefs, // ← Ajouter ici
];
```

### 5. Compiler

```bash
npm run build
```

### 6. Tester

```bash
cd ../../apps/backend
npm run dev
```

Tester l'import :
```typescript
import { Evenement } from '@clubmanager/types';
```

---

## 🐛 Dépannage

### Erreur : "Le domaine existe déjà"

**Problème :** Vous essayez de créer un domaine qui existe déjà.

**Solution :**
```bash
# Supprimer le domaine existant
rm -rf src/domains/mon-domaine

# Regénérer
npm run generate:domain mon-domaine
```

---

### Erreur : "Le nom doit être en kebab-case"

**Problème :** Nom de domaine invalide (ex: `MonDomaine`, `mon_domaine`)

**Solution :** Utiliser kebab-case :
```bash
# ❌ Incorrect
npm run generate:domain MonDomaine
npm run generate:domain mon_domaine

# ✅ Correct
npm run generate:domain mon-domaine
```

---

### Avertissement : "Export manquant dans domains/index.ts"

**Problème :** Le générateur n'a pas pu ajouter l'export automatiquement.

**Solution :** Ajouter manuellement dans `src/domains/index.ts` :
```typescript
export * as MonDomaine from "./mon-domaine/index.js";
```

---

### Erreur de compilation TypeScript

**Problème :** Erreur lors de `npm run build`

**Solution :**

1. Vérifier les imports utilisent `.js` :
```typescript
// ❌ Incorrect
import { Type } from "./types";

// ✅ Correct
import { Type } from "./types.js";
```

2. Vérifier que tous les exports sont présents dans `index.ts`

3. Exécuter la validation :
```bash
npm run validate:domain mon-domaine
```

---

### GraphQL typeDefs non reconnus

**Problème :** Le typeDef n'apparaît pas dans GraphQL

**Solution :** Vérifier `src/index.ts` :

```typescript
// 1. Import
import { monDomaineTypeDefs } from "./domains/mon-domaine/index.js";

// 2. Ajouter dans allTypeDefs
export const allTypeDefs = [
  // ...
  monDomaineTypeDefs,
];
```

---

## 📊 Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| Générer domaine | `npm run generate:domain <nom>` | Crée un nouveau domaine |
| Valider domaine | `npm run validate:domain <nom>` | Valide la conformité |
| Audit structure | `npm run audit:structure` | Audit tous les domaines |
| Audit GraphQL | `npm run audit:graphql` | Audit patterns GraphQL |
| Build | `npm run build` | Compile TypeScript |

---

## 🎯 Checklist rapide

Après génération d'un domaine :

- [ ] ✅ Validation réussie : `npm run validate:domain <nom>`
- [ ] 📝 Types personnalisés dans `types.ts`
- [ ] 🔍 Validations Zod complétées dans `validators.ts`
- [ ] 📘 Schéma GraphQL ajusté (si `--with-graphql`)
- [ ] 📚 README mis à jour avec spécificités
- [ ] 🔗 Export ajouté dans `src/index.ts` (si GraphQL)
- [ ] ✅ Build réussi : `npm run build`
- [ ] 🧪 Import testé dans app

---

## 💡 Bonnes pratiques

### ✅ À FAIRE

1. **Toujours valider après génération**
   ```bash
   npm run generate:domain mon-domaine -- --with-graphql
   npm run validate:domain mon-domaine
   ```

2. **Utiliser --dry-run pour tester**
   ```bash
   npm run generate:domain test -- --dry-run --with-graphql
   ```

3. **Ajouter JSDoc pour types publics**
   ```typescript
   /**
    * Représente un événement dans le système
    * @example
    * const evt: Evenement = { id: 1, nom: "Concert" };
    */
   export interface Evenement { ... }
   ```

4. **Séparer types métier et DB si différents**
   ```bash
   npm run generate:domain utilisateurs -- --with-database
   ```

5. **Compiler après chaque modification**
   ```bash
   npm run build
   ```

### ❌ À ÉVITER

1. ❌ Ne pas mettre Zod dans `types.ts`
2. ❌ Ne pas créer domaine sans validators
3. ❌ Ne pas oublier `.js` dans imports
4. ❌ Ne pas dupliquer types entre domaines
5. ❌ Ne pas modifier directement `dist/`

---

## 🚀 Prochaines étapes

Après avoir maîtrisé le générateur :

1. **GraphQL Code Generator** (optionnel)
   - Générer automatiquement `graphql.types.ts` depuis `graphql.typedefs.ts`
   - Évite duplication manuelle

2. **Tests automatisés**
   - Ajouter tests unitaires pour validators
   - Smoke tests pour exports

3. **CI/CD**
   - Intégrer validation dans pipeline
   - Build automatique sur PR

4. **Documentation auto**
   - Générer doc depuis JSDoc
   - API reference automatique

---

## 📞 Support

**Questions ?** Voir :
- 📚 `DOMAIN_TEMPLATE.md` - Template détaillé
- 📘 `STRUCTURE.md` - Architecture globale
- 🔍 `README.md` - Documentation package

**Problème ?** Exécuter les audits :
```bash
npm run audit:structure
npm run audit:graphql
```

---

**Dernière mise à jour :** Février 2025  
**Version générateur :** 1.0.0  
**Mainteneur :** Équipe ClubManager