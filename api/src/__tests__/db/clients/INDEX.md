# 📑 Index des Tests - Repositories ClubManager

Ce fichier sert d'index pour naviguer rapidement entre les différents fichiers de tests des repositories.

## 🗂️ Organisation des Tests

```
api/src/__tests__/db/clients/
├── 📄 INDEX.md (ce fichier)
├── 📄 README_TESTS.md (documentation complète)
├── 📄 QUICK_START.md (guide de démarrage rapide)
│
├── 📁 alertes/
│   └── alertes.test.ts (23 tests)
│
├── 📁 auth/
│   └── auth.test.ts (47 tests)
│
├── 📁 commandes/
│   └── commandes.test.ts (68 tests)
│
├── 📁 cours/
│   └── cours.repository.test.ts (69 tests)
│
├── 📁 compte/
│   └── compte.test.ts (tests existants)
│
└── 📁 informations/
    └── informations.test.ts (tests existants)
```

## 📚 Navigation Rapide

### Documentation
- **[README_TESTS.md](./README_TESTS.md)** - Documentation complète des tests
- **[QUICK_START.md](./QUICK_START.md)** - Guide de démarrage rapide
- **[INDEX.md](./INDEX.md)** - Ce fichier

### Fichiers de Tests

#### 🔔 Alertes
- **Fichier**: [alertes/alertes.test.ts](./alertes/alertes.test.ts)
- **Nombre de tests**: 23
- **Repository testé**: `AlertesRepository`
- **Fonctionnalités couvertes**:
  - ✅ Dashboard des alertes
  - ✅ Alertes actives
  - ✅ Alertes par utilisateur
  - ✅ Statistiques des alertes
- **Commande**:
  ```bash
  npx jest src/__tests__/db/clients/alertes
  ```

#### 🔐 Auth
- **Fichier**: [auth/auth.test.ts](./auth/auth.test.ts)
- **Nombre de tests**: 47
- **Repository testé**: `AuthRepository`
- **Fonctionnalités couvertes**:
  - ✅ Recherche d'utilisateurs (email, ID)
  - ✅ Validation d'email
  - ✅ Informations de sécurité
  - ✅ Tokens de récupération
  - ✅ Tentatives de connexion
  - ✅ Comptage des utilisateurs actifs
- **Commande**:
  ```bash
  npx jest src/__tests__/db/clients/auth
  ```

#### 🛒 Commandes
- **Fichier**: [commandes/commandes.test.ts](./commandes/commandes.test.ts)
- **Nombre de tests**: 68
- **Repository testé**: `CommandesRepository`
- **Fonctionnalités couvertes**:
  - ✅ Opérations CRUD complètes
  - ✅ Recherche et filtrage
  - ✅ Statistiques et analytics
  - ✅ Validations métier
  - ✅ Gestion des paiements
- **Commande**:
  ```bash
  npx jest src/__tests__/db/clients/commandes
  ```

#### 📚 Cours
- **Fichier**: [cours/cours.repository.test.ts](./cours/cours.repository.test.ts)
- **Nombre de tests**: 69
- **Repository testé**: `CoursRepository`
- **Fonctionnalités couvertes**:
  - ✅ Gestion des cours (CRUD)
  - ✅ Cours récurrents
  - ✅ Inscriptions et désinscriptions
  - ✅ Gestion des présences
  - ✅ Professeurs
  - ✅ Statistiques complètes
  - ✅ Validations
- **Commande**:
  ```bash
  npx jest src/__tests__/db/clients/cours
  ```

#### 👤 Compte
- **Fichier**: [compte/compte.test.ts](./compte/compte.test.ts)
- **Repository testé**: `CompteRepository`
- **Statut**: Tests existants (à améliorer)
- **Commande**:
  ```bash
  npx jest src/__tests__/db/clients/compte
  ```

#### ℹ️ Informations
- **Fichier**: [informations/informations.test.ts](./informations/informations.test.ts)
- **Repository testé**: `InformationsRepository`
- **Statut**: Tests existants (à améliorer)
- **Commande**:
  ```bash
  npx jest src/__tests__/db/clients/informations
  ```

## 🎯 Résumé des Tests

| Module | Fichier | Tests | Statut | Couverture |
|--------|---------|-------|--------|------------|
| Alertes | `alertes.test.ts` | 23 | ✅ Complet | Haute |
| Auth | `auth.test.ts` | 47 | ✅ Complet | Haute |
| Commandes | `commandes.test.ts` | 68 | ✅ Complet | Haute |
| Cours | `cours.repository.test.ts` | 69 | ✅ Complet | Haute |
| Compte | `compte.test.ts` | - | ⚠️ Existant | Moyenne |
| Informations | `informations.test.ts` | - | ⚠️ Existant | Moyenne |
| **TOTAL** | **6 fichiers** | **207+** | **En cours** | **Bonne** |

## 🚀 Commandes Rapides

### Exécuter tous les tests
```bash
# Via npm script
npm run test:db:windows

# Via Jest directement
npx jest src/__tests__/db/clients

# Avec couverture
npx jest --coverage src/__tests__/db/clients
```

### Exécuter des tests spécifiques
```bash
# Un module
npx jest src/__tests__/db/clients/alertes

# Plusieurs modules
npx jest src/__tests__/db/clients/alertes src/__tests__/db/clients/auth

# Par nom de test
npx jest --testNamePattern="should return user"
```

### Mode développement
```bash
# Mode watch
npx jest --watch src/__tests__/db/clients/alertes

# Mode interactif
npx jest --watchAll src/__tests__/db/clients
```

### Script personnalisé
```bash
# Utiliser le script dédié
node scripts/run-repository-tests.js

# Avec options
node scripts/run-repository-tests.js alertes --coverage
node scripts/run-repository-tests.js --watch
node scripts/run-repository-tests.js --help
```

## 📊 Métriques de Qualité

### Couverture Cible
- **Lignes**: > 80%
- **Fonctions**: > 85%
- **Branches**: > 75%
- **Statements**: > 80%

### Types de Tests
- ✅ **Tests de succès** - Cas nominaux
- ✅ **Tests d'erreur** - Gestion des erreurs
- ✅ **Tests de validation** - Règles métier
- ✅ **Tests de cas limites** - Edge cases
- ✅ **Tests d'intégration** - Repositories composés

## 🔍 Recherche Rapide

### Par Fonctionnalité

**CRUD Basique**
- Commandes: `findAll`, `findById`, `create`, `update`, `delete`
- Cours: `findAll`, `findById`, `createCours`, `updateCours`, `deleteCours`
- Auth: `rechercherUtilisateurParEmail`, `rechercherUtilisateurParId`

**Statistiques**
- Alertes: `obtenirStatistiques`
- Commandes: `getStatistiques`, `getTopProduits`, `getPanierMoyen`
- Cours: `getStatistiquesGlobales`, `getCoursPlusPopulaires`

**Validation**
- Commandes: `exists`, `userCanOrder`, `checkValidStatut`
- Cours: `coursExists`, `checkCoursIsFull`, `validateCapacite`
- Auth: `emailExiste`, `verifierTokenRecuperation`

**Recherche**
- Commandes: `search`, `searchByEmail`, `searchByMontantRange`
- Cours: `findByWeek`, `findByDateRange`, `findFutureCours`

## 🛠️ Maintenance

### Ajouter un nouveau test
1. Créer le fichier dans le bon dossier
2. Suivre la structure existante
3. Mocker les dépendances
4. Tester succès + erreurs + edge cases
5. Mettre à jour ce fichier INDEX.md

### Améliorer un test existant
1. Identifier les cas non couverts
2. Ajouter les tests manquants
3. Améliorer les assertions
4. Documenter les changements

### Vérifier la couverture
```bash
# Générer le rapport
npx jest --coverage src/__tests__/db/clients

# Voir les fichiers non couverts
npx jest --coverage --coverageReporters=text

# Rapport HTML détaillé
# Ouvrir: coverage/lcov-report/index.html
```

## 📖 Guides de Référence

1. **[QUICK_START.md](./QUICK_START.md)** 
   - Démarrage rapide
   - Commandes essentielles
   - Exemples de code
   - Debugging

2. **[README_TESTS.md](./README_TESTS.md)**
   - Documentation complète
   - Architecture des tests
   - Patterns utilisés
   - Bonnes pratiques

3. **Script de test** (`scripts/run-repository-tests.js`)
   - Exécution personnalisée
   - Options avancées
   - Rapports détaillés

## 🎓 Ressources d'Apprentissage

### Documentation Officielle
- [Jest Documentation](https://jestjs.io/)
- [ts-jest Guide](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### Patterns de Test
- **AAA Pattern**: Arrange, Act, Assert
- **Given-When-Then**: Comportement attendu
- **Red-Green-Refactor**: TDD cycle

### Exemples Internes
- Voir `alertes.test.ts` pour un exemple simple
- Voir `commandes.test.ts` pour des sub-repositories
- Voir `cours.repository.test.ts` pour tests complexes

## 🤝 Contribution

Pour contribuer aux tests :
1. Lire le [QUICK_START.md](./QUICK_START.md)
2. Suivre les patterns existants
3. Assurer une couverture > 80%
4. Documenter les tests complexes
5. Mettre à jour cet INDEX

## 📞 Support

En cas de problème :
- Consulter le [QUICK_START.md](./QUICK_START.md) section "Problèmes Courants"
- Vérifier la configuration Jest (`jest.config.cjs`)
- Contacter l'équipe de développement

---

**Dernière mise à jour**: 2024  
**Mainteneur**: Équipe ClubManager  
**Version**: 1.0.0