# 📦 Template de Domaine - packages/types

Ce document définit la structure standard pour créer un nouveau domaine dans `packages/types`.

---

## 📁 Structure Standard d'un Domaine

```
domains/<nom-domaine>/
├── index.ts                    # ✅ OBLIGATOIRE - Point d'entrée du domaine
├── types.ts                    # ✅ OBLIGATOIRE - Types TypeScript métier
├── validators.ts               # ✅ OBLIGATOIRE - Schémas de validation Zod
├── graphql.typedefs.ts         # ⚠️  CONDITIONNEL - Schémas GraphQL (strings)
├── graphql.types.ts            # ⚠️  CONDITIONNEL - Types TypeScript pour GraphQL
├── service.ts                  # 🔵 OPTIONNEL - Types de service
├── database.types.ts           # 🔵 OPTIONNEL - Types spécifiques DB (snake_case)
└── <sous-domaine>/            # 🔵 OPTIONNEL - Sous-domaines si complexité élevée
    ├── index.ts
    ├── types.ts
    └── validators.ts
```

---

## 📝 Contenu de Chaque Fichier

### 1. `index.ts` - Point d'Entrée

```typescript
/**
 * <NomDomaine> Domain
 * Description du domaine
 */

// Base types
export * from "./types.js";

// Validators
export * from "./validators.js";

// Service types (si présent)
export * from "./service.js";

// Database types (si présent)
export * from "./database.types.js";

// Subdomains (si présents)
export * as SousDomaine from "./sous-domaine/index.js";

// GraphQL typedefs
export { nomDomaineTypeDefs } from "./graphql.typedefs.js";
```

**Règles** :
- ✅ Toujours exporter types.ts en premier
- ✅ Toujours exporter validators.ts en second
- ✅ Sous-domaines avec namespace export (`export * as`)
- ✅ GraphQL typedefs exportés nommément

---

### 2. `types.ts` - Types Métier

```typescript
/**
 * Types pour le domaine <NomDomaine>
 * 
 * Conventions:
 * - PascalCase pour les interfaces/types
 * - camelCase pour les propriétés
 * - Commentaires JSDoc obligatoires pour types principaux
 * - Pas de schémas Zod ici (dans validators.ts)
 */

/**
 * Représente une entité principale du domaine
 * 
 * @example
 * const entity: Entity = {
 *   id: 1,
 *   name: "Example",
 *   status: "active"
 * };
 */
export interface Entity {
  /** Identifiant unique */
  id: number;
  
  /** Nom de l'entité */
  name: string;
  
  /** Statut actuel */
  status: EntityStatus;
  
  /** Date de création */
  createdAt: Date;
  
  /** Date de dernière modification */
  updatedAt?: Date;
}

/**
 * Statuts possibles pour une entité
 */
export type EntityStatus = 'active' | 'inactive' | 'pending';

/**
 * Données pour créer une nouvelle entité
 */
export interface CreateEntityInput {
  name: string;
  status?: EntityStatus;
}

/**
 * Données pour mettre à jour une entité
 */
export interface UpdateEntityInput {
  name?: string;
  status?: EntityStatus;
}

/**
 * Résultat d'une opération sur une entité
 */
export interface EntityResult {
  success: boolean;
  entity?: Entity;
  error?: string;
}

/**
 * Filtre de recherche pour les entités
 */
export interface EntityFilter {
  status?: EntityStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Liste paginée d'entités
 */
export interface EntityList {
  entities: Entity[];
  total: number;
  hasMore: boolean;
}
```

**Règles** :
- ✅ JSDoc sur tous les types publics
- ✅ @example pour types complexes
- ✅ Pas de valeurs par défaut
- ✅ Pas de logique métier
- ❌ JAMAIS de schémas Zod ici

---

### 3. `validators.ts` - Schémas Zod

```typescript
/**
 * Schémas de validation Zod pour <NomDomaine>
 * 
 * Conventions:
 * - Nom des schémas en camelCase + "Schema" : createEntitySchema
 * - Types inférés en PascalCase : CreateEntityData
 * - Validation stricte avec messages d'erreur clairs
 */

import { z } from "zod";

/**
 * Schéma de validation pour créer une entité
 */
export const createEntitySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .trim(),
  
  status: z
    .enum(["active", "inactive", "pending"])
    .optional()
    .default("pending"),
});

/**
 * Type inféré depuis le schéma de création
 */
export type CreateEntityData = z.infer<typeof createEntitySchema>;

/**
 * Schéma de validation pour mettre à jour une entité
 */
export const updateEntitySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .trim()
    .optional(),
  
  status: z
    .enum(["active", "inactive", "pending"])
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être fourni pour la mise à jour" }
);

/**
 * Type inféré depuis le schéma de mise à jour
 */
export type UpdateEntityData = z.infer<typeof updateEntitySchema>;

/**
 * Schéma pour valider l'ID d'une entité
 */
export const entityIdSchema = z
  .string()
  .refine((val) => /^\d+$/.test(val), {
    message: "ID doit être un nombre positif",
  })
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, {
    message: "ID doit être supérieur à 0",
  });

/**
 * Schéma pour les filtres de recherche
 */
export const entityFilterSchema = z.object({
  status: z.enum(["active", "inactive", "pending"]).optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Type inféré pour les filtres
 */
export type EntityFilterData = z.infer<typeof entityFilterSchema>;

/**
 * Fonction helper pour valider une entité
 */
export function validateEntity(data: unknown): CreateEntityData {
  return createEntitySchema.parse(data);
}

/**
 * Fonction helper pour valider de manière sûre
 */
export function safeValidateEntity(data: unknown) {
  return createEntitySchema.safeParse(data);
}
```

**Règles** :
- ✅ Tous les schémas Zod ici
- ✅ Messages d'erreur en français et explicites
- ✅ Types inférés avec z.infer<>
- ✅ Fonctions helper de validation
- ✅ Valeurs par défaut dans les schémas

---

### 4. `graphql.typedefs.ts` - Schémas GraphQL

```typescript
/**
 * Schémas GraphQL pour <NomDomaine>
 * Définition des types, queries et mutations
 */

import { gql } from "graphql-tag";

export const nomDomaineTypeDefs = gql`
  # ============================================
  # TYPES
  # ============================================

  """
  Entité principale du domaine
  """
  type Entity {
    """Identifiant unique"""
    id: Int!
    
    """Nom de l'entité"""
    name: String!
    
    """Statut actuel"""
    status: EntityStatus!
    
    """Date de création"""
    createdAt: DateTime!
    
    """Date de dernière modification"""
    updatedAt: DateTime
  }

  """
  Statuts possibles pour une entité
  """
  enum EntityStatus {
    ACTIVE
    INACTIVE
    PENDING
  }

  """
  Liste paginée d'entités
  """
  type EntityList {
    entities: [Entity!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Résultat d'une opération sur une entité
  """
  type EntityResult {
    success: Boolean!
    entity: Entity
    error: String
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Données pour créer une nouvelle entité
  """
  input CreateEntityInput {
    name: String!
    status: EntityStatus
  }

  """
  Données pour mettre à jour une entité
  """
  input UpdateEntityInput {
    name: String
    status: EntityStatus
  }

  """
  Filtre de recherche pour les entités
  """
  input EntityFilter {
    status: EntityStatus
    search: String
    limit: Int
    offset: Int
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """Récupérer une entité par son ID"""
    getEntity(id: Int!): Entity
    
    """Récupérer toutes les entités avec filtres"""
    getEntities(filter: EntityFilter): EntityList!
    
    """Rechercher des entités"""
    searchEntities(search: String!): [Entity!]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """Créer une nouvelle entité"""
    createEntity(input: CreateEntityInput!): EntityResult!
    
    """Mettre à jour une entité"""
    updateEntity(id: Int!, input: UpdateEntityInput!): EntityResult!
    
    """Supprimer une entité"""
    deleteEntity(id: Int!): EntityResult!
  }

  # ============================================
  # SUBSCRIPTIONS (optionnel)
  # ============================================

  extend type Subscription {
    """S'abonner aux changements d'une entité"""
    entityUpdated(id: Int!): Entity!
    
    """S'abonner aux nouvelles entités"""
    entityCreated: Entity!
  }
`;
```

**Règles** :
- ✅ Utiliser gql tag de graphql-tag
- ✅ Commentaires GraphQL avec """
- ✅ Section séparées : TYPES, INPUTS, QUERIES, MUTATIONS, SUBSCRIPTIONS
- ✅ extend type Query/Mutation pour éviter conflits
- ✅ Nommage cohérent avec types.ts

---

### 5. `graphql.types.ts` - Types TypeScript pour GraphQL (Optionnel)

```typescript
/**
 * Types TypeScript correspondant aux schémas GraphQL
 * Utilisés par les resolvers
 * 
 * Note: Si possible, utiliser GraphQL Code Generator pour générer automatiquement
 */

/**
 * Contexte GraphQL pour <NomDomaine>
 */
export interface NomDomaineContext {
  prisma: any;
  userId?: number;
  userRole?: string;
  req?: any;
  res?: any;
}

/**
 * Args pour getEntity query
 */
export interface GetEntityArgs {
  id: number;
}

/**
 * Args pour getEntities query
 */
export interface GetEntitiesArgs {
  filter?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Args pour createEntity mutation
 */
export interface CreateEntityArgs {
  input: {
    name: string;
    status?: string;
  };
}

/**
 * Args pour updateEntity mutation
 */
export interface UpdateEntityArgs {
  id: number;
  input: {
    name?: string;
    status?: string;
  };
}

/**
 * Args pour deleteEntity mutation
 */
export interface DeleteEntityArgs {
  id: number;
}

/**
 * Parent type pour resolvers
 */
export interface EntityParent {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

**Règles** :
- ✅ Seulement si resolvers ont besoin de types spécifiques
- ✅ Préférer GraphQL Code Generator
- ✅ Types Context, Args, Parent

---

### 6. `service.ts` - Types de Service (Optionnel)

```typescript
/**
 * Types pour les services métier de <NomDomaine>
 * Interfaces et types pour la couche service
 */

import type { Entity, CreateEntityInput, UpdateEntityInput } from "./types.js";

/**
 * Interface du service de gestion des entités
 */
export interface EntityService {
  /**
   * Créer une nouvelle entité
   */
  create(input: CreateEntityInput): Promise<Entity>;
  
  /**
   * Récupérer une entité par son ID
   */
  findById(id: number): Promise<Entity | null>;
  
  /**
   * Mettre à jour une entité
   */
  update(id: number, input: UpdateEntityInput): Promise<Entity>;
  
  /**
   * Supprimer une entité
   */
  delete(id: number): Promise<boolean>;
  
  /**
   * Lister toutes les entités
   */
  findAll(): Promise<Entity[]>;
}

/**
 * Options de configuration pour le service
 */
export interface EntityServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
}

/**
 * Événements émis par le service
 */
export type EntityServiceEvent = 
  | { type: 'created'; entity: Entity }
  | { type: 'updated'; entity: Entity }
  | { type: 'deleted'; id: number };
```

**Règles** :
- ✅ Seulement si logique métier complexe
- ✅ Interfaces de service
- ✅ Types d'événements

---

### 7. `database.types.ts` - Types Database (Optionnel)

```typescript
/**
 * Types pour la base de données (snake_case Prisma)
 * Correspond aux tables et colonnes de la DB
 */

/**
 * Entité dans la base de données (snake_case)
 */
export interface EntityDB {
  id: number;
  name: string;
  status: string;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}

/**
 * Relation avec d'autres tables
 */
export interface EntityWithRelationsDB extends EntityDB {
  user: {
    id: number;
    email: string;
  };
  category: {
    id: number;
    name: string;
  } | null;
}

/**
 * Type pour création dans la DB
 */
export interface CreateEntityDB {
  name: string;
  status: string;
  user_id: number;
  category_id?: number;
}
```

**Règles** :
- ✅ snake_case pour correspondre à Prisma
- ✅ Suffixe DB pour distinction
- ✅ Seulement si types DB ≠ types métier

---

## 🎯 Conventions de Nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Interface | PascalCase | `Entity`, `EntityResult` |
| Type alias | PascalCase | `EntityStatus`, `EntityFilter` |
| Schéma Zod | camelCase + Schema | `createEntitySchema` |
| Type inféré Zod | PascalCase + Data | `CreateEntityData` |
| GraphQL typedef | camelCase + TypeDefs | `nomDomaineTypeDefs` |
| Fonction | camelCase | `validateEntity` |
| Constante | UPPER_SNAKE_CASE | `MAX_ENTITIES` |
| Enum | PascalCase | `EntityStatus` |

---

## ✅ Checklist Création Domaine

- [ ] Créer le dossier `domains/<nom>/`
- [ ] Créer `types.ts` avec types métier + JSDoc
- [ ] Créer `validators.ts` avec schémas Zod
- [ ] Créer `graphql.typedefs.ts` si besoin GraphQL
- [ ] Créer `graphql.types.ts` si resolvers complexes
- [ ] Créer `service.ts` si logique métier complexe
- [ ] Créer `database.types.ts` si DB différent métier
- [ ] Créer `index.ts` avec exports propres
- [ ] Ajouter export namespace dans `domains/index.ts`
- [ ] Ajouter typeDef dans `src/index.ts`
- [ ] Compiler avec `npm run build`
- [ ] Tester l'import : `import { NomDomaine } from '@clubmanager/types'`

---

## 📚 Exemples Complets

Voir les domaines existants bien structurés :
- ✅ `domains/auth/` - Structure complète
- ✅ `domains/utilisateurs/` - Avec database.types.ts
- ✅ `domains/magasin/` - Avec sous-domaine stock/
- ✅ `domains/paiements/` - Avec sous-domaines echeances/ et confirmation/

---

## 🚫 Anti-Patterns à Éviter

❌ **NE PAS** :
- Mettre des schémas Zod dans `types.ts`
- Mélanger camelCase et snake_case dans même fichier
- Exporter `export *` sans documenter
- Oublier les JSDoc sur types publics
- Créer des types database dans `types.ts`
- Avoir des dépendances circulaires
- Utiliser `any` sans justification

✅ **TOUJOURS** :
- Séparer types métier et validation
- Documenter les types principaux
- Utiliser z.infer<> pour types Zod
- Préfixer types DB avec DB
- Exporter via index.ts
- Compiler après modifications

---

**Dernière mise à jour** : Février 2025  
**Mainteneur** : Équipe ClubManager