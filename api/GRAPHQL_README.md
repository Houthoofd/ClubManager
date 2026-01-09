# 🚀 GraphQL API - ClubManager

Documentation complète de l'API GraphQL pour ClubManager.

---

## 📋 Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Playground GraphQL](#playground-graphql)
- [Authentication](#authentication)
- [Queries](#queries)
- [Mutations](#mutations)
- [Subscriptions](#subscriptions)
- [Exemples d'utilisation](#exemples-dutilisation)

---

## 🛠️ Installation

Toutes les dépendances sont déjà installées dans le projet :

```bash
npm install
```

Dépendances GraphQL :
- `graphql` - Implémentation GraphQL
- `@apollo/server` - Serveur Apollo Server 4
- `graphql-tag` - Parser pour schema GraphQL
- `prisma` - ORM pour la base de données
- `@prisma/client` - Client Prisma généré

---

## ⚙️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env` dans le dossier `api/` :

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/clubmanager"

# Server
API_PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:8081,http://localhost:3000
```

### 2. Générer le client Prisma

```bash
cd api
npx prisma generate
```

### 3. Synchroniser le schéma avec la base de données

```bash
# Pull schema from existing database
npx prisma db pull

# Push schema to database
npx prisma db push
```

---

## 🚀 Démarrage

### Développement

```bash
cd api
npm run build
node dist/server.js
```

### Production

```bash
npm run build
NODE_ENV=production node dist/server.js
```

Le serveur GraphQL sera disponible sur : **`http://localhost:5000/graphql`**

---

## 🎮 Playground GraphQL

Apollo Server 4 inclut **Apollo Sandbox** accessible via navigateur :

```
http://localhost:5000/graphql
```

**Features :**
- 🔍 Exploration du schéma
- 📝 Autocomplétion des queries
- 📚 Documentation interactive
- 🧪 Tester les queries/mutations
- 📊 Visualisation des erreurs

---

## 🔐 Authentication

### Obtenir un token JWT

**Mutation Login :**

```graphql
mutation Login {
  login(email: "user@example.com", password: "password123") {
    token
    user {
      id
      firstName
      lastName
      email
      status {
        nomRole
      }
    }
  }
}
```

**Mutation Register :**

```graphql
mutation Register {
  register(input: {
    firstName: "John"
    lastName: "Doe"
    email: "john.doe@example.com"
    password: "SecurePass123!"
    dateOfBirth: "1990-01-15"
    genderId: 1
  }) {
    token
    user {
      id
      email
      fullName
    }
  }
}
```

### Utiliser le token

Dans Apollo Sandbox ou votre client GraphQL, ajoutez le header :

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
```

---

## 📖 Queries

### Utilisateurs

#### Obtenir tous les utilisateurs (avec pagination)

```graphql
query GetUsers {
  users(
    filter: {
      actif: true
      statusId: 2
    }
    pagination: {
      page: 1
      limit: 10
      orderBy: "firstName"
      orderDirection: "ASC"
    }
  ) {
    users {
      id
      fullName
      email
      dateOfBirth
      status {
        nomRole
      }
      grade {
        nom
      }
      abonnement {
        nom
        prix
      }
    }
    total
    page
    totalPages
  }
}
```

#### Obtenir un utilisateur spécifique

```graphql
query GetUser($id: Int!) {
  user(id: $id) {
    id
    fullName
    email
    dateOfBirth
    nombreInscriptions
    dernierPaiement {
      montant
      datePaiement
    }
    prochainCours {
      typeCours
      dateCours
      heureDebut
    }
    inscriptions {
      cours {
        typeCours
        dateCours
      }
      present
    }
  }
}
```

**Variables :**
```json
{
  "id": 1
}
```

#### Obtenir l'utilisateur connecté

```graphql
query Me {
  me {
    id
    fullName
    email
    status {
      nomRole
    }
    notifications(where: { lu: false }) {
      titre
      message
      createdAt
    }
  }
}
```

#### Rechercher des utilisateurs

```graphql
query SearchUsers {
  users(
    filter: {
      search: "john"
      actif: true
    }
  ) {
    users {
      id
      fullName
      email
    }
    total
  }
}
```

---

### Cours

#### Lister tous les cours

```graphql
query GetCours {
  cours(
    filter: {
      typeCours: "JJB"
      dateDebut: "2024-01-01"
      dateFin: "2024-12-31"
      actif: true
    }
    pagination: {
      page: 1
      limit: 20
    }
  ) {
    cours {
      id
      typeCours
      dateCours
      heureDebut
      heureFin
      nombreInscrits
      placesDisponibles
      estComplet
      inscriptions {
        utilisateur {
          fullName
        }
        present
      }
    }
    total
    totalPages
  }
}
```

#### Prochains cours

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

#### Cours par type

```graphql
query CoursByType {
  coursParType(typeCours: "Grappling") {
    id
    dateCours
    heureDebut
    heureFin
    nombreInscrits
  }
}
```

---

### Inscriptions

#### Inscriptions d'un utilisateur

```graphql
query UserInscriptions($userId: Int!) {
  inscriptionsByUser(utilisateurId: $userId) {
    id
    cours {
      typeCours
      dateCours
      heureDebut
    }
    present
    dateInscription
  }
}
```

#### Inscriptions à un cours

```graphql
query CoursInscriptions($coursId: Int!) {
  inscriptionsByCours(coursId: $coursId) {
    id
    utilisateur {
      fullName
      email
    }
    present
    notes
  }
}
```

---

### Paiements

#### Paiements avec filtres

```graphql
query GetPaiements {
  paiements(
    filter: {
      statut: "validé"
      dateDebut: "2024-01-01"
      dateFin: "2024-12-31"
    }
  ) {
    id
    montant
    datePaiement
    statut
    utilisateur {
      fullName
    }
    abonnement {
      nom
    }
  }
}
```

#### Paiements d'un utilisateur

```graphql
query UserPaiements($userId: Int!) {
  paiementsByUser(utilisateurId: $userId) {
    id
    montant
    datePaiement
    statut
    periodeDebut
    periodeFin
    abonnement {
      nom
      prix
    }
  }
}
```

#### Échéances de paiements

```graphql
query EcheancesPaiements {
  echeancesPaiements(utilisateurId: 1) {
    id
    montant
    dateEcheance
    statut
    rappelEnvoye
  }
}
```

---

### Boutique

#### Articles disponibles

```graphql
query GetArticles {
  articles(actif: true) {
    id
    nom
    description
    prix
    imageUrl
    taille {
      nom
    }
    stockDisponible
    enRupture
  }
}
```

#### Commandes d'un utilisateur

```graphql
query UserCommandes($userId: Int!) {
  commandes(utilisateurId: $userId) {
    id
    dateCommande
    statut
    montantTotal
    nombreArticles
    articles {
      article {
        nom
      }
      quantite
      prixUnitaire
      sousTotal
    }
  }
}
```

---

### Messages & Notifications

#### Messages non lus

```graphql
query UnreadMessages($userId: Int!) {
  messagesNonLus(utilisateurId: $userId) {
    id
    sujet
    contenu
    expediteur {
      fullName
    }
    createdAt
  }
}
```

#### Notifications

```graphql
query UserNotifications($userId: Int!) {
  notifications(utilisateurId: $userId) {
    id
    titre
    message
    type
    lu
    lien
    createdAt
  }
}
```

---

### Statistiques

#### Dashboard administrateur

```graphql
query Dashboard {
  statistiquesDashboard {
    totalUtilisateurs
    utilisateursActifs
    totalCours
    coursAVenir
    totalPaiements
    paiementsEnAttente
    tauxPresence
    revenuMensuel
  }
}
```

#### Statistiques utilisateur

```graphql
query UserStats($userId: Int!) {
  statistiquesUtilisateur(utilisateurId: $userId) {
    utilisateurId
    nombreCoursAssistes
    tauxPresence
    dernierCours
    prochainPaiement
    montantTotalPaye
  }
}
```

---

### Données de référence

```graphql
query References {
  genres {
    id
    genreName
  }
  statuses {
    id
    nomRole
    description
  }
  grades {
    id
    nom
    ordre
  }
  plansTarifaires {
    id
    nom
    description
    prix
    duree
    actif
  }
}
```

---

## ✏️ Mutations

### Utilisateurs

#### Créer un utilisateur

```graphql
mutation CreateUser {
  createUser(input: {
    firstName: "Alice"
    lastName: "Martin"
    email: "alice@example.com"
    password: "SecurePass123!"
    dateOfBirth: "1995-05-20"
    genderId: 2
    statusId: 2
    gradeId: 1
    abonnementId: 1
  }) {
    id
    fullName
    email
  }
}
```

#### Mettre à jour un utilisateur

```graphql
mutation UpdateUser($id: Int!) {
  updateUser(
    id: $id
    input: {
      firstName: "Alice"
      lastName: "Dupont"
      gradeId: 2
      abonnementId: 2
    }
  ) {
    id
    fullName
    grade {
      nom
    }
    abonnement {
      nom
    }
  }
}
```

#### Activer/Désactiver un utilisateur

```graphql
mutation DeactivateUser($id: Int!) {
  deactivateUser(id: $id) {
    id
    actif
  }
}
```

---

### Cours

#### Créer un cours

```graphql
mutation CreateCours {
  createCours(input: {
    dateCours: "2024-12-20"
    typeCours: "JJB"
    heureDebut: "19:30:00"
    heureFin: "21:15:00"
    capaciteMax: 25
    description: "Cours de JJB tous niveaux"
  }) {
    id
    typeCours
    dateCours
    nombreInscrits
  }
}
```

#### Mettre à jour un cours

```graphql
mutation UpdateCours($id: Int!) {
  updateCours(
    id: $id
    input: {
      capaciteMax: 30
      description: "Cours de JJB débutants"
    }
  ) {
    id
    capaciteMax
    description
  }
}
```

---

### Inscriptions

#### Inscrire un utilisateur à un cours

```graphql
mutation Inscrire {
  inscrireUtilisateur(input: {
    utilisateurId: 1
    coursId: 10
    notes: "Première inscription"
  }) {
    id
    utilisateur {
      fullName
    }
    cours {
      typeCours
      dateCours
    }
  }
}
```

#### Marquer la présence

```graphql
mutation MarquerPresence($id: Int!, $present: Boolean!) {
  marquerPresence(id: $id, present: $present) {
    id
    present
    utilisateur {
      fullName
    }
    cours {
      dateCours
    }
  }
}
```

#### Désinscrire un utilisateur

```graphql
mutation Desinscrire($id: Int!) {
  desinscrireUtilisateur(id: $id) {
    success
    message
  }
}
```

---

### Paiements

#### Créer un paiement

```graphql
mutation CreatePaiement {
  createPaiement(input: {
    utilisateurId: 1
    montant: 49.99
    abonnementId: 1
    periodeDebut: "2024-12-01"
    periodeFin: "2024-12-31"
    methode: "carte"
  }) {
    id
    montant
    statut
    utilisateur {
      fullName
    }
  }
}
```

#### Valider un paiement

```graphql
mutation ValiderPaiement($id: Int!) {
  validerPaiement(id: $id) {
    id
    statut
    montant
  }
}
```

---

### Boutique

#### Créer un article

```graphql
mutation CreateArticle {
  createArticle(input: {
    nom: "Kimono JJB Blanc"
    description: "Kimono de haute qualité"
    prix: 89.99
    tailleId: 3
    imageUrl: "https://example.com/kimono.jpg"
  }) {
    id
    nom
    prix
  }
}
```

#### Mettre à jour le stock

```graphql
mutation UpdateStock($articleId: Int!, $quantite: Int!) {
  updateStock(articleId: $articleId, quantite: $quantite) {
    id
    quantite
    article {
      nom
    }
  }
}
```

#### Créer une commande

```graphql
mutation CreateCommande {
  createCommande(input: {
    utilisateurId: 1
    articles: [
      { articleId: 1, quantite: 2 }
      { articleId: 3, quantite: 1 }
    ]
    adresseLivraison: "123 Rue Example, Paris"
    notes: "Livraison rapide SVP"
  }) {
    id
    montantTotal
    statut
    articles {
      article {
        nom
      }
      quantite
      sousTotal
    }
  }
}
```

---

### Messages & Notifications

#### Envoyer un message

```graphql
mutation SendMessage {
  sendMessage(input: {
    expediteurId: 1
    destinataireId: 2
    sujet: "Nouveau cours disponible"
    contenu: "Bonjour, un nouveau cours de Grappling est disponible..."
    type: "prive"
  }) {
    id
    sujet
    expediteur {
      fullName
    }
    destinataire {
      fullName
    }
  }
}
```

#### Marquer comme lu

```graphql
mutation MarkAsRead($id: Int!) {
  markNotificationAsRead(id: $id) {
    id
    lu
  }
}
```

#### Marquer toutes les notifications comme lues

```graphql
mutation MarkAllRead($userId: Int!) {
  markAllNotificationsAsRead(utilisateurId: $userId) {
    success
    message
  }
}
```

---

### Alertes

#### Résoudre une alerte

```graphql
mutation ResoudreAlerte($id: Int!) {
  resoudreAlerte(
    id: $id
    notes: "Problème résolu, utilisateur contacté"
  ) {
    id
    statut
    dateResolution
    notes
  }
}
```

---

## 📡 Subscriptions

### Notifications en temps réel

```graphql
subscription OnNotification($userId: Int!) {
  notificationAdded(utilisateurId: $userId) {
    id
    titre
    message
    type
    createdAt
  }
}
```

### Nouveaux messages

```graphql
subscription OnMessage($userId: Int!) {
  messageReceived(utilisateurId: $userId) {
    id
    sujet
    contenu
    expediteur {
      fullName
    }
  }
}
```

### Mises à jour de cours

```graphql
subscription OnCoursUpdate($coursId: Int!) {
  coursUpdated(coursId: $coursId) {
    id
    nombreInscrits
    estComplet
  }
}
```

---

## 💻 Exemples d'utilisation

### Avec JavaScript/TypeScript (Apollo Client)

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Configuration
const httpLink = createHttpLink({
  uri: 'http://localhost:5000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// Exemple de query
import { gql } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers {
    users(pagination: { limit: 10 }) {
      users {
        id
        fullName
        email
      }
    }
  }
`;

// Utilisation
const { data, loading, error } = useQuery(GET_USERS);
```

### Avec fetch (JavaScript vanilla)

```javascript
const token = 'YOUR_JWT_TOKEN';

fetch('http://localhost:5000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: `
      query {
        me {
          id
          fullName
          email
        }
      }
    `
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Avec curl

```bash
# Login
curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"user@example.com\", password: \"pass123\") { token user { fullName } } }"
  }'

# Query avec token
curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "query { me { id fullName email } }"
  }'
```

---

## 🔒 Sécurité & Best Practices

### Permissions par rôle

Les resolvers implémentent des contrôles d'accès :

- **`requireAuth(context)`** : Nécessite authentification
- **`requireRole(context, ['administrateur'])`** : Nécessite rôle spécifique

### Rate Limiting

Ajoutez un rate limiter au niveau Express :

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requêtes
});

app.use('/graphql', limiter);
```

### Validation des inputs

Utilisez des directives ou Zod pour validation :

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  firstName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});
```

---

## 🐛 Debugging

### Activer les logs détaillés

```typescript
// Dans resolvers.ts
console.log('Query args:', args);
console.log('Context user:', context.user);
```

### Utiliser Apollo Studio

```env
APOLLO_KEY=your_apollo_key
APOLLO_GRAPH_REF=your_graph_ref
```

### Prisma Studio

```bash
npx prisma studio
```

Ouvre une interface web pour explorer la base de données.

---

## 📚 Ressources

- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Docs](https://graphql.org/learn/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)

---

## 🤝 Contribution

Pour ajouter de nouvelles features GraphQL :

1. **Mettre à jour le schéma Prisma** (`api/prisma/schema.prisma`)
2. **Générer le client** : `npx prisma generate`
3. **Ajouter les types GraphQL** dans `typeDefs.ts`
4. **Implémenter les resolvers** dans `resolvers.ts`
5. **Tester** avec Apollo Sandbox

---

**Fait avec ❤️ pour ClubManager**