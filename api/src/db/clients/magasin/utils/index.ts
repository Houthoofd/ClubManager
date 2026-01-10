/**
 * Utilitaires et parseurs pour le module Magasin
 */

import type {
  Article,
  ArticleRow,
  ArticleAvecCategorie,
  ArticleAvecRelationsRow,
  StockArticle,
  StockDetail,
  StockDetailRow,
  Categorie,
  CategorieRow,
  Taille,
  TailleRow,
  TailleMap,
  Commande,
  CommandeRow,
  CommandeAvecClient,
  CommandeAvecClientRow,
  ArticleCommande,
  ArticleCommandeRow,
  ArticlesParCategorie,
} from '../types.js';

// ============================================================================
// PARSEURS D'ARTICLES
// ============================================================================

/**
 * Parser une row d'article simple
 */
export function parseArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    nom: row.nom,
    prix: row.prix,
    description: row.description,
    categorie_id: row.categorie_id,
    images: [],
    stocks: [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parser plusieurs rows d'articles simples
 */
export function parseArticleRows(rows: ArticleRow[]): Article[] {
  return rows.map(parseArticleRow);
}

/**
 * Parser des rows avec relations en articles groupés
 */
export function parseArticlesWithRelations(
  rows: ArticleAvecRelationsRow[]
): ArticleAvecCategorie[] {
  const articlesMap = new Map<number, ArticleAvecCategorie>();

  for (const row of rows) {
    if (!articlesMap.has(row.id)) {
      articlesMap.set(row.id, {
        id: row.id,
        nom: row.nom,
        prix: row.prix,
        description: row.description,
        categorie: {
          id: row.categorie_id,
          nom: row.categorie_nom || 'Sans catégorie',
        },
        images: [],
        stocks: [],
      });
    }

    const article = articlesMap.get(row.id)!;

    // Ajouter image si elle existe et n'est pas déjà présente
    if (row.image_url && !article.images.includes(row.image_url)) {
      article.images.push(row.image_url);
    }

    // Ajouter stock si il existe et n'est pas déjà présent
    if (row.stock_taille && row.stock_quantite !== null) {
      const stockExists = article.stocks.some(
        (s) => s.taille === row.stock_taille && s.quantite === row.stock_quantite
      );
      if (!stockExists) {
        article.stocks.push({
          taille: row.stock_taille,
          quantite: row.stock_quantite,
        });
      }
    }
  }

  return Array.from(articlesMap.values());
}

/**
 * Parser des articles groupés par catégorie
 */
export function parseArticlesParCategorie(
  rows: ArticleAvecRelationsRow[]
): ArticlesParCategorie {
  const result: ArticlesParCategorie = {};
  const articles = parseArticlesWithRelations(rows);

  for (const article of articles) {
    const categorieName = article.categorie.nom;
    if (!result[categorieName]) {
      result[categorieName] = [];
    }
    result[categorieName].push(article);
  }

  return result;
}

// ============================================================================
// PARSEURS DE STOCKS
// ============================================================================

/**
 * Parser une row de stock détaillé
 */
export function parseStockDetailRow(row: StockDetailRow): StockDetail {
  return {
    id: row.id,
    article_id: row.article_id,
    taille_id: row.taille_id,
    taille: row.taille_nom,
    quantite: row.quantite,
  };
}

/**
 * Parser plusieurs rows de stocks détaillés
 */
export function parseStockDetailRows(rows: StockDetailRow[]): StockDetail[] {
  return rows.map(parseStockDetailRow);
}

/**
 * Parser des rows de stock en StockArticle simples
 */
export function parseStockArticles(rows: StockDetailRow[]): StockArticle[] {
  return rows.map((row) => ({
    taille: row.taille_nom,
    quantite: row.quantite,
  }));
}

// ============================================================================
// PARSEURS DE CATÉGORIES
// ============================================================================

/**
 * Parser une row de catégorie
 */
export function parseCategorieRow(row: CategorieRow): Categorie {
  return {
    id: row.id,
    nom: row.nom,
  };
}

/**
 * Parser plusieurs rows de catégories
 */
export function parseCategorieRows(rows: CategorieRow[]): Categorie[] {
  return rows.map(parseCategorieRow);
}

// ============================================================================
// PARSEURS DE TAILLES
// ============================================================================

/**
 * Parser une row de taille
 */
export function parseTailleRow(row: TailleRow): Taille {
  return {
    id: row.id,
    nom: row.nom,
  };
}

/**
 * Parser plusieurs rows de tailles
 */
export function parseTailleRows(rows: TailleRow[]): Taille[] {
  return rows.map(parseTailleRow);
}

/**
 * Créer une map nom -> id à partir de rows de tailles
 */
export function createTailleMap(rows: TailleRow[]): TailleMap {
  const map: TailleMap = {};
  for (const row of rows) {
    map[row.nom] = row.id;
  }
  return map;
}

/**
 * Obtenir l'ID d'une taille à partir de son nom dans une map
 */
export function getTailleIdFromMap(map: TailleMap, nom: string): number | null {
  return map[nom] || null;
}

// ============================================================================
// PARSEURS DE COMMANDES
// ============================================================================

/**
 * Parser une row de commande simple
 */
export function parseCommandeRow(row: CommandeRow): Commande {
  return {
    id: row.id,
    utilisateur_id: row.utilisateur_id,
    date_commande: row.date_commande,
    statut: row.statut,
    total: row.total,
    articles: [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parser plusieurs rows de commandes simples
 */
export function parseCommandeRows(rows: CommandeRow[]): Commande[] {
  return rows.map(parseCommandeRow);
}

/**
 * Parser des rows de commande avec détails client en commandes groupées
 */
export function parseCommandesAvecClient(
  rows: CommandeAvecClientRow[]
): CommandeAvecClient[] {
  const commandesMap = new Map<number, CommandeAvecClient>();

  for (const row of rows) {
    if (!commandesMap.has(row.commande_id)) {
      commandesMap.set(row.commande_id, {
        commande_id: row.commande_id,
        date_commande: row.date_commande,
        statut: row.statut,
        total: row.total,
        client: {
          id: row.utilisateur_id,
          nom: row.client_nom,
          email: row.client_email,
        },
        articles: [],
      });
    }

    const commande = commandesMap.get(row.commande_id)!;

    // Ajouter l'article si les données existent
    if (row.article_id && row.taille && row.quantite && row.prix) {
      commande.articles.push({
        article_id: row.article_id,
        nom: row.article_nom,
        taille: row.taille,
        quantite: row.quantite,
        prix: row.prix,
      });
    }
  }

  return Array.from(commandesMap.values());
}

/**
 * Parser une row d'article de commande
 */
export function parseArticleCommandeRow(row: ArticleCommandeRow): ArticleCommande {
  return {
    article_id: row.article_id,
    taille: '', // Sera rempli avec le nom de la taille via une jointure
    quantite: row.quantite,
    prix: row.prix,
  };
}

// ============================================================================
// HELPERS DE CONVERSION
// ============================================================================

/**
 * Convertir en entier de manière sûre
 */
export function toInt(value: any): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Convertir en nombre décimal de manière sûre
 */
export function toFloat(value: any): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Convertir en booléen de manière sûre
 */
export function toBool(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return false;
}

/**
 * Formater un prix en euros
 */
export function formatPrice(prix: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(prix);
}

/**
 * Formater une date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formater une date avec l'heure
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// HELPERS DE VALIDATION
// ============================================================================

/**
 * Valider un ID
 */
export function validateId(id: any): number | null {
  const num = toInt(id);
  return num > 0 ? num : null;
}

/**
 * Valider un prix
 */
export function validatePrice(prix: any): number | null {
  const num = toFloat(prix);
  return num > 0 ? num : null;
}

/**
 * Valider une quantité
 */
export function validateQuantity(quantite: any): number | null {
  const num = toInt(quantite);
  return num >= 0 ? num : null;
}

/**
 * Nettoyer une chaîne de caractères
 */
export function sanitizeString(str: any): string {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * Valider un nom d'article
 */
export function validateArticleName(nom: string): boolean {
  return nom && nom.trim().length >= 3 && nom.trim().length <= 255;
}

/**
 * Valider une URL d'image
 */
export function validateImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// ============================================================================
// HELPERS DE TRANSFORMATION
// ============================================================================

/**
 * Extraire les images uniques d'une liste de rows
 */
export function extractUniqueImages(rows: ArticleAvecRelationsRow[]): string[] {
  const images = new Set<string>();
  for (const row of rows) {
    if (row.image_url) {
      images.add(row.image_url);
    }
  }
  return Array.from(images);
}

/**
 * Extraire les stocks uniques d'une liste de rows
 */
export function extractUniqueStocks(rows: ArticleAvecRelationsRow[]): StockArticle[] {
  const stocksMap = new Map<string, StockArticle>();
  for (const row of rows) {
    if (row.stock_taille && row.stock_quantite !== null) {
      const key = `${row.stock_taille}-${row.stock_quantite}`;
      if (!stocksMap.has(key)) {
        stocksMap.set(key, {
          taille: row.stock_taille,
          quantite: row.stock_quantite,
        });
      }
    }
  }
  return Array.from(stocksMap.values());
}

/**
 * Calculer le total d'une commande à partir de ses articles
 */
export function calculateCommandeTotal(articles: ArticleCommande[]): number {
  return articles.reduce((total, article) => {
    return total + article.prix * article.quantite;
  }, 0);
}

/**
 * Vérifier si un article a du stock disponible
 */
export function hasAvailableStock(stocks: StockArticle[]): boolean {
  return stocks.some((stock) => stock.quantite > 0);
}

/**
 * Obtenir le stock total d'un article
 */
export function getTotalStock(stocks: StockArticle[]): number {
  return stocks.reduce((total, stock) => total + stock.quantite, 0);
}

// ============================================================================
// HELPERS DE FILTRAGE
// ============================================================================

/**
 * Filtrer les articles par catégorie
 */
export function filterArticlesByCategorie(
  articles: ArticleAvecCategorie[],
  categorieId: number
): ArticleAvecCategorie[] {
  return articles.filter((article) => article.categorie.id === categorieId);
}

/**
 * Filtrer les articles par plage de prix
 */
export function filterArticlesByPriceRange(
  articles: ArticleAvecCategorie[],
  minPrice: number,
  maxPrice: number
): ArticleAvecCategorie[] {
  return articles.filter(
    (article) => article.prix >= minPrice && article.prix <= maxPrice
  );
}

/**
 * Filtrer les articles en stock
 */
export function filterArticlesInStock(
  articles: ArticleAvecCategorie[]
): ArticleAvecCategorie[] {
  return articles.filter((article) => hasAvailableStock(article.stocks));
}

/**
 * Filtrer les commandes par statut
 */
export function filterCommandesByStatut(
  commandes: CommandeAvecClient[],
  statut: string
): CommandeAvecClient[] {
  return commandes.filter((commande) => commande.statut === statut);
}

// ============================================================================
// HELPERS DE TRI
// ============================================================================

/**
 * Trier les articles par nom
 */
export function sortArticlesByName(
  articles: ArticleAvecCategorie[],
  ascending: boolean = true
): ArticleAvecCategorie[] {
  return [...articles].sort((a, b) => {
    const comparison = a.nom.localeCompare(b.nom, 'fr-FR');
    return ascending ? comparison : -comparison;
  });
}

/**
 * Trier les articles par prix
 */
export function sortArticlesByPrice(
  articles: ArticleAvecCategorie[],
  ascending: boolean = true
): ArticleAvecCategorie[] {
  return [...articles].sort((a, b) => {
    return ascending ? a.prix - b.prix : b.prix - a.prix;
  });
}

/**
 * Trier les commandes par date
 */
export function sortCommandesByDate(
  commandes: CommandeAvecClient[],
  ascending: boolean = false
): CommandeAvecClient[] {
  return [...commandes].sort((a, b) => {
    const dateA = new Date(a.date_commande).getTime();
    const dateB = new Date(b.date_commande).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

// ============================================================================
// HELPERS DE REGROUPEMENT
// ============================================================================

/**
 * Regrouper les articles par catégorie
 */
export function groupArticlesByCategorie(
  articles: ArticleAvecCategorie[]
): ArticlesParCategorie {
  const result: ArticlesParCategorie = {};
  for (const article of articles) {
    const categorieName = article.categorie.nom;
    if (!result[categorieName]) {
      result[categorieName] = [];
    }
    result[categorieName].push(article);
  }
  return result;
}

/**
 * Regrouper les commandes par utilisateur
 */
export function groupCommandesByUser(
  commandes: CommandeAvecClient[]
): Map<number, CommandeAvecClient[]> {
  const result = new Map<number, CommandeAvecClient[]>();
  for (const commande of commandes) {
    const userId = commande.client.id;
    if (!result.has(userId)) {
      result.set(userId, []);
    }
    result.get(userId)!.push(commande);
  }
  return result;
}

/**
 * Regrouper les commandes par statut
 */
export function groupCommandesByStatut(
  commandes: CommandeAvecClient[]
): Map<string, CommandeAvecClient[]> {
  const result = new Map<string, CommandeAvecClient[]>();
  for (const commande of commandes) {
    const statut = commande.statut;
    if (!result.has(statut)) {
      result.set(statut, []);
    }
    result.get(statut)!.push(commande);
  }
  return result;
}
