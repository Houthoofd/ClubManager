# Exemples d'Utilisation - Module Magasin

Ce fichier contient des exemples pratiques d'utilisation du module Magasin dans différents contextes.

## Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Gestion des articles](#gestion-des-articles)
3. [Gestion des stocks](#gestion-des-stocks)
4. [Gestion des commandes](#gestion-des-commandes)
5. [Recherche et filtrage](#recherche-et-filtrage)
6. [Statistiques et reporting](#statistiques-et-reporting)
7. [Intégration Express/API](#intégration-expressapi)
8. [Intégration GraphQL](#intégration-graphql)
9. [Cas d'usage avancés](#cas-dusage-avancés)

---

## Configuration initiale

### Import et instanciation

```typescript
import { getMagasinRepository } from './db/clients/magasin/index.js';
import type {
  CreateArticleData,
  CreateCommandeData,
  ConfirmationResult,
} from './db/clients/magasin/index.js';

// Obtenir l'instance du repository (singleton)
const magasinRepo = getMagasinRepository();
```

---

## Gestion des articles

### Exemple 1: Créer un article complet

```typescript
async function creerNouveauProduit() {
  const articleData: CreateArticleData = {
    nom: 'T-Shirt Club Édition 2024',
    prix: 29.99,
    description: 'T-shirt officiel du club en coton bio',
    categorie_id: 1, // ID de la catégorie "Vêtements"
    images: [
      'https://cdn.example.com/products/tshirt-front.jpg',
      'https://cdn.example.com/products/tshirt-back.jpg',
    ],
    stocks: [
      { taille: 'XS', quantite: 10 },
      { taille: 'S', quantite: 25 },
      { taille: 'M', quantite: 50 },
      { taille: 'L', quantite: 40 },
      { taille: 'XL', quantite: 20 },
      { taille: 'XXL', quantite: 10 },
    ],
  };

  try {
    const result = await magasinRepo.createArticle(articleData);
    
    if (result.isConfirm) {
      console.log('✅ Article créé avec succès !');
      console.log('ID du nouvel article:', result.data.id);
      return result.data.id;
    } else {
      console.error('❌ Échec de la création:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    throw error;
  }
}
```

### Exemple 2: Mettre à jour un article

```typescript
async function mettreAJourPrix(articleId: number, nouveauPrix: number) {
  try {
    const result = await magasinRepo.updateArticle(articleId, {
      prix: nouveauPrix,
    });

    if (result.isConfirm) {
      console.log(`✅ Prix mis à jour: ${nouveauPrix}€`);
    }
    
    return result;
  } catch (error) {
    console.error('Erreur mise à jour prix:', error);
    throw error;
  }
}
```

### Exemple 3: Ajouter des images à un article existant

```typescript
async function ajouterNouvellesImages(articleId: number, nouvellesImages: string[]) {
  try {
    // Récupérer l'article actuel
    const article = await magasinRepo.getArticleById(articleId);
    
    if (!article) {
      throw new Error('Article non trouvé');
    }

    // Fusionner les anciennes et nouvelles images
    const toutesLesImages = [...article.images, ...nouvellesImages];

    // Mettre à jour
    const result = await magasinRepo.updateArticle(articleId, {
      images: toutesLesImages,
    });

    return result;
  } catch (error) {
    console.error('Erreur ajout images:', error);
    throw error;
  }
}
```

### Exemple 4: Supprimer un article avec validation

```typescript
async function supprimerArticleSiPossible(articleId: number) {
  try {
    // Vérifier que l'article existe
    const existe = await magasinRepo.articleExists(articleId);
    
    if (!existe) {
      console.log('❌ Article non trouvé');
      return { isConfirm: false, message: 'Article non trouvé' };
    }

    // Supprimer
    const result = await magasinRepo.deleteArticle(articleId);
    
    if (result.isConfirm) {
      console.log('✅ Article supprimé (y compris images et stocks)');
    }
    
    return result;
  } catch (error) {
    console.error('Erreur suppression:', error);
    throw error;
  }
}
```

---

## Gestion des stocks

### Exemple 5: Ajouter du stock

```typescript
async function reapprovisionner(articleId: number, taille: string, quantite: number) {
  try {
    // Obtenir l'ID de la taille
    const tailleObj = await magasinRepo.getTailleByName(taille);
    
    if (!tailleObj) {
      throw new Error(`Taille "${taille}" non trouvée`);
    }

    // Ajouter le stock
    const result = await magasinRepo.addStock({
      article_id: articleId,
      taille_id: tailleObj.id,
      quantite: quantite,
    });

    if (result.isConfirm) {
      console.log(`✅ Stock ajouté: ${quantite} unités en taille ${taille}`);
    }

    return result;
  } catch (error) {
    console.error('Erreur réapprovisionnement:', error);
    throw error;
  }
}
```

### Exemple 6: Définir une quantité exacte de stock

```typescript
async function definirStock(articleId: number, taille: string, quantiteExacte: number) {
  try {
    const tailleObj = await magasinRepo.getTailleByName(taille);
    
    if (!tailleObj) {
      throw new Error(`Taille "${taille}" non trouvée`);
    }

    const result = await magasinRepo.updateStock({
      article_id: articleId,
      taille_id: tailleObj.id,
      quantite: quantiteExacte,
    });

    if (result.isConfirm) {
      console.log(`✅ Stock défini à ${quantiteExacte} unités`);
    }

    return result;
  } catch (error) {
    console.error('Erreur définition stock:', error);
    throw error;
  }
}
```

### Exemple 7: Vérifier les stocks faibles

```typescript
async function alertesStockFaible() {
  try {
    const seuilAlerte = 10; // Alerte si moins de 10 unités
    const stocksFaibles = await magasinRepo.getLowStockArticles(seuilAlerte);

    if (stocksFaibles.length > 0) {
      console.log(`⚠️ ${stocksFaibles.length} articles à faible stock:`);
      
      for (const stock of stocksFaibles) {
        console.log(`  - Article #${stock.article_id} (${stock.taille}): ${stock.quantite} unités restantes`);
      }
      
      // Envoyer une notification email, Slack, etc.
      // await envoyerNotificationStock(stocksFaibles);
    } else {
      console.log('✅ Tous les stocks sont au-dessus du seuil');
    }

    return stocksFaibles;
  } catch (error) {
    console.error('Erreur vérification stocks:', error);
    throw error;
  }
}
```

### Exemple 8: Rapport de rupture de stock

```typescript
async function rapportRuptureStock() {
  try {
    const articlesEnRupture = await magasinRepo.getOutOfStockArticles();

    console.log('📊 Rapport de rupture de stock');
    console.log('=' .repeat(50));
    console.log(`Articles en rupture: ${articlesEnRupture.length}`);
    
    if (articlesEnRupture.length > 0) {
      console.log('\nDétails:');
      for (const article of articlesEnRupture) {
        console.log(`  - ${article.nom} (ID: ${article.id}) - Catégorie: ${article.categorie.nom}`);
      }
    }

    return articlesEnRupture;
  } catch (error) {
    console.error('Erreur rapport rupture:', error);
    throw error;
  }
}
```

---

## Gestion des commandes

### Exemple 9: Créer une commande avec validation

```typescript
async function passerCommande(utilisateurId: number, panierArticles: any[]) {
  try {
    // 1. Obtenir la map des tailles
    const tailleMap = await magasinRepo.getTailleMap();

    // 2. Valider chaque article du panier
    const articlesValides = [];
    let total = 0;

    for (const item of panierArticles) {
      // Vérifier que l'article existe
      const article = await magasinRepo.getArticleById(item.article_id);
      
      if (!article) {
        throw new Error(`Article ${item.article_id} non trouvé`);
      }

      // Obtenir l'ID de la taille
      const tailleId = tailleMap[item.taille];
      
      if (!tailleId) {
        throw new Error(`Taille "${item.taille}" invalide`);
      }

      // Vérifier le stock
      const stockSuffisant = await magasinRepo.checkStockSufficient(
        item.article_id,
        tailleId,
        item.quantite
      );

      if (!stockSuffisant) {
        throw new Error(
          `Stock insuffisant pour ${article.nom} en taille ${item.taille}`
        );
      }

      // Calculer le prix
      const prixLigne = article.prix * item.quantite;
      total += prixLigne;

      articlesValides.push({
        article_id: item.article_id,
        taille: item.taille,
        quantite: item.quantite,
        prix: article.prix,
      });
    }

    // 3. Créer la commande
    const commandeData: CreateCommandeData = {
      utilisateur_id: utilisateurId,
      articles: articlesValides,
      total: total,
      statut: 'en_attente',
    };

    const result = await magasinRepo.createCommande(commandeData);

    if (result.isConfirm) {
      console.log('✅ Commande créée avec succès!');
      console.log(`   ID: ${result.data.id}`);
      console.log(`   Total: ${total.toFixed(2)}€`);
      console.log(`   Articles: ${articlesValides.length}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Erreur création commande:', error);
    throw error;
  }
}

// Utilisation
const panier = [
  { article_id: 1, taille: 'M', quantite: 2 },
  { article_id: 3, taille: 'L', quantite: 1 },
];

await passerCommande(123, panier);
```

### Exemple 10: Gérer le workflow d'une commande

```typescript
async function gererCommandeWorkflow(commandeId: number) {
  try {
    // 1. Confirmer la commande
    await magasinRepo.updateCommandeStatut(commandeId, 'confirmee');
    console.log('✅ Commande confirmée');

    // 2. Préparer la commande
    await magasinRepo.updateCommandeStatut(commandeId, 'en_preparation');
    console.log('📦 Commande en préparation');

    // 3. Expédier
    await magasinRepo.updateCommandeStatut(commandeId, 'expediee');
    console.log('🚚 Commande expédiée');

    // 4. Livrer
    await magasinRepo.updateCommandeStatut(commandeId, 'livree');
    console.log('✅ Commande livrée');

  } catch (error) {
    console.error('Erreur workflow commande:', error);
    throw error;
  }
}
```

### Exemple 11: Annuler une commande

```typescript
async function annulerCommandeSiPossible(commandeId: number) {
  try {
    // Récupérer la commande
    const commande = await magasinRepo.getCommandeById(commandeId);

    if (!commande) {
      throw new Error('Commande non trouvée');
    }

    // Vérifier si la commande peut être annulée
    const statutsNonAnnulables = ['expediee', 'livree', 'annulee'];
    
    if (statutsNonAnnulables.includes(commande.statut)) {
      console.log(`❌ Commande ${commandeId} ne peut pas être annulée (statut: ${commande.statut})`);
      return { isConfirm: false, message: 'Commande non annulable' };
    }

    // Annuler
    const result = await magasinRepo.cancelCommande(commandeId);

    if (result.isConfirm) {
      console.log(`✅ Commande ${commandeId} annulée`);
      // Note: Les stocks ne sont pas restaurés automatiquement
      // Il faudrait le faire manuellement si nécessaire
    }

    return result;
  } catch (error) {
    console.error('Erreur annulation:', error);
    throw error;
  }
}
```

---

## Recherche et filtrage

### Exemple 12: Recherche multi-critères

```typescript
async function rechercherArticles(criteres: {
  nom?: string;
  categorieId?: number;
  prixMin?: number;
  prixMax?: number;
}) {
  try {
    let articles = await magasinRepo.getAllArticles();

    // Filtrer par nom si spécifié
    if (criteres.nom) {
      const resultatsRecherche = await magasinRepo.searchArticlesByName(criteres.nom);
      articles = resultatsRecherche;
    }

    // Filtrer par catégorie si spécifié
    if (criteres.categorieId) {
      articles = articles.filter(a => a.categorie.id === criteres.categorieId);
    }

    // Filtrer par plage de prix si spécifié
    if (criteres.prixMin !== undefined || criteres.prixMax !== undefined) {
      const min = criteres.prixMin ?? 0;
      const max = criteres.prixMax ?? Infinity;
      articles = articles.filter(a => a.prix >= min && a.prix <= max);
    }

    console.log(`🔍 ${articles.length} article(s) trouvé(s)`);
    return articles;
  } catch (error) {
    console.error('Erreur recherche:', error);
    throw error;
  }
}

// Utilisation
const resultats = await rechercherArticles({
  nom: 'shirt',
  categorieId: 1,
  prixMin: 20,
  prixMax: 50,
});
```

### Exemple 13: Catalogue avec filtres

```typescript
async function afficherCatalogue(filtres: {
  categorie?: string;
  enStock?: boolean;
  triPar?: 'nom' | 'prix';
  ordre?: 'asc' | 'desc';
}) {
  try {
    let articles = await magasinRepo.getAllArticles();

    // Filtrer par catégorie
    if (filtres.categorie) {
      articles = articles.filter(a => 
        a.categorie.nom.toLowerCase().includes(filtres.categorie!.toLowerCase())
      );
    }

    // Filtrer par disponibilité
    if (filtres.enStock) {
      articles = articles.filter(a => 
        a.stocks.some(s => s.quantite > 0)
      );
    }

    // Trier
    if (filtres.triPar === 'prix') {
      articles.sort((a, b) => 
        filtres.ordre === 'desc' ? b.prix - a.prix : a.prix - b.prix
      );
    } else if (filtres.triPar === 'nom') {
      articles.sort((a, b) => {
        const compare = a.nom.localeCompare(b.nom);
        return filtres.ordre === 'desc' ? -compare : compare;
      });
    }

    // Afficher
    console.log('📚 Catalogue:');
    console.log('=' .repeat(60));
    
    for (const article of articles) {
      const stockTotal = article.stocks.reduce((sum, s) => sum + s.quantite, 0);
      console.log(`${article.nom.padEnd(30)} | ${article.prix.toFixed(2)}€ | Stock: ${stockTotal}`);
    }

    return articles;
  } catch (error) {
    console.error('Erreur affichage catalogue:', error);
    throw error;
  }
}
```

---

## Statistiques et reporting

### Exemple 14: Dashboard complet

```typescript
async function afficherDashboard() {
  try {
    console.log('📊 DASHBOARD MAGASIN');
    console.log('=' .repeat(70));

    // Statistiques globales
    const stats = await magasinRepo.getStats();
    
    console.log('\n📈 Statistiques Générales:');
    console.log(`  Total articles:           ${stats.totalArticles}`);
    console.log(`  Total commandes:          ${stats.totalCommandes}`);
    console.log(`  Revenu total:             ${stats.totalRevenu.toFixed(2)}€`);
    console.log(`  Articles en rupture:      ${stats.articlesEnRupture}`);
    console.log(`  Commandes en attente:     ${stats.commandesEnAttente}`);

    // Panier moyen
    if (stats.totalCommandes > 0) {
      const panierMoyen = stats.totalRevenu / stats.totalCommandes;
      console.log(`  Panier moyen:             ${panierMoyen.toFixed(2)}€`);
    }

    // Articles par catégorie
    console.log('\n📂 Répartition par Catégories:');
    const categories = await magasinRepo.getAllCategories();
    
    for (const cat of categories) {
      const articles = await magasinRepo.getArticlesByCategorie(cat.id);
      console.log(`  ${cat.nom.padEnd(20)} ${articles.length} articles`);
    }

    // Commandes en attente
    console.log('\n⏳ Commandes en Attente:');
    const commandesEnAttente = await magasinRepo.getCommandesByStatut('en_attente');
    
    if (commandesEnAttente.length > 0) {
      for (const cmd of commandesEnAttente.slice(0, 5)) {
        console.log(`  #${cmd.commande_id} - ${cmd.client.nom} - ${cmd.total.toFixed(2)}€`);
      }
      if (commandesEnAttente.length > 5) {
        console.log(`  ... et ${commandesEnAttente.length - 5} autres`);
      }
    } else {
      console.log('  Aucune commande en attente');
    }

    return stats;
  } catch (error) {
    console.error('Erreur dashboard:', error);
    throw error;
  }
}
```

### Exemple 15: Rapport mensuel

```typescript
async function rapportMensuel(mois: number, annee: number) {
  try {
    console.log(`📊 Rapport Mensuel - ${mois}/${annee}`);
    console.log('=' .repeat(70));

    // Toutes les commandes
    const toutesCommandes = await magasinRepo.getAllCommandes();

    // Filtrer par mois
    const commandesDuMois = toutesCommandes.filter(cmd => {
      const date = new Date(cmd.date_commande);
      return date.getMonth() + 1 === mois && date.getFullYear() === annee;
    });

    // Calculs
    const nombreCommandes = commandesDuMois.length;
    const revenuTotal = commandesDuMois.reduce((sum, cmd) => sum + cmd.total, 0);
    const panierMoyen = nombreCommandes > 0 ? revenuTotal / nombreCommandes : 0;

    // Répartition par statut
    const parStatut = commandesDuMois.reduce((acc, cmd) => {
      acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n📈 Résumé:`);
    console.log(`  Nombre de commandes:    ${nombreCommandes}`);
    console.log(`  Revenu total:           ${revenuTotal.toFixed(2)}€`);
    console.log(`  Panier moyen:           ${panierMoyen.toFixed(2)}€`);

    console.log(`\n📊 Répartition par statut:`);
    for (const [statut, nombre] of Object.entries(parStatut)) {
      console.log(`  ${statut.padEnd(20)} ${nombre}`);
    }

    return {
      mois,
      annee,
      nombreCommandes,
      revenuTotal,
      panierMoyen,
      parStatut,
    };
  } catch (error) {
    console.error('Erreur rapport mensuel:', error);
    throw error;
  }
}
```

---

## Intégration Express/API

### Exemple 16: Routes Express complètes

```typescript
import express from 'express';
import { getMagasinRepository } from './db/clients/magasin/index.js';

const router = express.Router();
const magasinRepo = getMagasinRepository();

// GET /api/articles - Liste tous les articles
router.get('/articles', async (req, res) => {
  try {
    const articles = await magasinRepo.getAllArticles();
    res.json({
      success: true,
      data: articles,
      count: articles.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

// GET /api/articles/:id - Détails d'un article
router.get('/articles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const article = await magasinRepo.getArticleById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé',
      });
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

// POST /api/articles - Créer un article
router.post('/articles', async (req, res) => {
  try {
    const result = await magasinRepo.createArticle(req.body);
    
    if (result.isConfirm) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

// POST /api/commandes - Créer une commande
router.post('/commandes', async (req, res) => {
  try {
    const result = await magasinRepo.createCommande(req.body);
    
    if (result.isConfirm) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

// GET /api/stats - Statistiques
router.get('/stats', async (req, res) => {
  try {
    const stats = await magasinRepo.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

export default router;
```

---

## Intégration GraphQL

### Exemple 17: Configuration Apollo Server

```typescript
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs, resolvers } from './db/clients/magasin/index.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`);
```

### Exemple 18: Requêtes GraphQL courantes

```graphql
# Récupérer tous les articles
query GetAllArticles {
  getAllArticles {
    id
    nom
    prix
    categorie {
      id
      nom
    }
    stocks {
      taille
      quantite
    }
  }
}

# Créer un article
mutation CreateArticle {
  createArticle(input: {
    nom: "Sweat à capuche"
    prix: 49.99
    description: "Sweat confortable"
    categorie_id: 1
    images: ["https://example.com/sweat.jpg"]
    stocks: [
      { taille: "M", quantite: 20 }
      { taille: "L", quantite: 15 }
    ]
  }) {
    isConfirm
    message
    data
  }
}

# Créer une commande
mutation CreateOrder {
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

# Obtenir les statistiques
query GetStats {
  getMagasinStats {
    totalArticles
    totalCommandes
    totalRevenu
    articlesEnRupture
    commandesEnAttente
  }
}
```

---

## Cas d'usage avancés

### Exemple 19: Promotion et réduction de prix en masse

```typescript
async function appliquerPromotion(categorieId: number, pourcentageReduction: number) {
  try {
    const articles = await magasinRepo.getArticlesByCategorie(categorieId);
    
    console.log(`🏷️ Application d'une réduction de ${pourcentageReduction}% sur ${articles.length} articles`);

    for (const article of articles) {
      const nouveauPrix = article.prix * (1 - pourcentageReduction / 100);
      
      await magasinRepo.updateArticle(article.id, {
        prix: Number(nouveauPrix.toFixed(2)),
      });
      
      console.log(`  ✅ ${article.nom}: ${article.prix}€ → ${nouveauPrix.toFixed(2)}€`);
    }

    console.log('✅ Promotion appliquée avec succès');
  } catch (error) {
    console.error('Erreur promotion:', error);
    throw error;
  }
}

// Utilisation: -20% sur la catégorie Vêtements (ID: 1)
await appliquerPromotion(1, 20);
```

### Exemple 20: Export CSV des stocks

```typescript
async function exporterStocksCSV(fichier: string) {
  try {
    const stocks = await magasinRepo.getAllStocks();
    
    let csv = 'Article ID,Article,Taille ID,Taille,Quantité\n';
    
    for (const stock of stocks) {
      csv += `${stock.article_id},Article #${stock.article_id},${stock.taille_id},${stock.taille},${stock.quantite}\n`;
    }

    // Sauvegarder dans un fichier
    // await fs.writeFile(fichier, csv);
    
    console.log(`✅ Export CSV terminé: ${stocks.length} lignes exportées`);
    return csv;
  } catch (error) {
    console.error('Erreur export CSV:', error);
    throw error;
  }
}
```

### Exemple 21: Système de notifications automatiques

```typescript
interface NotificationService {
  envoyerEmail(destinataire: string, sujet: string, corps: string): Promise<void>;
}

async function surveillerStocksAutomatique(notificationService: NotificationService) {
  try {
    // Vérifier les stocks faibles
    const stocksFaibles = await magasinRepo.getLowStockArticles(10);
    
    if (stocksFaibles.length > 0) {
      const message = `
        ⚠️ Alerte Stock Faible
        
        ${stocksFaibles.length} article(s) nécessitent un réapprovisionnement:
        
        ${stocksFaibles.map(s => 
          `- Article #${s.article_id} (${s.taille}): ${s.quantite} unités`
        ).join('\n')}
      `;
      
      await notificationService.envoyerEmail(
        'gestionnaire@club.com',
        'Alerte: Stock faible',
        message
      );
      
      console.log('📧 Notification envoyée');
    }

    // Vérifier les commandes en attente depuis plus de 24h
    const commandes = await magasinRepo.getCommandesByStatut('en_attente');
    const maintenant = new Date();
    
    for (const cmd of commandes) {
      const dateCommande = new Date(cmd.date_commande);
      const heuresEcoulees = (maintenant.getTime() - dateCommande.getTime()) / (1000 * 60 * 60);
      
      if (heuresEcoulees > 24) {
        await notificationService.envoyerEmail(
          'gestionnaire@club.com',
          `Commande #${cmd.commande_id} en attente`,
          `La commande #${cmd.commande_id} de ${cmd.client.nom} est en attente depuis ${Math.floor(heuresEcoulees)}h.`
        );
      }
    }
  } catch (error) {
    console.error('Erreur surveillance:', error);
  }
}

// Exécuter toutes les heures
// setInterval(() => surveillerStocksAutomatique(notificationService), 3600000);
```

---

## Conclusion

Ces exemples couvrent la plupart des cas d'usage courants du module Magasin. Pour plus d'informations, consultez:

- [README.md](./README.md) - Documentation complète
- [MIGRATION.md](./MIGRATION.md) - Guide de migration
- [Types](./types.ts) - Définitions TypeScript
- [Tests](./tests/) - Exemples de tests unitaires

**Astuce:** Consultez les tests unitaires pour encore plus d'exemples d'utilisation !