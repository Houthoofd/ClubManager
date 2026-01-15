# Architecture du module Professeurs

## Vue d'ensemble

Le module `professeurs` suit une architecture modulaire en couches, séparant clairement les responsabilités entre lecture, écriture et validation. Cette architecture est alignée sur les modules `messages`, `paiements` et `compte`.

## Structure des dossiers

```
professeurs/
├── types.ts                          # Types, interfaces, DTOs, enums
├── queries/                          # Requêtes SQL organisées
│   ├── read.queries.ts              # Requêtes SELECT
│   ├── write.queries.ts             # Requêtes INSERT/UPDATE/DELETE
│   ├── validation.queries.ts        # Requêtes de validation
│   └── index.ts                     # Export centralisé
├── repositories/                     # Couche d'accès aux données
│   ├── read.repository.ts           # Opérations de lecture
│   ├── write.repository.ts          # Opérations d'écriture
│   ├── validation.repository.ts     # Opérations de validation
│   └── index.ts                     # Export centralisé
├── professeurs.repository.ts        # Repository principal (orchestrateur)
├── professeurs.ts                   # Client legacy (compatibilité)
├── index.ts                         # Point d'entrée du module
├── docs/                            # Documentation
│   └── ARCHITECTURE.md              # Ce fichier
└── README.md                        # Documentation utilisateur

```

## Principes architecturaux

### 1. Séparation des responsabilités

- **types.ts** : Définitions de types, DTOs, enums, type guards, fonctions de mapping
- **queries/** : Requêtes SQL pures, sans logique métier
- **repositories/** : Logique d'accès aux données, orchestration des requêtes
- **professeurs.repository.ts** : Orchestrateur principal, validation métier, coordination

### 2. Pattern Repository

Le pattern Repository est utilisé pour encapsuler la logique d'accès aux données :

- `ProfesseursReadRepository` : Toutes les opérations de lecture
- `ProfesseursWriteRepository` : Toutes les opérations d'écriture
- `ProfesseursValidationRepository` : Toutes les validations
- `ProfesseursRepository` : Orchestrateur qui coordonne les trois repositories

### 3. Pattern Singleton

Le repository principal utilise le pattern Singleton pour garantir une seule instance :

```typescript
const repository = getProfesseursRepository();
```

### 4. Typage fort

Tous les types sont explicitement définis et utilisés partout dans le module :
- Types de base : `Professeur`, `ProfesseurComplet`, `CoursRecurrent`, `Utilisateur`
- DTOs : `AjouterProfesseurDTO`, `ModifierStatutProfesseurDTO`, etc.
- Résultats : `ConfirmationResult`, `VerifyResultWithData`, `ProfesseursSearchResult`

## Flux de données

### Lecture de données

```
Client
  ↓
ProfesseursRepository.obtenirLesProfesseurs()
  ↓
ProfesseursReadRepository.getAllProfesseurs()
  ↓
MysqlConnector.query(GET_ALL_PROFESSEURS)
  ↓
Database
  ↓
mapRowToProfesseur() pour chaque ligne
  ↓
Retour au client
```

### Écriture de données (avec validation)

```
Client
  ↓
ProfesseursRepository.ajouterUnProfesseur(userData)
  ↓
ProfesseursValidationRepository.validatePromotionToProfesseur()
  ├── userExists()
  ├── isUserAlreadyProfesseur()
  └── validateUserData()
  ↓
ProfesseursWriteRepository.ajouterUnProfesseur(dto)
  ↓
MysqlConnector.query(PROMOTE_USER_TO_PROFESSEUR)
  ↓
Database
  ↓
Retour au client
```

## Couches du module

### 1. Couche Types (`types.ts`)

Définit toutes les structures de données :
- **Types de base** : `Professeur`, `ProfesseurComplet`, `CoursRecurrent`, `Utilisateur`
- **DTOs** : Objets de transfert pour les opérations d'écriture
- **Résultats** : Structures de retour standardisées
- **Enums** : `UserStatus`, `JourSemaine`
- **Constantes** : `PROFESSEUR_STATUS_ID`, `UTILISATEUR_STATUS_ID`
- **Type Guards** : Fonctions de validation de types runtime
- **Mappers** : Fonctions de conversion DB → TypeScript

### 2. Couche Queries (`queries/`)

Contient les requêtes SQL pures, organisées par type :

#### read.queries.ts
- `GET_ALL_PROFESSEURS` : Récupère tous les professeurs
- `GET_PROFESSEUR_BY_ID` : Récupère un professeur par ID
- `GET_UTILISATEUR_BY_ID` : Récupère un utilisateur par ID
- `GET_PLANNING_COURS_PROFESSEUR` : Planning des cours d'un professeur
- `SEARCH_PROFESSEURS` : Recherche de professeurs
- `COUNT_PROFESSEURS` : Compte les professeurs

#### write.queries.ts
- `UPDATE_USER_STATUS` : Modifie le statut d'un utilisateur
- `PROMOTE_USER_TO_PROFESSEUR` : Promeut un utilisateur
- `DEMOTE_PROFESSEUR_TO_USER` : Rétrograde un professeur
- `ASSIGN_PROFESSEUR_TO_COURS` : Assigne à un cours
- `REMOVE_PROFESSEUR_FROM_COURS` : Retire d'un cours
- `UPDATE_USER_INFO` : Met à jour les informations

#### validation.queries.ts
- `USER_EXISTS` : Vérifie l'existence d'un utilisateur
- `PROFESSEUR_EXISTS` : Vérifie l'existence d'un professeur
- `IS_USER_ALREADY_PROFESSEUR` : Vérifie le statut professeur
- `EMAIL_EXISTS` : Vérifie l'unicité d'un email
- `HAS_ACTIVE_COURS` : Vérifie les cours actifs
- `CAN_DEMOTE_PROFESSEUR` : Vérifie si peut rétrograder

### 3. Couche Repositories (`repositories/`)

#### ProfesseursReadRepository
Opérations de lecture seules :
- `getAllProfesseurs()` : Liste tous les professeurs
- `getProfesseurById()` : Récupère un professeur
- `getUtilisateurById()` : Récupère un utilisateur
- `searchProfesseurs()` : Recherche de professeurs
- `getPlanningCoursProfesseur()` : Planning des cours
- `countProfesseurs()` : Compte les professeurs

#### ProfesseursWriteRepository
Opérations d'écriture seules :
- `modifierStatutProfesseur()` : Modifie le statut
- `promoteUserToProfesseur()` : Promeut un utilisateur
- `retirerPromotionProfesseur()` : Retire la promotion
- `ajouterUnProfesseur()` : Ajoute/promeut des professeurs
- `assignProfesseurToCours()` : Assigne à un cours
- `removeProfesseurFromCours()` : Retire d'un cours
- `updateUserInfo()` : Met à jour les informations

#### ProfesseursValidationRepository
Opérations de validation seules :
- `userExists()` : Vérifie l'existence
- `professeurExists()` : Vérifie l'existence du professeur
- `isUserAlreadyProfesseur()` : Vérifie le statut
- `canUserBePromoted()` : Vérifie si peut être promu
- `emailExists()` : Vérifie l'unicité de l'email
- `hasActiveCours()` : Vérifie les cours actifs
- `canDemoteProfesseur()` : Vérifie si peut rétrograder
- `validatePromotionToProfesseur()` : Validation complète de promotion
- `validateDemotionFromProfesseur()` : Validation complète de rétrogradation

### 4. Repository Principal (`professeurs.repository.ts`)

Orchestrateur qui :
1. Coordonne les opérations entre les 3 repositories
2. Applique les règles métier
3. Valide les données avant les opérations d'écriture
4. Fournit une API de haut niveau

**Méthodes principales** :
- `obtenirLesProfesseurs()` : Liste des professeurs
- `obtenirProfesseurParId()` : Récupère un professeur
- `obtenirUtilisateurParId()` : Récupère un utilisateur
- `obtenirPlanningCoursProfesseur()` : Planning des cours
- `ajouterUnProfesseur()` : Ajoute/promeut des professeurs (avec validation)
- `modifierStatutProfesseur()` : Modifie le statut (avec validation)
- `retirerPromotionProfesseur()` : Retire la promotion (avec validation)
- `assignerProfesseurACours()` : Assigne à un cours (avec validation)
- `retirerProfesseurDuCours()` : Retire d'un cours
- `mettreAJourUtilisateur()` : Met à jour les informations (avec validation)

## Utilisation

### Import du module

```typescript
// Import du repository principal (recommandé)
import { getProfesseursRepository } from './db/clients/professeurs';

// Import de types spécifiques
import type { Professeur, ProfesseurComplet } from './db/clients/professeurs';

// Import du client legacy (déprécié, pour compatibilité)
import { Professeurs } from './db/clients/professeurs';
```

### Exemples d'utilisation

#### Récupérer tous les professeurs

```typescript
const repository = getProfesseursRepository();

const result = await repository.obtenirLesProfesseurs();
if (result.isFind) {
  console.log(`${result.data.length} professeurs trouvés`);
  result.data.forEach(prof => {
    console.log(`${prof.prenom} ${prof.nom} - ${prof.email}`);
  });
}
```

#### Récupérer un professeur par ID

```typescript
const professeur = await repository.obtenirProfesseurParId(123);
if (professeur) {
  console.log(`Professeur: ${professeur.prenom} ${professeur.nom}`);
}
```

#### Promouvoir un utilisateur en professeur

```typescript
const result = await repository.ajouterUnProfesseur({ id: 456 });
if (result.isConfirm) {
  console.log('Utilisateur promu professeur avec succès');
} else {
  console.error('Erreur:', result.message);
}
```

#### Promouvoir plusieurs utilisateurs en batch

```typescript
const result = await repository.ajouterUnProfesseur({
  utilisateurs: [456, 789, 101]
});
console.log(result.message);
```

#### Retirer la promotion d'un professeur

```typescript
const result = await repository.retirerPromotionProfesseur(123);
if (result.isConfirm) {
  console.log('Promotion retirée avec succès');
} else {
  console.error('Erreur:', result.message);
}
```

#### Récupérer le planning d'un professeur

```typescript
const planning = await repository.obtenirPlanningCoursProfesseur(123);
if (planning.isFind) {
  planning.data.forEach(cours => {
    console.log(`${cours.type_cours} - ${cours.jour_semaine} ${cours.heure_debut}`);
  });
}
```

#### Assigner un professeur à un cours

```typescript
const result = await repository.assignerProfesseurACours(coursId, professeurId);
if (result.isConfirm) {
  console.log('Professeur assigné au cours');
}
```

#### Valider avant une opération

```typescript
// Vérifier si un utilisateur existe
const exists = await repository.utilisateurExiste(123);

// Vérifier si un utilisateur est déjà professeur
const isProfesseur = await repository.estDejaProfesseur(123);

// Vérifier si un professeur a des cours actifs
const hasActiveCours = await repository.aProfesseurDesCoursActifs(123);

// Vérifier les dépendances d'un professeur
const deps = await repository.verifierDependancesProfesseur(123);
console.log(`Cours récurrents: ${deps.coursCount}`);
console.log(`Cours ponctuels: ${deps.coursPonctuelsCount}`);
```

## Migration du code legacy

### Avant (client legacy)

```typescript
import { Professeurs } from './db/clients/professeurs/professeurs.js';

const professeurs = new Professeurs();
const result = await professeurs.obtenirLesProfesseurs();
```

### Après (nouveau repository)

```typescript
import { getProfesseursRepository } from './db/clients/professeurs';

const repository = getProfesseursRepository();
const result = await repository.obtenirLesProfesseurs();
```

**Avantages de la migration** :
- ✅ Singleton : pas de `new` nécessaire
- ✅ Validation automatique des données
- ✅ Meilleur typage TypeScript
- ✅ Séparation des responsabilités
- ✅ Facilité de test (mockable)
- ✅ Logs structurés

## Gestion des erreurs

Le module utilise une gestion d'erreurs cohérente :

### Opérations de lecture
- Retournent `null` si non trouvé
- Lancent une exception en cas d'erreur DB

### Opérations d'écriture
- Retournent `ConfirmationResult` avec `isConfirm` et `message`
- Validations avant écriture
- Messages d'erreur explicites

### Opérations de validation
- Retournent des booléens ou des objets de validation
- Ne lancent pas d'exceptions (sauf erreur DB critique)

## Logging

Le module utilise `console.log` et `console.error` pour les logs :
- ✅ Succès : `console.log('✅ ...')`
- ⚠️ Avertissements : `console.log('⚠️ ...')`
- ❌ Erreurs : `console.error('Erreur ...')`

## Tests

### Tests unitaires recommandés

```typescript
describe('ProfesseursRepository', () => {
  describe('obtenirLesProfesseurs', () => {
    it('devrait retourner tous les professeurs', async () => {
      const result = await repository.obtenirLesProfesseurs();
      expect(result.isFind).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('ajouterUnProfesseur', () => {
    it('devrait promouvoir un utilisateur', async () => {
      const result = await repository.ajouterUnProfesseur({ id: 123 });
      expect(result.isConfirm).toBe(true);
    });

    it('devrait rejeter si utilisateur n\'existe pas', async () => {
      const result = await repository.ajouterUnProfesseur({ id: 99999 });
      expect(result.isConfirm).toBe(false);
    });
  });

  describe('retirerPromotionProfesseur', () => {
    it('devrait rejeter si professeur a des cours actifs', async () => {
      const result = await repository.retirerPromotionProfesseur(123);
      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('cours actifs');
    });
  });
});
```

## Dépendances

- `MysqlConnector` : Gestion des connexions MySQL
- `@clubmanager/types` : Types partagés (pour compatibilité legacy)

## Évolutions futures

### Prochaines étapes

1. **GraphQL** : Ajouter des resolvers GraphQL pour exposer l'API
2. **Tests** : Implémenter les tests unitaires et d'intégration
3. **Cache** : Ajouter un cache Redis pour les lectures fréquentes
4. **Events** : Émettre des événements lors des changements de statut
5. **Audit** : Logger les changements de statut professeur
6. **Permissions** : Vérifier les permissions utilisateur avant les opérations

### Améliorations possibles

- Pagination avancée pour `getAllProfesseurs`
- Filtres et tri pour la recherche
- Bulk operations optimisées
- Soft delete au lieu de hard delete
- Historique des modifications de statut
- Notifications par email lors de promotion/rétrogradation

## Conformité

Ce module suit les mêmes conventions que :
- ✅ `compte/` : Architecture de référence
- ✅ `messages/` : Patterns validés
- ✅ `paiements/` : Structure cohérente

## Support

Pour toute question ou problème :
1. Consulter ce fichier ARCHITECTURE.md
2. Consulter le README.md du module
3. Consulter les exemples d'utilisation dans les tests
4. Contacter l'équipe de développement