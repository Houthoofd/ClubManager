# Guide de Migration - Module Magasin

## Vue d'ensemble

Ce guide vous aidera à migrer du code utilisant l'ancienne classe `Magasin` vers le nouveau `MagasinRepository`.

## Changements principaux

### 1. Architecture

**Avant:**
- Classe `Magasin` instanciée directement
- Méthodes avec noms en français
- Pas de pattern singleton
- Pas de GraphQL

**Après:**
- Pattern Repository avec singleton
- Méthodes en anglais (convention)
- API GraphQL complète
- Types TypeScript stricts
- Tests unitaires complets

### 2. Import et Instanciation

**Avant:**
```typescript
import { Magasin } from './db/clients/magasin/magasin.js';

const magasin = new Magasin();
```

**Après:**
```typescript
import { getMagasinRepository } from './db/clients/magasin/index.js';

const magasinRepo = getMagasinRepository();
```

## Correspondance des Méthodes

### Articles

| Ancienne Méthode | Nouvelle Méthode | Changements |
|------------------|------------------|-------------|
| `obtenirLesArticles()` | `getAllArticles()` | Retour typé `ArticleAvecCategorie[]` |
| `obtenirArticlesParCategories()` | `getArticlesParCategories()` | Même structure de retour |
| N/A | `getArticleById(id)` | Nouvelle méthode |
| N/A | `getArticlesByCategorie(categorieId)` | Nouvelle méthode |
| N/A | `searchArticlesByName(searchTerm)` | Nouvelle méthode |
| N/A | `searchArticlesByPriceRange(min, max)` | Nouvelle méthode |
| `ajouterArticle(data)` | `createArticle(data)` | Paramètres typés `CreateArticleData` |
| `modifierArticle(id, data)` | `updateArticle(id, data)` | Paramètres typés `UpdateArticleData` |
| `supprimerArticle(id)` | `deleteArticle(id)` | Suppression complète (images + stocks) |

### Stocks

| Ancienne Méthode | Nouvelle Méthode | Changements |
|------------------|------------------|-------------|
| `obtenirLeStock()` | `getAllStocks()` | Retour typé `StockDetail[]` |
| N/A | `getStocksByArticle(articleId)` | Nouvelle méthode |
| N/A | `getStockByArticleAndTaille(articleId, tailleId)` | Nouvelle méthode |
| N/A | `getOutOfStockArticles()` | Nouvelle méthode |
| N/A | `getLowStockArticles(threshold)` | Nouvelle méthode |
| `ajouterStock(articleId, tailleId, quantite)` | `addStock({article_id, taille_id, quantite})` | Paramètre objet |
| `modifierStock(articleId, tailleId, quantite)` | `updateStock({article_id, taille_id, quantite})` | Paramètre objet |

### Commandes

| Ancienne Méthode | Nouvelle Méthode | Changements |
|------------------|------------------|-------------|
| `obtenirLesCommandes()` | `getAllCommandes()` | Retour typé `CommandeAvecClient[]` |
| N/A | `getCommandeById(id)` | Nouvelle méthode |
| N/A | `getCommandesByUser(utilisateurId)` | Nouvelle méthode |
| N/A | `getCommandesByStatut(statut)` | Nouvelle méthode |
| `ajouterCommande(data)` | `createCommande(data)` | Paramètres typés, gestion automatique des stocks |
| `creerCommande(data)` | `createCommande(data)` | Méthode unifiée |
| N/A | `updateCommandeStatut(id, statut)` | Nouvelle méthode |
| N/A | `cancelCommande(id)` | Nouvelle méthode |

### Catégories et Tailles

| Ancienne Méthode | Nouvelle Méthode | Changements |
|------------------|------------------|-------------|
| `obtenirLesCategories()` | `getAllCategories()` | Retour typé `Categorie[]` |
| N/A | `getCategorieById(id)` | Nouvelle méthode |
| N/A | `getCategorieByName(nom)` | Nouvelle méthode |
| `obtenirLesTailles()` | `getAllTailles()` | Retour typé `Taille[]` |
| N/A | `getTailleById(id)` | Nouvelle méthode |
| N/A | `getTailleByName(nom)` | Nouvelle méthode |
| `getTailleMap()` | `getTailleMap()` | Même signature |

### Validations (Nouvelles)

| Méthode | Description |
|---------|-------------|
| `articleExists(id)` | Vérifie si un article existe |
| `categorieExists(id)` | Vérifie si une catégorie existe |
| `checkStockSufficient(articleId, tailleId, quantite)` | Vérifie le stock disponible |

### Statistiques (Nouvelles)

| Méthode | Description |
|---------|-------------|
| `getStats()` | Retourne toutes les statistiques du magasin |

## Exemples de Migration

### Exemple 1: Récupérer les articles

**Avant:**
```typescript
const magasin = new Magasin();
const articles = await magasin.obtenirLesArticles();
```

**Après:**
```typescript
const magasinRepo = getMagasinRepository();
const articles = await magasinRepo.getAllArticles();
```

### Exemple 2: Créer un article

**Avant:**
```typescript
const result = await magasin.ajouterArticle({
  nom: 'T-Shirt',
  description: 'Description',
  prix: 25.99,
  categorie_id: 1,
  images: ['url1', 'url2'],
  stocks: [
    { taille: 'M', quantite: 10 }
  ]
});
```

**Après:**
```typescript
const result = await magasinRepo.createArticle({
  nom: 'T-Shirt',
  prix: 25.99,
  description: 'Description',
  categorie_id: 1,
  images: ['url1', 'url2'],
  stocks: [
    { taille: 'M', quantite: 10 }
  ]
});
```

### Exemple 3: Ajouter du stock

**Avant:**
```typescript
const result = await magasin.ajouterStock(1, 2, 10);
```

**Après:**
```typescript
const result = await magasinRepo.addStock({
  article_id: 1,
  taille_id: 2,
  quantite: 10
});
```

### Exemple 4: Créer une commande

**Avant:**
```typescript
const result = await magasin.ajouterCommande({
  utilisateur_id: 1,
  articles: [
    { article_id: 1, taille: 'M', quantite: 2, prix: 25.99 }
  ],
  total: 51.98,
  date: new Date().toISOString(),
  statut: 'en_attente'
});
```

**Après:**
```typescript
const result = await magasinRepo.createCommande({
  utilisateur_id: 1,
  articles: [
    { article_id: 1, taille: 'M', quantite: 2, prix: 25.99 }
  ],
  total: 51.98,
  // date et statut sont optionnels avec valeurs par défaut
});
```

### Exemple 5: Recherche d'articles (Nouvelle fonctionnalité)

**Après:**
```typescript
// Par nom
const articles = await magasinRepo.searchArticlesByName('shirt');

// Par prix
const articles = await magasinRepo.searchArticlesByPriceRange(20, 50);

// Par catégorie
const articles = await magasinRepo.getArticlesByCategorie(1);
```

## Gestion des Erreurs

### Avant
```typescript
try {
  const result = await magasin.ajouterArticle(data);
  if (result.isConfirm) {
    console.log('Succès');
  } else {
    console.error(result.message);
  }
} catch (error) {
  console.error('Erreur DB:', error);
}
```

### Après
```typescript
try {
  const result = await magasinRepo.createArticle(data);
  if (result.isConfirm) {
    console.log('Succès:', result.message);
    if (result.data) {
      console.log('ID créé:', result.data.id);
    }
  } else {
    console.error('Échec:', result.message);
  }
} catch (error) {
  console.error('Erreur inattendue:', error);
}
```

## Utilisation avec TypeScript

### Types disponibles

```typescript
import type {
  Article,
  ArticleAvecCategorie,
  StockArticle,
  StockDetail,
  Categorie,
  Taille,
  Commande,
  CommandeAvecClient,
  ArticleCommande,
  CreateArticleData,
  UpdateArticleData,
  CreateCommandeData,
  AddStockData,
  UpdateStockData,
  ConfirmationResult,
  MagasinStats
} from './db/clients/magasin/index.js';
```

### Exemple typé

```typescript
import { getMagasinRepository } from './db/clients/magasin/index.js';
import type { CreateArticleData, ConfirmationResult } from './db/clients/magasin/index.js';

async function creerArticle(data: CreateArticleData): Promise<ConfirmationResult> {
  const repo = getMagasinRepository();
  return await repo.createArticle(data);
}
```

## Migration GraphQL

### Configuration Apollo Server

```typescript
import { ApolloServer } from '@apollo/server';
import { typeDefs, resolvers } from './db/clients/magasin/index.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});
```

### Exemples de requêtes

**Créer un article via GraphQL:**
```graphql
mutation {
  createArticle(input: {
    nom: "T-Shirt"
    prix: 25.99
    categorie_id: 1
    images: ["url"]
    stocks: [{ taille: "M", quantite: 10 }]
  }) {
    isConfirm
    message
    data
  }
}
```

## Plan de Migration Progressif

### Phase 1: Coexistence (Recommandé)
1. Garder l'ancien fichier `magasin.ts` (legacy)
2. Utiliser le nouveau repository dans les nouvelles fonctionnalités
3. Migrer progressivement les anciens endpoints

### Phase 2: Migration des endpoints
1. Identifier tous les usages de `new Magasin()`
2. Remplacer par `getMagasinRepository()`
3. Ajuster les noms de méthodes selon le tableau de correspondance
4. Tester chaque endpoint migré

### Phase 3: Tests
1. Exécuter les tests unitaires du nouveau module
2. Tester l'intégration avec votre application
3. Valider les cas limites

### Phase 4: Nettoyage
1. Supprimer l'ancien fichier `magasin.ts`
2. Mettre à jour toute la documentation
3. Former l'équipe sur la nouvelle architecture

## Checklist de Migration

- [ ] Installer les dépendances TypeScript
- [ ] Importer le nouveau module
- [ ] Remplacer `new Magasin()` par `getMagasinRepository()`
- [ ] Mettre à jour les noms de méthodes
- [ ] Ajuster les paramètres (objets au lieu de paramètres multiples)
- [ ] Ajouter les types TypeScript
- [ ] Tester toutes les fonctionnalités
- [ ] Mettre à jour les tests existants
- [ ] Configurer GraphQL (si applicable)
- [ ] Former l'équipe
- [ ] Documenter les changements
- [ ] Supprimer l'ancien code

## Différences importantes

### 1. Gestion des transactions
Le nouveau repository gère automatiquement les opérations transactionnelles (ex: création d'article avec images et stocks).

### 2. Gestion des stocks dans les commandes
La création de commande décrémente automatiquement les stocks.

### 3. Validations
Plus de méthodes de validation disponibles avant les opérations.

### 4. Retours de méthodes
Toutes les méthodes de modification retournent un `ConfirmationResult` consistant.

### 5. Types stricts
Utilisation de TypeScript strict avec types d'entrée et de sortie définis.

## Support

Pour toute question sur la migration:
1. Consultez le README.md complet
2. Référez-vous aux tests unitaires pour des exemples
3. Contactez l'équipe de développement

## Ressources

- [README.md](./README.md) - Documentation complète
- [types.ts](./types.ts) - Tous les types TypeScript
- [__tests__/](./tests/) - Exemples d'utilisation dans les tests
- [graphql/magasin.graphql.ts](./graphql/magasin.graphql.ts) - Schema GraphQL

## Notes Importantes

⚠️ **Attention:**
- Le nouveau repository supprime **vraiment** les articles (avec leurs images et stocks)
- Les commandes décrémententautomatiquement les stocks
- Vérifiez toujours le stock avant de créer une commande
- Utilisez toujours le singleton `getMagasinRepository()`

✅ **Avantages:**
- Code plus maintenable et testable
- Types TypeScript stricts
- API GraphQL prête à l'emploi
- Meilleure séparation des responsabilités
- Tests unitaires complets