# Guide d'intégration du module GraphQL Commandes

Ce guide explique comment intégrer le module GraphQL Commandes dans votre serveur Apollo existant.

## 📋 Prérequis

- Apollo Server installé
- Module Commandes refactorisé
- Services Commandes configurés

## 🚀 Intégration rapide

### Étape 1: Importer les modules

Dans votre fichier de configuration du serveur GraphQL (ex: `api/src/graphql/server.ts`):

```typescript
import { commandesTypeDefs, commandesResolvers } from './commandes/index.js';
```

### Étape 2: Fusionner avec les autres modules

Si vous avez déjà d'autres modules GraphQL:

```typescript
import { mergeTypeDefs } from '@graphql-tools/merge';
import { mergeResolvers } from '@graphql-tools/merge';

// Import de tous les modules
import { authTypeDefs, authResolvers } from './auth/index.js';
import { alertesTypeDefs, alertesResolvers } from './alertes/index.js';
import { commandesTypeDefs, commandesResolvers } from './commandes/index.js';

// Base schema (Query et Mutation types)
const baseTypeDefs = `#graphql
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
`;

// Fusion des typeDefs
const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  authTypeDefs,
  alertesTypeDefs,
  commandesTypeDefs,
]);

// Fusion des resolvers
const resolvers = mergeResolvers([
  authResolvers,
  alertesResolvers,
  commandesResolvers,
]);
```

### Étape 3: Créer le serveur Apollo

```typescript
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Options supplémentaires
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return error;
  },
  introspection: process.env.NODE_ENV !== 'production',
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    // Votre logique d'authentification
    const user = await getUserFromToken(req.headers.authorization);
    return { user };
  },
});

console.log(`🚀 Server ready at: ${url}`);
```

## 🔧 Configuration complète

### Fichier: `api/src/graphql/server.ts`

```typescript
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';

// Import des modules
import { authTypeDefs, authResolvers } from './auth/index.js';
import { alertesTypeDefs, alertesResolvers } from './alertes/index.js';
import { commandesTypeDefs, commandesResolvers } from './commandes/index.js';

// Base schema
const baseTypeDefs = `#graphql
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
  
  scalar DateTime
  scalar JSON
`;

// Fusion
const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  authTypeDefs,
  alertesTypeDefs,
  commandesTypeDefs,
]);

const resolvers = mergeResolvers([
  authResolvers,
  alertesResolvers,
  commandesResolvers,
]);

// Créer le schéma exécutable
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Configuration du serveur
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (formattedError, error) => {
    // Log les erreurs serveur
    if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
      console.error('Internal Server Error:', error);
    }
    
    // Retourner l'erreur formatée
    return formattedError;
  },
  plugins: [
    // Plugin de logging
    {
      async requestDidStart() {
        return {
          async didEncounterErrors(requestContext) {
            console.error('GraphQL Errors:', requestContext.errors);
          },
        };
      },
    },
  ],
});

// Démarrer le serveur
export async function startApolloServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.GRAPHQL_PORT || '4000') },
    context: async ({ req }) => {
      // Extraire le token d'authentification
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      // Récupérer l'utilisateur (à adapter selon votre système d'auth)
      let user = null;
      if (token) {
        try {
          // Votre logique de vérification de token
          user = await verifyToken(token);
        } catch (error) {
          console.error('Invalid token:', error);
        }
      }
      
      return { user };
    },
  });
  
  console.log(`🚀 GraphQL Server ready at: ${url}`);
  return server;
}

// Export pour utilisation dans d'autres fichiers
export { server, schema, typeDefs, resolvers };
```

## 🔐 Ajout de l'authentification

### Middleware d'authentification dans les resolvers

```typescript
// Dans commandes.resolvers.ts
export const commandesResolvers = {
  Query: {
    commandes: async (_: any, __: any, context: GraphQLContext) => {
      // Vérifier l'authentification
      if (!context.user) {
        throw new Error('Non authentifié');
      }
      
      // Vérifier les permissions (admin seulement)
      if (context.user.role !== 'admin') {
        throw new Error('Accès non autorisé - Admin requis');
      }
      
      const service = getCommandesService();
      return await service.getAllCommandes();
    },
    
    commandesByUserId: async (
      _: any,
      { utilisateurId }: { utilisateurId: number },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Non authentifié');
      }
      
      // Un utilisateur ne peut voir que ses propres commandes
      if (context.user.role !== 'admin' && context.user.id !== utilisateurId) {
        throw new Error('Accès non autorisé');
      }
      
      const service = getCommandesService();
      return await service.getCommandesByUserId(utilisateurId);
    },
  },
};
```

### Directive d'authentification (approche avancée)

```typescript
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql';

function authDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string
) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      
      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const { requires } = authDirective;
        
        fieldConfig.resolve = async function (source, args, context, info) {
          if (!context.user) {
            throw new Error('Non authentifié');
          }
          
          if (requires && !requires.includes(context.user.role)) {
            throw new Error('Accès non autorisé');
          }
          
          return resolve(source, args, context, info);
        };
      }
      
      return fieldConfig;
    },
  });
}

// Dans typeDefs
const authDirectiveTypeDef = `
  directive @auth(requires: [String]) on FIELD_DEFINITION
`;

// Utilisation
const baseTypeDefs = `#graphql
  ${authDirectiveTypeDef}
  
  type Query {
    commandes: [Commande!]! @auth(requires: ["admin"])
  }
`;
```

## 🧪 Test de l'intégration

### 1. Démarrer le serveur

```bash
npm run dev
# ou
node api/src/graphql/server.js
```

### 2. Tester dans Apollo Studio

Ouvrir `http://localhost:4000/graphql` dans votre navigateur.

### 3. Requête de test

```graphql
query TestCommandes {
  commandes {
    commande_id
    statut
    total
  }
}
```

### 4. Mutation de test

```graphql
mutation TestCreateCommande {
  createCommande(
    data: {
      commande_id: "TEST-001"
      utilisateur_id: 1
      total: 99.99
      articles: [
        {
          article_id: "ART-001"
          nom: "Test Article"
          quantite: 1
          prix_unitaire: 99.99
          prix_total: 99.99
        }
      ]
    }
  ) {
    commande_id
    statut
  }
}
```

## 🐛 Dépannage

### Erreur: "Cannot extend type Query"

**Solution**: Assurez-vous que le type `Query` de base est défini:

```typescript
const baseTypeDefs = `#graphql
  type Query {
    _empty: String
  }
`;
```

### Erreur: "Module not found"

**Solution**: Vérifiez les extensions `.js` dans les imports:

```typescript
// ❌ Incorrect
import { commandesTypeDefs } from './commandes';

// ✅ Correct
import { commandesTypeDefs } from './commandes/index.js';
```

### Erreur: "Resolver function missing"

**Solution**: Vérifiez que tous les champs ont un resolver ou utilisent le resolver par défaut.

### Erreur CORS

**Solution**: Configurer CORS dans Apollo Server:

```typescript
import cors from 'cors';
import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => ({ user: req.user }),
}));
```

## 📦 Dépendances requises

Assurez-vous d'avoir installé:

```json
{
  "dependencies": {
    "@apollo/server": "^4.0.0",
    "graphql": "^16.0.0"
  },
  "devDependencies": {
    "@graphql-tools/merge": "^9.0.0",
    "@graphql-tools/schema": "^10.0.0",
    "@graphql-tools/utils": "^10.0.0"
  }
}
```

Installation:

```bash
npm install @apollo/server graphql
npm install --save-dev @graphql-tools/merge @graphql-tools/schema @graphql-tools/utils
```

## 🌐 Intégration avec Express (alternative)

Si vous utilisez déjà Express:

```typescript
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

// Monter GraphQL sur /graphql
app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => ({ user: req.user }),
}));

// Autres routes REST
app.use('/api/commandes', commandesRouter);

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
  console.log('GraphQL endpoint: http://localhost:4000/graphql');
});
```

## 🔍 Monitoring et logging

### Ajout de logs détaillés

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    {
      async requestDidStart(requestContext) {
        console.log(`📨 Request started: ${requestContext.request.operationName}`);
        
        return {
          async willSendResponse(requestContext) {
            console.log(`✅ Response sent: ${requestContext.request.operationName}`);
          },
          async didEncounterErrors(requestContext) {
            console.error(`❌ Errors encountered:`, requestContext.errors);
          },
        };
      },
    },
  ],
});
```

### Intégration avec Sentry

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    Sentry.captureException(error);
    return error;
  },
});
```

## 📚 Ressources

- [Documentation Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Tools](https://the-guild.dev/graphql/tools)
- [Module Commandes README](../../db/clients/commandes/README.md)
- [Architecture du module](../../db/clients/commandes/ARCHITECTURE.md)

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2024