# Nouveaux Modules GraphQL - Documentation

## 📋 Vue d'ensemble

Ce document liste tous les modules GraphQL créés pour compléter l'architecture uniformisée du projet ClubManager.

## ✅ Modules Créés

### 1. **Paiements** ✅ TERMINÉ
**Chemin:** `api/src/graphql/paiements/`

**Fichiers:**
- `paiements.typeDefs.ts` - Schéma GraphQL complet
- `paiements.resolvers.ts` - Resolvers implémentés
- `index.ts` - Point d'entrée

**Fonctionnalités:**
- ✅ Gestion complète des paiements (CRUD)
- ✅ Gestion des échéances de paiement
- ✅ Gestion des commandes
- ✅ Statistiques de paiements
- ✅ Filtres et recherche avancée
- ✅ Intégration Stripe (payment_intent, charge)
- ✅ Historique et suivi des paiements

**Queries principales:**
- `paiements`, `paiement(id)`
- `paiementsAvecDetails`
- `paiementsUtilisateur(utilisateur_id)`
- `echeances`, `echeancesEnAttente`, `echeancesEnRetard`
- `statistiquesPaiements`, `statistiquesParMethode`

**Mutations principales:**
- `creerPaiement`, `mettreAJourPaiement`
- `marquerPaiementReussi`, `marquerPaiementEchoue`
- `annulerPaiement`, `rembourserPaiement`
- `creerEcheance`, `marquerEcheancePayee`
- `creerCommande`, `marquerCommandePayee`

---

### 2. **Messagerie** ✅ TERMINÉ
**Chemin:** `api/src/graphql/messagerie/`

**Fichiers:**
- `messagerie.typeDefs.ts` - Schéma GraphQL complet
- `messagerie.resolvers.ts` - Resolvers implémentés
- `index.ts` - Point d'entrée

**Fonctionnalités:**
- ✅ Gestion des types de messages
- ✅ Messages personnalisés utilisateurs
- ✅ Templates d'emails
- ✅ Historique des messages envoyés
- ✅ Statistiques de messagerie
- ✅ Envoi d'emails (simples, templates, bienvenue, confirmation)

**Queries principales:**
- `typesMessages`, `typeMessage(id)`
- `messagesPersonnalises`, `messagesUtilisateur(utilisateur_id)`
- `messagesRecus(userId)`, `messagesNonLus(userId)`
- `emailTemplates`, `emailTemplate(id)`
- `historiqueMessages`, `messagesParStatut(status)`
- `statistiquesMessagerie`

**Mutations principales:**
- `creerTypeMessage`, `mettreAJourTypeMessage`
- `creerMessagePersonnalise`, `envoyerMessagePersonnalise`
- `envoyerMessageTousUtilisateurs`
- `marquerMessageLu`, `marquerTousMessagesLus`
- `creerEmailTemplate`, `mettreAJourEmailTemplate`
- `envoyerEmailSimple`, `envoyerEmailAvecTemplate`
- `envoyerEmailBienvenue`, `envoyerEmailConfirmation`

---

### 3. **Utilisateurs** 🔄 EN COURS
**Chemin:** `api/src/graphql/utilisateurs/`

**Statut:** Dossier créé, fichiers à compléter

**Fonctionnalités prévues:**
- Gestion complète des utilisateurs (CRUD)
- Authentification et sessions
- Profils utilisateurs
- Recherche et filtres
- Gestion des statuts et rôles
- Historique et activités

**À implémenter:**
- `utilisateurs.typeDefs.ts`
- `utilisateurs.resolvers.ts`
- `index.ts`

---

### 4. **Magasin** 🔄 EN COURS
**Chemin:** `api/src/graphql/magasin/`

**Statut:** Dossier créé, fichiers à compléter

**Fonctionnalités prévues:**
- Gestion des articles (CRUD)
- Gestion des stocks par taille
- Gestion des catégories
- Gestion des commandes
- Recherche et filtres
- Statistiques de ventes

**À implémenter:**
- `magasin.typeDefs.ts`
- `magasin.resolvers.ts`
- `index.ts`

---

### 5. **Inscription** 🔄 EN COURS
**Chemin:** `api/src/graphql/inscription/`

**Statut:** Dossier créé, fichiers à compléter

**Fonctionnalités prévues:**
- Gestion des cours (ponctuels et récurrents)
- Gestion des inscriptions aux cours
- Gestion des présences
- Planning des cours
- Statistiques de présence
- Participants et professeurs

**À implémenter:**
- `inscription.typeDefs.ts`
- `inscription.resolvers.ts`
- `index.ts`

---

### 6. **Statistiques** 🔄 EN COURS
**Chemin:** `api/src/graphql/statistiques/`

**Statut:** Dossier créé, fichiers à compléter

**Fonctionnalités prévues:**
- Statistiques globales du club
- Statistiques par module
- Tableaux de bord
- Rapports et exports
- Métriques de performance

**À implémenter:**
- `statistiques.typeDefs.ts`
- `statistiques.resolvers.ts`
- `index.ts`

---

### 7. **Stock** 🔄 EN COURS
**Chemin:** `api/src/graphql/stock/`

**Statut:** Dossier créé, fichiers à compléter

**Fonctionnalités prévues:**
- Gestion des stocks articles
- Mouvements de stock
- Alertes de stock bas
- Historique des mouvements
- Inventaires

**À implémenter:**
- `stock.typeDefs.ts`
- `stock.resolvers.ts`
- `index.ts`

---

### 8. **Verification** 🔄 EN COURS
**Chemin:** `api/src/graphql/verification/`

**Statut:** Dossier créé, fichiers à compléter

**Fonctionnalités prévues:**
- Vérification des emails
- Vérification des tokens
- Gestion des tokens de validation
- Processus de vérification utilisateur

**À implémenter:**
- `verification.typeDefs.ts`
- `verification.resolvers.ts`
- `index.ts`

---

## 📊 État d'avancement

| Module | Dossier | TypeDefs | Resolvers | Index | Intégration | Statut |
|--------|---------|----------|-----------|-------|-------------|--------|
| **Paiements** | ✅ | ✅ | ✅ | ✅ | ⏳ | **TERMINÉ** |
| **Messagerie** | ✅ | ✅ | ✅ | ✅ | ⏳ | **TERMINÉ** |
| **Utilisateurs** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | EN COURS |
| **Magasin** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | EN COURS |
| **Inscription** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | EN COURS |
| **Statistiques** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | EN COURS |
| **Stock** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | EN COURS |
| **Verification** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | EN COURS |

**Légende:**
- ✅ Terminé
- ⏳ À faire
- 🔄 En cours

---

## 🔧 Prochaines étapes

### Phase 1: Compléter les modules restants ⏳

1. **Utilisateurs** (Priorité: HAUTE)
   - Créer `utilisateurs.typeDefs.ts`
   - Créer `utilisateurs.resolvers.ts`
   - Créer `index.ts`

2. **Magasin** (Priorité: HAUTE)
   - Créer `magasin.typeDefs.ts`
   - Créer `magasin.resolvers.ts`
   - Créer `index.ts`

3. **Inscription** (Priorité: HAUTE)
   - Créer `inscription.typeDefs.ts`
   - Créer `inscription.resolvers.ts`
   - Créer `index.ts`

4. **Statistiques** (Priorité: MOYENNE)
   - Créer `statistiques.typeDefs.ts`
   - Créer `statistiques.resolvers.ts`
   - Créer `index.ts`

5. **Stock** (Priorité: MOYENNE)
   - Créer `stock.typeDefs.ts`
   - Créer `stock.resolvers.ts`
   - Créer `index.ts`

6. **Verification** (Priorité: MOYENNE)
   - Créer `verification.typeDefs.ts`
   - Créer `verification.resolvers.ts`
   - Créer `index.ts`

### Phase 2: Intégration GraphQL ⏳

Pour chaque module terminé, intégrer dans le serveur GraphQL principal :

1. **Éditer `api/src/graphql/typeDefs.ts`**
   ```typescript
   import { paiementsTypeDefs } from './paiements/index.js';
   import { messagerieTypeDefs } from './messagerie/index.js';
   // ... autres imports
   
   export const typeDefs = [
     baseTypeDefs,
     paiementsTypeDefs,
     messagerieTypeDefs,
     // ... autres typeDefs
   ];
   ```

2. **Éditer `api/src/graphql/resolvers.ts`**
   ```typescript
   import { paiementsResolvers } from './paiements/index.js';
   import { messagerieResolvers } from './messagerie/index.js';
   // ... autres imports
   
   export const resolvers = mergeResolvers([
     baseResolvers,
     paiementsResolvers,
     messagerieResolvers,
     // ... autres resolvers
   ]);
   ```

3. **Redémarrer le serveur GraphQL**
   ```bash
   npm run dev
   # ou
   pnpm dev
   ```

### Phase 3: Tests et validation ⏳

1. **Tests unitaires**
   - Créer des tests pour chaque resolver
   - Tester les cas d'erreur
   - Tester les validations

2. **Tests d'intégration**
   - Tester les queries GraphQL
   - Tester les mutations GraphQL
   - Tester les relations entre modules

3. **Tests E2E**
   - Tester les scénarios complets
   - Tester la sécurité et l'authentification

### Phase 4: Documentation et sécurité ⏳

1. **Documentation**
   - Créer un README pour chaque module
   - Documenter les queries et mutations
   - Créer des exemples d'utilisation
   - Ajouter des diagrammes si nécessaire

2. **Sécurité**
   - Ajouter l'authentification sur les mutations sensibles
   - Ajouter l'autorisation (rôles et permissions)
   - Ajouter les guards GraphQL
   - Ajouter l'audit logging

3. **Performance**
   - Ajouter DataLoader pour éviter N+1
   - Ajouter du caching si nécessaire
   - Optimiser les requêtes SQL
   - Ajouter la pagination partout

---

## 📖 Architecture commune

Tous les modules suivent la même architecture:

```
api/src/graphql/[module]/
├── [module].typeDefs.ts    # Schéma GraphQL (types, queries, mutations)
├── [module].resolvers.ts   # Implémentation des resolvers
└── index.ts                # Point d'entrée (exports)
```

### Pattern des typeDefs

```typescript
export const [module]TypeDefs = `#graphql
  # Types principaux
  type [Entity] { ... }
  
  # Types de résultat
  type [Entity]Result { ... }
  
  # Inputs
  input Create[Entity]Input { ... }
  input Update[Entity]Input { ... }
  
  # Queries
  type Query {
    [entities]: [[Entity]!]!
    [entity](id: Int!): [Entity]
    ...
  }
  
  # Mutations
  type Mutation {
    creer[Entity](input: Create[Entity]Input!): ConfirmationResult!
    mettreAJour[Entity](id: Int!, input: Update[Entity]Input!): ConfirmationResult!
    ...
  }
`;
```

### Pattern des resolvers

```typescript
export const [module]Resolvers = {
  Query: {
    [entity]: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      const repository = get[Module]Repository();
      return await repository.[method](id);
    },
    ...
  },
  
  Mutation: {
    creer[Entity]: async (_: any, { input }: { input: Create[Entity]Input }, context: GraphQLContext) => {
      const repository = get[Module]Repository();
      return await repository.create[Entity](input);
    },
    ...
  },
};
```

---

## 🔗 Modules DB correspondants

Chaque module GraphQL correspond à un client DB:

| Module GraphQL | Client DB | Status |
|----------------|-----------|--------|
| `graphql/paiements` | `db/clients/paiements` | ✅ Repository |
| `graphql/messagerie` | `db/clients/messagerie` | ✅ Repository |
| `graphql/utilisateurs` | `db/clients/utilisateurs` | ⚠️ Legacy |
| `graphql/magasin` | `db/clients/magasin` | ✅ Repository |
| `graphql/inscription` | `db/clients/inscription` | ✅ Repository |
| `graphql/statistiques` | `db/clients/statistiques` | ⚠️ Legacy |
| `graphql/stock` | `db/clients/stock` | ⚠️ Legacy |
| `graphql/verification` | `db/clients/verification` | ⚠️ Legacy |

**Note:** Les modules marqués "Legacy" n'ont pas encore de repository modernisé et utilisent l'ancienne classe client.

---

## 📝 Notes importantes

### Conventions de nommage

1. **Fichiers**: `[module].typeDefs.ts`, `[module].resolvers.ts`
2. **Exports**: `[module]TypeDefs`, `[module]Resolvers`
3. **Types GraphQL**: PascalCase (ex: `Paiement`, `EcheancePaiement`)
4. **Queries**: camelCase (ex: `paiements`, `paiementParId`)
5. **Mutations**: verbe + Nom (ex: `creerPaiement`, `mettreAJourPaiement`)

### Types de retour standards

```graphql
type ConfirmationResult {
  isConfirm: Boolean!
  message: String!
  insertId: Int
}

type VerifyResultWithData {
  isFind: Boolean!
  message: String!
  data: [Entity!]
}
```

### Gestion des erreurs

- Les resolvers capturent les erreurs et les loguent
- Renvoyer des messages d'erreur clairs et sécurisés
- Ne jamais exposer les détails techniques sensibles

### Authentification & Autorisation

À implémenter dans Phase 4:

```typescript
// Exemple de guard
const requireAuth = (resolver) => {
  return (parent, args, context, info) => {
    if (!context.user) {
      throw new Error('Non authentifié');
    }
    return resolver(parent, args, context, info);
  };
};

// Utilisation
creerPaiement: requireAuth(async (...) => { ... })
```

---

## 🎯 Objectifs finaux

- ✅ **8 nouveaux modules GraphQL** créés
- ⏳ **Intégration complète** dans le serveur GraphQL
- ⏳ **Tests** unitaires et d'intégration
- ⏳ **Documentation** complète
- ⏳ **Sécurité** (auth, authz, audit)
- ⏳ **Performance** (DataLoader, caching, pagination)

---

## 🚀 Utilisation

### Démarrer le serveur GraphQL

```bash
cd api
npm run dev
# ou
pnpm dev
```

### Accéder à GraphQL Playground

```
http://localhost:4000/graphql
```

### Exemple de query

```graphql
query {
  paiements(pagination: { limit: 10, offset: 0 }) {
    id
    montant
    date_paiement
    statut
  }
}
```

### Exemple de mutation

```graphql
mutation {
  creerPaiement(input: {
    utilisateur_id: 1
    montant: 50.00
    methode_paiement: "carte"
  }) {
    success
    message
    paiementId
  }
}
```

---

## 📞 Support

Pour toute question ou problème:
1. Consulter la documentation du module concerné
2. Vérifier les logs du serveur GraphQL
3. Consulter le README principal du projet

---

**Date de création:** 2024
**Dernière mise à jour:** 2024
**Version:** 1.0.0