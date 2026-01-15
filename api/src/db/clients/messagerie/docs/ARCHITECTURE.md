# Architecture du Module Messagerie

## Vue d'ensemble

Le module Messagerie gère l'ensemble des communications internes et externes de l'application ClubManager. Il suit une architecture modulaire avec séparation des responsabilités.

## Structure des dossiers

```
messagerie/
├── docs/                           # Documentation
│   └── ARCHITECTURE.md            # Ce fichier
├── queries/                        # Requêtes SQL modulaires
│   ├── index.ts                   # Point d'entrée des queries
│   ├── read.queries.ts            # Requêtes SELECT
│   ├── write.queries.ts           # Requêtes INSERT/UPDATE/DELETE
│   └── validation.queries.ts      # Requêtes de validation
├── repositories/                   # Repositories modulaires
│   ├── read.repository.ts         # Opérations de lecture
│   ├── write.repository.ts        # Opérations d'écriture
│   └── validation.repository.ts   # Opérations de validation
├── utils/                          # Utilitaires (à créer si nécessaire)
├── emailClient.ts                  # Client pour envoi d'emails externes
├── messageClient.ts                # Client hybride (legacy)
├── messagerieClient.ts             # Client pour messages internes (legacy)
├── messagerie.repository.ts        # Repository principal (orchestrateur)
├── index.ts                        # Point d'entrée du module
├── queries.ts                      # Fichier de compatibilité
└── types.ts                        # Définitions TypeScript
```

## Architecture en couches

### 1. Couche de présentation (Point d'entrée)
- **index.ts**: Exporte tous les éléments publics du module
- Fournit une API simple et cohérente

### 2. Couche orchestration
- **messagerie.repository.ts**: Repository principal
  - Orchestre les appels aux sous-repositories
  - Gère la logique métier complexe
  - Pattern Singleton

### 3. Couche de données (Repositories modulaires)
- **read.repository.ts**: Toutes les opérations de lecture (SELECT)
- **write.repository.ts**: Toutes les opérations d'écriture (INSERT/UPDATE/DELETE)
- **validation.repository.ts**: Validation et vérification de données

### 4. Couche de requêtes SQL
- **queries/read.queries.ts**: Requêtes SELECT
- **queries/write.queries.ts**: Requêtes INSERT/UPDATE/DELETE
- **queries/validation.queries.ts**: Requêtes de validation (COUNT, EXISTS)

### 5. Couche de types
- **types.ts**: Définitions TypeScript complètes
  - Types d'entités
  - Types de données pour opérations
  - Types de résultats
  - Types SQL (raw DB rows)
  - Enums
  - Type guards

### 6. Clients spécialisés (Legacy - à migrer progressivement)
- **emailClient.ts**: Envoi d'emails via service externe
- **messageClient.ts**: Client hybride
- **messagerieClient.ts**: Gestion des messages internes

## Entités principales

### 1. Types de messages (`types_messages_personnalises`)
Templates de messages réutilisables avec titre et contenu.

### 2. Messages personnalisés (`messages_personnalises`)
Messages envoyés aux utilisateurs individuels.

### 3. Templates d'email (`email_templates`)
Templates pour les emails externes avec variables dynamiques.

### 4. Historique des messages (`historique_messages`)
Traçabilité de tous les messages envoyés avec statut et erreurs.

### 5. Utilisateurs (`utilisateurs`)
Destinataires des messages.

## Flux de données

### Envoi d'un message
```
1. Controller/Service
   ↓
2. MessagerieRepository (orchestration)
   ↓
3. ValidationRepository (vérification)
   ↓
4. ReadRepository (récupération du template)
   ↓
5. WriteRepository (insertion des messages)
   ↓
6. Base de données
```

### Lecture de messages
```
1. Controller/Service
   ↓
2. MessagerieRepository
   ↓
3. ReadRepository
   ↓
4. Base de données
```

## Principes de conception

### 1. Séparation des responsabilités
- Chaque repository a une responsabilité unique
- Les queries SQL sont isolées des repositories
- Les types sont centralisés

### 2. Pattern Repository
- Abstraction de la couche de données
- Facilite les tests unitaires
- Permet de changer facilement la source de données

### 3. Pattern Singleton
- Une seule instance du repository principal
- Évite les connexions multiples
- Performance optimisée

### 4. Programmation asynchrone
- Toutes les méthodes retournent des Promises
- Support de async/await
- Gestion d'erreurs cohérente

### 5. Type Safety
- TypeScript strict
- Types explicites partout
- Validation des données à la compilation

## Compatibilité

### Fichiers de compatibilité
- **queries.ts**: Redirige vers queries/index.ts
- Permet une migration progressive du code existant

### Clients legacy
Les anciens clients (emailClient, messageClient, messagerieClient) sont conservés pour :
- Compatibilité avec le code existant
- Migration progressive
- Fonctionnalités spécialisées (envoi d'emails externes)

## Conventions de nommage

### Méthodes de lecture
- `get*`: Récupération d'une ou plusieurs entités
- `getAll*`: Récupération de toutes les entités
- `find*`: Recherche avec critères

### Méthodes d'écriture
- `create*`: Création d'une nouvelle entité
- `update*`: Mise à jour d'une entité existante
- `delete*`: Suppression d'une entité
- `envoyer*`: Envoi de messages
- `marquer*`: Marquage de statut

### Méthodes de validation
- `*Exists`: Vérification d'existence
- `is*`: Vérification d'état/propriété
- `check*`: Validation complexe

### Méthodes de statistiques
- `get*Stats`: Statistiques globales
- `count*`: Comptage
- `getTaux*`: Calcul de taux/pourcentages

## Gestion des erreurs

### Stratégie
- Les repositories rejettent les Promises en cas d'erreur SQL
- Le repository principal peut enrichir les erreurs
- Le code appelant doit gérer les erreurs avec try/catch

### Types d'erreurs courantes
- Erreur de connexion à la base de données
- Entité non trouvée
- Violation de contraintes
- Données invalides

## Performance

### Optimisations
1. **Requêtes préparées**: Toutes les queries utilisent des paramètres (?)
2. **Sélection ciblée**: SELECT uniquement les colonnes nécessaires
3. **Indexes**: Utilisation d'index sur les clés étrangères
4. **Limites**: Pagination sur les requêtes volumineuses
5. **Singleton**: Réutilisation de la connexion

### Bonnes pratiques
- Limiter le nombre de résultats avec LIMIT
- Utiliser les JOINs plutôt que des requêtes multiples
- Éviter SELECT * en production
- Créer des indexes sur les colonnes fréquemment recherchées

## Sécurité

### Protection SQL Injection
- Utilisation exclusive de requêtes préparées
- Validation des paramètres
- Pas de concaténation de SQL

### Validation des données
- Vérification des types
- Validation des emails
- Contrôle des autorisations (utilisateur actif, etc.)

## Tests

### Structure de tests recommandée
```
__tests__/
├── repositories/
│   ├── read.repository.test.ts
│   ├── write.repository.test.ts
│   └── validation.repository.test.ts
├── messagerie.repository.test.ts
└── integration.test.ts
```

### Types de tests
1. **Tests unitaires**: Chaque méthode de repository
2. **Tests d'intégration**: Flux complets
3. **Tests de validation**: Contraintes et règles métier

## Migration depuis l'ancien code

### Étapes recommandées

1. **Phase 1**: Nouveaux développements
   - Utiliser le nouveau repository pour tout nouveau code
   - Import depuis index.ts

2. **Phase 2**: Migration progressive
   - Identifier les usages de l'ancien code
   - Remplacer par les nouvelles méthodes
   - Tester chaque remplacement

3. **Phase 3**: Nettoyage
   - Supprimer les anciens clients une fois inutilisés
   - Nettoyer les imports
   - Mettre à jour la documentation

### Mapping ancien → nouveau

```typescript
// Ancien
import { getMessagerieClient } from './messagerie/messagerieClient.js';
const client = getMessagerieClient();
await client.getAllTypesMessages();

// Nouveau
import { getMessagerieRepository } from './messagerie/index.js';
const repo = getMessagerieRepository();
await repo.getAllTypesMessages();
```

## Améliorations futures

### Court terme
1. Ajouter le champ `lu` à la table `messages_personnalises`
2. Créer des utilitaires de parsing/transformation
3. Ajouter des tests unitaires complets

### Moyen terme
1. Implémenter un système de notifications en temps réel
2. Ajouter un système de templates avec variables dynamiques
3. Créer un système de priorités pour les messages

### Long terme
1. Migrer vers une queue de messages (RabbitMQ, Redis)
2. Implémenter un système de retry automatique
3. Ajouter des analytics avancés

## Ressources

### Documentation connexe
- Guide d'utilisation: docs/USAGE.md (à créer)
- Exemples: docs/EXAMPLES.md (à créer)
- Changelog: docs/CHANGELOG.md (à créer)

### Dépendances
- MysqlConnector: Connexion à la base de données
- TypeScript: Typage statique

## Contact et support

Pour toute question ou suggestion d'amélioration, contacter l'équipe de développement.