# Tests des Repositories - Documentation

Ce document décrit les tests unitaires créés pour les différents repositories du projet ClubManager.

## 📋 Vue d'ensemble

Des tests complets ont été créés pour les repositories suivants :
- ✅ **Alertes** - Repository des alertes et notifications
- ✅ **Auth** - Repository d'authentification
- ✅ **Commandes** - Repository de gestion des commandes
- ✅ **Cours** - Repository de gestion des cours
- ⏳ **Compte** - (Tests existants à améliorer)
- ⏳ **Informations** - (Tests existants à améliorer)

## 🗂️ Structure des tests

```
api/src/__tests__/db/clients/
├── alertes/
│   └── alertes.test.ts
├── auth/
│   └── auth.test.ts
├── commandes/
│   └── commandes.test.ts
├── cours/
│   └── cours.repository.test.ts
├── compte/
│   └── compte.test.ts (existant)
└── informations/
    └── informations.test.ts (existant)
```

## 🧪 Tests Alertes (`alertes.test.ts`)

### Couverture
- ✅ Récupération du dashboard des alertes
- ✅ Récupération des alertes actives
- ✅ Récupération des alertes par utilisateur
- ✅ Récupération des statistiques des alertes
- ✅ Gestion des erreurs de base de données
- ✅ Gestion des cas limites (null, undefined, timeout)

### Méthodes testées
```typescript
- obtenirDashboard()
- obtenirAlertesActives()
- obtenirAlertesUtilisateur(userId)
- obtenirStatistiques()
```

### Nombre de tests : 23 tests

## 🔐 Tests Auth (`auth.test.ts`)

### Couverture
- ✅ Recherche d'utilisateur par email
- ✅ Recherche d'utilisateur actif
- ✅ Vérification de l'existence d'un email
- ✅ Récupération des informations de sécurité
- ✅ Vérification des tokens de récupération
- ✅ Comptage des tentatives de connexion/récupération
- ✅ Gestion des utilisateurs par ID
- ✅ Listage des tokens
- ✅ Comptage des utilisateurs actifs
- ✅ Méthode queryAsync pour requêtes génériques

### Méthodes testées
```typescript
- rechercherUtilisateurParEmail(email)
- rechercherUtilisateurActifParEmail(email)
- emailExiste(email)
- obtenirInformationsSecurite(userId)
- verifierTokenRecuperation(token)
- verifierTentativesRecuperationRecentes(email, minutes?)
- obtenirTentativesConnexionRecentes(email, minutes?)
- obtenirUtilisateurParId(userId)
- listerTokensUtilisateur(userId)
- compterUtilisateursActifs()
- queryAsync(sql, params?)
```

### Nombre de tests : 47 tests

## 🛒 Tests Commandes (`commandes.test.ts`)

### Couverture

#### Opérations de lecture
- ✅ findAll() - Toutes les commandes
- ✅ findById() - Commande par ID
- ✅ findByUserId() - Commandes d'un utilisateur
- ✅ findByStatut() - Commandes par statut
- ✅ findByPaymentIntent() - Commande par payment intent
- ✅ getRecentUserCommandes() - Commandes récentes d'un utilisateur

#### Opérations d'écriture
- ✅ create() - Création de commande
- ✅ updateStatut() - Mise à jour du statut
- ✅ updateTotal() - Mise à jour du total
- ✅ updateArticles() - Mise à jour des articles
- ✅ updatePaymentIntent() - Mise à jour du payment intent
- ✅ update() - Mise à jour générale
- ✅ delete() - Suppression
- ✅ deleteByUser() - Suppression par utilisateur
- ✅ deleteOldCancelled() - Nettoyage des commandes annulées

#### Statistiques
- ✅ getStatistiques() - Statistiques globales
- ✅ countByStatut() - Comptage par statut
- ✅ getStatsByPeriod() - Stats par période
- ✅ getTopProduits() - Top produits
- ✅ getPanierMoyen() - Panier moyen
- ✅ getTauxConversion() - Taux de conversion

#### Recherche
- ✅ search() - Recherche multi-critères
- ✅ searchByEmail() - Recherche par email
- ✅ searchByMontantRange() - Recherche par montant

#### Validation
- ✅ exists() - Vérification d'existence
- ✅ userExists() - Vérification utilisateur
- ✅ canBeCancelled() - Possibilité d'annulation
- ✅ checkValidStatut() - Validation du statut
- ✅ isValidStatusTransition() - Transition de statut valide
- ✅ checkValidMontant() - Validation du montant
- ✅ userCanOrder() - Utilisateur peut commander

### Nombre de tests : 68 tests

## 📚 Tests Cours (`cours.repository.test.ts`)

### Couverture

#### Opérations de lecture basiques
- ✅ findAll() - Tous les cours
- ✅ findById() - Cours par ID
- ✅ findByWeek() - Cours par semaine
- ✅ findByDateRange() - Cours par plage de dates
- ✅ findFutureCours() - Cours futurs

#### Opérations avec relations
- ✅ findByIdWithProfesseurs() - Cours avec professeurs
- ✅ findAllWithProfesseurs() - Tous les cours avec professeurs
- ✅ getParticipantsByCours() - Participants d'un cours
- ✅ getCoursByUser() - Cours d'un utilisateur

#### Cours récurrents
- ✅ findAllCoursRecurrents() - Tous les cours récurrents
- ✅ findCoursRecurrentById() - Cours récurrent par ID
- ✅ findCoursRecurrentsByDay() - Cours récurrents par jour
- ✅ getJoursDeCours() - Jours de cours

#### Opérations d'écriture
- ✅ createCours() - Création de cours
- ✅ createCoursRecurrent() - Création de cours récurrent
- ✅ updateCours() - Mise à jour de cours
- ✅ updateCoursActif() - Mise à jour du statut actif
- ✅ updateCoursCapacite() - Mise à jour de la capacité
- ✅ deleteCours() - Suppression de cours
- ✅ softDeleteCours() - Suppression soft
- ✅ deleteCoursRecurrent() - Suppression cours récurrent

#### Gestion des professeurs
- ✅ associerProfesseur() - Association d'un professeur
- ✅ associerProfesseurs() - Association de plusieurs professeurs
- ✅ deleteProfesseursByCoursRecurrent() - Suppression des professeurs
- ✅ createProfesseur() - Création de professeur

#### Inscriptions
- ✅ inscrireUtilisateur() - Inscription d'un utilisateur
- ✅ desinscrireUtilisateur() - Désinscription
- ✅ deleteInscriptionsByCours() - Suppression des inscriptions par cours
- ✅ deleteInscriptionsByUser() - Suppression des inscriptions par utilisateur
- ✅ marquerPresence() - Marquage de présence
- ✅ validerPresence() - Validation de présence
- ✅ annulerPresence() - Annulation de présence
- ✅ verifierInscription() - Vérification d'inscription
- ✅ getInscriptionById() - Inscription par ID
- ✅ getInscriptionsByUser() - Inscriptions par utilisateur
- ✅ getInscriptionsByCours() - Inscriptions par cours
- ✅ countPresentsByCours() - Comptage des présents
- ✅ countAbsentsByCours() - Comptage des absents

#### Statistiques
- ✅ getStatistiquesPresenceCours() - Stats de présence par cours
- ✅ getStatistiquesGlobales() - Statistiques globales
- ✅ getStatistiquesPresenceUtilisateur() - Stats de présence utilisateur
- ✅ getStatistiquesParTypeCours() - Stats par type
- ✅ getCoursPlusPopulaires() - Cours les plus populaires
- ✅ countTotalCours() - Comptage total des cours
- ✅ countTotalParticipants() - Comptage total des participants

#### Validation
- ✅ inscriptionExists() - Vérification d'existence d'inscription
- ✅ coursExists() - Vérification d'existence de cours
- ✅ coursRecurrentExists() - Vérification cours récurrent
- ✅ professeurExists() - Vérification professeur
- ✅ checkUserCanRegister() - Vérification possibilité d'inscription
- ✅ checkCoursIsFull() - Vérification si cours complet
- ✅ checkDuplicateInscription() - Vérification doublon
- ✅ validateCapacite() - Validation de la capacité
- ✅ checkCoursIsPast() - Vérification si cours passé

### Nombre de tests : 69 tests

## 🏃‍♂️ Exécution des tests

### Tous les tests des repositories clients
```bash
npm run test:db:windows
```

### Tests spécifiques par module
```bash
# Tests alertes
npx jest src/__tests__/db/clients/alertes

# Tests auth
npx jest src/__tests__/db/clients/auth

# Tests commandes
npx jest src/__tests__/db/clients/commandes

# Tests cours
npx jest src/__tests__/db/clients/cours

# Tests compte
npx jest src/__tests__/db/clients/compte

# Tests informations
npx jest src/__tests__/db/clients/informations
```

### Tests avec couverture
```bash
npx jest --coverage src/__tests__/db/clients
```

## 📊 Statistiques globales

| Module | Fichiers de test | Nombre de tests | Statut |
|--------|-----------------|-----------------|--------|
| Alertes | 1 | 23 | ✅ Complet |
| Auth | 1 | 47 | ✅ Complet |
| Commandes | 1 | 68 | ✅ Complet |
| Cours | 1 | 69 | ✅ Complet |
| Compte | 1 | - | ⚠️ Existant |
| Informations | 1 | - | ⚠️ Existant |
| **TOTAL** | **6** | **207+** | **En cours** |

## 🎯 Patterns de test utilisés

### 1. Mocking des dépendances
```typescript
jest.mock('../../../../db/connector/mysqlconnector.js');
jest.mock('../../../../db/clients/commandes/repositories/read.repository.js');
```

### 2. Setup et cleanup
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Setup du repository et des mocks
});
```

### 3. Tests positifs et négatifs
```typescript
it('should return data when successful', async () => {
  // Test du cas de succès
});

it('should handle errors gracefully', async () => {
  // Test de la gestion d'erreur
});
```

### 4. Tests des cas limites
```typescript
it('should handle null values', async () => {
  // Test des valeurs null
});

it('should handle empty arrays', async () => {
  // Test des tableaux vides
});
```

## 🔧 Configuration Jest

Le fichier `jest.config.cjs` est configuré pour :
- ✅ Support TypeScript avec ts-jest
- ✅ Modules ESM
- ✅ Mocks des dépendances MySQL
- ✅ Timeout de 30 secondes
- ✅ Environnement Node.js

## 📝 Bonnes pratiques appliquées

1. **Isolation des tests** : Chaque test est indépendant
2. **Nommage clair** : Les noms de tests décrivent clairement ce qui est testé
3. **AAA Pattern** : Arrange, Act, Assert
4. **Mock approprié** : Les dépendances externes sont mockées
5. **Couverture complète** : Tests des succès, erreurs et cas limites
6. **Documentation** : Commentaires et descriptions claires

## 🚀 Prochaines étapes

### Tests à améliorer
- [ ] Améliorer les tests du module `compte`
- [ ] Améliorer les tests du module `informations`
- [ ] Ajouter des tests d'intégration
- [ ] Ajouter des tests de performance

### Fonctionnalités à tester
- [ ] Tests des transactions
- [ ] Tests des stored procedures
- [ ] Tests de concurrence
- [ ] Tests de sécurité

## 📚 Ressources

- [Documentation Jest](https://jestjs.io/)
- [Documentation ts-jest](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. Créer un nouveau fichier `*.test.ts` dans le dossier approprié
2. Suivre la structure existante
3. Mocker les dépendances nécessaires
4. Tester les cas de succès, d'erreur et limites
5. Documenter les tests ajoutés dans ce README

## ⚠️ Notes importantes

- Les tests utilisent des mocks et ne se connectent pas à une vraie base de données
- Le timeout par défaut est de 30 secondes
- Les tests sont exécutés en mode ESM
- Toujours exécuter `jest.clearAllMocks()` dans `beforeEach()`

---

**Dernière mise à jour** : 2024
**Mainteneur** : Équipe ClubManager