# Module Commandes - Architecture Modulaire V2

## 📋 Vue d'ensemble

Le module **Commandes** gère l'ensemble du cycle de vie des commandes dans l'application ClubManager, de la création au suivi des statistiques, en passant par la recherche et la validation.

**Version actuelle :** 2.0.0  
**Architecture :** Modulaire et orientée responsabilités  
**Compatibilité :** 100% rétrocompatible avec la version 1.0

## 🚀 Démarrage Rapide

### Installation

```typescript
import { getCommandesRepository } from './db/clients/commandes';

const repo = getCommandesRepository();
```

### Utilisation Basique

```typescript
// Lire une commande
const commande = await repo.findById('cmd_123');

// Créer une commande
const newId = await repo.create({
  commande_id: 'cmd_456',
  utilisateur_id: 42,
  total: 150.00,
  articles: [
    { article_id: 'art_1', nom: 'Produit', quantite: 2, prix_total: 150.00 }
  ]
});

// Mettre à jour le statut
await repo.updateStatut('cmd_456', 'confirmee');

// Obtenir des statistiques
const stats = await repo.getStatistiques();
```

## 📁 Structure du Module

```
commandes/
├── queries/                      # Requêtes SQL organisées
│   ├── read.queries.ts          # SELECT (121 lignes)
│   ├── write.queries.ts         # INSERT/UPDATE/DELETE (102 lignes)
│   ├── stats.queries.ts         # Statistiques (308 lignes)
│   ├── search.queries.ts        # Recherche (406 lignes)
│   ├── validation.queries.ts    # Validation (370 lignes)
│   └── index.ts                 # Exports centralisés
│
├── repositories/                 # Repositories spécialisés
│   ├── read.repository.ts       # Lecture seule (140 lignes)
│   ├── write.repository.ts      # Écriture seule (226 lignes)
│   ├── stats.repository.ts      # Statistiques (367 lignes)
│   ├── search.repository.ts     # Recherche (238 lignes)
│   └── validation.repository.ts # Validation (563 lignes)
│
├── utils/                        # Utilitaires
│   ├── parsing.utils.ts         # Parsing de données
│   ├── validation.utils.ts      # Validation métier
│   └── index.ts
│
├── types.ts                      # Types et interfaces TypeScript
├── commandes.repository.ts       # Repository principal (agrégateur)
├── commandes.ts                  # Façade publique
├── index.ts                      # Exports publics
│
└── 📚 Documentation
    ├── README.md                 # Ce fichier
    ├── ARCHITECTURE_V2.md        # Architecture détaillée
    ├── IMPROVEMENTS_SUMMARY.md   # Résumé des améliorations
    ├── MIGRATION_GUIDE.md        # Guide de migration
    ├── BEFORE_AFTER.md           # Comparaison visuelle
    └── CHANGELOG.md              # Historique des versions
```

## 🎯 Principes d'Architecture

### 1. Séparation des Responsabilités (SRP)
Chaque fichier a **une seule responsabilité** :
- **Queries** : Contiennent uniquement du SQL
- **Repositories** : Exécutent les requêtes et parsent les résultats
- **Utils** : Parsing et validation
- **Types** : Définitions de types

### 2. Composition sur Héritage
Le repository principal **agrège** les repositories spécialisés :

```typescript
class CommandesRepository {
  private readRepo: CommandesReadRepository;
  private writeRepo: CommandesWriteRepository;
  private statsRepo: CommandesStatsRepository;
  private searchRepo: CommandesSearchRepository;
  private validationRepo: CommandesValidationRepository;
  
  async findById(id: string) {
    return this.readRepo.findById(id); // Délégation
  }
}
```

## 📖 API Principale

### Lecture (Read)

```typescript
// Récupérer toutes les commandes
const all = await repo.findAll();

// Récupérer par ID
const cmd = await repo.findById('cmd_123');

// Récupérer par utilisateur
const userCmds = await repo.findByUserId(42);

// Récupérer par statut
const pending = await repo.findByStatut('en_attente');

// Récupérer par payment_intent
const cmd = await repo.findByPaymentIntent('pi_xxx');

// Récupérer les commandes récentes
const recent = await repo.getRecentUserCommandes(42, 30); // 30 minutes
```

### Écriture (Write)

```typescript
// Créer une commande
const id = await repo.create({
  commande_id: 'cmd_456',
  utilisateur_id: 42,
  total: 150.00,
  articles: [...]
});

// Mettre à jour le statut
await repo.updateStatut('cmd_456', 'confirmee');

// Mettre à jour le total
await repo.updateTotal('cmd_456', 200.00);

// Mettre à jour les articles
await repo.updateArticles('cmd_456', newArticles);

// Mettre à jour le payment_intent
await repo.updatePaymentIntent('cmd_456', 'pi_xxx');

// Mise à jour dynamique
await repo.update('cmd_456', {
  statut: 'confirmee',
  total: 200.00
});

// Supprimer une commande
await repo.delete('cmd_456');

// Supprimer par utilisateur (avec précaution)
await repo.deleteByUser(42);

// Nettoyer les anciennes commandes annulées
const deleted = await repo.deleteOldCancelled(90); // > 90 jours
```

### Statistiques (Stats)

```typescript
// Statistiques globales
const stats = await repo.getStatistiques();
// {
//   total_commandes,
//   commandes_en_attente,
//   commandes_confirmees,
//   chiffre_affaires_total,
//   panier_moyen,
//   ...
// }

// Compter par statut
const counts = await repo.countByStatut();
// { en_attente: 5, confirmee: 10, ... }

// Stats par période
const daily = await repo.getStatsByPeriod('day', 7);
const weekly = await repo.getStatsByPeriod('week', 4);
const monthly = await repo.getStatsByPeriod('month', 12);

// Top produits
const topProducts = await repo.getTopProduits(10);
const topByCA = await repo.getTopProduitsByCA(10);

// Panier moyen
const avg = await repo.getPanierMoyen();

// Top clients
const topByCount = await repo.getTopClientsByCount(10);
const topByAmount = await repo.getTopClientsByAmount(10);

// Taux de conversion
const conversion = await repo.getTauxConversion();

// Temps moyen de traitement
const avgTime = await repo.getTempsMoyenTraitement(30);

// Répartition temporelle
const byHour = await repo.getCommandesByHour(7);
const byDay = await repo.getCommandesByDayOfWeek(90);
```

### Recherche (Search)

```typescript
// Recherche avec filtres
const results = await repo.search({
  statut: 'confirmee',
  utilisateur_id: 42,
  date_debut: '2024-01-01',
  date_fin: '2024-12-31',
  montant_min: 50,
  montant_max: 500,
  search: 'john',
  limit: 50,
  offset: 0
});

// Recherche par pattern (autocomplete)
const suggestions = await repo.searchByIdPattern('cmd_', 10);

// Recherche par email
const byEmail = await repo.searchByEmail('user@example.com');

// Recherche par username
const byUser = await repo.searchByUsername('john');

// Recherche par montant
const byAmount = await repo.searchByMontantRange(100, 500);

// Recherche par article
const byArticle = await repo.searchByArticle('art_123');

// Recherche par produit
const byProduct = await repo.searchByProductName('tshirt');
```

### Validation

```typescript
// Vérifications d'existence
const exists = await repo.exists('cmd_123');
const userExists = await repo.userExists(42);
const piExists = await repo.paymentIntentExists('pi_xxx');

// Vérifications de statut
const status = await repo.getCommandeStatut('cmd_123');
const canCancel = await repo.canBeCancelled('cmd_123');
const canModify = await repo.canBeModified('cmd_123');
const canRefund = await repo.canBeRefunded('cmd_123');

// Validations de statut
const isValid = repo.checkValidStatut('confirmee');
const canTransition = repo.isValidStatusTransition('en_attente', 'confirmee');
const isFinal = repo.isFinalStatus('livree');

// Détection de fraude
const recentCount = await repo.countRecentUserCommandes(42, 30);
const recentTotal = await repo.sumRecentUserCommandesTotal(42, 30);
const exceeds = await repo.userExceedsOrderLimit(42, 24, 10);

const fraudCheck = await repo.userHasTooManyCancelled(42, 30, 50);
if (fraudCheck.hasTooMany) {
  console.warn('Taux d\'annulation suspect:', fraudCheck.stats);
}

// Validations métier
const canOrder = await repo.userCanOrder(42);
const consistency = await repo.checkCommandeTotalConsistency('cmd_123');
const hasArticles = await repo.commandeHasArticles('cmd_123');

// Validations de montants
const validAmount = repo.checkValidMontant(150);
const suspicious = repo.checkSuspiciousMontant(15000);
const deviation = await repo.checkMontantDeviation(42, 500, 90);
```

## 🔧 Utilisation Avancée

### Accès Direct aux Repositories Spécialisés

```typescript
const repo = getCommandesRepository();

// Accès aux repositories
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
```

## 📊 Types Principaux

```typescript
// Commande complète
interface Commande {
  commande_id: string;
  utilisateur_id: number;
  statut: CommandeStatut;
  total: number;
  articles: Article[];
  date_commande: Date;
  updated_at?: Date;
  payment_intent_id?: string;
  nom_utilisateur?: string;
  email?: string;
}

// Création
interface CreateCommandeData {
  commande_id: string;
  utilisateur_id: number;
  total: number;
  articles: Article[];
  statut?: CommandeStatut;
  payment_intent_id?: string;
}

// Mise à jour
interface UpdateCommandeData {
  statut?: CommandeStatut;
  total?: number;
  articles?: Article[];
  payment_intent_id?: string;
}

// Filtres de recherche
interface CommandeSearchFilters {
  statut?: string;
  utilisateur_id?: number;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
  search?: string;
  limit?: number;
  offset?: number;
}
```

## 🧪 Tests

```typescript
import { CommandesReadRepository } from './repositories/read.repository';
import { MockMysqlConnector } from '@tests/mocks';

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

## 📚 Documentation Complète

- **[ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md)** - Architecture détaillée avec exemples
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - Résumé des améliorations
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guide de migration étape par étape
- **[BEFORE_AFTER.md](./BEFORE_AFTER.md)** - Comparaison visuelle avant/après
- **[CHANGELOG.md](./CHANGELOG.md)** - Historique des versions

## 🔄 Migration

### Code Existant (Fonctionne toujours)

```typescript
import { CommandesRepository } from './commandes.repository.js';
const repo = new CommandesRepository();
```

### Code Recommandé (Nouvelles fonctionnalités)

```typescript
import { getCommandesRepository } from './commandes.repository.js';
const repo = getCommandesRepository();
```

**Voir [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) pour plus de détails.**

## ✨ Fonctionnalités Clés

- ✅ **CRUD complet** - Création, lecture, mise à jour, suppression
- ✅ **Statistiques avancées** - Stats globales, par période, top produits/clients
- ✅ **Recherche puissante** - Recherche multicritères avec filtres et pagination
- ✅ **Validation robuste** - Détection de fraude, validation métier et d'intégrité
- ✅ **Architecture modulaire** - Code organisé et maintenable
- ✅ **100% rétrocompatible** - Aucune rupture avec le code existant
- ✅ **Documentation complète** - 5 fichiers de documentation détaillée
- ✅ **Testable** - Architecture facilitant les tests unitaires et d'intégration

## 🚦 Statuts de Commande

```typescript
type CommandeStatut =
  | 'en_attente'      // Commande créée, en attente de confirmation
  | 'confirmee'       // Commande confirmée et payée
  | 'en_preparation'  // Commande en cours de préparation
  | 'expedie'         // Commande expédiée
  | 'livree'          // Commande livrée (état final)
  | 'annulee'         // Commande annulée (état final)
  | 'remboursee';     // Commande remboursée (état final)
```

### Transitions Autorisées

```
en_attente → confirmee, annulee
confirmee → en_preparation, annulee, remboursee
en_preparation → expedie, annulee, remboursee
expedie → livree, remboursee
livree → remboursee
annulee → [état final]
remboursee → [état final]
```

## 🛡️ Sécurité et Anti-Fraude

Le module intègre plusieurs mécanismes de détection de fraude :

- **Limite de commandes** : Détection de trop nombreuses commandes sur une période
- **Montants suspects** : Alerte sur les montants anormalement élevés
- **Déviation statistique** : Détection des montants anormaux par rapport à l'historique
- **Doublons payment_intent** : Détection de tentatives de double paiement
- **Taux d'annulation** : Alerte sur un taux d'annulation anormal
- **Intégrité référentielle** : Vérification des relations avec les utilisateurs

## 📈 Performance

- **Queries optimisées** : Indexation et jointures efficaces
- **Pagination** : Limite et offset pour les grandes listes
- **Caching potentiel** : Structure facilitant l'ajout de cache Redis
- **Séparation lecture/écriture** : Optimisation indépendante possible

## 🤝 Contribution

Pour contribuer à ce module :

1. Respecter l'architecture modulaire (un fichier = une responsabilité)
2. Écrire des tests pour les nouvelles fonctionnalités
3. Documenter les changements dans CHANGELOG.md
4. Maintenir la rétrocompatibilité

## 📞 Support

Pour toute question ou problème :

1. Consulter la documentation complète dans `ARCHITECTURE_V2.md`
2. Vérifier le guide de migration dans `MIGRATION_GUIDE.md`
3. Consulter le changelog dans `CHANGELOG.md`
4. Contacter l'équipe de développement

## 🎯 Prochaines Étapes

- [ ] Tests unitaires complets
- [ ] Tests d'intégration
- [ ] DataLoader pour GraphQL
- [ ] Caching Redis pour les statistiques
- [ ] GraphQL subscriptions
- [ ] Webhooks pour notifications

---

**Version :** 2.0.0  
**Dernière mise à jour :** 2024  
**Statut :** ✅ Production Ready  
**Licence :** Privé - ClubManager