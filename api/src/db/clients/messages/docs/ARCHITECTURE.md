# Architecture du Module Messages

## Vue d'ensemble

Le module Messages suit une architecture modulaire qui sépare les responsabilités en couches distinctes. Cette architecture facilite la maintenance, les tests et l'évolution du code.

## Structure des Dossiers

```
messages/
├── docs/                      # Documentation
│   └── ARCHITECTURE.md       # Ce fichier
├── queries/                  # Requêtes SQL modulaires
│   ├── read.queries.ts      # Requêtes SELECT
│   ├── write.queries.ts     # Requêtes INSERT/UPDATE/DELETE
│   ├── validation.queries.ts # Requêtes de validation
│   └── index.ts             # Export centralisé
├── repositories/            # Repositories modulaires
│   ├── read.repository.ts   # Opérations de lecture
│   ├── write.repository.ts  # Opérations d'écriture
│   ├── validation.repository.ts # Opérations de validation
│   └── index.ts             # Export centralisé (si nécessaire)
├── utils/                   # Utilitaires et helpers
├── messages.repository.ts   # Repository principal (orchestrateur)
├── types.ts                 # Types TypeScript
├── queries.ts              # Fichier de compatibilité
├── index.ts                # Point d'entrée du module
├── messageClient.ts        # Client legacy (compatibilité)
└── messages.ts             # Client legacy (compatibilité)
```

## Couches d'Architecture

### 1. Types (`types.ts`)

Définit tous les types TypeScript du module:
- **Entités**: Représentations métier (MessagePersonnalise, TypeMessagePersonnalise, etc.)
- **SQL Rows**: Structures brutes de la base de données
- **DTOs**: Objets de transfert de données
- **Résultats**: Structures de retour standardisées
- **Enums**: Énumérations (MessageStatus, TypeMessage)
- **Type Guards**: Fonctions de validation de types

### 2. Requêtes SQL (`queries/`)

Séparation des requêtes SQL par responsabilité:

#### `read.queries.ts`
- Toutes les requêtes SELECT
- Récupération des types de messages, messages personnalisés, historique, templates
- Statistiques et comptages

#### `write.queries.ts`
- Requêtes INSERT, UPDATE, DELETE
- Création et modification des messages et types
- Soft delete et restauration

#### `validation.queries.ts`
- Requêtes de vérification (CHECK, EXISTS)
- Validation de l'existence des entités
- Vérification des permissions et états

### 3. Repositories (`repositories/`)

Encapsulation de la logique d'accès aux données:

#### `read.repository.ts`
**Responsabilité**: Opérations de lecture uniquement
- Méthodes de récupération (get, find, list)
- Parsing des rows SQL vers entités TypeScript
- Gestion des promesses et erreurs

**Exemple**:
```typescript
async getAllTypesMessages(): Promise<TypeMessagePersonnalise[]>
async getMessagesRecusParUtilisateur(id: number): Promise<MessagePersonnaliseAvecDetails[]>
async compterMessagesNonLus(id: number): Promise<number>
```

#### `write.repository.ts`
**Responsabilité**: Opérations d'écriture (INSERT/UPDATE/DELETE)
- Création, modification, suppression
- Gestion des transactions (si nécessaire)
- Retour des IDs générés ou confirmations

**Exemple**:
```typescript
async createTypeMessage(data: CreateTypeMessageData): Promise<number>
async sendMessagePersonnalise(data: SendMessagePersonnaliseData): Promise<number>
async marquerMessageCommeLu(messageId: number): Promise<boolean>
```

#### `validation.repository.ts`
**Responsabilité**: Validations et vérifications
- Vérification d'existence
- Validation de permissions
- Contrôle d'intégrité

**Exemple**:
```typescript
async messageExists(messageId: number): Promise<boolean>
async userCanSendMessage(userId: number): Promise<boolean>
async messageBelongsToUser(messageId: number, userId: number): Promise<boolean>
```

### 4. Repository Principal (`messages.repository.ts`)

**Pattern**: Orchestrateur + Singleton

**Responsabilités**:
- Orchestration des sous-repositories
- Validation métier avant opérations
- Gestion des erreurs et logs
- Formatage des réponses standardisées

**Structure**:
```typescript
class MessagesRepository {
  private readRepository: MessagesReadRepository;
  private writeRepository: MessagesWriteRepository;
  private validationRepository: MessagesValidationRepository;
  
  // Méthodes publiques qui orchestrent les opérations
  async envoyerMessage(data: SendMessagePersonnaliseData): Promise<SendMessageResult> {
    // 1. Validations
    const typeExists = await this.validationRepository.typeMessageExists(data.type_id);
    const senderCanSend = await this.validationRepository.userCanSendMessage(data.expediteur_id);
    
    // 2. Opération d'écriture
    const messageId = await this.writeRepository.sendMessagePersonnalise(data);
    
    // 3. Retour formaté
    return { isConfirm: true, message: 'Message envoyé', messageId };
  }
  
  // Accès direct aux sous-repositories si nécessaire
  get read() { return this.readRepository; }
  get write() { return this.writeRepository; }
  get validation() { return this.validationRepository; }
}
```

**Singleton**:
```typescript
let repositoryInstance: MessagesRepository | null = null;

export function getMessagesRepository(): MessagesRepository {
  if (!repositoryInstance) {
    repositoryInstance = new MessagesRepository();
  }
  return repositoryInstance;
}
```

### 5. Point d'entrée (`index.ts`)

Expose l'API publique du module:
```typescript
// Repository principal
export { MessagesRepository, getMessagesRepository } from './messages.repository.js';

// Types
export * from './types.js';

// Queries (pour compatibilité)
export * as queries from './queries.js';

// Clients legacy
export { default as MessageClient } from './messageClient.js';
export { default as Message } from './messages.js';
```

## Flux de Données

### Lecture (Query Flow)
```
Client → Repository Principal → Read Repository → Query → Database
                                                      ↓
Client ← Entité TypeScript ← Parser ← Row SQL ← Results
```

### Écriture (Command Flow)
```
Client → Repository Principal
           ↓
        Validation Repository (vérifications)
           ↓
        Write Repository → Query → Database
           ↓
        Retour (Success/Failure)
```

## Principes de Conception

### 1. Séparation des Responsabilités (SRP)
- Chaque repository a une responsabilité unique
- Les requêtes sont séparées par type d'opération
- Le parsing est isolé dans les repositories de lecture

### 2. DRY (Don't Repeat Yourself)
- Requêtes SQL centralisées et réutilisables
- Fonctions de parsing privées dans les repositories
- Types partagés dans `types.ts`

### 3. Type Safety
- Tous les types SQL et entités sont typés
- Type guards pour validation runtime
- Interfaces strictes pour les DTOs

### 4. Gestion des Erreurs
- Try-catch dans le repository principal
- Logs détaillés des erreurs
- Retours standardisés (isConfirm, message, data)

### 5. Testabilité
- Repositories injectables
- Mocking facile des sous-repositories
- Isolation des responsabilités

## Usage

### Import du module
```typescript
import { getMessagesRepository } from '@/db/clients/messages';

const messagesRepo = getMessagesRepository();
```

### Opérations courantes

#### Envoyer un message
```typescript
const result = await messagesRepo.envoyerMessage({
  titre: 'Bienvenue',
  contenu: 'Message de bienvenue',
  type_id: 1,
  expediteur_id: 1,
  destinataire_id: 2,
});

if (result.isConfirm) {
  console.log('Message envoyé, ID:', result.messageId);
}
```

#### Récupérer les messages d'un utilisateur
```typescript
const result = await messagesRepo.obtenirMessagesRecusParUtilisateur(userId);

if (result.isFind) {
  console.log('Messages:', result.data);
}
```

#### Accès direct aux sous-repositories
```typescript
// Pour opérations avancées
const messages = await messagesRepo.read.getMessagesWithDetails(messageId);
const isValid = await messagesRepo.validation.messageExists(messageId);
const success = await messagesRepo.write.marquerMessageCommeLu(messageId);
```

## Migration depuis l'Ancien Code

### Ancien code (messageClient.ts, messages.ts)
```typescript
import { Message } from '@/db/clients/messages/messages';
const messageClient = new Message();
const result = await messageClient.envoyerMessage(...);
```

### Nouveau code (repository)
```typescript
import { getMessagesRepository } from '@/db/clients/messages';
const messagesRepo = getMessagesRepository();
const result = await messagesRepo.envoyerMessage({...});
```

**Note**: Les anciens clients restent disponibles pour compatibilité mais sont dépréciés.

## Compatibilité

### Fichiers Legacy
- `messageClient.ts` et `messages.ts` sont conservés
- Exportés depuis `index.ts` pour compatibilité
- À migrer progressivement vers le nouveau repository

### Queries
- `queries.ts` redirige vers `queries/index.ts`
- Anciens imports restent fonctionnels
- Nouveaux imports recommandés depuis `queries/read.queries.ts`, etc.

## Avantages de cette Architecture

1. **Maintenabilité**: Code organisé et facile à localiser
2. **Scalabilité**: Ajout facile de nouvelles fonctionnalités
3. **Testabilité**: Isolation des responsabilités
4. **Type Safety**: TypeScript complet avec types stricts
5. **Réutilisabilité**: Requêtes et logique partagées
6. **Performance**: Optimisation possible par couche
7. **Documentation**: Structure auto-documentée

## Évolutions Futures

- [ ] Ajouter des transactions pour opérations complexes
- [ ] Implémenter un cache pour les types de messages fréquents
- [ ] Ajouter des événements (EventEmitter) pour notifications
- [ ] Créer des indexes sur les requêtes les plus fréquentes
- [ ] Implémenter la pagination pour les listes
- [ ] Ajouter des métriques et monitoring

## Ressources

- Documentation TypeScript: https://www.typescriptlang.org/docs/
- Patterns Repository: https://martinfowler.com/eaaCatalog/repository.html
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html