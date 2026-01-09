# API GraphQL ClubManager - Documentation Générale

Documentation complète de l'API GraphQL pour le système ClubManager.

## 📚 Vue d'Ensemble

L'API GraphQL de ClubManager offre une interface moderne, flexible et performante pour accéder aux données du système. Elle remplace progressivement les endpoints REST traditionnels.

**Endpoint** : `http://localhost:5000/graphql`  
**Playground** : Disponible en développement à la même URL

## 🎯 Pourquoi GraphQL ?

### Avantages vs REST

| Critère | REST | GraphQL |
|---------|------|---------|
| **Endpoints** | Multiple (`/users`, `/courses`, etc.) | Un seul `/graphql` |
| **Over-fetching** | ❌ Récupère tous les champs | ✅ Uniquement ce qui est demandé |
| **Under-fetching** | ❌ Nécessite plusieurs requêtes | ✅ Une requête pour tout |
| **Versionning** | `/v1`, `/v2`... | ✅ Évolution sans version |
| **Documentation** | Manuelle | ✅ Auto-générée |
| **Type Safety** | ❌ Dépend du client | ✅ Natif |
| **Flexibilité** | ❌ Structure fixe | ✅ Requêtes sur-mesure |

### Exemple Concret

**REST** (3 requêtes) :
```http
GET /api/users/123
GET /api/users/123/alertes
GET /api/users/123/courses
```

**GraphQL** (1 requête) :
```graphql
query {
  user(id: 123) {
    firstName
    email
    alertes { id priorite }
    courses { nom dateDebut }
  }
}
```

## 📦 Modules Disponibles

### ✅ Auth - Authentification
Module complet pour la gestion des comptes et de la sécurité.

**Fichiers** :
- `graphql/auth/auth.typeDefs.ts` - Types GraphQL
- `graphql/auth/auth.resolvers.ts` - Logique métier
- `graphql/auth/README.md` - Documentation détaillée

**Fonctionnalités** :
- ✅ Connexion / Déconnexion
- ✅ Création de compte
- ✅ Modification de mot de passe
- ✅ Récupération de mot de passe
- ✅ Validation en temps réel
- ✅ Statistiques de sécurité

**Queries** :
- `me` - Utilisateur courant
- `emailExists` - Vérifier disponibilité email
- `validatePassword` - Valider force mot de passe
- `securityInfo` - Infos sécurité utilisateur
- `securityStats` - Statistiques tentatives

**Mutations** :
- `login` - Authentification
- `logout` - Déconnexion
- `createAccount` - Créer compte
- `changePassword` - Modifier mot de passe
- `requestPasswordReset` - Demander récupération
- `resetPassword` - Réinitialiser mot de passe
- `refreshToken` - Rafraîchir token

📖 [Documentation complète Auth](./auth/README.md)

---

### ✅ Alertes - Gestion des Alertes
Système de détection et gestion des alertes utilisateurs.

**Fichiers** :
- `graphql/alertes/alertes.typeDefs.ts` - Types GraphQL
- `graphql/alertes/alertes.resolvers.ts` - Logique métier
- `graphql/alertes/README.md` - Documentation détaillée

**Fonctionnalités** :
- ✅ Dashboard des alertes
- ✅ Détection automatique
- ✅ Résolution / Ignorement
- ✅ Statistiques globales
- ✅ Filtres et pagination
- ✅ Alertes critiques en priorité

**Queries** :
- `alertesDashboard` - Vue d'ensemble
- `alertesActives` - Liste avec filtres
- `alertesUtilisateur` - Alertes par utilisateur
- `alerteDetails` - Détails complets
- `statistiquesAlertes` - Statistiques globales
- `alertesCritiques` - Alertes urgentes uniquement

**Mutations** :
- `detecterAlertes` - Détection automatique
- `resoudreAlerte` - Résoudre une alerte
- `ignorerAlerte` - Ignorer une alerte
- `reactiverAlerte` - Réactiver une alerte
- `resoudreAlertesEnMasse` - Résolution groupée
- `nettoyerAlertesAnciennes` - Nettoyage

📖 [Documentation complète Alertes](./alertes/README.md)

---

### 🚧 Modules à Venir

Les modules suivants seront progressivement migrés vers GraphQL :

- **Cours** - Gestion des cours et inscriptions
- **Paiements** - Gestion des paiements
- **Utilisateurs** - Profils utilisateurs
- **Magasin** - Boutique en ligne
- **Messages** - Messagerie interne
- **Statistiques** - Analytics et rapports

## 🚀 Démarrage Rapide

### 1. Installation Client GraphQL

**React avec Apollo Client** :
```bash
npm install @apollo/client graphql
```

**Vue avec vue-apollo** :
```bash
npm install @vue/apollo-composable @apollo/client graphql
```

**Vanilla JS** :
Utilisez `fetch()` natif, aucune installation nécessaire.

### 2. Configuration Apollo Client (React)

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Lien HTTP vers le serveur GraphQL
const httpLink = createHttpLink({
  uri: 'http://localhost:5000/graphql',
});

// Middleware d'authentification
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Client Apollo
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

export default client;
```

### 3. Première Requête

```typescript
import { gql, useQuery } from '@apollo/client';

const ME_QUERY = gql`
  query GetCurrentUser {
    me {
      id
      firstName
      lastName
      email
    }
  }
`;

function UserProfile() {
  const { loading, error, data } = useQuery(ME_QUERY);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error.message}</p>;

  return (
    <div>
      <h1>Bonjour {data.me.firstName} !</h1>
      <p>Email : {data.me.email}</p>
    </div>
  );
}
```

## 📖 Guide d'Utilisation

### Structure d'une Requête GraphQL

```graphql
# Opération (query, mutation, subscription)
query NomDeVotreRequete {
  # Champ à récupérer
  champPrincipal {
    # Sous-champs
    sousChamp1
    sousChamp2
    # Relation
    relation {
      id
      nom
    }
  }
}
```

### Queries (Lecture)

Utilisées pour récupérer des données :

```graphql
query {
  # Récupérer l'utilisateur courant
  me {
    id
    email
  }
  
  # Récupérer les alertes critiques
  alertesCritiques {
    id
    typeAlerte
    priorite
  }
}
```

### Mutations (Écriture)

Utilisées pour modifier des données :

```graphql
mutation ConnexionUtilisateur {
  login(input: {
    email: "user@example.com"
    password: "password123"
    rememberMe: false
  }) {
    token
    user {
      id
      firstName
    }
  }
}
```

### Variables

Séparez les données des requêtes avec des variables :

```graphql
# Requête
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user { id }
  }
}
```

```json
// Variables
{
  "input": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

### Fragments

Réutilisez des sélections de champs :

```graphql
fragment UserInfo on AuthUser {
  id
  firstName
  lastName
  email
}

query {
  me {
    ...UserInfo
  }
}
```

## 🔒 Authentification

L'API utilise des **tokens JWT** pour l'authentification.

### 1. Obtenir un Token

```graphql
mutation {
  login(input: {
    email: "user@example.com"
    password: "password"
  }) {
    token
    expiresAt
  }
}
```

### 2. Utiliser le Token

Ajoutez le token dans l'header `Authorization` :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Avec Apollo Client** :
```typescript
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});
```

**Avec fetch** :
```javascript
fetch('http://localhost:5000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ query, variables })
});
```

### 3. Rafraîchir le Token

```graphql
mutation {
  refreshToken {
    token
    expiresAt
  }
}
```

## ⚠️ Gestion des Erreurs

GraphQL retourne des erreurs dans un format standardisé :

```json
{
  "errors": [
    {
      "message": "Non authentifié",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### Codes d'Erreur Standards

| Code | Description | Action Recommandée |
|------|-------------|-------------------|
| `UNAUTHENTICATED` | Non authentifié | Rediriger vers login |
| `FORBIDDEN` | Permissions insuffisantes | Afficher message accès refusé |
| `NOT_FOUND` | Ressource non trouvée | Vérifier l'ID ou rafraîchir |
| `BAD_USER_INPUT` | Données invalides | Valider les champs du formulaire |
| `INTERNAL_SERVER_ERROR` | Erreur serveur | Réessayer ou contacter support |
| `TOO_MANY_ATTEMPTS` | Trop de tentatives | Attendre avant de réessayer |

### Gestion avec Apollo Client

```typescript
try {
  const { data } = await mutation({ variables });
  // Succès
} catch (error) {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(({ message, extensions }) => {
      switch (extensions.code) {
        case 'UNAUTHENTICATED':
          logout();
          navigate('/login');
          break;
        case 'FORBIDDEN':
          toast.error('Accès refusé');
          break;
        default:
          toast.error(message);
      }
    });
  }
}
```

## 🎨 Playground GraphQL

En développement, accédez au **GraphQL Playground** pour :
- ✅ Tester les requêtes interactivement
- ✅ Explorer le schéma (introspection)
- ✅ Voir la documentation auto-générée
- ✅ Déboguer les requêtes

**URL** : `http://localhost:5000/graphql`

### Fonctionnalités du Playground

1. **Autocomplétion** : `Ctrl+Space` pour suggestions
2. **Documentation** : Panneau "Docs" à droite
3. **Historique** : Requêtes sauvegardées automatiquement
4. **Variables** : Onglet dédié pour les variables JSON
5. **Headers** : Ajouter l'authentification

## 📊 Bonnes Pratiques

### 1. Nommer les Opérations

```graphql
# ✅ BON
query GetCurrentUser {
  me { id email }
}

# ❌ MAUVAIS
query {
  me { id email }
}
```

### 2. Utiliser des Variables

```graphql
# ✅ BON
query GetUser($id: Int!) {
  user(id: $id) { name }
}

# ❌ MAUVAIS
query {
  user(id: 123) { name }
}
```

### 3. Demander Uniquement ce qui est Nécessaire

```graphql
# ✅ BON - Minimal
query {
  me {
    id
    email
  }
}

# ❌ MAUVAIS - Trop de données
query {
  me {
    id
    firstName
    lastName
    email
    dateOfBirth
    address
    phone
    # ... 20 autres champs inutilisés
  }
}
```

### 4. Utiliser les Fragments

```graphql
# ✅ BON - Réutilisable
fragment UserCard on User {
  id
  firstName
  lastName
  email
}

query {
  user1: user(id: 1) { ...UserCard }
  user2: user(id: 2) { ...UserCard }
}
```

### 5. Gérer les Erreurs Proprement

```typescript
// ✅ BON
try {
  const { data } = await query();
  return data;
} catch (error) {
  handleGraphQLError(error);
  throw error;
}
```

### 6. Pagination

```graphql
# ✅ Toujours paginer les listes
query {
  alertesActives(
    pagination: { page: 1, limit: 20 }
  ) {
    alertes { id }
    total
    totalPages
  }
}
```

## 🚀 Optimisations

### 1. Cache Apollo

```typescript
// Cache automatique par ID
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          alertesActives: {
            // Stratégie de merge pour pagination
            merge(existing = [], incoming) {
              return incoming;
            }
          }
        }
      }
    }
  })
});
```

### 2. Polling Intelligent

```typescript
// Rafraîchir les données critiques souvent
useQuery(ALERTES_CRITIQUES, {
  pollInterval: 10000 // 10 secondes
});

// Rafraîchir les stats moins souvent
useQuery(STATS_QUERY, {
  pollInterval: 60000 // 1 minute
});
```

### 3. Lazy Queries

```typescript
// Charger à la demande
const [loadUser, { data }] = useLazyQuery(USER_QUERY);

// Plus tard
onClick={() => loadUser({ variables: { id } })}
```

### 4. Batch Requests

Apollo Client regroupe automatiquement les requêtes envoyées simultanément.

## 📚 Ressources

### Documentation Officielle

- [GraphQL Official](https://graphql.org/) - Spécification GraphQL
- [Apollo Client](https://www.apollographql.com/docs/react/) - Client React
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

### Tutoriels

- [How to GraphQL](https://www.howtographql.com/) - Tutoriel complet
- [Apollo Tutorials](https://www.apollographql.com/tutorials/) - Cours interactifs

### Outils

- [GraphiQL](https://github.com/graphql/graphiql) - IDE GraphQL
- [Apollo Studio](https://studio.apollographql.com/) - Monitoring
- [GraphQL Voyager](https://apis.guru/graphql-voyager/) - Visualisation schéma

## 🔧 Développement

### Ajouter un Nouveau Module GraphQL

1. **Créer le dossier** : `graphql/nom-module/`

2. **Créer les types** : `nom-module.typeDefs.ts`
```typescript
import { gql } from 'graphql-tag';

export const nomModuleTypeDefs = gql`
  type NomModule {
    id: Int!
    nom: String!
  }

  extend type Query {
    nomModules: [NomModule!]!
  }
`;
```

3. **Créer les resolvers** : `nom-module.resolvers.ts`
```typescript
export const nomModuleResolvers = {
  Query: {
    nomModules: async () => {
      // Logique
      return [];
    }
  }
};
```

4. **Créer l'index** : `index.ts`
```typescript
export { nomModuleTypeDefs, nomModuleResolvers };
```

5. **Intégrer au serveur** : Ajouter au serveur GraphQL principal

6. **Documenter** : Créer `README.md` avec exemples

### Tests

```typescript
import { ApolloServer } from '@apollo/server';

describe('Module GraphQL', () => {
  let server: ApolloServer;

  beforeAll(() => {
    server = new ApolloServer({ typeDefs, resolvers });
  });

  it('devrait retourner les données', async () => {
    const result = await server.executeOperation({
      query: 'query { me { id } }'
    });

    expect(result.data?.me).toBeDefined();
  });
});
```

## 📞 Support

- **Documentation** : Consultez les README de chaque module
- **Playground** : Testez vos requêtes à `http://localhost:5000/graphql`
- **Issues** : Signalez les bugs sur le dépôt GitHub
- **Questions** : Contactez l'équipe de développement

---

**Version** : 2.0.0  
**Date** : 2024  
**Maintenu par** : ClubManager Team  
**Licence** : Propriétaire