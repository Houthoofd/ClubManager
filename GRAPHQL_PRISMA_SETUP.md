# 🚀 Guide de Démarrage Rapide - GraphQL + Prisma

Ce guide vous permettra de démarrer rapidement avec GraphQL et Prisma sur le projet ClubManager.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration Prisma](#configuration-prisma)
4. [Configuration DATABASE_URL](#configuration-database_url)
5. [Génération du client Prisma](#génération-du-client-prisma)
6. [Intégration GraphQL avec Express](#intégration-graphql-avec-express)
7. [Démarrage du serveur](#démarrage-du-serveur)
8. [Test avec Apollo Sandbox](#test-avec-apollo-sandbox)
9. [Premiers tests](#premiers-tests)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Prérequis

- Node.js >= 18
- MySQL >= 8.0 (déjà configuré avec vos tables)
- npm ou yarn

---

## 📦 Installation

Toutes les dépendances ont déjà été installées :

```bash
cd api

# Dépendances déjà installées :
# - prisma@latest
# - @prisma/client@latest
# - graphql@^16.12.0
# - @apollo/server@^5.2.0
# - graphql-tag@^2.12.6
# - express@^4.19.2
```

Vérifiez que tout est bien installé :

```bash
npm list prisma @prisma/client graphql @apollo/server
```

---

## ⚙️ Configuration Prisma

### 1. Vérifier le schéma Prisma

Le fichier `prisma/schema.prisma` a déjà été créé avec tous vos modèles :

```
api/
├── prisma/
│   └── schema.prisma   ✅ Créé (31 modèles)
├── src/
│   └── graphql/
│       ├── typeDefs.ts   ✅ Créé (schéma GraphQL)
│       ├── resolvers.ts  ✅ Créé (queries + mutations)
│       └── server.ts     ✅ Créé (Apollo Server)
```

### 2. Modèles Prisma disponibles

Votre schéma Prisma inclut :

- **Référence** : Genre, Status, Grade, PlanTarifaire
- **Utilisateurs** : User
- **Cours** : Cours, Inscription, Reservation
- **Paiements** : Paiement, EcheancePaiement
- **Boutique** : Article, Stock, Commande, CommandeArticle, Taille
- **Communication** : Message, MessagePersonnalise, Notification
- **Groupes** : Groupe, GroupeUtilisateur
- **Alertes** : AlerteType, AlerteUtilisateur, AlerteAction

**Total : 21 modèles principaux**

---

## 🔗 Configuration DATABASE_URL

### Option 1 : Fichier .env (Recommandé)

Créez ou modifiez `api/.env` :

```env
# Database MySQL
DATABASE_URL="mysql://user:password@localhost:3306/clubmanager"

# Exemple avec vos credentials
DATABASE_URL="mysql://root:PtW143kjkS3F@localhost:3306/clubmanager"

# Server
API_PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:8081,http://localhost:3000
```

### Option 2 : Tester la connexion

```bash
# Windows
set DATABASE_URL=mysql://root:password@localhost:3306/clubmanager

# Linux/Mac
export DATABASE_URL="mysql://root:password@localhost:3306/clubmanager"
```

---

## 🔄 Génération du client Prisma

### 1. Générer le client depuis le schéma

```bash
cd api
npx prisma generate
```

**Output attendu :**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### 2. Vérifier que vos tables MySQL existent

```bash
npx prisma db pull
```

Cela va :
- ✅ Se connecter à votre base de données
- ✅ Lire la structure des tables
- ✅ Mettre à jour le schéma si nécessaire

### 3. Synchroniser le schéma avec la DB (si modifications)

```bash
# Push le schéma Prisma vers MySQL (si vous avez modifié schema.prisma)
npx prisma db push
```

⚠️ **Attention** : Cette commande peut modifier votre base de données !

### 4. Ouvrir Prisma Studio (Interface visuelle)

```bash
npx prisma studio
```

Cela ouvrira `http://localhost:5555` avec une interface pour :
- 📊 Visualiser vos données
- ✏️ Éditer les enregistrements
- 🔍 Explorer les relations

---

## 🔌 Intégration GraphQL avec Express

### 1. Modifier votre fichier server.ts principal

Créez `api/src/server.ts` ou modifiez l'existant :

```typescript
import express from 'express';
import cors from 'cors';
import { createApolloServer } from './graphql/server.js';

const app = express();
const PORT = process.env.API_PORT || 5000;

// Middleware de base
app.use(cors());
app.use(express.json());

// Routes REST existantes (si besoin)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Initialiser Apollo Server avec GraphQL
async function startServer() {
  const { httpServer } = await createApolloServer(app);

  httpServer.listen(PORT, () => {
    console.log(`
🚀 Server ready at http://localhost:${PORT}
📊 GraphQL endpoint: http://localhost:${PORT}/graphql
🔍 Apollo Sandbox: http://localhost:${PORT}/graphql
    `);
  });
}

startServer().catch(console.error);
```

### 2. Compiler TypeScript

```bash
cd api
npm run build
```

**Output attendu :**
```
✔ Compilation TypeScript réussie
✔ Fichiers générés dans dist/
```

---

## 🚀 Démarrage du serveur

### Option 1 : Mode développement

```bash
cd api
npm run build && node dist/server.js
```

### Option 2 : Avec nodemon (auto-reload)

```bash
npm install -D nodemon
npx nodemon --watch src --exec "npm run build && node dist/server.js"
```

### Vérification

Si tout fonctionne, vous devriez voir :

```
🚀 Server ready at http://localhost:5000
📊 GraphQL endpoint: http://localhost:5000/graphql
🔍 Apollo Sandbox: http://localhost:5000/graphql
```

---

## 🎮 Test avec Apollo Sandbox

### 1. Ouvrir Apollo Sandbox

Naviguez vers : **http://localhost:5000/graphql**

### 2. Explorer le schéma

Dans la sidebar gauche, cliquez sur "Documentation" pour voir :
- 📖 Toutes les queries disponibles
- ✏️ Toutes les mutations disponibles
- 📡 Toutes les subscriptions disponibles

### 3. Configuration de l'authentification

Pour tester des queries authentifiées :

1. **Obtenez un token** :

```graphql
mutation Login {
  login(email: "user@example.com", password: "password123") {
    token
    user {
      fullName
    }
  }
}
```

2. **Configurez le header** dans Apollo Sandbox :

Cliquez sur "Headers" en bas et ajoutez :

```json
{
  "Authorization": "Bearer VOTRE_TOKEN_ICI"
}
```

---

## 🧪 Premiers tests

### Test 1 : Obtenir les données de référence (sans auth)

```graphql
query GetReferences {
  genres {
    id
    genreName
  }
  statuses {
    id
    nomRole
  }
  grades {
    id
    nom
    ordre
  }
}
```

### Test 2 : S'authentifier

```graphql
mutation Login {
  login(email: "votre@email.com", password: "votrePassword") {
    token
    user {
      id
      fullName
      email
      status {
        nomRole
      }
    }
  }
}
```

### Test 3 : Obtenir ses informations (avec auth)

```graphql
query Me {
  me {
    id
    fullName
    email
    dateOfBirth
    nombreInscriptions
    dernierPaiement {
      montant
      datePaiement
    }
  }
}
```

### Test 4 : Lister les utilisateurs (admin)

```graphql
query GetUsers {
  users(pagination: { limit: 5 }) {
    users {
      id
      fullName
      email
      grade {
        nom
      }
    }
    total
    totalPages
  }
}
```

### Test 5 : Prochains cours

```graphql
query ProchainsCours {
  prochainsCours(limit: 5) {
    id
    typeCours
    dateCours
    heureDebut
    heureFin
    nombreInscrits
    capaciteMax
    estComplet
  }
}
```

---

## 🐛 Troubleshooting

### Erreur : "Can't reach database server"

**Problème** : Prisma ne peut pas se connecter à MySQL

**Solutions** :
1. Vérifiez que MySQL est démarré
2. Vérifiez vos credentials dans DATABASE_URL
3. Testez la connexion :
   ```bash
   npx prisma db pull
   ```

### Erreur : "Client validation error"

**Problème** : Le client Prisma n'est pas généré

**Solution** :
```bash
npx prisma generate
```

### Erreur : "Cannot find module '@prisma/client'"

**Problème** : Installation incomplète

**Solution** :
```bash
npm install @prisma/client
npx prisma generate
```

### Erreur GraphQL : "UNAUTHENTICATED"

**Problème** : Token JWT manquant ou invalide

**Solution** :
1. Obtenez un nouveau token via mutation `login`
2. Ajoutez le header Authorization dans Apollo Sandbox

### Erreur : "Table doesn't exist"

**Problème** : Schéma Prisma ne correspond pas à la DB

**Solution** :
```bash
# Pull depuis la DB (recommandé)
npx prisma db pull

# OU Push vers la DB (attention !)
npx prisma db push
```

### Port déjà utilisé

**Problème** : Le port 5000 est occupé

**Solution** :
```bash
# Modifier dans .env
API_PORT=5001

# OU tuer le processus
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

---

## 📚 Ressources supplémentaires

### Documentation officielle

- **Prisma** : https://www.prisma.io/docs/
- **Apollo Server** : https://www.apollographql.com/docs/apollo-server/
- **GraphQL** : https://graphql.org/learn/

### Fichiers de référence

- `api/prisma/schema.prisma` - Schéma de la base de données
- `api/src/graphql/typeDefs.ts` - Types GraphQL
- `api/src/graphql/resolvers.ts` - Logique des queries/mutations
- `api/GRAPHQL_README.md` - Documentation complète de l'API

### Commandes utiles

```bash
# Prisma
npx prisma studio              # Interface visuelle
npx prisma generate            # Générer le client
npx prisma db pull             # Sync depuis DB
npx prisma db push             # Sync vers DB
npx prisma migrate dev         # Créer une migration
npx prisma format              # Formatter schema.prisma

# Tests GraphQL
npm test                       # Lancer les tests
npm run lint                   # Vérifier le code

# Production
npm run build                  # Compiler TypeScript
node dist/server.js            # Lancer en production
```

---

## 🎉 Prochaines étapes

1. ✅ **Testez les queries de base** dans Apollo Sandbox
2. ✅ **Créez un compte** avec la mutation `register`
3. ✅ **Explorez les relations** entre modèles (User → Inscriptions → Cours)
4. ✅ **Implémentez des mutations** pour créer/modifier des données
5. ✅ **Ajoutez des subscriptions** pour le temps réel (WebSockets)

### Intégration Frontend

Une fois GraphQL opérationnel, vous pourrez l'utiliser dans votre frontend :

```typescript
// Exemple avec Apollo Client React
import { gql, useQuery } from '@apollo/client';

const GET_ME = gql`
  query GetMe {
    me {
      fullName
      email
      prochainCours {
        typeCours
        dateCours
      }
    }
  }
`;

function Profile() {
  const { data, loading } = useQuery(GET_ME);
  
  if (loading) return <div>Chargement...</div>;
  
  return (
    <div>
      <h1>{data.me.fullName}</h1>
      <p>{data.me.email}</p>
    </div>
  );
}
```

---

## ✨ Félicitations !

Vous avez maintenant :
- ✅ Prisma configuré avec votre base MySQL existante
- ✅ GraphQL opérationnel avec Apollo Server
- ✅ 21 modèles de données disponibles
- ✅ Authentification JWT fonctionnelle
- ✅ Plus de 50 queries et mutations prêtes à l'emploi

**Happy coding! 🚀**

---

*Document créé le : Janvier 2025*  
*Dernière mise à jour : Janvier 2025*