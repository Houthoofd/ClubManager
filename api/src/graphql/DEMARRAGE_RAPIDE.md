# Guide de Démarrage Rapide - Modules GraphQL

## 🎯 Objectif

Vous devez compléter **6 modules GraphQL manquants** pour uniformiser l'architecture du projet ClubManager.

---

## ✅ État Actuel

### Modules TERMINÉS (2/8)
- ✅ **Paiements** - 100% (typeDefs + resolvers)
- ✅ **Messagerie** - 100% (typeDefs + resolvers)

### Modules À FAIRE (6/8)
- ⏳ **Utilisateurs** - Priorité HAUTE
- ⏳ **Magasin** - Priorité HAUTE
- ⏳ **Inscription** - Priorité HAUTE
- ⏳ **Statistiques** - Priorité MOYENNE
- ⏳ **Stock** - Priorité MOYENNE
- ⏳ **Verification** - Priorité MOYENNE

---

## 🚀 Comment Procéder

### Pour CHAQUE module restant:

#### 1. Analyser le client DB
```bash
# Ouvrir et lire le fichier du client DB
api/src/db/clients/[module]/[module].ts
# ou
api/src/db/clients/[module]/[module].repository.ts
```

#### 2. Créer le fichier TypeDefs
```typescript
// api/src/graphql/[module]/[module].typeDefs.ts

export const [module]TypeDefs = `#graphql
  type [Entity] {
    id: Int!
    # ... autres champs
  }
  
  type Query {
    [entities]: [[Entity]!]!
    [entity](id: Int!): [Entity]
  }
  
  type Mutation {
    creer[Entity](input: Create[Entity]Input!): ConfirmationResult!
  }
`;
```

#### 3. Créer le fichier Resolvers
```typescript
// api/src/graphql/[module]/[module].resolvers.ts

import { get[Module]Repository } from '../../db/clients/[module]/index.js';

export const [module]Resolvers = {
  Query: {
    [entities]: async () => {
      const repo = get[Module]Repository();
      return await repo.getAll[Entities]();
    },
  },
  Mutation: {
    creer[Entity]: async (_, { input }) => {
      const repo = get[Module]Repository();
      return await repo.create[Entity](input);
    },
  },
};
```

#### 4. Vérifier l'index.ts
```typescript
// api/src/graphql/[module]/index.ts
// Devrait déjà exister et contenir:

export { [module]TypeDefs } from './[module].typeDefs.js';
export { [module]Resolvers } from './[module].resolvers.js';
```

---

## 📝 Template Rapide

### Copier ces 2 fichiers pour chaque module:

**Fichier 1: `[module].typeDefs.ts`**
```typescript
export const [module]TypeDefs = `#graphql
  # Définir vos types ici
  type [Entity] {
    id: Int!
    # champs...
  }
  
  # Inputs
  input Create[Entity]Input {
    # champs...
  }
  
  # Queries
  type Query {
    [entities]: [[Entity]!]!
    [entity](id: Int!): [Entity]
  }
  
  # Mutations
  type Mutation {
    creer[Entity](input: Create[Entity]Input!): ConfirmationResult!
  }
`;
```

**Fichier 2: `[module].resolvers.ts`**
```typescript
import { get[Module]Repository } from '../../db/clients/[module]/index.js';

interface GraphQLContext {
  user?: { id: number; role: string; };
}

export const [module]Resolvers = {
  Query: {
    [entities]: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repo = get[Module]Repository();
        return await repo.getAll[Entities]();
      } catch (error) {
        console.error('Erreur:', error);
        throw new Error('Erreur lors de la récupération');
      }
    },
  },
  
  Mutation: {
    creer[Entity]: async (_: any, { input }: any, context: GraphQLContext) => {
      try {
        const repo = get[Module]Repository();
        const result = await repo.create[Entity](input);
        return {
          isConfirm: true,
          message: 'Créé avec succès',
          insertId: result,
        };
      } catch (error) {
        console.error('Erreur:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la création',
        };
      }
    },
  },
};
```

---

## 🎯 Plan d'Action Rapide

### Jour 1 (6-8h)
1. **Utilisateurs** (2-3h)
   - Lire `api/src/db/clients/utilisateurs/utilisateurs.ts`
   - Créer `utilisateurs.typeDefs.ts`
   - Créer `utilisateurs.resolvers.ts`

2. **Magasin** (2-3h)
   - Lire `api/src/db/clients/magasin/magasin.repository.ts`
   - Créer `magasin.typeDefs.ts`
   - Créer `magasin.resolvers.ts`

3. **Inscription** (2-3h)
   - Lire `api/src/db/clients/inscription/inscription.repository.ts`
   - Créer `inscription.typeDefs.ts`
   - Créer `inscription.resolvers.ts`

### Jour 2 (4-6h)
4. **Statistiques** (1-2h)
5. **Stock** (1-2h)
6. **Verification** (1-2h)

### Jour 3 (2-3h)
7. **Intégration** (1h) - Ajouter tous les modules dans `typeDefs.ts` et `resolvers.ts`
8. **Tests** (1-2h) - Tester dans GraphQL Playground

---

## 🔧 Intégration Finale

### Une fois TOUS les modules terminés:

**1. Éditer `api/src/graphql/typeDefs.ts`**
```typescript
import { paiementsTypeDefs } from './paiements/index.js';
import { messagerieTypeDefs } from './messagerie/index.js';
import { utilisateursTypeDefs } from './utilisateurs/index.js';
import { magasinTypeDefs } from './magasin/index.js';
import { inscriptionTypeDefs } from './inscription/index.js';
import { statistiquesTypeDefs } from './statistiques/index.js';
import { stockTypeDefs } from './stock/index.js';
import { verificationTypeDefs } from './verification/index.js';

export const typeDefs = [
  baseTypeDefs,
  paiementsTypeDefs,
  messagerieTypeDefs,
  utilisateursTypeDefs,
  magasinTypeDefs,
  inscriptionTypeDefs,
  statistiquesTypeDefs,
  stockTypeDefs,
  verificationTypeDefs,
];
```

**2. Éditer `api/src/graphql/resolvers.ts`**
```typescript
import { paiementsResolvers } from './paiements/index.js';
import { messagerieResolvers } from './messagerie/index.js';
import { utilisateursResolvers } from './utilisateurs/index.js';
import { magasinResolvers } from './magasin/index.js';
import { inscriptionResolvers } from './inscription/index.js';
import { statistiquesResolvers } from './statistiques/index.js';
import { stockResolvers } from './stock/index.js';
import { verificationResolvers } from './verification/index.js';

export const resolvers = mergeResolvers([
  baseResolvers,
  paiementsResolvers,
  messagerieResolvers,
  utilisateursResolvers,
  magasinResolvers,
  inscriptionResolvers,
  statistiquesResolvers,
  stockResolvers,
  verificationResolvers,
]);
```

**3. Redémarrer le serveur**
```bash
cd api
npm run dev
```

**4. Tester**
```
http://localhost:4000/graphql
```

---

## 📚 Ressources

### Documentation
- 📖 `README_NEW_MODULES.md` - Documentation complète
- 📊 `COMPLETION_STATUS.md` - État d'avancement
- 🎯 `ACTION_PLAN.md` - Plan détaillé
- ✅ `TRAVAIL_EFFECTUE.md` - Résumé du travail

### Exemples de référence
- `api/src/graphql/paiements/` - Module complet (payments)
- `api/src/graphql/messagerie/` - Module complet (messaging)
- `api/src/graphql/professeurs/` - Module existant

### Clients DB
- `api/src/db/clients/[module]/` - Voir les méthodes disponibles

---

## ⚡ Raccourcis

### Commandes utiles
```bash
# Démarrer le serveur
npm run dev

# Compiler
npm run build

# Tests
npm test
```

### URLs
- GraphQL Playground: http://localhost:4000/graphql
- Documentation API: http://localhost:4000/docs

---

## ✅ Checklist

Pour CHAQUE module:
- [ ] Analyser le client DB
- [ ] Créer `[module].typeDefs.ts`
- [ ] Créer `[module].resolvers.ts`
- [ ] Vérifier `index.ts`
- [ ] Tester dans Playground

Après TOUS les modules:
- [ ] Intégrer dans `typeDefs.ts`
- [ ] Intégrer dans `resolvers.ts`
- [ ] Redémarrer le serveur
- [ ] Tester toutes les queries
- [ ] Tester toutes les mutations

---

## 🎉 C'est parti !

**Ordre recommandé:**
1. Utilisateurs
2. Magasin
3. Inscription
4. Statistiques
5. Stock
6. Verification

**Temps total estimé:** 12-20 heures

**Bonne chance ! 🚀**