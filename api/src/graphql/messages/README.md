# Module GraphQL Messages

Ce module fournit l'API GraphQL pour la gestion des messages dans l'application ClubManager.

## Vue d'ensemble

Le module Messages gère :
- **Messages personnalisés** : Messages internes entre utilisateurs
- **Types de messages** : Catégorisation des messages
- **Historique des emails** : Suivi des emails envoyés
- **Templates d'emails** : Gestion des templates d'emails
- **Statistiques** : Métriques sur les messages

## Structure

```
messages/
├── README.md                 # Ce fichier
├── index.ts                  # Point d'entrée du module
├── messages.typeDefs.ts      # Définitions de types GraphQL
└── messages.resolvers.ts     # Resolvers GraphQL
```

## Types GraphQL

### Types Principaux

#### TypeMessagePersonnalise
```graphql
type TypeMessagePersonnalise {
  id: Int!
  nom_type: String!
  description: String
  actif: Boolean!
  created_at: String
  updated_at: String
}
```

#### MessagePersonnalise
```graphql
type MessagePersonnalise {
  id: Int!
  titre: String!
  contenu: String!
  type_id: Int!
  expediteur_id: Int!
  destinataire_id: Int!
  lu: Boolean!
  supprime: Boolean!
  created_at: String
  updated_at: String
}
```

#### MessagePersonnaliseAvecDetails
```graphql
type MessagePersonnaliseAvecDetails {
  id: Int!
  titre: String!
  contenu: String!
  type_nom: String!
  expediteur_nom: String!
  expediteur_prenom: String!
  destinataire_nom: String!
  destinataire_prenom: String!
  lu: Boolean!
  supprime: Boolean!
  created_at: String
}
```

#### HistoriqueMessage
```graphql
type HistoriqueMessage {
  id: Int!
  utilisateur_id: Int!
  type_message: String!
  contenu: String!
  status_envoi: MessageStatus!
  email_recipient: String!
  message_id: String
  error_message: String
  created_at: String
  updated_at: String
}
```

### Enums

#### MessageStatus
```graphql
enum MessageStatus {
  PENDING
  SENT
  FAILED
}
```

#### TypeMessage
```graphql
enum TypeMessage {
  BIENVENUE
  VALIDATION
  RECUPERATION
  RAPPEL_PAIEMENT
  NOTIFICATION
  ALERTE
  INFORMATION
}
```

## Queries

### getAllTypesMessages
Récupère tous les types de messages actifs.

```graphql
query {
  getAllTypesMessages {
    isFind
    message
    data {
      id
      nom_type
      description
      actif
    }
  }
}
```

### getMessagesRecusParUtilisateur
Récupère les messages reçus par un utilisateur.

```graphql
query GetMessages($utilisateurId: Int!) {
  getMessagesRecusParUtilisateur(utilisateurId: $utilisateurId) {
    isFind
    message
    data {
      id
      titre
      contenu
      type_nom
      expediteur_prenom
      expediteur_nom
      lu
      created_at
    }
  }
}
```

**Variables:**
```json
{
  "utilisateurId": 1
}
```

### compterMessagesNonLus
Compte les messages non lus d'un utilisateur.

```graphql
query CountUnread($utilisateurId: Int!) {
  compterMessagesNonLus(utilisateurId: $utilisateurId)
}
```

### getStatistiquesMessages
Récupère les statistiques des messages.

```graphql
query {
  getStatistiquesMessages {
    total
    envoyes
    lus
    non_lus
    supprimes
  }
}
```

### getMessageHistory
Récupère l'historique des messages d'un utilisateur.

```graphql
query GetHistory($utilisateurId: Int!, $limit: Int, $offset: Int) {
  getMessageHistory(utilisateurId: $utilisateurId, limit: $limit, offset: $offset) {
    id
    type_message
    contenu
    status_envoi
    email_recipient
    created_at
  }
}
```

### getAllTemplates
Récupère tous les templates d'emails actifs.

```graphql
query {
  getAllTemplates {
    id
    nom_template
    sujet
    contenu_html
    variables_disponibles
    actif
  }
}
```

## Mutations

### creerTypeMessage
Crée un nouveau type de message.

```graphql
mutation CreateType($input: CreateTypeMessageInput!) {
  creerTypeMessage(input: $input) {
    isConfirm
    message
    messageId
  }
}
```

**Variables:**
```json
{
  "input": {
    "nom_type": "Notification",
    "description": "Messages de notification",
    "actif": true
  }
}
```

### envoyerMessage
Envoie un message personnalisé.

```graphql
mutation SendMessage($input: SendMessagePersonnaliseInput!) {
  envoyerMessage(input: $input) {
    isConfirm
    message
    messageId
  }
}
```

**Variables:**
```json
{
  "input": {
    "titre": "Bienvenue",
    "contenu": "Bienvenue dans notre club!",
    "type_id": 1,
    "expediteur_id": 1,
    "destinataire_id": 2
  }
}
```

### marquerMessageCommeLu
Marque un message comme lu.

```graphql
mutation MarkAsRead($messageId: Int!) {
  marquerMessageCommeLu(messageId: $messageId) {
    isConfirm
    message
  }
}
```

**Variables:**
```json
{
  "messageId": 123
}
```

### supprimerMessageRecu
Supprime un message reçu (soft delete).

```graphql
mutation DeleteMessage($messageId: Int!) {
  supprimerMessageRecu(messageId: $messageId) {
    isConfirm
    message
  }
}
```

### restaurerMessage
Restaure un message supprimé.

```graphql
mutation RestoreMessage($messageId: Int!) {
  restaurerMessage(messageId: $messageId) {
    isConfirm
    message
  }
}
```

### envoyerEmailBienvenue
Envoie un email de bienvenue à un utilisateur.

```graphql
mutation SendWelcome($input: WelcomeEmailInput!) {
  envoyerEmailBienvenue(input: $input) {
    success
    messageId
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": 1,
    "email": "user@example.com",
    "userName": "jdoe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### envoyerValidationEmail
Envoie un email de validation.

```graphql
mutation SendValidation($input: ValidationEmailInput!) {
  envoyerValidationEmail(input: $input) {
    success
    messageId
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": 1,
    "email": "user@example.com",
    "prenom": "John",
    "confirmationToken": "abc123xyz"
  }
}
```

## Exemples d'Utilisation

### Récupérer les messages d'un utilisateur et les marquer comme lus

```graphql
# 1. Récupérer les messages
query GetMessages {
  getMessagesRecusParUtilisateur(utilisateurId: 1) {
    isFind
    data {
      id
      titre
      contenu
      lu
    }
  }
}

# 2. Marquer chaque message comme lu
mutation MarkAsRead {
  marquerMessageCommeLu(messageId: 123) {
    isConfirm
    message
  }
}
```

### Workflow d'envoi de message complet

```graphql
# 1. Vérifier les types de messages disponibles
query GetTypes {
  getAllTypesMessages {
    data {
      id
      nom_type
    }
  }
}

# 2. Envoyer le message
mutation SendMessage {
  envoyerMessage(input: {
    titre: "Rappel"
    contenu: "N'oubliez pas le cours de demain"
    type_id: 2
    expediteur_id: 1
    destinataire_id: 5
  }) {
    isConfirm
    message
    messageId
  }
}

# 3. Vérifier que le message a été reçu
query CheckReceived {
  getMessagesRecusParUtilisateur(utilisateurId: 5) {
    isFind
    data {
      id
      titre
      lu
    }
  }
}
```

### Gestion des statistiques

```graphql
query GetStats {
  getStatistiquesMessages {
    total
    envoyes
    lus
    non_lus
    supprimes
  }
  
  getStatistiquesSuppressions {
    total_supprimes
    derniere_suppression
  }
}
```

## Architecture

Le module Messages suit l'architecture modulaire du projet :

```
Database Layer (messages.repository.ts)
         ↓
   GraphQL Layer (resolvers)
         ↓
    GraphQL API (typeDefs)
         ↓
      Clients
```

### Resolvers

Les resolvers font le lien entre GraphQL et le repository de la base de données :

```typescript
import { getMessagesRepository } from '../../db/clients/messages/messages.repository.js';

export const messagesResolvers = {
  Query: {
    getAllTypesMessages: async () => {
      const repository = getMessagesRepository();
      return await repository.obtenirTousLesTypesDeMessages();
    }
  }
}
```

## Gestion des Erreurs

Les resolvers gèrent les erreurs et renvoient des messages explicites :

```typescript
try {
  const repository = getMessagesRepository();
  return await repository.envoyerMessage(input);
} catch (error) {
  console.error("Erreur lors de l'envoi du message:", error);
  throw new Error("Impossible d'envoyer le message");
}
```

## Sécurité

### Authentification
Les resolvers peuvent utiliser le contexte GraphQL pour vérifier l'authentification :

```typescript
async (_, args, context: GraphQLContext) => {
  if (!context.user) {
    throw new Error('Non authentifié');
  }
  // ...
}
```

### Autorisation
Vérifier que l'utilisateur a les permissions nécessaires :

```typescript
if (context.user.role !== 'admin') {
  throw new Error('Permission refusée');
}
```

## Intégration

### Dans un serveur GraphQL

```typescript
import { messagesTypeDefs, messagesResolvers } from './graphql/messages';

const typeDefs = [
  messagesTypeDefs,
  // autres typeDefs...
];

const resolvers = [
  messagesResolvers,
  // autres resolvers...
];
```

### Depuis un client GraphQL

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const GET_MESSAGES = gql`
  query GetMessages($userId: Int!) {
    getMessagesRecusParUtilisateur(utilisateurId: $userId) {
      isFind
      message
      data {
        id
        titre
        contenu
        lu
      }
    }
  }
`;

const { data } = await client.query({
  query: GET_MESSAGES,
  variables: { userId: 1 }
});
```

## Tests

### Exemple de test avec Jest

```typescript
import { messagesResolvers } from './messages.resolvers';

describe('Messages Resolvers', () => {
  it('should get messages for user', async () => {
    const result = await messagesResolvers.Query.getMessagesRecusParUtilisateur(
      {},
      { utilisateurId: 1 },
      { user: { id: 1, role: 'user' } }
    );
    
    expect(result.isFind).toBe(true);
    expect(result.data).toBeInstanceOf(Array);
  });
});
```

## Dépendances

- **Repository Layer**: `../../db/clients/messages/messages.repository.js`
- **Types**: `../../db/clients/messages/types.js`
- **Legacy Clients**: `messageClient.js`, `messages.js` (pour certaines fonctionnalités)

## Notes

- Les fonctionnalités d'envoi d'email (bienvenue, validation, etc.) utilisent encore les clients legacy
- La migration complète vers le nouveau repository est en cours
- Certaines mutations complexes (comme `envoyerMessageAvecEmails`) nécessitent encore le MessageClient

## TODO

- [ ] Migrer toutes les fonctionnalités d'email vers le repository
- [ ] Ajouter la pagination pour les queries de liste
- [ ] Implémenter les subscriptions GraphQL pour les messages en temps réel
- [ ] Ajouter des directives de validation (@auth, @hasRole)
- [ ] Optimiser les requêtes avec DataLoader pour éviter N+1
- [ ] Ajouter des tests unitaires et d'intégration

## Ressources

- [Documentation GraphQL](https://graphql.org/learn/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [Architecture du module Messages](../../db/clients/messages/docs/ARCHITECTURE.md)