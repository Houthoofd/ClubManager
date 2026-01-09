/**
 * Utilitaires de parsing pour le module Commandes
 */

import type { ArticleCommande, Commande, CommandeRow } from '../types.js';

// ============================================================================
// PARSING DES ARTICLES
// ============================================================================

/**
 * Parse les articles JSON d'une commande
 * @param articlesJson - String JSON ou objet
 * @returns Array d'articles parsés
 */
export function parseArticles(articlesJson: string | ArticleCommande[]): ArticleCommande[] {
  try {
    if (typeof articlesJson === 'string') {
      const parsed = JSON.parse(articlesJson);
      return Array.isArray(parsed) ? parsed : [];
    }
    return Array.isArray(articlesJson) ? articlesJson : [];
  } catch (error) {
    console.error('Erreur lors du parsing des articles:', error);
    return [];
  }
}

/**
 * Stringifie les articles pour la base de données
 * @param articles - Array d'articles
 * @returns String JSON
 */
export function stringifyArticles(articles: ArticleCommande[]): string {
  try {
    return JSON.stringify(articles);
  } catch (error) {
    console.error('Erreur lors de la stringification des articles:', error);
    return '[]';
  }
}

// ============================================================================
// PARSING DES ROWS DB
// ============================================================================

/**
 * Parse une row de la base de données en objet Commande
 * @param row - Row brute de la DB
 * @returns Commande parsée
 */
export function parseCommandeRow(row: CommandeRow): Commande {
  return {
    commande_id: row.commande_id,
    utilisateur_id: row.utilisateur_id,
    statut: row.statut,
    total: Number(row.total),
    articles: parseArticles(row.articles),
    date_commande: row.date_commande,
    updated_at: row.updated_at,
    payment_intent_id: row.payment_intent_id,
    nom_utilisateur: row.nom_utilisateur,
    email: row.email,
  };
}

/**
 * Parse un tableau de rows DB en tableau de Commandes
 * @param rows - Tableau de rows brutes
 * @returns Tableau de commandes parsées
 */
export function parseCommandeRows(rows: CommandeRow[]): Commande[] {
  return rows.map(parseCommandeRow);
}

// ============================================================================
// CONVERSION DE TYPES
// ============================================================================

/**
 * Convertit les valeurs string en number (pour les résultats SQL)
 * @param value - Valeur à convertir
 * @returns Nombre
 */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'string' ? parseFloat(value) || 0 : value;
}

/**
 * Convertit les valeurs en entier
 * @param value - Valeur à convertir
 * @returns Entier
 */
export function toInt(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'string' ? parseInt(value, 10) || 0 : Math.floor(value);
}

// ============================================================================
// CALCULS SUR LES ARTICLES
// ============================================================================

/**
 * Calcule le total d'une commande à partir des articles
 * @param articles - Tableau d'articles
 * @returns Total calculé
 */
export function calculateTotal(articles: ArticleCommande[]): number {
  return articles.reduce((sum, article) => sum + article.prix_total, 0);
}

/**
 * Valide et recalcule les prix des articles
 * @param articles - Tableau d'articles
 * @returns Articles avec prix recalculés
 */
export function recalculateArticlePrices(articles: ArticleCommande[]): ArticleCommande[] {
  return articles.map(article => ({
    ...article,
    prix_total: article.quantite * article.prix_unitaire,
  }));
}

/**
 * Compte le nombre total d'articles dans une commande
 * @param articles - Tableau d'articles
 * @returns Nombre total d'articles
 */
export function countTotalArticles(articles: ArticleCommande[]): number {
  return articles.reduce((sum, article) => sum + article.quantite, 0);
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Formate un montant en euros
 * @param amount - Montant à formater
 * @returns String formatée
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formate une date pour l'affichage
 * @param date - Date à formater
 * @returns String formatée
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Formate une commande pour l'affichage
 * @param commande - Commande à formater
 * @returns Objet avec champs formatés
 */
export function formatCommandeForDisplay(commande: Commande) {
  return {
    ...commande,
    total_formatted: formatPrice(commande.total),
    date_commande_formatted: formatDate(commande.date_commande),
    updated_at_formatted: formatDate(commande.updated_at),
    nombre_articles: countTotalArticles(commande.articles),
  };
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Nettoie un ID de commande
 * @param commandeId - ID à nettoyer
 * @returns ID nettoyé
 */
export function sanitizeCommandeId(commandeId: string): string {
  return commandeId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Nettoie un payment intent ID
 * @param paymentIntentId - ID à nettoyer
 * @returns ID nettoyé ou null
 */
export function sanitizePaymentIntentId(paymentIntentId: string | null | undefined): string | null {
  if (!paymentIntentId) return null;
  const cleaned = paymentIntentId.trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Nettoie les données d'article avant insertion
 * @param article - Article à nettoyer
 * @returns Article nettoyé
 */
export function sanitizeArticle(article: ArticleCommande): ArticleCommande {
  return {
    article_id: article.article_id.trim(),
    nom: article.nom.trim(),
    quantite: Math.max(1, Math.floor(article.quantite)),
    prix_unitaire: Math.max(0, article.prix_unitaire),
    prix_total: Math.max(0, article.prix_total),
    image: article.image?.trim(),
    taille: article.taille?.trim(),
    couleur: article.couleur?.trim(),
  };
}

/**
 * Nettoie un tableau d'articles
 * @param articles - Articles à nettoyer
 * @returns Articles nettoyés
 */
export function sanitizeArticles(articles: ArticleCommande[]): ArticleCommande[] {
  return articles.map(sanitizeArticle);
}
