# Architecture du Module Commandes

## 📐 Vue d'ensemble

Le module Commandes suit une architecture en couches (Layered Architecture) avec séparation stricte des responsabilités. Cette approche facilite la maintenance, les tests et l'évolutivité du code.

```
┌─────────────────────────────────────────────────────────────┐
│                        GRAPHQL LAYER                         │
│  (commandes.typeDefs.ts, commandes.resolvers.ts)            │
│  • Schémas GraphQL                                          │
│  • Resolvers (queries & mutations)                          │
│  • Validation des entrées GraphQL                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        FACADE LAYER                          │
│  (commandes.ts)                                             │
│  • API publique unifiée                                     │
│  • Composition des services                                 │
│  • Backward compatibility                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                          │
│  (services/commandes/)                                      │
│  • Logique métier                                           │
│  • Orchestration                                            │
│  • Validation métier                                        │
│  • Gestion des erreurs métier                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     REPOSITORY LAYER                         │
│  (commandes.repository.ts)                                  │
│  • Accès à la base de données                               │
│  • Requêtes SQL                                             │
│  • Parsing des résultats                                    │
│  • Pas de logique métier                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
│  (MySQL via MysqlConnector)                                 │
│  • Table commandes                                          │
│  • Transactions                                             │
│  • Indexes                                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Structure des fichiers

```
commandes/
├── ARCHITECTURE.md           # Ce fichier
├── README.md                 # Documentation utilisateur
│
├── types.ts                  # Types TypeScript et SQL
├── queries.ts                # Requêtes SQL
│
├── utils/                    # Utilitaires
│   ├── parsing.utils.ts      # Parsing et formatage
│   ├── validation.utils.ts   # Validation des données
│   └── index.ts              # Exports
│
├── commandes.repository.ts   # Repository (accès DB)
├── commandes.ts              # Façade (API publique)
└── index.ts                  # Point d'entrée
```

## 🏗️ Couches de l'architecture

### 1. Types Layer (types.ts)

**Responsabilité**: Définir tous les types TypeScript et SQL.

**Contenu**:
- Types métier (`Commande`, `ArticleCommande`, `StatutCommande`)
- Types SQL bruts (`CommandeRow`, `StatistiquesRow`)
- Interfaces de données (`CreateCommandeData`, `UpdateCommandeData`)
- Enums et constantes
- Type guards

**Principe**: Un seul endroit pour tous les types.

```typescript
// Types métier
export interface Commande {
  commande_id: string;
  utilisateur_id: number;
  // ...
}

// Types SQL bruts
export interface CommandeRow {
  commande_id: string;
  articles: string; // JSON stringifié
  // ...
}
```

### 2. Queries Layer (queries.ts)

**Responsabilité**: Centraliser toutes les requêtes SQL.

**Contenu**:
- Requêtes SELECT
- Requêtes INSERT, UPDATE, DELETE
- Requêtes de statistiques
- Fonctions de construction dynamique de requêtes

**Principe**: Séparation SQL / code métier.

```typescript
export const SELECT_COMMANDE_BY_ID = `
  SELECT c.*, u.nom_utilisateur, u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.commande_id = ?
`;
```

### 3. Utils Layer (utils/)

**Responsabilité**: Fonctions utilitaires réutilisables.

**Modules**:

#### parsing.utils.ts
- Parsing JSON des articles
- Conversion de types (string → number)
- Formatage (dates, prix)
- Sanitization des données

#### validation.utils.ts
- Validation des articles
- Validation des données de commande
- Validation des filtres de recherche
- Vérification des transitions de statut

**Principe**: DRY (Don't Repeat Yourself).

### 4. Repository Layer (commandes.repository.ts)

**Responsabilité**: Accès direct à la base de données.

**Fonctions**:
- Exécuter les requêtes SQL
- Parser les résultats bruts en objets TypeScript
- Gérer les erreurs de DB
- **PAS de logique métier**

**Pattern**: Repository Pattern

```typescript
export class CommandesRepository {
  async findById(commandeId: string): Promise<Commande | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        SELECT_COMMANDE_BY_ID,
        [commandeId],
        (error, results) => {
          if (error) reject(error);
          else resolve(results[0] ? parseCommandeRow(results[0]) : null);
        }
      );
    });
  }
}
```

**Caractéristiques**:
- Singleton
- Méthodes async/await avec Promises
- Parsing automatique des résultats
- Gestion des erreurs DB

### 5. Service Layer (services/commandes/)

**Responsabilité**: Logique métier et orchestration.

**Modules**:

#### commandesService.ts
- Orchestration CRUD des commandes
- Validation métier
- Gestion des erreurs métier
- Vérification des permissions/règles métier

```typescript
export class CommandesService {
  async createCommande(data: CreateCommandeData): Promise<Commande> {
    // 1. Valider les données
    const validation = validateCreateCommandeData(data);
    if (!validation.isValid) {
      throw new CommandeError('Données invalides', 'VALIDATION_ERROR');
    }
    
    // 2. Vérifier que l'utilisateur existe
    const userExists = await this.repository.userExists(data.utilisateur_id);
    if (!userExists) {
      throw new CommandeError('Utilisateur introuvable', 'USER_NOT_FOUND', 404);
    }
    
    // 3. Créer la commande
    const commandeId = await this.repository.create(data);
    return await this.repository.findById(commandeId);
  }
}
```

#### stockService.ts
- Gestion du stock lié aux commandes
- Réservation / libération de stock
- Vérification de disponibilité
- Intégration future avec le module stock

**Pattern**: Service Layer Pattern

**Caractéristiques**:
- Singleton
- Erreurs métier typées (`CommandeError`, `StockError`)
- Validation stricte
- Orchestration de plusieurs repositories si nécessaire

### 6. Facade Layer (commandes.ts)

**Responsabilité**: API publique simple et unifiée.

**Fonctions**:
- Composer repository + services
- Fournir une API simple pour les consommateurs
- Maintenir la backward compatibility
- Initialisation lazy des dépendances

**Pattern**: Facade Pattern

```typescript
export class Commandes {
  private static service: CommandesService;
  private static stockService: StockService;
  
  private static initialize(): void {
    if (!this.service) {
      this.service = getCommandesService();
      this.stockService = getStockService();
    }
  }
  
  static async findAll(): Promise<Commande[]> {
    this.initialize();
    return this.service.getAllCommandes();
  }
}
```

**Avantages**:
- API simple et intuitive
- Masque la complexité interne
- Point d'entrée unique
- Compatible avec l'ancien code

### 7. GraphQL Layer (graphql/commandes/)

**Responsabilité**: Exposer l'API via GraphQL.

**Modules**:

#### commandes.typeDefs.ts
- Schémas GraphQL
- Types, inputs, enums
- Queries et mutations

#### commandes.resolvers.ts
- Implémentation des queries
- Implémentation des mutations
- Gestion des erreurs GraphQL
- Parsing des arguments

**Principe**: GraphQL consomme la façade ou les services.

```typescript
export const commandesResolvers = {
  Query: {
    commandes: async () => {
      const service = getCommandesService();
      return await service.getAllCommandes();
    },
  },
  Mutation: {
    createCommande: async (_, { data }) => {
      const service = getCommandesService();
      return await service.createCommande(data);
    },
  },
};
```

## 🔄 Flux de données

### Exemple: Création d'une commande

```
1. Client GraphQL
   └─> mutation createCommande(data)
         │
         ▼
2. GraphQL Resolver
   └─> Valide les arguments GraphQL
       └─> Appelle getCommandesService().createCommande(data)
             │
             ▼
3. CommandesService
   └─> Valide les données métier (validateCreateCommandeData)
   └─> Vérifie l'utilisateur existe (repository.userExists)
   └─> Vérifie l'unicité de la commande (repository.exists)
   └─> Appelle repository.create(data)
             │
             ▼
4. CommandesRepository
   └─> Stringifie les articles JSON
   └─> Exécute INSERT_COMMANDE avec paramètres
   └─> Retourne l'ID de la commande
             │
             ▼
5. CommandesService
   └─> Récupère la commande créée (repository.findById)
   └─> Retourne l'objet Commande complet
             │
             ▼
6. GraphQL Resolver
   └─> Retourne la commande au client
```

### Exemple: Changement de statut avec stock

```
1. Client
   └─> updateCommandeStatut(commandeId, 'confirmee')
         │
         ▼
2. CommandesService
   └─> Récupère la commande existante
   └─> Vérifie la transition de statut est valide
   └─> Appelle stockService.handleCommandeStatusChange()
         │
         ▼
3. StockService
   └─> Si statut = 'confirmee', réserve le stock
   └─> Si statut = 'annulee', libère le stock
   └─> Si statut = 'livree', confirme la sortie
         │
         ▼
4. CommandesRepository
   └─> Met à jour le statut en DB
   └─> Retourne la commande mise à jour
```

## 🎯 Design Patterns utilisés

### 1. Repository Pattern
- **Où**: `commandes.repository.ts`
- **Pourquoi**: Isoler l'accès aux données
- **Avantage**: Facilite les tests avec des mocks

### 2. Service Layer Pattern
- **Où**: `services/commandes/`
- **Pourquoi**: Centraliser la logique métier
- **Avantage**: Réutilisable par GraphQL, REST, CRON, etc.

### 3. Facade Pattern
- **Où**: `commandes.ts`
- **Pourquoi**: Simplifier l'API publique
- **Avantage**: Point d'entrée unique, masque la complexité

### 4. Singleton Pattern
- **Où**: Repository, Services
- **Pourquoi**: Réutiliser les instances
- **Avantage**: Performance, cohérence

### 5. Strategy Pattern
- **Où**: `isValidStatusTransition()`, transitions de statut
- **Pourquoi**: Gérer les différentes stratégies de transition
- **Avantage**: Extensible, maintenable

### 6. Error Handling Pattern
- **Où**: Services (`CommandeError`, `StockError`)
- **Pourquoi**: Erreurs typées avec codes
- **Avantage**: Gestion fine des erreurs côté client

## 🧪 Testabilité

### Tests unitaires

#### Repository
```typescript
// Mock MysqlConnector
const mockConnector = {
  query: jest.fn((sql, params, callback) => {
    callback(null, [mockData]);
  }),
};

// Test
const repository = new CommandesRepository();
repository.mysqlConnector = mockConnector;
const result = await repository.findById('CMD-123');
expect(result).toEqual(expectedCommande);
```

#### Service
```typescript
// Mock Repository
const mockRepository = {
  findById: jest.fn().mockResolvedValue(mockCommande),
  userExists: jest.fn().mockResolvedValue(true),
  create: jest.fn().mockResolvedValue('CMD-123'),
};

// Test
const service = new CommandesService();
service.repository = mockRepository;
const result = await service.createCommande(mockData);
expect(mockRepository.create).toHaveBeenCalledWith(mockData);
```

#### Utils
```typescript
describe('validateArticle', () => {
  it('should validate a valid article', () => {
    const result = validateArticle(validArticle);
    expect(result.isValid).toBe(true);
  });
  
  it('should reject invalid quantite', () => {
    const result = validateArticle({ ...validArticle, quantite: -1 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Quantité invalide');
  });
});
```

### Tests d'intégration

```typescript
describe('Commandes Integration', () => {
  it('should create and retrieve a commande', async () => {
    const data = { /* ... */ };
    const commandeId = await Commandes.create(data);
    const commande = await Commandes.findById(commandeId);
    expect(commande.total).toBe(data.total);
  });
});
```

## 🔐 Sécurité

### Validation en couches

1. **GraphQL Layer**: Validation des types GraphQL
2. **Service Layer**: Validation métier stricte
3. **Repository Layer**: Requêtes paramétrées (protection SQL injection)

### Sanitization

```typescript
// Dans parsing.utils.ts
export function sanitizeCommandeId(commandeId: string): string {
  return commandeId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}
```

### Gestion des permissions

```typescript
// Dans les resolvers GraphQL
if (!context.user || context.user.role !== 'admin') {
  throw new Error('Accès non autorisé');
}
```

## 🚀 Performance

### Indexes DB recommandés

```sql
CREATE INDEX idx_commandes_id ON commandes(commande_id);
CREATE INDEX idx_commandes_user ON commandes(utilisateur_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_date ON commandes(date_commande);
CREATE INDEX idx_commandes_payment ON commandes(payment_intent_id);
```

### Optimisations

1. **Singleton Pattern**: Réutilisation des instances
2. **Prepared Statements**: Requêtes paramétrées (MySQL optimise)
3. **Pagination**: Limite sur les résultats de recherche
4. **Lazy Loading**: Initialisation à la demande (Façade)

### À implémenter

- [ ] Cache Redis pour statistiques
- [ ] DataLoader pour éviter N+1 en GraphQL
- [ ] Connection pooling optimisé

## 🔄 Évolutivité

### Ajouter une nouvelle fonctionnalité

1. **Ajouter les types** dans `types.ts`
2. **Ajouter la requête SQL** dans `queries.ts`
3. **Implémenter dans le repository** (accès DB)
4. **Ajouter la logique métier** dans le service
5. **Exposer via la façade** (API publique)
6. **Ajouter GraphQL** (typeDefs + resolvers)
7. **Documenter** (README)

### Migration vers Prisma (futur)

L'architecture actuelle facilite la migration:
1. Remplacer `CommandesRepository` par un `PrismaCommandesRepository`
2. Les services et la façade restent inchangés
3. Tests unitaires sur les services fonctionnent toujours

## 📊 Métriques de qualité

- ✅ **Separation of Concerns**: Chaque fichier a UNE responsabilité
- ✅ **DRY**: Pas de duplication (utils réutilisables)
- ✅ **SOLID Principles**:
  - Single Responsibility
  - Open/Closed (extensible via nouveaux services)
  - Liskov Substitution (interfaces)
  - Interface Segregation
  - Dependency Inversion (dépend d'abstractions)
- ✅ **Testabilité**: Mocking facile à tous les niveaux
- ✅ **Maintenabilité**: Structure claire, documentation complète
- ✅ **Backward Compatibility**: Ancien code fonctionne toujours

## 🤝 Contribution

Pour maintenir la qualité architecturale:

1. **Ne pas** mélanger logique métier et accès DB
2. **Ne pas** mettre de SQL dans les services
3. **Ne pas** mettre de logique métier dans les repositories
4. Toujours valider les données en entrée
5. Utiliser les types TypeScript strictement
6. Documenter les nouvelles fonctionnalités
7. Écrire des tests

## 📚 Ressources

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)

---

**Version**: 1.0.0  
**Auteur**: Équipe ClubManager  
**Dernière mise à jour**: 2024