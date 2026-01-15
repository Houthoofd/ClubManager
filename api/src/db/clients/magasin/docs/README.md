# Module Magasin - Documentation

## Vue d'ensemble

Le module Magasin fournit une interface complète pour gérer les articles, stocks, catégories, tailles et commandes d'une boutique en ligne. Il suit le pattern Repository et expose une API GraphQL pour une intégration facile.

## Architecture

Le module est organisé selon les principes suivants :
- **Séparation des préoccupations** : Repository (accès données), Types (définitions), Utils (helpers), GraphQL (API)
- **Pattern Singleton** : Une seule instance du repository
- **Type-safe** : TypeScript complet avec types stricts
- **Testable** : Tests unitaires complets avec mocks

### Structure des fichiers

```
magasin/
├── magasin.repository.ts       # Repository principal (logique d'accès DB)
├── magasin.ts                  # Ancien fichier (legacy, à migrer)
├── types.ts                    # Définitions TypeScript
├── index.ts                    # Point d'entrée principal
├── queries/                    # Requêtes SQL modulaires
│   ├── read.queries.ts         # SELECT queries
│   ├── write.queries.ts        # INSERT, UPDATE, DELETE
│   ├── validation.queries.ts  # Vérifications et validations
│   └── index.ts               # Export centralisé
├── utils/                      # Utilitaires et parseurs
│   └── index.ts               # Parseurs, validators, helpers
├── graphql/                    # Schema et resolvers GraphQL
│   └── magasin.graphql.ts     # TypeDefs + Resolvers
└── __tests__/                  # Tests unitaires
    ├── magasin.repository.test.ts
    └── magasin.graphql.test.ts
```

## Installation et Configuration

### Prérequis

```bash
npm install
```

### Configuration de la base de données

Le module utilise `MysqlConnector` pour se connecter à la base de données. Assurez-vous que votre configuration MySQL est correcte dans votre fichier `.env`.

## Utilisation

### 1. Import du Repository

```typescript
import { getMagasinRepository } from './db/clients/magasin/index.js';

const magasinRepo = getMagasinRepository();
```

### 2. Gestion des Articles

#### Récupérer tous les articles

```typescript
const articles = await magasinRepo.getAllArticles();
// Retourne: ArticleAvecCategorie[]
```

#### Récupérer un article par ID

```typescript
const article = await magasinRepo.getArticleById(1);
// Retourne: ArticleAvecCategorie | null
```

#### Créer un article

```typescript
const result = await magasinRepo.createArticle({
  nom: 'T-Shirt Club',
  prix: 25.99,
  description: 'T-shirt officiel du club',
  categorie_id: 1,
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  stocks: [
    { taille: 'S', quantite: 10 },
    { taille: 'M', quantite: 20 },
    { taille: 'L', quantite: 15 }
  ]
});

if (result.isConfirm) {
  console.log('Article créé avec ID:', result.data.id);
}
```

#### Mettre à jour un article

```typescript
const result = await magasinRepo.updateArticle(1, {
  nom: 'T-Shirt Club (Nouveau Design)',
  prix: 29.99,
  stocks: [
    { taille: 'M', quantite: 30 },
    { taille: 'L', quantite: 25 }
  ]
});
```

#### Supprimer un article

```typescript
const result = await magasinRepo.deleteArticle(1);
```

#### Rechercher des articles

```typescript
// Par nom
const articles = await magasinRepo.searchArticlesByName('shirt');

// Par plage de prix
const articles = await magasinRepo.searchArticlesByPriceRange(20, 50);

// Par catégorie
const articles = await magasinRepo.getArticlesByCategorie(1);

// Organisés par catégories
const articlesParCategorie = await magasinRepo.getArticlesParCategories();
// Retourne: { "Vêtements": [...], "Accessoires": [...] }
```

### 3. Gestion des Stocks

#### Récupérer les stocks

```typescript
// Tous les stocks
const stocks = await magasinRepo.getAllStocks();

// Stocks d'un article
const stocks = await magasinRepo.getStocksByArticle(1);

// Stock spécifique (article + taille)
const stock = await magasinRepo.getStockByArticleAndTaille(1, 2);
```

#### Ajouter/Mettre à jour du stock

```typescript
// Ajouter du stock (ou incrémenter si existe)
const result = await magasinRepo.addStock({
  article_id: 1,
  taille_id: 2,
  quantite: 10
});

// Définir une quantité exacte
const result = await magasinRepo.updateStock({
  article_id: 1,
  taille_id: 2,
  quantite: 50
});
```

#### Alertes de stock

```typescript
// Articles en rupture de stock
const rupture = await magasinRepo.getOutOfStockArticles();

// Articles avec stock faible (< 5 par défaut)
const faibleStock = await magasinRepo.getLowStockArticles(5);
```

### 4. Gestion des Commandes

#### Créer une commande

```typescript
const result = await magasinRepo.createCommande({
  utilisateur_id: 1,
  articles: [
    { article_id: 1, taille: 'M', quantite: 2, prix: 25.99 },
    { article_id: 2, taille: 'L', quantite: 1, prix: 35.99 }
  ],
  total: 87.97,
  statut: 'en_attente' // Optionnel, défaut: 'en_attente'
});

if (result.isConfirm) {
  console.log('Commande créée avec ID:', result.data.id);
}
```

#### Récupérer les commandes

```typescript
// Toutes les commandes
const commandes = await magasinRepo.getAllCommandes();

// Commande par ID
const commande = await magasinRepo.getCommandeById(1);

// Commandes d'un utilisateur
const commandes = await magasinRepo.getCommandesByUser(1);

// Commandes par statut
const commandes = await magasinRepo.getCommandesByStatut('en_attente');
```

#### Modifier une commande

```typescript
// Changer le statut
const result = await magasinRepo.updateCommandeStatut(1, 'confirmee');

// Annuler une commande
const result = await magasinRepo.cancelCommande(1);
```

### 5. Catégories et Tailles

#### Catégories

```typescript
// Toutes les catégories
const categories = await magasinRepo.getAllCategories();

// Par ID
const categorie = await magasinRepo.getCategorieById(1);

// Par nom
const categorie = await magasinRepo.getCategorieByName('Vêtements');
```

#### Tailles

```typescript
// Toutes les tailles
const tailles = await magasinRepo.getAllTailles();

// Par ID
const taille = await magasinRepo.getTailleById(2);

// Par nom
const taille = await magasinRepo.getTailleByName('M');

// Map des tailles (utile pour les conversions)
const tailleMap = await magasinRepo.getTailleMap();
// Retourne: { "S": 1, "M": 2, "L": 3, ... }
```

### 6. Validations

```typescript
// Vérifier si un article existe
const existe = await magasinRepo.articleExists(1);

// Vérifier si une catégorie existe
const existe = await magasinRepo.categorieExists(1);

// Vérifier si le stock est suffisant
const suffisant = await magasinRepo.checkStockSufficient(1, 2, 5);
// article_id: 1, taille_id: 2, quantite demandée: 5
```

### 7. Statistiques

```typescript
const stats = await magasinRepo.getStats();

console.log(`
  Total articles: ${stats.totalArticles}
  Total commandes: ${stats.totalCommandes}
  Revenu total: ${stats.totalRevenu}€
  Articles en rupture: ${stats.articlesEnRupture}
  Commandes en attente: ${stats.commandesEnAttente}
`);
```

## Utilisation avec GraphQL

### Configuration Apollo Server

```typescript
import { typeDefs, resolvers } from './db/clients/magasin/index.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // ... autres options
});
```

### Exemples de requêtes GraphQL

#### Récupérer tous les articles

```graphql
query {
  getAllArticles {
    id
    nom
    prix
    description
    categorie {
      id
      nom
    }
    images
    stocks {
      taille
      quantite
    }
  }
}
```

#### Créer un article

```graphql
mutation {
  createArticle(input: {
    nom: "T-Shirt Club"
    prix: 25.99
    description: "T-shirt officiel"
    categorie_id: 1
    images: ["https://example.com/image.jpg"]
    stocks: [
      { taille: "M", quantite: 10 }
      { taille: "L", quantite: 5 }
    ]
  }) {
    isConfirm
    message
    data
  }
}
```

#### Créer une commande

```graphql
mutation {
  createCommande(input: {
    utilisateur_id: 1
    articles: [
      { article_id: 1, taille: "M", quantite: 2, prix: 25.99 }
    ]
    total: 51.98
  }) {
    isConfirm
    message
    data
  }
}
```

#### Obtenir les statistiques

```graphql
query {
  getMagasinStats {
    totalArticles
    totalCommandes
    totalRevenu
    articlesEnRupture
    commandesEnAttente
  }
}
```

## Types TypeScript

### Types principaux

```typescript
// Article avec catégorie et relations
interface ArticleAvecCategorie {
  id: number;
  nom: string;
  prix: number;
  description: string | null;
  categorie: {
    id: number;
    nom: string;
  };
  images: string[];
  stocks: StockArticle[];
}

// Stock d'un article
interface StockArticle {
  taille: string;
  quantite: number;
}

// Commande avec client
interface CommandeAvecClient {
  commande_id: number;
  date_commande: Date | string;
  statut: string;
  total: number;
  client: {
    id: number;
    nom: string;
    email: string;
  };
  articles: ArticleCommande[];
}

// Résultat de confirmation
interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  data?: any;
}
```

## Tests

### Exécuter les tests

```bash
# Tous les tests du module magasin
npm test -- magasin

# Tests du repository uniquement
npm test -- magasin.repository.test.ts

# Tests GraphQL uniquement
npm test -- magasin.graphql.test.ts

# Avec coverage
npm test -- magasin --coverage
```

### Structure des tests

Les tests couvrent :
- ✅ Toutes les méthodes du repository
- ✅ Tous les resolvers GraphQL (queries et mutations)
- ✅ Gestion des erreurs
- ✅ Cas limites (null, tableaux vides, etc.)
- ✅ Validations

## Migration depuis l'ancien code

### Correspondance des méthodes

| Ancienne méthode | Nouvelle méthode |
|------------------|------------------|
| `obtenirLesArticles()` | `getAllArticles()` |
| `obtenirArticlesParCategories()` | `getArticlesParCategories()` |
| `obtenirLesCategories()` | `getAllCategories()` |
| `getTailleMap()` | `getTailleMap()` |
| `ajouterArticle()` | `createArticle()` |
| `obtenirLeStock()` | `getAllStocks()` |
| `ajouterStock()` | `addStock()` |
| `obtenirLesCommandes()` | `getAllCommandes()` |
| `ajouterCommande()` | `createCommande()` |
| `supprimerArticle()` | `deleteArticle()` |
| `modifierArticle()` | `updateArticle()` |
| `modifierStock()` | `updateStock()` |
| `obtenirLesTailles()` | `getAllTailles()` |
| `creerCommande()` | `createCommande()` |

### Exemple de migration

**Avant (ancien code):**

```typescript
import { Magasin } from './db/clients/magasin/magasin.js';

const magasin = new Magasin();
const articles = await magasin.obtenirLesArticles();
```

**Après (nouveau code):**

```typescript
import { getMagasinRepository } from './db/clients/magasin/index.js';

const magasinRepo = getMagasinRepository();
const articles = await magasinRepo.getAllArticles();
```

## Bonnes pratiques

### 1. Toujours utiliser le singleton

❌ **Mauvais:**
```typescript
const repo = new MagasinRepository(); // Ne pas faire
```

✅ **Bon:**
```typescript
const repo = getMagasinRepository();
```

### 2. Gérer les erreurs

```typescript
try {
  const result = await magasinRepo.createArticle(data);
  if (result.isConfirm) {
    // Succès
  } else {
    // Échec
    console.error(result.message);
  }
} catch (error) {
  // Erreur inattendue
  console.error('Erreur:', error);
}
```

### 3. Valider avant d'insérer

```typescript
// Vérifier que la catégorie existe avant de créer l'article
const categorieExiste = await magasinRepo.categorieExists(categorieId);
if (!categorieExiste) {
  throw new Error('Catégorie invalide');
}

const result = await magasinRepo.createArticle(data);
```

### 4. Vérifier le stock avant de créer une commande

```typescript
for (const article of commandeData.articles) {
  const tailleMap = await magasinRepo.getTailleMap();
  const tailleId = tailleMap[article.taille];
  
  const stockSuffisant = await magasinRepo.checkStockSufficient(
    article.article_id,
    tailleId,
    article.quantite
  );
  
  if (!stockSuffisant) {
    throw new Error(`Stock insuffisant pour ${article.taille}`);
  }
}

const result = await magasinRepo.createCommande(commandeData);
```

## Dépannage

### Problème : "Repository instance is null"

**Solution:** Assurez-vous d'utiliser `getMagasinRepository()` et non `new MagasinRepository()`.

### Problème : "Taille inconnue"

**Solution:** Vérifiez que la taille existe dans la table `tailles` avant de l'utiliser.

```typescript
const taille = await magasinRepo.getTailleByName('M');
if (!taille) {
  console.error('Taille non trouvée');
}
```

### Problème : Stocks négatifs après commande

**Solution:** Toujours vérifier le stock avant de créer une commande avec `checkStockSufficient()`.

## Performance

### Optimisations recommandées

1. **Mettre en cache la map des tailles** : Elle change rarement
2. **Utiliser des index sur** : `articles.categorie_id`, `stocks.article_id`, `commandes.utilisateur_id`
3. **Pagination** : Pour les listes longues de commandes ou articles

## Support et Contribution

Pour toute question ou suggestion, contactez l'équipe de développement.

### Checklist avant PR

- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Types TypeScript corrects
- [ ] Documentation mise à jour
- [ ] Code formaté (Prettier/ESLint)
- [ ] Pas de console.log en production

## Changelog

### Version 2.0.0 (Actuelle)
- ✨ Refactorisation complète du module
- ✨ Pattern Repository avec singleton
- ✨ API GraphQL complète
- ✨ Tests unitaires complets
- ✨ Types TypeScript stricts
- ✨ Queries SQL modulaires
- ✨ Utils et parseurs réutilisables

### Version 1.0.0 (Legacy)
- Module magasin original avec classe Magasin