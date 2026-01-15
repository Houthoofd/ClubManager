# Module Messages - ClubManager API

Ce module gère l'ensemble de la messagerie de l'application ClubManager, incluant les messages personnalisés entre utilisateurs, les emails automatiques, et l'historique des communications.

## Vue d'ensemble

Le module Messages suit une **architecture modulaire** avec séparation des responsabilités :

- **Repository Pattern** : Accès aux données via des repositories spécialisés
- **Type Safety** : TypeScript complet avec types stricts
- **GraphQL API** : Interface GraphQL complète
- **Legacy Support** : Compatibilité avec l'ancien code

## Structure du Module

```
messages/
├── docs/
│   └── ARCHITECTURE.md          # Documentation détaillée de l'architecture
├── queries/
│   ├── read.queries.ts          # Requêtes SELECT
│   ├── write.queries.ts         # Requêtes INSERT/UPDATE/DELETE
│   ├── validation.queries.ts    # Requêtes de validation
│   └── index.ts                 # Export centralisé
├── repositories/
│   ├── read.repository.ts       # Repository de lecture
│   ├── write.repository.ts      # Repository d'écriture
│   ├── validation.repository.ts # Repository de validation
├── utils/                       # Utilitaires (à développer)
├── messages.repository.ts       # Repository principal (orchestrateur)
├── types.ts                     # Types TypeScript
├── queries.ts                   # Fichier de compatibilité
├── index.ts                     # Point d'entrée du module
├── messageClient.ts             # Client legacy (compatibilité)
├── messages.ts                  # Client legacy (compatibilité)
└── README.md                    # Ce fichier
```

## Installation / Import

### Import du Repository Principal

```typescript
import { getMessagesRepository } from '@/db/clients/messages';

const messagesRepo = getMessagesRepository();
```

### Import des Types

```typescript
import type {
  MessagePersonnalise,
  TypeMessagePersonnalise,
  SendMessagePersonnaliseData,
  MessageSearchResult
} from '@/db/clients/messages';
```

### Import des Queries (si nécessaire)

```typescript
import * as messagesQueries from '@/db/clients/messages/queries';
```

## Fonctionnalités

### 1. Messages Personnalisés

Gestion des messages internes entre utilisateurs de l'application.

#### Envoyer un message

```typescript
const result = await messagesRepo.envoyerMessage({
  titre: 'Bienvenue',
  contenu: 'Bienvenue dans notre club!',
  type_id: 1,
  expediteur_id: 1,
  destinataire_id: 2,
});

if (result.isConfirm) {
  console.log('Message envoyé avec succès, ID:', result.messageId);
}
```

#### Récupérer les messages d'un utilisateur

```typescript
const result = await messagesRepo.obtenirMessagesRecusParUtilisateur(userId);

if (result.isFind) {
  result.data.forEach(message => {
    console.log(`${message.titre}: ${message.contenu}`);
  });
}
```

#### Marquer un message comme lu

```typescript
const result = await messagesRepo.marquerMessageCommeLu(messageId);

if (result.isConfirm) {
  console.log('Message marqué comme lu');
}
```

#### Compter les messages non lus

```typescript
const count = await messagesRepo.compterMessagesNonLus(userId);
console.log(`${count} message(s) non lu(s)`);
```

### 2. Types de Messages

Gestion des catégories de messages.

#### Récupérer tous les types

```typescript
const result = await messagesRepo.obtenirTousLesTypesDeMessages();

if (result.isFind) {
  result.data.forEach(type => {
    console.log(`${type.nom_type}: ${type.description}`);
  });
}
```

#### Créer un type de message

```typescript
const result = await messagesRepo.creerTypeMessage({
  nom_type: 'Notification',
  description: 'Messages de notification système',
  actif: true,
});

if (result.isConfirm) {
  console.log('Type créé avec ID:', result.messageId);
}
```

#### Modifier un type de message

```typescript
const result = await messagesRepo.modifierTypeMessage(typeId, {
  nom_type: 'Notification Système',
  description: 'Messages automatiques du système',
  actif: true,
});
```

### 3. Historique des Emails

Suivi des emails envoyés par l'application.

#### Récupérer l'historique d'un utilisateur

```typescript
const history = await messagesRepo.getMessageHistory(
  userId,
  50,  // limit
  0    // offset
);

history.forEach(msg => {
  console.log(`${msg.type_message} - ${msg.status_envoi} - ${msg.email_recipient}`);
});
```

#### Sauvegarder un message dans l'historique

```typescript
const messageId = await messagesRepo.saveMessageToDatabase({
  utilisateur_id: 1,
  type_message: 'bienvenue',
  contenu: 'Email de bienvenue envoyé',
  status_envoi: 'sent',
  email_recipient: 'user@example.com',
  message_id: 'sendgrid-msg-id-123',
});
```

#### Mettre à jour le statut d'un message

```typescript
const success = await messagesRepo.updateMessageStatus({
  messageId: 123,
  status: 'sent',
  emailMessageId: 'sendgrid-msg-id-123',
});
```

### 4. Templates d'Emails

Gestion des templates pour les emails automatiques.

#### Récupérer tous les templates

```typescript
const templates = await messagesRepo.getAllTemplates();

templates.forEach(template => {
  console.log(`${template.nom_template}: ${template.sujet}`);
});
```

#### Récupérer un template par nom

```typescript
const template = await messagesRepo.getTemplateByName('bienvenue');

if (template) {
  console.log(`Sujet: ${template.sujet}`);
  console.log(`HTML: ${template.contenu_html}`);
}
```

### 5. Statistiques

#### Statistiques des messages

```typescript
const result = await messagesRepo.obtenirStatistiquesMessages();

if (result.isFind) {
  const stats = result.data;
  console.log(`Total: ${stats.total}`);
  console.log(`Envoyés: ${stats.envoyes}`);
  console.log(`Lus: ${stats.lus}`);
  console.log(`Non lus: ${stats.non_lus}`);
  console.log(`Supprimés: ${stats.supprimes}`);
}
```

#### Statistiques de suppression

```typescript
const result = await messagesRepo.obtenirStatistiquesSuppressions();

if (result.isFind) {
  const stats = result.data;
  console.log(`Total supprimé: ${stats.total_supprimes}`);
  console.log(`Dernière suppression: ${stats.derniere_suppression}`);
}
```

## API GraphQL

Le module expose également une API GraphQL complète. Voir [documentation GraphQL](../../graphql/messages/README.md).

### Exemple de Query GraphQL

```graphql
query GetMessages($userId: Int!) {
  getMessagesRecusParUtilisateur(utilisateurId: $userId) {
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

### Exemple de Mutation GraphQL

```graphql
mutation SendMessage($input: SendMessagePersonnaliseInput!) {
  envoyerMessage(input: $input) {
    isConfirm
    message
    messageId
  }
}
```

## Accès Avancé aux Sous-Repositories

Pour des opérations avancées, vous pouvez accéder directement aux sous-repositories :

```typescript
const messagesRepo = getMessagesRepository();

// Accès direct au repository de lecture
const messages = await messagesRepo.read.getMessagesRecusParUtilisateur(userId);

// Accès direct au repository d'écriture
const messageId = await messagesRepo.write.sendMessagePersonnalise(data);

// Accès direct au repository de validation
const exists = await messagesRepo.validation.messageExists(messageId);
const canSend = await messagesRepo.validation.userCanSendMessage(userId);
```

## Types Principaux

### MessagePersonnalise

```typescript
interface MessagePersonnalise {
  id: number;
  titre: string;
  contenu: string;
  type_id: number;
  expediteur_id: number;
  destinataire_id: number;
  lu: boolean;
  supprime: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}
```

### TypeMessagePersonnalise

```typescript
interface TypeMessagePersonnalise {
  id: number;
  nom_type: string;
  description?: string | null;
  actif: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}
```

### HistoriqueMessage

```typescript
interface HistoriqueMessage {
  id: number;
  utilisateur_id: number;
  type_message: string;
  contenu: string;
  status_envoi: 'pending' | 'sent' | 'failed';
  email_recipient: string;
  message_id?: string | null;
  error_message?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}
```

## Gestion des Erreurs

Le repository gère les erreurs et retourne des résultats standardisés :

```typescript
const result = await messagesRepo.envoyerMessage(data);

if (result.isConfirm) {
  // Succès
  console.log('Message envoyé:', result.message);
  console.log('ID:', result.messageId);
} else {
  // Échec
  console.error('Erreur:', result.message);
}
```

## Validation

Le module effectue des validations automatiques :

```typescript
// Validation d'existence du type de message
// Validation que l'expéditeur peut envoyer
// Validation que le destinataire peut recevoir
const result = await messagesRepo.envoyerMessage({
  titre: 'Test',
  contenu: 'Message de test',
  type_id: 999,        // Type inexistant
  expediteur_id: 1,
  destinataire_id: 2,
});

// result.isConfirm sera false
// result.message contiendra le message d'erreur
```

## Migration depuis l'Ancien Code

### Ancien code

```typescript
import { Message } from '@/db/clients/messages/messages';

const messageClient = new Message();
const result = await messageClient.envoyerMessage(...);
```

### Nouveau code

```typescript
import { getMessagesRepository } from '@/db/clients/messages';

const messagesRepo = getMessagesRepository();
const result = await messagesRepo.envoyerMessage({...});
```

**Note** : Les anciens clients (`Message` et `MessageClient`) restent disponibles pour compatibilité mais sont dépréciés.

## Base de Données

### Tables Utilisées

- `types_messages_personnalises` : Types de messages
- `messages_personnalises` : Messages entre utilisateurs
- `historique_messages` : Historique des emails envoyés
- `email_templates` : Templates d'emails
- `utilisateurs` : Jointure pour informations utilisateurs

### Schéma Simplifié

```sql
-- Types de messages
CREATE TABLE types_messages_personnalises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom_type VARCHAR(100) NOT NULL,
  description TEXT,
  actif TINYINT(1) DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME
);

-- Messages personnalisés
CREATE TABLE messages_personnalises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  type_id INT NOT NULL,
  expediteur_id INT NOT NULL,
  destinataire_id INT NOT NULL,
  lu TINYINT(1) DEFAULT 0,
  supprime TINYINT(1) DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (type_id) REFERENCES types_messages_personnalises(id),
  FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id),
  FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id)
);

-- Historique des messages (emails)
CREATE TABLE historique_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id INT NOT NULL,
  type_message VARCHAR(50) NOT NULL,
  contenu TEXT,
  status_envoi VARCHAR(20) NOT NULL,
  email_recipient VARCHAR(255) NOT NULL,
  message_id VARCHAR(255),
  error_message TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);
```

## Tests

### Exemple de Test Unitaire

```typescript
import { getMessagesRepository } from '@/db/clients/messages';

describe('MessagesRepository', () => {
  const messagesRepo = getMessagesRepository();

  it('should send a message', async () => {
    const result = await messagesRepo.envoyerMessage({
      titre: 'Test',
      contenu: 'Message de test',
      type_id: 1,
      expediteur_id: 1,
      destinataire_id: 2,
    });

    expect(result.isConfirm).toBe(true);
    expect(result.messageId).toBeGreaterThan(0);
  });

  it('should get messages for user', async () => {
    const result = await messagesRepo.obtenirMessagesRecusParUtilisateur(1);

    expect(result.isFind).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
});
```

## Performance

### Optimisations

- **Singleton Pattern** : Une seule instance du repository
- **Prepared Statements** : Protection contre les injections SQL
- **Indexes** : Sur les clés étrangères et champs de recherche
- **Lazy Loading** : Chargement des relations uniquement si nécessaire

### Recommandations

- Utiliser la pagination pour les grandes listes
- Indexer les colonnes `created_at` pour les tris
- Archiver les anciens messages régulièrement

## Sécurité

### Validations

- Existence des entités avant opérations
- Permissions d'envoi et de réception
- Validation des formats (email, contenu, etc.)
- Protection contre les injections SQL

### Bonnes Pratiques

```typescript
// Toujours vérifier les résultats
const result = await messagesRepo.envoyerMessage(data);
if (!result.isConfirm) {
  throw new Error(result.message);
}

// Valider les permissions côté serveur
if (!user.hasPermission('send_messages')) {
  throw new Error('Permission refusée');
}

// Nettoyer les entrées utilisateur
const titre = sanitize(input.titre);
const contenu = sanitize(input.contenu);
```

## Documentation Complémentaire

- [Architecture Détaillée](./docs/ARCHITECTURE.md)
- [API GraphQL](../../graphql/messages/README.md)
- [Types TypeScript](./types.ts)
- [Queries SQL](./queries/)

## Contribuer

### Ajouter une Nouvelle Fonctionnalité

1. Ajouter les types dans `types.ts`
2. Créer les queries SQL dans `queries/`
3. Implémenter dans le repository approprié (`read`, `write`, ou `validation`)
4. Exposer via le repository principal `messages.repository.ts`
5. Ajouter les resolvers GraphQL si nécessaire
6. Mettre à jour la documentation

### Standards de Code

- TypeScript strict activé
- Commentaires JSDoc pour les fonctions publiques
- Gestion des erreurs avec try-catch
- Retours standardisés (`isConfirm`, `message`, `data`)

## Roadmap

- [ ] Ajouter la pagination pour toutes les listes
- [ ] Implémenter un système de cache
- [ ] Ajouter des événements (notifications temps réel)
- [ ] Supporter les pièces jointes
- [ ] Ajouter des filtres de recherche avancés
- [ ] Implémenter les conversations groupées
- [ ] Ajouter le support des réponses/threads
- [ ] Créer des webhooks pour les événements

## Support

Pour toute question ou problème :
1. Consulter la [documentation détaillée](./docs/ARCHITECTURE.md)
2. Vérifier les exemples ci-dessus
3. Contacter l'équipe de développement

## License

Propriété de ClubManager - Tous droits réservés