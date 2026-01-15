# Changelog - Module Professeurs

Toutes les modifications notables de ce module seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [2.0.0] - 2024-01-XX

### 🎉 Refonte majeure - Architecture modulaire

Cette version introduit une refonte complète de l'architecture du module professeurs pour suivre les mêmes patterns que les modules `compte`, `messages` et `paiements`.

### ✨ Ajouté

#### Architecture
- **Repository pattern** : Séparation claire des responsabilités
  - `ProfesseursReadRepository` : Opérations de lecture
  - `ProfesseursWriteRepository` : Opérations d'écriture
  - `ProfesseursValidationRepository` : Validations métier
  - `ProfesseursRepository` : Orchestrateur principal (singleton)

#### Types et DTOs
- `types.ts` : Définitions complètes des types
  - `Professeur` : Type de base
  - `ProfesseurComplet` : Type étendu avec métadonnées
  - `CoursRecurrent` : Type pour les cours
  - `Utilisateur` : Type utilisateur complet
  - `AjouterProfesseurDTO` : DTO pour ajout
  - `AjouterProfesseursBatchDTO` : DTO pour ajout en batch
  - `ModifierStatutProfesseurDTO` : DTO pour modification statut
  - `RetirerPromotionDTO` : DTO pour retrait promotion
  - `ProfesseursSearchResult` : Résultat de recherche
  - `PlanningCoursResult` : Résultat de planning
- Enums :
  - `UserStatus` : Statuts utilisateur
  - `JourSemaine` : Jours de la semaine
- Constantes :
  - `PROFESSEUR_STATUS_ID = 5`
  - `UTILISATEUR_STATUS_ID = 1`
- Type guards :
  - `isProfesseur()`
  - `isProfesseurComplet()`
  - `isCoursRecurrent()`
  - `isUtilisateur()`
  - `isUtilisateurProfesseur()`
- Fonctions de mapping :
  - `mapRowToProfesseur()`
  - `mapRowToProfesseurComplet()`
  - `mapRowToCoursRecurrent()`
  - `mapRowToUtilisateur()`

#### Requêtes SQL organisées
- `queries/read.queries.ts` : Requêtes de lecture (10 requêtes)
- `queries/write.queries.ts` : Requêtes d'écriture (15 requêtes)
- `queries/validation.queries.ts` : Requêtes de validation (23 requêtes)

#### Nouvelles méthodes (API enrichie)
- **Recherche** :
  - `rechercherProfesseurs(searchTerm, limit, offset)` : Recherche par nom/email
  - `compterProfesseurs()` : Compte total des professeurs
  
- **Validation exposée** :
  - `utilisateurExiste(userId)` : Vérifie existence utilisateur
  - `professeurExiste(userId)` : Vérifie existence professeur
  - `estDejaProfesseur(userId)` : Vérifie statut professeur
  - `aProfesseurDesCoursActifs(professeurId)` : Vérifie cours actifs
  - `compterCoursProfesseur(professeurId)` : Compte les cours
  - `emailEstUnique(email)` : Vérifie unicité email
  - `verifierDependancesProfesseur(professeurId)` : Vérifie dépendances

- **Gestion des cours** :
  - `assignerProfesseurACours(coursId, professeurId)` : Assigne à un cours
  - `retirerProfesseurDuCours(coursId, professeurId)` : Retire d'un cours
  - `retirerProfesseurDeTousLesCours(professeurId)` : Retire de tous les cours
  - `obtenirCoursProfesseur(professeurId)` : Récupère les cours

- **Mise à jour** :
  - `mettreAJourUtilisateur(userId, ...)` : Mise à jour complète
  - `mettreAJourEmail(userId, email)` : Mise à jour email
  - `mettreAJourGrade(userId, gradeId)` : Mise à jour grade
  - `promouvoirUtilisateur(userId)` : Promotion avec validation

- **Utilitaires** :
  - `obtenirStatutUtilisateur(userId)` : Récupère le statut

#### Documentation
- `README.md` : Documentation utilisateur complète (700+ lignes)
- `docs/ARCHITECTURE.md` : Documentation d'architecture (430+ lignes)
- `docs/MIGRATION.md` : Guide de migration détaillé (600+ lignes)
- `CHANGELOG.md` : Ce fichier

#### Fonctionnalités
- **Singleton pattern** : Une seule instance du repository principal
- **Validation automatique** : Toutes les opérations d'écriture sont validées
- **Logs structurés** : Logs avec emojis (✅ ⚠️ ❌) pour meilleure lisibilité
- **Gestion d'erreurs** : Messages d'erreur explicites et cohérents
- **Typage fort** : TypeScript strict avec type guards

### 🔄 Modifié

#### Méthodes existantes améliorées
- `ajouterUnProfesseur()` : 
  - ✅ Validation automatique de l'existence des utilisateurs
  - ✅ Validation que l'utilisateur n'est pas déjà professeur
  - ✅ Meilleurs messages d'erreur
  
- `retirerPromotionProfesseur()` :
  - ✅ Validation automatique (existence + pas de cours actifs)
  - ✅ Message d'erreur explicite si cours actifs
  
- `modifierStatutProfesseur()` :
  - ✅ Validation automatique de l'existence
  - ✅ Meilleure gestion d'erreur

- Toutes les méthodes de lecture :
  - ✅ Meilleur typage des retours
  - ✅ Logs structurés
  - ✅ Mapping automatique des résultats DB → TypeScript

### 🔧 Technique

- **Pattern Singleton** : 
  ```typescript
  const repository = getProfesseursRepository();
  ```
  
- **Séparation des requêtes SQL** : 
  - Plus facile à maintenir
  - Plus facile à tester
  - Réutilisables
  
- **Validation centralisée** :
  - Un seul endroit pour les règles métier
  - Cohérence garantie
  
- **Type safety** :
  - Tous les types explicitement définis
  - Aucun `any` dans l'API publique
  - Type guards pour validation runtime

### ⚠️ Déprécié

- `Professeurs` (class) : Le client legacy reste disponible pour compatibilité mais son utilisation est découragée
  - Pas de validation automatique
  - API limitée
  - Sera supprimé dans une version future (v3.0.0)

### 📦 Structure des fichiers

```
professeurs/
├── types.ts                          # Types, interfaces, DTOs, enums
├── queries/                          # Requêtes SQL organisées
│   ├── read.queries.ts              # 10 requêtes SELECT
│   ├── write.queries.ts             # 15 requêtes INSERT/UPDATE/DELETE
│   ├── validation.queries.ts        # 23 requêtes de validation
│   └── index.ts                     # Export centralisé
├── repositories/                     # Couche d'accès aux données
│   ├── read.repository.ts           # 10 méthodes de lecture
│   ├── write.repository.ts          # 15 méthodes d'écriture
│   ├── validation.repository.ts     # 20 méthodes de validation
│   └── index.ts                     # Export centralisé
├── professeurs.repository.ts        # Repository principal (orchestrateur)
├── professeurs.ts                   # Client legacy (compatibilité)
├── index.ts                         # Point d'entrée du module
├── README.md                        # Documentation utilisateur
├── CHANGELOG.md                     # Ce fichier
└── docs/                            # Documentation
    ├── ARCHITECTURE.md              # Documentation d'architecture
    └── MIGRATION.md                 # Guide de migration
```

### 🧪 Tests recommandés

Les tests suivants sont recommandés pour une couverture complète :

#### Tests unitaires
- Tests des repositories individuels (read, write, validation)
- Tests des type guards
- Tests des fonctions de mapping
- Tests du repository principal (orchestration)

#### Tests d'intégration
- Tests des opérations complètes (lecture + validation + écriture)
- Tests des cas d'erreur
- Tests des validations métier

#### Tests de régression
- Vérifier que toutes les anciennes fonctionnalités marchent
- Comparer les résultats ancien vs nouveau client

### 📊 Métriques

- **Lignes de code** : ~3,500 lignes (incluant docs et commentaires)
- **Fichiers TypeScript** : 10 fichiers
- **Fichiers Documentation** : 4 fichiers
- **Types définis** : 15+ types/interfaces
- **Méthodes publiques** : 30+ méthodes
- **Requêtes SQL** : 48 requêtes organisées
- **Couverture documentation** : 100%

### 🔗 Dépendances

- `MysqlConnector` : Gestion des connexions MySQL
- `@clubmanager/types` : Types partagés (pour compatibilité legacy)

### 🚀 Migration

Pour migrer du code existant :

1. **Remplacer l'import** :
   ```typescript
   // Avant
   import { Professeurs } from './db/clients/professeurs/professeurs.js';
   
   // Après
   import { getProfesseursRepository } from './db/clients/professeurs';
   ```

2. **Remplacer l'instanciation** :
   ```typescript
   // Avant
   const professeurs = new Professeurs();
   
   // Après
   const repository = getProfesseursRepository();
   ```

3. **Utiliser normalement** :
   ```typescript
   // Les signatures de méthodes sont identiques
   const result = await repository.obtenirLesProfesseurs();
   ```

Consultez [docs/MIGRATION.md](./docs/MIGRATION.md) pour un guide détaillé.

### 🎯 Compatibilité

- ✅ **Rétrocompatibilité** : Client legacy disponible
- ✅ **Migration progressive** : Les deux APIs coexistent
- ✅ **Même base de données** : Aucun changement de schéma requis
- ✅ **TypeScript** : Support complet
- ✅ **JavaScript** : Support via imports ES6

### 📝 Notes de version

Cette version majeure (2.0.0) introduit des changements architecturaux importants mais maintient la compatibilité avec le code existant via le client legacy.

**Recommandation** : Migrer progressivement vers la nouvelle API pour bénéficier :
- De la validation automatique
- Des nouvelles fonctionnalités
- D'un meilleur typage
- D'une meilleure maintenabilité

### 🙏 Remerciements

Architecture inspirée des modules :
- `compte/` : Architecture de référence
- `messages/` : Patterns validés
- `paiements/` : Structure cohérente

---

## [1.0.0] - (Date antérieure)

### Initial

Version initiale avec le client `Professeurs` (class).

Fonctionnalités de base :
- `obtenirLesProfesseurs()`
- `obtenirProfesseurParId(id)`
- `modifierStatutProfesseur(id, status_id)`
- `retirerPromotionProfesseur(id)`
- `ajouterUnProfesseur(userData)`
- `obtenirPlanningCoursProfesseur(inputId)`
- `obtenirUtilisateurParId(id)`

---

## Prochaines versions

### [2.1.0] - Prévu

- [ ] GraphQL : Ajout de typeDefs et resolvers
- [ ] Cache : Implémentation d'un cache Redis
- [ ] Events : Émission d'événements lors des changements
- [ ] Audit : Logging des changements de statut

### [3.0.0] - Prévu (Breaking changes)

- [ ] Suppression du client legacy `Professeurs`
- [ ] Migration obligatoire vers `ProfesseursRepository`
- [ ] Nouvelles fonctionnalités nécessitant des breaking changes

---

**Pour plus d'informations** :
- Documentation complète : [README.md](./README.md)
- Architecture : [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Guide de migration : [docs/MIGRATION.md](./docs/MIGRATION.md)