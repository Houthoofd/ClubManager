# Architecture Modulaire du Module Commandes (V2)

## 🎯 Objectif

Cette nouvelle architecture décompose le module Commandes en plusieurs fichiers spécialisés pour améliorer la **maintenabilité**, la **testabilité** et la **lisibilité** du code.

## 📁 Structure des Fichiers

```
commandes/
├── queries/                      # Requêtes SQL organisées par responsabilité
│   ├── read.queries.ts          # SELECT (121 lignes)
│   ├── write.queries.ts         # INSERT, UPDATE, DELETE (102 lignes)
│   ├── stats.queries.ts         # Statistiques et agrégations (308 lignes)
│   ├── search.queries.ts        # Recherche avec filtres (406 lignes)
│   ├── validation.queries.ts    # Validation et vérification (370 lignes)
│   └── index.ts                 # Exports centralisés
│
├── repositories/                 # Repositories spécialisés par responsabilité
│   ├── read.repository.ts       # Opérations de lecture (140 lignes)
│   ├── write.repository.ts      # Opérations d'écriture (226 lignes)
│   ├── stats.repository.ts      # Opérations de statistiques (367 lignes)
│   ├── search.repository.ts     # Opérations de recherche (238 lignes)
│   └── validation.repository.ts # Opérations de validation (563 lignes)
│
├── utils/                        # Utilitaires
│   ├── parsing.utils.ts         # Parsing de données
│   ├── validation.utils.ts      # Validation métier
│   └── index.ts
│
├── types.ts                      # Types et interfaces
├── commandes.repository.ts       # Repository principal (agrégateur)
├── commandes.ts                  # Façade publique
└── index.ts                      # Exports publics
```

## 🏗️ Principes d'Architecture

### 1. **Séparation des Responsabilités (SRP)**

Chaque fichier a une responsabilité unique et bien définie :

- **Queries** : Contiennent uniquement du SQL
- **Repositories** : Exécutent les requêtes et parsent les résultats
- **Utils** : Parsing et validation
- **Types** : Définitions de types

### 2. **Composition sur Héritage**

Le `CommandesRepository` principal **agrège** les repositories spécialisés au lieu de tout implémenter :

```typescript
export class CommandesRepository {
  private readRepo: CommandesReadRepository;
  private writeRepo: CommandesWriteRepository;
  private statsRepo: CommandesStatsRepository;
  private searchRepo: CommandesSearchRepository;
  private validationRepo: CommandesValidationRepository;

  // Délègue les appels aux repositories spécialisés
  async findById(id: string): Promise<Commande | null> {
    return this.readRepo.findById(id);
  }
}
```

### 3. **Accès Direct aux Repositories Spécialisés**

Pour des cas d'usage avancés, accès direct via des getters :

```typescript
const repo = getCommandesRepository();

// Utilisation standard (méthodes déléguées)
const commande = await repo.findById('cmd_123');

// Utilisation avancée (accès direct)
const result = await repo.search.advancedSearch({
  statut: 'confirmee',
  dateDebut: '2024-01-01',
  sortBy: 'total',
  sortOrder: 'DESC'
});
```

## 📋 Organisation des Queries

### **read.queries.ts** (121 lignes)
Requêtes SELECT de base :
- `SELECT_ALL_COMMANDES`
- `SELECT_COMMANDE_BY_ID`
- `SELECT_COMMANDES_BY_USER_ID`
- `SELECT_COMMANDES_BY_STATUT`
- `SELECT_COMMANDE_BY_PAYMENT_INTENT`
- `SELECT_RECENT_USER_COMMANDES`

### **write.queries.ts** (102 lignes)
Requêtes d'écriture :
- `INSERT_COMMANDE`
- `UPDATE_COMMANDE_STATUT`
- `UPDATE_COMMANDE_TOTAL`
- `UPDATE_COMMANDE_ARTICLES`
- `UPDATE_COMMANDE_PAYMENT_INTENT`
- `DELETE_COMMANDE`
- `DELETE_COMMANDES_BY_USER`
- `DELETE_OLD_CANCELLED_COMMANDES`
- `buildUpdateCommandeQuery()` (construction dynamique)

### **stats.queries.ts** (308 lignes)
Requêtes de statistiques :
- Statistiques globales
- Chiffre d'affaires (total, mensuel)
- Statistiques par période (jour, semaine, mois, année)
- Top produits vendus
- Top clients
- Taux de conversion
- Temps moyen de traitement
- Répartition par heure/jour de la semaine

### **search.queries.ts** (406 lignes)
Requêtes de recherche avancée :
- Recherche de base avec filtres
- Recherche par ID partiel (autocomplete)
- Recherche par email/username
- Recherche par plage de montants
- Recherche par article/produit (JSON)
- Construction dynamique de requêtes
- `buildSearchQuery()` et `buildSearchCountQuery()`

### **validation.queries.ts** (370 lignes)
Requêtes de validation :
- Vérification d'existence
- Validation de statut et transitions
- Détection de fraude
- Validation métier
- Validation temporelle
- Validation de montants
- Validation d'intégrité

## 🔧 Organisation des Repositories

### **CommandesReadRepository** (140 lignes)
Opérations de lecture uniquement :
```typescript
- findAll()
- findById(id)
- findByUserId(id)
- findByStatut(statut)
- findByPaymentIntent(id)
- getRecentUserCommandes(userId, minutes)
```

### **CommandesWriteRepository** (226 lignes)
Opérations d'écriture uniquement :
```typescript
- create(data)
- updateStatut(id, statut)
- updateTotal(id, total)
- updateArticles(id, articles)
- updatePaymentIntent(id, paymentIntent)
- update(id, data)  // dynamique
- delete(id)
- deleteByUser(userId)
- deleteOldCancelled(days)
```

### **CommandesStatsRepository** (367 lignes)
Opérations de statistiques :
```typescript
- getStatistiques()
- countByStatut()
- getStatsByPeriod(period, duration)
- getStatsByYear(duration)
- getTopProduits(limit)
- getTopProduitsByCA(limit)
- getPanierMoyen()
- getTopClientsByCount(limit)
- getTopClientsByAmount(limit)
- getTauxConversion()
- getTempsMoyenTraitement(days)
- getCommandesByHour(days)
- getCommandesByDayOfWeek(days)
```

### **CommandesSearchRepository** (238 lignes)
Opérations de recherche :
```typescript
- search(filters)
- searchByIdPattern(pattern, limit)
- searchByEmail(email, limit)
- searchByUsername(username, limit)
- searchByMontantRange(min, max, limit)
- searchByArticle(articleId, limit)
- searchByProductName(name, limit)
- advancedSearch(params)
```

### **CommandesValidationRepository** (563 lignes)
Opérations de validation :
```typescript
// Existence
- exists(id)
- userExists(userId)
- paymentIntentExists(id)

// Statut
- getCommandeStatut(id)
- canBeCancelled(id)
- canBeModified(id)
- canBeRefunded(id)
- checkValidStatut(statut)
- isValidStatusTransition(current, new)
- isFinalStatus(statut)

// Détection de fraude
- countRecentUserCommandes(userId, minutes)
- sumRecentUserCommandesTotal(userId, minutes)
- userExceedsOrderLimit(userId, hours, limit)
- userHasTooManyCancelled(userId, days, tauxMax)
- checkDuplicatePaymentIntent(id)

// Validation métier
- userCanOrder(userId)
- checkCommandeTotalConsistency(id)
- commandeHasArticles(id)

// Validation temporelle
- isCommandeTooOld(id, hours)
- isCommandeExpired(id, hours)
- getExpiredCommandes(hours, limit)

// Validation montants
- checkValidMontant(montant)
- checkSuspiciousMontant(montant)
- getUserAverageOrderAmount(userId, days)
- checkMontantDeviation(userId, montant, days)

// Intégrité
- checkReferentialIntegrity(id)
- getOrphanedCommandes(limit)
- checkPotentialDuplicates(id)
```

## 📊 Comparaison Avant/Après

### Avant (Monolithique)
```
commandes.repository.ts    ~550 lignes    ❌ Difficile à maintenir
queries.ts                  ~249 lignes    ❌ Toutes les queries mélangées
```

### Après (Modulaire)
```
queries/
  read.queries.ts           121 lignes     ✅ Focalisé sur la lecture
  write.queries.ts          102 lignes     ✅ Focalisé sur l'écriture
  stats.queries.ts          308 lignes     ✅ Focalisé sur les stats
  search.queries.ts         406 lignes     ✅ Focalisé sur la recherche
  validation.queries.ts     370 lignes     ✅ Focalisé sur la validation

repositories/
  read.repository.ts        140 lignes     ✅ Lecture seule
  write.repository.ts       226 lignes     ✅ Écriture seule
  stats.repository.ts       367 lignes     ✅ Statistiques seules
  search.repository.ts      238 lignes     ✅ Recherche seule
  validation.repository.ts  563 lignes     ✅ Validation seule

commandes.repository.ts     ~650 lignes    ✅ Agrégateur simple
```

## 🚀 Utilisation

### Utilisation Standard

```typescript
import { getCommandesRepository } from './commandes.repository.js';

const repo = getCommandesRepository();

// Lecture
const commande = await repo.findById('cmd_123');
const commandes = await repo.findByUserId(42);

// Écriture
const id = await repo.create({
  commande_id: 'cmd_456',
  utilisateur_id: 42,
  total: 150.00,
  articles: [...]
});

await repo.updateStatut('cmd_456', 'confirmee');

// Statistiques
const stats = await repo.getStatistiques();
const topProduits = await repo.getTopProduits(10);

// Recherche
const results = await repo.search({
  statut: 'confirmee',
  date_debut: '2024-01-01',
  limit: 50
});

// Validation
const canCancel = await repo.canBeCancelled('cmd_456');
const isValid = repo.checkValidStatut('confirmee');
```

### Utilisation Avancée (Accès Direct)

```typescript
const repo = getCommandesRepository();

// Accès direct aux repositories spécialisés
const readRepo = repo.read;
const writeRepo = repo.write;
const statsRepo = repo.stats;
const searchRepo = repo.searchRepository;
const validationRepo = repo.validation;

// Recherche avancée
const results = await repo.searchRepository.advancedSearch({
  statut: 'confirmee',
  montantMin: 100,
  montantMax: 500,
  dateDebut: '2024-01-01',
  sortBy: 'total',
  sortOrder: 'DESC',
  limit: 20,
  offset: 0
});

// Validation complexe
const fraudCheck = await repo.validation.userHasTooManyCancelled(
  userId,
  30,  // 30 jours
  50   // 50% de taux d'annulation max
);

if (fraudCheck.hasTooMany) {
  console.log('Utilisateur suspect:', fraudCheck.stats);
}
```

## 🧪 Testabilité

Chaque repository peut être testé indépendamment :

```typescript
// test/repositories/read.repository.test.ts
import { CommandesReadRepository } from '../read.repository.js';

describe('CommandesReadRepository', () => {
  let repo: CommandesReadRepository;
  let mockConnector: MockMysqlConnector;

  beforeEach(() => {
    mockConnector = new MockMysqlConnector();
    repo = new CommandesReadRepository(mockConnector);
  });

  it('should find command by id', async () => {
    mockConnector.mockQueryResult([mockCommandeRow]);
    const result = await repo.findById('cmd_123');
    expect(result).toBeDefined();
    expect(result?.commande_id).toBe('cmd_123');
  });
});
```

## ✅ Avantages

1. **Lisibilité** : Fichiers courts et focalisés (< 600 lignes)
2. **Maintenabilité** : Facile de trouver et modifier du code spécifique
3. **Testabilité** : Tests unitaires par repository
4. **Réutilisabilité** : Les repositories peuvent être composés différemment
5. **Performance** : Possibilité d'optimiser chaque repository indépendamment
6. **Évolutivité** : Ajout facile de nouvelles fonctionnalités
7. **Séparation des préoccupations** : Chaque fichier a un rôle unique
8. **Découverte** : Les noms de fichiers indiquent clairement leur contenu

## 🔄 Migration

### Étape 1 : Mettre à jour les imports

```typescript
// Avant
import { CommandesRepository } from './commandes.repository.js';

// Après (inchangé - compatibilité totale)
import { CommandesRepository } from './commandes.repository.js';
```

### Étape 2 : Utiliser les nouvelles méthodes (optionnel)

```typescript
// Nouvelles méthodes disponibles
await repo.updateTotal(id, 200);
await repo.updateArticles(id, articles);
await repo.getTopProduitsByCA(10);
await repo.searchByProductName('tshirt');
await repo.checkMontantDeviation(userId, 500);
```

### Étape 3 : Tests (recommandé)

Ajouter des tests pour chaque repository spécialisé.

## 🎓 Best Practices

1. **Toujours utiliser le repository principal** pour les opérations courantes
2. **Accéder aux repositories spécialisés** uniquement pour des cas avancés
3. **Ne jamais modifier directement les queries** sans passer par le repository
4. **Toujours valider** avant d'écrire en base
5. **Logger** les opérations importantes (création, suppression, fraude détectée)

## 📚 Prochaines Étapes

1. ✅ Appliquer la même architecture au module `compte`
2. ✅ Appliquer au module `alertes`
3. ✅ Appliquer au module `auth`
4. 🔄 Ajouter des tests unitaires pour chaque repository
5. 🔄 Ajouter des tests d'intégration
6. 🔄 Documenter les exemples d'utilisation avancée
7. 🔄 Créer des DataLoaders pour GraphQL (éviter N+1)
8. 🔄 Ajouter du caching Redis pour les statistiques

---

**Auteur** : Architecture V2  
**Date** : 2024  
**Version** : 2.0.0