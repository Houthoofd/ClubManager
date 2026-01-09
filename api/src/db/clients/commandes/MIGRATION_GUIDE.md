# 🔄 Guide de Migration - Module Commandes V2

## 📋 Vue d'ensemble

Ce guide explique comment migrer du code existant vers la nouvelle architecture modulaire du module Commandes.

**Bonne nouvelle :** La migration est **100% rétrocompatible** ! Votre code existant continuera de fonctionner sans modification.

## ✅ Aucune Action Requise

### Code Existant
```typescript
// Ce code continue de fonctionner EXACTEMENT comme avant
import { CommandesRepository } from './db/clients/commandes/commandes.repository.js';
import * as queries from './db/clients/commandes/queries.js';

const repo = new CommandesRepository();
const commande = await repo.findById('cmd_123');
const stats = await repo.getStatistiques();
```

**Résultat :** ✅ Fonctionne sans modification

## 🚀 Migration Recommandée (Optionnelle)

Pour bénéficier pleinement des nouvelles fonctionnalités, suivez ces étapes :

### Étape 1 : Mettre à jour les imports

#### Avant
```typescript
import { CommandesRepository } from './commandes.repository.js';
import * as queries from './queries.js';
```

#### Après (Recommandé)
```typescript
import { getCommandesRepository } from './commandes.repository.js';
import * as queries from './queries/index.js';
```

**Avantage :** Accès au singleton et imports plus explicites

---

### Étape 2 : Utiliser le singleton

#### Avant
```typescript
const repo = new CommandesRepository();
```

#### Après
```typescript
const repo = getCommandesRepository();
```

**Avantage :** Une seule instance partagée (économie mémoire)

---

### Étape 3 : Utiliser les nouvelles méthodes

#### Mises à jour spécifiques

**Avant :**
```typescript
await repo.update(id, { total: 200 });
```

**Après (plus explicite) :**
```typescript
await repo.updateTotal(id, 200);
```

**Avant :**
```typescript
await repo.update(id, { articles: newArticles });
```

**Après :**
```typescript
await repo.updateArticles(id, newArticles);
```

**Avant :**
```typescript
await repo.update(id, { payment_intent_id: pi });
```

**Après :**
```typescript
await repo.updatePaymentIntent(id, pi);
```

---

### Étape 4 : Accéder aux repositories spécialisés

Pour des opérations avancées, utilisez les repositories spécialisés :

```typescript
const repo = getCommandesRepository();

// Accès direct pour des opérations avancées
const searchResults = await repo.searchRepository.advancedSearch({
  statut: 'confirmee',
  montantMin: 100,
  montantMax: 500,
  dateDebut: '2024-01-01',
  sortBy: 'total',
  sortOrder: 'DESC',
  limit: 20
});

// Recherche par pattern (autocomplete)
const suggestions = await repo.searchRepository.searchByIdPattern('cmd_', 10);

// Recherche par produit
const commandesAvecProduit = await repo.searchRepository.searchByProductName('tshirt');

// Validation anti-fraude
const fraudCheck = await repo.validation.userHasTooManyCancelled(userId, 30, 50);
if (fraudCheck.hasTooMany) {
  console.warn('Taux d\'annulation suspect:', fraudCheck.stats);
}

// Statistiques détaillées
const statsJour = await repo.stats.getCommandesByHour(7);
const statsSemaine = await repo.stats.getCommandesByDayOfWeek(90);
```

---

## 📊 Nouvelles Fonctionnalités Disponibles

### 1. Méthodes d'écriture spécialisées

```typescript
// Mettre à jour uniquement le total
await repo.updateTotal(commandeId, 250.50);

// Mettre à jour uniquement les articles
await repo.updateArticles(commandeId, nouvellesArticles);

// Mettre à jour uniquement le payment_intent
await repo.updatePaymentIntent(commandeId, paymentIntentId);

// Supprimer les commandes d'un utilisateur
await repo.deleteByUser(utilisateurId);

// Nettoyer les anciennes commandes annulées
const nbSupprimees = await repo.deleteOldCancelled(90); // > 90 jours
```

### 2. Statistiques avancées

```typescript
// Panier moyen
const panierMoyen = await repo.getPanierMoyen();

// Statistiques par année
const statsAnnuelles = await repo.getStatsByYear(5);

// Top produits par CA
const topProduits = await repo.getTopProduitsByCA(10);

// Top clients
const topClientsParNombre = await repo.getTopClientsByCount(10);
const topClientsParMontant = await repo.getTopClientsByAmount(10);

// Taux de conversion
const tauxConversion = await repo.getTauxConversion();
// { total_commandes, commandes_reussies, taux_reussite, ... }

// Temps moyen de traitement
const tempsTraitement = await repo.getTempsMoyenTraitement(30);

// Répartition temporelle
const parHeure = await repo.getCommandesByHour(7);
const parJourSemaine = await repo.getCommandesByDayOfWeek(90);
```

### 3. Recherche avancée

```typescript
// Autocomplete sur les IDs
const suggestions = await repo.searchByIdPattern('cmd_2024', 10);

// Recherche par email
const commandesEmail = await repo.searchByEmail('user@example.com');

// Recherche par username
const commandesUser = await repo.searchByUsername('john');

// Recherche par plage de montants
const commandesMontant = await repo.searchByMontantRange(100, 500);

// Recherche par article ID
const commandesArticle = await repo.searchByArticle('art_123');

// Recherche par nom de produit
const commandesProduit = await repo.searchByProductName('tshirt');

// Recherche complexe avec tous les filtres
const results = await repo.searchRepository.advancedSearch({
  statut: 'confirmee',
  utilisateurId: 42,
  dateDebut: '2024-01-01',
  dateFin: '2024-12-31',
  montantMin: 50,
  montantMax: 1000,
  search: 'john',
  articleId: 'art_123',
  sortBy: 'total',
  sortOrder: 'DESC',
  limit: 50,
  offset: 0
});
```

### 4. Validations avancées

```typescript
// Vérifications basiques
const exists = await repo.paymentIntentExists(paymentIntentId);
const hasPending = await repo.userHasPendingCommande(userId);

// Vérifications de modification
const canCancel = await repo.canBeCancelled(commandeId);
const canModify = await repo.canBeModified(commandeId);
const canRefund = await repo.canBeRefunded(commandeId);

// Détection de fraude
const nbRecentes = await repo.countRecentUserCommandes(userId, 30);
const totalRecent = await repo.sumRecentUserCommandesTotal(userId, 30);
const exceedsLimit = await repo.userExceedsOrderLimit(userId, 24, 10);

const fraudCheck = await repo.userHasTooManyCancelled(userId, 30, 50);
if (fraudCheck.hasTooMany) {
  console.log('Stats:', fraudCheck.stats);
  // { total_commandes, commandes_annulees, taux_annulation }
}

const duplicate = await repo.checkDuplicatePaymentIntent(paymentIntentId);
if (duplicate.hasDuplicate) {
  console.warn('Doublons détectés:', duplicate.commandeIds);
}

// Validations métier
const canOrder = await repo.userCanOrder(userId);
const consistency = await repo.checkCommandeTotalConsistency(commandeId);
if (!consistency.isConsistent) {
  console.error('Incohérence:', consistency.details);
}

const hasArticles = await repo.commandeHasArticles(commandeId);

// Validations de statut
const isValid = repo.checkValidStatut('confirmee'); // synchrone
const canTransition = repo.isValidStatusTransition('en_attente', 'confirmee');
const isFinal = repo.isFinalStatus('livree');

// Validations temporelles
const tooOld = await repo.isCommandeTooOld(commandeId, 24);
const expired = await repo.isCommandeExpired(commandeId, 24);
const expiredList = await repo.getExpiredCommandes(24, 100);

// Validations de montants
const validMontant = repo.checkValidMontant(150); // synchrone
const suspicious = repo.checkSuspiciousMontant(15000);

const avgAmount = await repo.getUserAverageOrderAmount(userId, 90);
const deviation = await repo.checkMontantDeviation(userId, 500, 90);
if (deviation.hasDeviation) {
  console.warn('Montant anormal:', deviation.stats);
}

// Validations d'intégrité
const integrityOk = await repo.checkReferentialIntegrity(commandeId);
const orphans = await repo.getOrphanedCommandes(100);
const duplicates = await repo.checkPotentialDuplicates(commandeId);
```

---

## 🧪 Migration des Tests

### Avant
```typescript
// Test monolithique
describe('CommandesRepository', () => {
  let repo: CommandesRepository;
  
  beforeEach(() => {
    repo = new CommandesRepository();
  });
  
  it('should find by id', async () => {
    const result = await repo.findById('cmd_123');
    expect(result).toBeDefined();
  });
  
  // ... 50+ tests
});
```

### Après (Recommandé)
```typescript
// Tests focalisés par repository
describe('CommandesReadRepository', () => {
  let readRepo: CommandesReadRepository;
  let mockConnector: MockMysqlConnector;
  
  beforeEach(() => {
    mockConnector = new MockMysqlConnector();
    readRepo = new CommandesReadRepository(mockConnector);
  });
  
  it('should find by id', async () => {
    mockConnector.mockQueryResult([mockCommandeRow]);
    const result = await readRepo.findById('cmd_123');
    expect(result).toBeDefined();
  });
  
  // Seulement 6-8 tests focalisés
});

describe('CommandesWriteRepository', () => {
  // Tests d'écriture uniquement
});

// etc.
```

---

## ⚠️ Points d'Attention

### 1. Imports des Queries

Si vous importez directement des queries :

```typescript
// ❌ Ancien (déprécié mais fonctionne)
import { SELECT_ALL_COMMANDES } from './queries.js';

// ✅ Nouveau (recommandé)
import { SELECT_ALL_COMMANDES } from './queries/read.queries.js';
// ou
import * as readQueries from './queries/read.queries.js';
```

### 2. Construction Dynamique

La fonction `buildUpdateCommandeQuery` reste disponible :

```typescript
import { buildUpdateCommandeQuery } from './queries/write.queries.js';

const updates = ['statut = ?', 'total = ?'];
const sql = buildUpdateCommandeQuery(updates);
```

### 3. Types Inchangés

Tous les types restent au même endroit :

```typescript
import type {
  Commande,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeSearchFilters
} from './types.js';
```

---

## 📝 Checklist de Migration

### Migration Minimale (0 changement requis)
- [ ] Vérifier que le code existant fonctionne
- [ ] Lire cette documentation
- [ ] **C'est tout !** 🎉

### Migration Recommandée (optionnelle)
- [ ] Remplacer `new CommandesRepository()` par `getCommandesRepository()`
- [ ] Utiliser les nouvelles méthodes spécialisées (`updateTotal`, etc.)
- [ ] Explorer les nouvelles fonctionnalités (recherche avancée, validations)
- [ ] Mettre à jour les tests pour utiliser les repositories spécialisés
- [ ] Mettre à jour les imports de queries vers `queries/`

### Migration Avancée (pour code optimisé)
- [ ] Utiliser l'accès direct aux repositories (`repo.search`, `repo.stats`)
- [ ] Implémenter la détection de fraude avec les nouvelles validations
- [ ] Ajouter du caching Redis pour les statistiques
- [ ] Créer des DataLoaders pour GraphQL

---

## 🆘 Support

### Questions Fréquentes

**Q: Mon code existant va-t-il casser ?**  
R: Non ! Compatibilité 100% garantie.

**Q: Dois-je tout migrer d'un coup ?**  
R: Non, migrez progressivement à votre rythme.

**Q: Les anciennes méthodes vont-elles disparaître ?**  
R: Non, elles resteront disponibles indéfiniment.

**Q: Puis-je mélanger ancien et nouveau code ?**  
R: Oui, absolument ! Migrez au fur et à mesure.

**Q: Où trouver plus d'exemples ?**  
R: Consultez `ARCHITECTURE_V2.md` et `IMPROVEMENTS_SUMMARY.md`

### En Cas de Problème

1. Vérifiez que tous les imports sont corrects
2. Assurez-vous d'utiliser les bonnes extensions (`.js`)
3. Consultez la documentation complète dans `ARCHITECTURE_V2.md`
4. Contactez l'équipe de développement

---

## 📚 Documentation Connexe

- **ARCHITECTURE_V2.md** - Architecture complète et détaillée
- **IMPROVEMENTS_SUMMARY.md** - Résumé des améliorations
- **README.md** - Guide d'utilisation général

---

**Date de création :** 2024  
**Version :** 2.0.0  
**Statut :** ✅ Production Ready