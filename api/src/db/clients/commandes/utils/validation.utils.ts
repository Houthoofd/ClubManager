/**
 * Utilitaires de validation pour le module Commandes
 */

import type {
  ArticleCommande,
  Commande,
  CreateCommandeData,
  UpdateCommandeData,
  StatutCommande,
  CommandeSearchFilters,
} from '../types.js';
import { isValidStatut, isValidArticle } from '../types.js';

// ============================================================================
// VALIDATION DES ARTICLES
// ============================================================================

/**
 * Valide un article de commande
 * @param article - Article à valider
 * @returns Objet avec isValid et errors
 */
export function validateArticle(article: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!article) {
    errors.push('Article manquant');
    return { isValid: false, errors };
  }

  if (!article.article_id || typeof article.article_id !== 'string') {
    errors.push('article_id invalide');
  }

  if (!article.nom || typeof article.nom !== 'string' || article.nom.trim().length === 0) {
    errors.push('Nom de l\'article invalide');
  }

  if (typeof article.quantite !== 'number' || article.quantite <= 0 || !Number.isInteger(article.quantite)) {
    errors.push('Quantité invalide (doit être un entier positif)');
  }

  if (typeof article.prix_unitaire !== 'number' || article.prix_unitaire < 0) {
    errors.push('Prix unitaire invalide');
  }

  if (typeof article.prix_total !== 'number' || article.prix_total < 0) {
    errors.push('Prix total invalide');
  }

  // Vérifier la cohérence du prix total
  const expectedTotal = article.quantite * article.prix_unitaire;
  const tolerance = 0.01; // Tolérance pour les arrondis
  if (Math.abs(article.prix_total - expectedTotal) > tolerance) {
    errors.push(`Prix total incohérent (attendu: ${expectedTotal}, reçu: ${article.prix_total})`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Valide un tableau d'articles
 * @param articles - Tableau d'articles à valider
 * @returns Objet avec isValid et errors
 */
export function validateArticles(articles: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(articles)) {
    errors.push('Les articles doivent être un tableau');
    return { isValid: false, errors };
  }

  if (articles.length === 0) {
    errors.push('Au moins un article est requis');
    return { isValid: false, errors };
  }

  articles.forEach((article, index) => {
    const validation = validateArticle(article);
    if (!validation.isValid) {
      errors.push(`Article ${index + 1}: ${validation.errors.join(', ')}`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// VALIDATION DES DONNÉES DE COMMANDE
// ============================================================================

/**
 * Valide les données de création d'une commande
 * @param data - Données à valider
 * @returns Objet avec isValid et errors
 */
export function validateCreateCommandeData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Données manquantes');
    return { isValid: false, errors };
  }

  // Validation de commande_id
  if (!data.commande_id || typeof data.commande_id !== 'string' || data.commande_id.trim().length === 0) {
    errors.push('commande_id invalide');
  }

  // Validation de utilisateur_id
  if (typeof data.utilisateur_id !== 'number' || data.utilisateur_id <= 0 || !Number.isInteger(data.utilisateur_id)) {
    errors.push('utilisateur_id invalide (doit être un entier positif)');
  }

  // Validation du total
  if (typeof data.total !== 'number' || data.total < 0) {
    errors.push('Total invalide');
  }

  // Validation des articles
  const articlesValidation = validateArticles(data.articles);
  if (!articlesValidation.isValid) {
    errors.push(...articlesValidation.errors);
  }

  // Validation du statut (optionnel)
  if (data.statut && !isValidStatut(data.statut)) {
    errors.push(`Statut invalide: ${data.statut}`);
  }

  // Validation du payment_intent_id (optionnel)
  if (data.payment_intent_id !== undefined && data.payment_intent_id !== null) {
    if (typeof data.payment_intent_id !== 'string' || data.payment_intent_id.trim().length === 0) {
      errors.push('payment_intent_id invalide');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Valide les données de mise à jour d'une commande
 * @param data - Données à valider
 * @returns Objet avec isValid et errors
 */
export function validateUpdateCommandeData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || Object.keys(data).length === 0) {
    errors.push('Aucune donnée à mettre à jour');
    return { isValid: false, errors };
  }

  // Validation du statut (si présent)
  if (data.statut !== undefined && !isValidStatut(data.statut)) {
    errors.push(`Statut invalide: ${data.statut}`);
  }

  // Validation du total (si présent)
  if (data.total !== undefined) {
    if (typeof data.total !== 'number' || data.total < 0) {
      errors.push('Total invalide');
    }
  }

  // Validation des articles (si présent)
  if (data.articles !== undefined) {
    const articlesValidation = validateArticles(data.articles);
    if (!articlesValidation.isValid) {
      errors.push(...articlesValidation.errors);
    }
  }

  // Validation du payment_intent_id (si présent)
  if (data.payment_intent_id !== undefined && data.payment_intent_id !== null) {
    if (typeof data.payment_intent_id !== 'string' || data.payment_intent_id.trim().length === 0) {
      errors.push('payment_intent_id invalide');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// VALIDATION DES IDs
// ============================================================================

/**
 * Valide un ID de commande
 * @param commandeId - ID à valider
 * @returns true si valide
 */
export function validateCommandeId(commandeId: any): boolean {
  return typeof commandeId === 'string' && commandeId.trim().length > 0;
}

/**
 * Valide un ID utilisateur
 * @param utilisateurId - ID à valider
 * @returns true si valide
 */
export function validateUtilisateurId(utilisateurId: any): boolean {
  return typeof utilisateurId === 'number' && utilisateurId > 0 && Number.isInteger(utilisateurId);
}

/**
 * Valide un statut
 * @param statut - Statut à valider
 * @returns true si valide
 */
export function validateStatut(statut: any): boolean {
  return typeof statut === 'string' && isValidStatut(statut);
}

// ============================================================================
// VALIDATION DES FILTRES DE RECHERCHE
// ============================================================================

/**
 * Valide les filtres de recherche
 * @param filters - Filtres à valider
 * @returns Objet avec isValid et errors
 */
export function validateSearchFilters(filters: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!filters || typeof filters !== 'object') {
    errors.push('Filtres invalides');
    return { isValid: false, errors };
  }

  // Validation du statut (si présent)
  if (filters.statut !== undefined && !validateStatut(filters.statut)) {
    errors.push(`Statut invalide: ${filters.statut}`);
  }

  // Validation de utilisateur_id (si présent)
  if (filters.utilisateur_id !== undefined && !validateUtilisateurId(filters.utilisateur_id)) {
    errors.push('utilisateur_id invalide');
  }

  // Validation des dates (si présentes)
  if (filters.date_debut !== undefined) {
    if (!isValidDateString(filters.date_debut)) {
      errors.push('date_debut invalide (format attendu: YYYY-MM-DD)');
    }
  }

  if (filters.date_fin !== undefined) {
    if (!isValidDateString(filters.date_fin)) {
      errors.push('date_fin invalide (format attendu: YYYY-MM-DD)');
    }
  }

  // Vérifier que date_debut < date_fin
  if (filters.date_debut && filters.date_fin) {
    const debut = new Date(filters.date_debut);
    const fin = new Date(filters.date_fin);
    if (debut > fin) {
      errors.push('date_debut doit être antérieure à date_fin');
    }
  }

  // Validation des montants (si présents)
  if (filters.montant_min !== undefined) {
    if (typeof filters.montant_min !== 'number' || filters.montant_min < 0) {
      errors.push('montant_min invalide');
    }
  }

  if (filters.montant_max !== undefined) {
    if (typeof filters.montant_max !== 'number' || filters.montant_max < 0) {
      errors.push('montant_max invalide');
    }
  }

  // Vérifier que montant_min < montant_max
  if (filters.montant_min !== undefined && filters.montant_max !== undefined) {
    if (filters.montant_min > filters.montant_max) {
      errors.push('montant_min doit être inférieur à montant_max');
    }
  }

  // Validation du search (si présent)
  if (filters.search !== undefined && typeof filters.search !== 'string') {
    errors.push('search doit être une chaîne de caractères');
  }

  // Validation de la pagination
  if (filters.limit !== undefined) {
    if (typeof filters.limit !== 'number' || filters.limit <= 0 || !Number.isInteger(filters.limit)) {
      errors.push('limit invalide (doit être un entier positif)');
    }
    if (filters.limit > 1000) {
      errors.push('limit trop élevé (maximum: 1000)');
    }
  }

  if (filters.offset !== undefined) {
    if (typeof filters.offset !== 'number' || filters.offset < 0 || !Number.isInteger(filters.offset)) {
      errors.push('offset invalide (doit être un entier >= 0)');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// UTILITAIRES DE VALIDATION
// ============================================================================

/**
 * Vérifie si une chaîne est une date valide au format YYYY-MM-DD
 * @param dateString - Chaîne à vérifier
 * @returns true si valide
 */
export function isValidDateString(dateString: string): boolean {
  if (typeof dateString !== 'string') return false;

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Vérifie si un montant est dans une plage acceptable
 * @param montant - Montant à vérifier
 * @param min - Montant minimum
 * @param max - Montant maximum
 * @returns true si dans la plage
 */
export function isAmountInRange(montant: number, min: number = 0, max: number = 999999.99): boolean {
  return montant >= min && montant <= max;
}

/**
 * Vérifie si une quantité est valide
 * @param quantite - Quantité à vérifier
 * @param max - Quantité maximum autorisée
 * @returns true si valide
 */
export function isValidQuantity(quantite: number, max: number = 1000): boolean {
  return Number.isInteger(quantite) && quantite > 0 && quantite <= max;
}

/**
 * Vérifie si une commande peut être modifiée (basé sur son statut)
 * @param statut - Statut de la commande
 * @returns true si modifiable
 */
export function isCommandeModifiable(statut: string): boolean {
  const statutsNonModifiables = ['livree', 'annulee', 'remboursee'];
  return !statutsNonModifiables.includes(statut);
}

/**
 * Vérifie si une commande peut être annulée (basé sur son statut)
 * @param statut - Statut de la commande
 * @returns true si annulable
 */
export function isCommandeAnnulable(statut: string): boolean {
  const statutsAnnulables = ['en_attente', 'confirmee', 'en_preparation'];
  return statutsAnnulables.includes(statut);
}

/**
 * Vérifie si un changement de statut est valide
 * @param currentStatut - Statut actuel
 * @param newStatut - Nouveau statut
 * @returns true si le changement est valide
 */
export function isValidStatusTransition(currentStatut: string, newStatut: string): boolean {
  // Définir les transitions valides
  const validTransitions: Record<string, string[]> = {
    en_attente: ['confirmee', 'annulee'],
    confirmee: ['en_preparation', 'annulee'],
    en_preparation: ['expedie', 'annulee'],
    expedie: ['livree'],
    livree: ['remboursee'],
    annulee: [], // Statut final
    remboursee: [], // Statut final
  };

  return validTransitions[currentStatut]?.includes(newStatut) || false;
}

/**
 * Obtient les statuts valides suivants pour une commande
 * @param currentStatut - Statut actuel
 * @returns Array des statuts suivants possibles
 */
export function getValidNextStatuses(currentStatut: string): string[] {
  const transitions: Record<string, string[]> = {
    en_attente: ['confirmee', 'annulee'],
    confirmee: ['en_preparation', 'annulee'],
    en_preparation: ['expedie', 'annulee'],
    expedie: ['livree'],
    livree: ['remboursee'],
    annulee: [],
    remboursee: [],
  };

  return transitions[currentStatut] || [];
}
