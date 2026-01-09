# Architecture V2 - Module Compte

## 📋 Vue d'ensemble

Cette documentation décrit l'architecture refactorisée du module **Compte** (gestion des utilisateurs), conçue pour améliorer la maintenabilité, la testabilité et la séparation des responsabilités.

## 🎯 Objectifs de la refactorisation

1. **Séparation des responsabilités** : Diviser le code monolithique en modules spécialisés
2. **Testabilité** : Faciliter les tests unitaires et d'intégration
3. **Maintenabilité** : Code plus lisible et plus facile à faire évoluer
4. **Réutilisabilité** : Composants modulaires réutilisables
5. **Scalabilité** : Architecture prête pour la croissance future

## 🏗️ Structure du module

```
compte/
├── docs/                           # Documentation
│   ├── ARCHITECTURE_V2.md         # Ce fichier
│   ├── MIGRATION_GUIDE.md         # Guide de migration
│   ├── CHANGELOG.md               # Historique des changements
│   └── API_REFERENCE.md           # Référence API
│
├── queries/                        # Requêtes SQL organisées par responsabilité
│   ├── read.queries.ts            # Requêtes de lecture
│   ├── write.queries.ts           # Requêtes d'écriture
│   ├── relations.queries.ts       # Requêtes avec jointures
│   ├── search.queries.ts          # Requêtes de recherche
│   ├── validation.queries.ts      # Requêtes de validation
│   └── index.ts                   # Exports centralisés
│
├── repositories/                   # Couche d'accès aux données
│   ├── read.repository.ts         # Repository lecture
│   ├── write.repository.ts        # Repository écriture
│   ├── relations.repository.ts    # Repository relations
│   ├── search.repository.ts       # Repository recherche
│   └── validation.repository.ts   # Repository validation
│
├── utils/                          # Utilitaires
│   ├── parsing.utils.ts           # Parsing de données
│   ├── validation.utils.ts        # Validation de données
│   └── index.ts                   # Exports
│
├── compte.repository.ts            # Repository agrégateur (Facade)
├── types.ts                        # Définitions de types TypeScript
└── queries.ts                      # Compatibilité ascendante (deprecated)

```

## 🔄 Architecture en couches

### 1. Couche SQL (Queries)

**Responsabilité** : Définir les requêtes SQL brutes, paramétrées et sécurisées.

**Fichiers** :
- `read.queries.ts` : SELECT simples (findById, findByEmail, etc.)
- `write.queries.ts` : INSERT, UPDATE, DELETE
- `relations.queries.ts` : SELECT avec JOINs (avec genres, grades, status)
- `search.queries.ts` : Recherches complexes avec filtres
- `validation.queries.ts` : Vérifications d'existence et d'état

**Principes** :
- ✅ Requêtes paramétrées (prévention SQL injection)
- ✅ Une requête = une fonction
- ✅ Noms explicites et cohérents
- ✅ Documentation JSDoc complète

**Exemple** :
```typescript
export const FIND_BY_EMAIL_QUERY = `
  SELECT 
    id, first_name, last_name, nom_utilisateur, email,
    genre_id, date_of_birth, status_id, grade_id, 
    abonnement_id, phone, created_at, updated_at
  FROM utilisateurs
  WHERE email = ?
  LIMIT 1
`;
```

### 2. Couche Repository

**Responsabilité** : Exécuter les requêtes et retourner des objets typés.

**Repositories spécialisés** :

#### `CompteReadRepository`
- `findById(id)` - Trouver par ID
- `findByEmail(email)` - Trouver par email
- `findByUsername(username)` - Trouver par nom d'utilisateur
- `findAllActive()` - Tous les utilisateurs actifs
- `getCompteInfo(id)` - Infos basiques du compte

#### `CompteWriteRepository`
- `updatePassword(id, hash)` - MAJ mot de passe
- `updateCompteInfo(id, data)` - MAJ infos compte
- `updateUtilisateur(id, data)` - MAJ utilisateur (admin)
- `softDelete(id)` - Désactivation (soft delete)
- `reactivate(id)` - Réactivation

#### `CompteRelationsRepository`
- `findByIdWithRelations(id)` - Utilisateur avec relations
- `findByNameWithRelations(name)` - Par nom avec relations
- `findAllWithRelations()` - Tous avec relations
- `getGenreIdByName(name)` - ID genre par nom
- `getGradeIdByName(name)` - ID grade par nom
- `getStatusIdByName(name)` - ID status par nom
- `getAbonnementIdByName(name)` - ID abonnement par nom
- `getAllGenres()` - Liste des genres
- `getAllGrades()` - Liste des grades
- `getAllStatus()` - Liste des status
- `getAllPlans()` - Liste des plans tarifaires

#### `CompteSearchRepository`
- `search(filters)` - Recherche avec filtres multiples

#### `CompteValidationRepository`
- `exists(id)` - Vérifier existence
- `emailExists(email, excludeId?)` - Email déjà utilisé
- `usernameExists(username, excludeId?)` - Username déjà utilisé
- `isActive(id)` - Vérifier si actif

**Principes** :
- ✅ Pas de logique métier (seulement DB)
- ✅ Gestion des erreurs de base
- ✅ Retour de types explicites
- ✅ Logging des erreurs SQL

### 3. Couche Façade (Repository Agrégateur)

**Fichier** : `compte.repository.ts`

**Responsabilité** : Composer les repositories spécialisés et offrir une API unifiée.

**Avantages** :
- Point d'entrée unique simple
- Délégation aux repositories spécialisés
- Facilite les tests (mock par repository)
- Backward compatibility

**Exemple** :
```typescript
export class CompteRepository {
  private readRepo = new CompteReadRepository();
  private writeRepo = new CompteWriteRepository();
  
  // Délégation
  async findById(id: number) {
    return this.readRepo.findById(id);
  }
  
  async updatePassword(id: number, hash: string) {
    return this.writeRepo.updatePassword(id, hash);
  }
}
```

### 4. Couche Utilitaires

**Fichiers** :
- `parsing.utils.ts` : Transformation de données (row → objet)
- `validation.utils.ts` : Validation de données entrantes

**Responsabilités** :
- Parsing sécurisé des résultats SQL
- Validation des inputs (email, phone, dates)
- Transformation de formats
- Sanitization

**Exemple** :
```typescript
export function parseUtilisateurRow(row: any): Utilisateur {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    // ... parsing sécurisé
  };
}
```

### 5. Couche GraphQL

**Fichiers** :
- `graphql/compte/compte.typeDefs.ts` - Schéma GraphQL
- `graphql/compte/compte.resolvers.ts` - Implémentation des resolvers
- `graphql/compte/index.ts` - Point d'entrée

**Responsabilités** :
- Définir le schéma GraphQL pour les comptes
- Implémenter les Query et Mutation resolvers
- Validation des inputs GraphQL
- Transformation des données pour GraphQL
- Gestion des erreurs GraphQL

**Queries disponibles** :
```graphql
# Lecture
utilisateurs: [Utilisateur!]!
utilisateur(id: Int!): Utilisateur
utilisateurByEmail(email: String!): Utilisateur
compteInfo(id: Int!): CompteInfo
searchUtilisateurs(filters: CompteSearchFiltersInput!): CompteSearchResult!

# Validations
checkEmailAvailability(email: String!): AvailabilityCheckResult!
checkUsernameAvailability(username: String!): AvailabilityCheckResult!
isUtilisateurActive(id: Int!): Boolean!

# Références
genres: [Genre!]!
grades: [Grade!]!
status: [Status!]!
plansTarifaires: [PlanTarifaire!]!

# Statistiques
comptesStatistiques: CompteStatistiques!
```

**Mutations disponibles** :
```graphql
updateCompteInfo(id: Int!, data: UpdateCompteInput!): CompteInfo!
updateUtilisateur(id: Int!, data: UpdateUtilisateurInput!): Utilisateur!
updatePassword(id: Int!, data: UpdatePasswordInput!): ConfirmationResult!
softDeleteCompte(id: Int!): ConfirmationResult!
reactivateCompte(id: Int!): ConfirmationResult!
```

## 📊 Flux de données

### Lecture d'un utilisateur

```
Client GraphQL
    ↓
GraphQL Resolver (compte.resolvers.ts)
    ↓
CompteRepository (facade)
    ↓
CompteReadRepository
    ↓
read.queries.ts (SQL)
    ↓
MysqlConnector
    ↓
Base de données MySQL
```

### Mise à jour d'un compte

```
Client GraphQL
    ↓
GraphQL Resolver (validation input)
    ↓
CompteRepository (facade)
    ↓
CompteValidationRepository (vérifications)
    ↓
CompteWriteRepository (écriture)
    ↓
write.queries.ts (UPDATE SQL)
    ↓
MysqlConnector
    ↓
Base de données MySQL
```

### Recherche avec filtres

```
Client GraphQL
    ↓
GraphQL Resolver (searchUtilisateurs)
    ↓
CompteRepository
    ↓
CompteSearchRepository
    ↓
search.queries.ts (WHERE dynamique)
    ↓
MysqlConnector
    ↓
Base de données MySQL
    ↓
Pagination côté resolver
    ↓
Client GraphQL (résultats paginés)
```

## 🔒 Principes de sécurité

1. **SQL Injection Prevention**
   - Toutes les requêtes sont paramétrées
   - Utilisation de `?` placeholders
   - Pas de concaténation de strings SQL

2. **Validation des inputs**
   - Validation email format
   - Validation phone format
   - Validation date format
   - Vérification des IDs

3. **Données sensibles**
   - Les mots de passe ne sont JAMAIS retournés dans les queries de lecture
   - Exclusion explicite du champ `password` dans les SELECT

4. **GraphQL Security**
   - Validation des inputs au niveau resolver
   - Messages d'erreur génériques pour éviter l'information leak
   - Checks d'existence avant modification

## 🧪 Testabilité

### Tests unitaires (Repositories)

```typescript
// Mock du connector
const mockConnector = {
  query: jest.fn()
};

// Test d'un repository
test('findById returns user', async () => {
  mockConnector.query.mockResolvedValue([mockUser]);
  
  const repo = new CompteReadRepository(mockConnector);
  const result = await repo.findById(1);
  
  expect(result).toEqual(mockUser);
  expect(mockConnector.query).toHaveBeenCalledWith(
    expect.stringContaining('SELECT'),
    [1]
  );
});
```

### Tests d'intégration (GraphQL)

```typescript
test('Query utilisateur returns user data', async () => {
  const query = `
    query {
      utilisateur(id: 1) {
        id
        email
        first_name
      }
    }
  `;
  
  const result = await executeQuery(query);
  
  expect(result.data.utilisateur).toBeDefined();
  expect(result.data.utilisateur.id).toBe(1);
});
```

## 📈 Patterns utilisés

### 1. Repository Pattern
- Abstraction de la couche de données
- Interface claire entre business logic et DB
- Facilite le switch de DB (MySQL → PostgreSQL, etc.)

### 2. Facade Pattern
- `CompteRepository` agrège les repositories spécialisés
- API simplifiée pour les consommateurs
- Point de composition

### 3. Single Responsibility Principle (SRP)
- Chaque fichier/classe a UNE responsabilité
- Queries : définir SQL
- Repositories : exécuter et typer
- Utils : transformer et valider

### 4. Dependency Injection
- Les repositories reçoivent le connector
- Facilite les tests (mocking)
- Découplage

### 5. Factory Pattern
- `getCompteRepository()` singleton
- Initialisation centralisée
- Réutilisation d'instance

## 🚀 Améliorations futures

### Court terme
1. ✅ **Service Layer** : Ajouter une couche service pour la logique métier
2. ✅ **Validation avancée** : Règles métier complexes
3. ✅ **Tests** : Coverage à 80%+
4. ✅ **Documentation API** : Swagger/OpenAPI pour REST

### Moyen terme
1. **DataLoader** : Optimiser les requêtes N+1 en GraphQL
2. **Cache** : Redis pour les données fréquemment lues
3. **Events** : Event-driven architecture (compte créé, modifié, etc.)
4. **Audit Trail** : Historique des modifications

### Long terme
1. **Migration Prisma** : Remplacer les repositories SQL bruts
2. **GraphQL Subscriptions** : Temps réel pour les updates
3. **Microservices** : Séparer le module compte si nécessaire
4. **CQRS** : Séparer lecture/écriture au niveau architecture

## 📚 Références

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Facade Pattern](https://refactoring.guru/design-patterns/facade)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 👥 Contribution

Pour contribuer au module Compte :

1. Lire cette documentation
2. Suivre les patterns établis
3. Ajouter des tests pour tout nouveau code
4. Mettre à jour la documentation si nécessaire
5. Code review obligatoire

## 📝 Notes de version

- **V2.0.0** - Refactorisation complète avec architecture modulaire + GraphQL
- **V1.0.0** - Version monolithique originale (deprecated)