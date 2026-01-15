# Intégration du Module GraphQL Professeurs

## 📋 Résumé

Le module GraphQL pour les professeurs a été créé avec succès. Ce document explique comment l'intégrer au serveur GraphQL principal.

## 🎯 Fichiers Créés

### Structure du Module
```
api/src/graphql/professeurs/
├── professeurs.typeDefs.ts    # Définitions de types GraphQL (262 lignes)
├── professeurs.resolvers.ts   # Resolvers GraphQL (418 lignes)
├── index.ts                   # Point d'entrée (9 lignes)
├── README.md                  # Documentation complète (739 lignes)
└── INTEGRATION.md             # Ce fichier
```

## 🔧 Intégration au Serveur GraphQL

### Étape 1 : Importer le Module

Dans `api/src/graphql/typeDefs.ts`, ajouter :

```typescript
import { professeursTypeDefs } from './professeurs/index.js';
import { compteTypeDefs } from './compte/index.js';
// ... autres imports

export const typeDefs = [
  // Types de base existants
  baseTypeDefs,
  
  // Modules spécifiques
  compteTypeDefs,
  professeursTypeDefs,  // ✨ NOUVEAU
  // ... autres modules
];
```

### Étape 2 : Intégrer les Resolvers

Dans `api/src/graphql/resolvers.ts`, ajouter :

```typescript
import { professeursResolvers } from './professeurs/index.js';
import { compteResolvers } from './compte/index.js';
import { mergeResolvers } from '@graphql-tools/merge';
// ... autres imports

export const resolvers = mergeResolvers([
  compteResolvers,
  professeursResolvers,  // ✨ NOUVEAU
  // ... autres resolvers
]);
```

### Étape 3 : Vérifier le Serveur GraphQL

Dans `api/src/graphql/server.ts`, s'assurer que :

```typescript
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';
import { ApolloServer } from '@apollo/server';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // ... configuration
});
```

## 📊 API GraphQL Disponible

### Queries (10)

| Query | Description | Exemple |
|-------|-------------|---------|
| `professeurs` | Liste tous les professeurs | `{ professeurs { data { id nom prenom } } }` |
| `professeur(id)` | Récupère un professeur par ID | `{ professeur(id: 123) { nom prenom email } }` |
| `planningCoursProfesseur(id)` | Planning des cours | `{ planningCoursProfesseur(id: 123) { data { type_cours } } }` |
| `rechercherProfesseurs` | Recherche par terme | `{ rechercherProfesseurs(searchTerm: "dupont") { professeurs { nom } } }` |
| `compterProfesseurs` | Compte total | `{ compterProfesseurs }` |
| `estProfesseur(id)` | Vérifie le statut | `{ estProfesseur(id: 456) }` |
| `professeurACoursActifs(id)` | Vérifie cours actifs | `{ professeurACoursActifs(id: 123) }` |
| `compterCoursProfesseur(id)` | Compte les cours | `{ compterCoursProfesseur(id: 123) }` |
| `verifierDependancesProfesseur(id)` | Vérifie dépendances | `{ verifierDependancesProfesseur(id: 123) { coursCount } }` |
| `obtenirStatutUtilisateur(id)` | Obtient le statut | `{ obtenirStatutUtilisateur(id: 123) }` |

### Mutations (11)

| Mutation | Description | Exemple |
|----------|-------------|---------|
| `ajouterProfesseur` | Promeut un utilisateur | `mutation { ajouterProfesseur(input: {id: 456}) { isConfirm } }` |
| `ajouterProfesseursBatch` | Promeut plusieurs utilisateurs | `mutation { ajouterProfesseursBatch(input: {utilisateurs: [456, 789]}) { message } }` |
| `modifierStatutProfesseur` | Modifie le statut | `mutation { modifierStatutProfesseur(input: {id: 123, status_id: 5}) { isConfirm } }` |
| `retirerPromotionProfesseur` | Retire la promotion | `mutation { retirerPromotionProfesseur(id: 123) { isConfirm message } }` |
| `assignerProfesseurACours` | Assigne à un cours | `mutation { assignerProfesseurACours(coursId: 10, professeurId: 123) { isConfirm } }` |
| `retirerProfesseurDuCours` | Retire d'un cours | `mutation { retirerProfesseurDuCours(coursId: 10, professeurId: 123) { isConfirm } }` |
| `retirerProfesseurDeTousLesCours` | Retire de tous les cours | `mutation { retirerProfesseurDeTousLesCours(professeurId: 123) { message } }` |
| `mettreAJourUtilisateur` | Met à jour les infos complètes | `mutation { mettreAJourUtilisateur(id: 123, input: {...}) { isConfirm } }` |
| `mettreAJourEmail` | Met à jour l'email | `mutation { mettreAJourEmail(id: 123, email: "new@example.com") { isConfirm } }` |
| `mettreAJourGrade` | Met à jour le grade | `mutation { mettreAJourGrade(id: 123, gradeId: 6) { isConfirm } }` |

## 🧪 Tests

### Test GraphQL Playground

Une fois intégré, tester avec GraphQL Playground :

```graphql
# Test 1 : Lister les professeurs
query {
  professeurs {
    isFind
    message
    data {
      id
      nom
      prenom
      email
    }
  }
}

# Test 2 : Promouvoir un utilisateur
mutation {
  ajouterProfesseur(input: { id: 456 }) {
    isConfirm
    message
  }
}

# Test 3 : Récupérer le planning
query {
  planningCoursProfesseur(id: 123) {
    isFind
    data {
      type_cours
      jour_semaine
      heure_debut
      heure_fin
    }
  }
}
```

### Test avec curl

```bash
# Test Query
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ professeurs { isFind data { id nom prenom } } }"
  }'

# Test Mutation
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { ajouterProfesseur(input: { id: 456 }) { isConfirm message } }"
  }'
```

## 🔒 Sécurité (À Implémenter)

### Guards Recommandés

Le module ne contient pas encore de vérification de permissions. Il est **fortement recommandé** d'ajouter :

```typescript
// Exemple de guard à implémenter
const requireAuth = (resolver: any) => {
  return (parent: any, args: any, context: GraphQLContext, info: any) => {
    if (!context.user) {
      throw new Error('Non authentifié');
    }
    return resolver(parent, args, context, info);
  };
};

const requireAdmin = (resolver: any) => {
  return (parent: any, args: any, context: GraphQLContext, info: any) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Droits administrateur requis');
    }
    return resolver(parent, args, context, info);
  };
};

// Utilisation dans les resolvers
export const professeursResolvers = {
  Query: {
    professeurs: requireAuth(async (...) => { ... }),
    professeur: requireAuth(async (...) => { ... }),
  },
  Mutation: {
    ajouterProfesseur: requireAdmin(async (...) => { ... }),
    retirerPromotionProfesseur: requireAdmin(async (...) => { ... }),
  },
};
```

### Audit Log

Ajouter un système d'audit pour les opérations sensibles :

```typescript
const auditLog = (operation: string, userId: number, data: any) => {
  console.log(`[AUDIT] ${operation} par user ${userId}:`, data);
  // Sauvegarder dans la base de données
};

// Dans les mutations
ajouterProfesseur: async (_, { input }, context) => {
  auditLog('PROMOTION_PROFESSEUR', context.user.id, input);
  // ... logique
};
```

## 📈 Monitoring

### Métriques à Surveiller

1. **Nombre de requêtes par endpoint**
2. **Temps de réponse moyen**
3. **Taux d'erreur**
4. **Opérations de promotion/rétrogradation**

### Exemple avec Apollo Studio

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginUsageReporting({
      sendVariableValues: { all: true },
    }),
  ],
});
```

## 🎯 Checklist d'Intégration

- [ ] **Étape 1** : Importer `professeursTypeDefs` dans `typeDefs.ts`
- [ ] **Étape 2** : Importer `professeursResolvers` dans `resolvers.ts`
- [ ] **Étape 3** : Redémarrer le serveur GraphQL
- [ ] **Étape 4** : Tester dans GraphQL Playground
- [ ] **Étape 5** : Tester toutes les queries (10)
- [ ] **Étape 6** : Tester toutes les mutations (11)
- [ ] **Étape 7** : Vérifier la gestion d'erreurs
- [ ] **Étape 8** : Ajouter les guards d'authentification
- [ ] **Étape 9** : Ajouter les guards d'autorisation
- [ ] **Étape 10** : Implémenter l'audit log
- [ ] **Étape 11** : Documenter l'API (Swagger/OpenAPI si applicable)
- [ ] **Étape 12** : Écrire les tests d'intégration
- [ ] **Étape 13** : Déployer en staging
- [ ] **Étape 14** : Valider avec l'équipe
- [ ] **Étape 15** : Déployer en production

## 📚 Documentation

### Liens Utiles

- **README du module GraphQL** : `./README.md`
- **Documentation du module DB** : `../../db/clients/professeurs/README.md`
- **Architecture du module** : `../../db/clients/professeurs/docs/ARCHITECTURE.md`
- **Guide de migration** : `../../db/clients/professeurs/docs/MIGRATION.md`

### Exemples Frontend

#### React avec Apollo Client

```typescript
import { gql, useQuery, useMutation } from '@apollo/client';

// Query
const GET_PROFESSEURS = gql`
  query {
    professeurs {
      isFind
      data {
        id
        nom
        prenom
        email
      }
    }
  }
`;

function ListeProfesseurs() {
  const { data, loading, error } = useQuery(GET_PROFESSEURS);
  
  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur: {error.message}</p>;
  
  return (
    <ul>
      {data.professeurs.data.map(prof => (
        <li key={prof.id}>{prof.prenom} {prof.nom}</li>
      ))}
    </ul>
  );
}

// Mutation
const PROMOUVOIR_PROFESSEUR = gql`
  mutation PromouvoirProfesseur($id: Int!) {
    ajouterProfesseur(input: { id: $id }) {
      isConfirm
      message
    }
  }
`;

function PromouvoirButton({ userId }) {
  const [promouvoir, { loading }] = useMutation(PROMOUVOIR_PROFESSEUR);
  
  const handleClick = async () => {
    try {
      const { data } = await promouvoir({ variables: { id: userId } });
      if (data.ajouterProfesseur.isConfirm) {
        alert('Promotion réussie!');
      } else {
        alert('Erreur: ' + data.ajouterProfesseur.message);
      }
    } catch (error) {
      alert('Erreur technique');
    }
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'En cours...' : 'Promouvoir'}
    </button>
  );
}
```

#### Vue 3 avec Apollo

```vue
<template>
  <div>
    <div v-if="loading">Chargement...</div>
    <div v-else-if="error">Erreur: {{ error.message }}</div>
    <ul v-else>
      <li v-for="prof in professeurs.data" :key="prof.id">
        {{ prof.prenom }} {{ prof.nom }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const GET_PROFESSEURS = gql`
  query {
    professeurs {
      isFind
      data {
        id
        nom
        prenom
      }
    }
  }
`;

const { result, loading, error } = useQuery(GET_PROFESSEURS);
const professeurs = computed(() => result.value?.professeurs || { data: [] });
</script>
```

## 🚀 Prochaines Étapes

### Court Terme
1. ✅ Module GraphQL créé
2. ⏳ Intégration au serveur GraphQL
3. ⏳ Tests d'intégration
4. ⏳ Ajout des guards de sécurité
5. ⏳ Documentation API complète

### Moyen Terme
1. ⏳ Subscriptions GraphQL (temps réel)
2. ⏳ DataLoader pour optimiser les requêtes N+1
3. ⏳ Cache GraphQL
4. ⏳ Pagination cursor-based
5. ⏳ Filtres avancés

### Long Terme
1. ⏳ GraphQL Federation (si microservices)
2. ⏳ Persisted Queries
3. ⏳ Rate limiting par utilisateur
4. ⏳ Monitoring avancé (Datadog, New Relic)

## ✅ Statut

- **Module GraphQL** : ✅ Créé et documenté
- **Intégration** : ⏳ En attente
- **Tests** : ⏳ À faire
- **Sécurité** : ⏳ À implémenter
- **Production** : ⏳ Pas encore déployé

---

**Date de création** : 2024-01-11  
**Version** : 2.0.0  
**Auteur** : Équipe de développement ClubManager  
**Statut** : ✅ Prêt pour intégration

---

> 💡 **Note** : Ce module suit exactement l'architecture du module GraphQL `compte`. Il est 100% conforme aux standards du projet.