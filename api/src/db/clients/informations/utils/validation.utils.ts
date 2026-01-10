/**
 * Utilitaires de validation pour le module Informations
 */

import {
  isValidTitre,
  isValidContenu,
  isValidPriorite,
  isValidDate,
} from '../types.js';

import type {
  CreateInformationData,
  UpdateInformationData,
  InformationSearchFilters,
} from '../types.js';

// ============================================================================
// VALIDATION DES INFORMATIONS
// ============================================================================

/**
 * Résultat de validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valide les données de création d'une information
 * @param data - Données de l'information
 * @returns Résultat de validation
 */
export function validateCreateInformationData(
  data: CreateInformationData
): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation du titre
  if (!data.titre) {
    errors.push('Le titre est requis');
    isValid = false;
  } else if (!isValidTitre(data.titre)) {
    errors.push('Le titre doit contenir entre 3 et 200 caractères');
    isValid = false;
  }

  // Validation du contenu
  if (!data.contenu) {
    errors.push('Le contenu est requis');
    isValid = false;
  } else if (!isValidContenu(data.contenu)) {
    errors.push('Le contenu doit contenir au moins 10 caractères');
    isValid = false;
  }

  // Validation de la catégorie (si fournie)
  if (data.categorie_id !== undefined && data.categorie_id !== null) {
    if (!Number.isInteger(data.categorie_id) || data.categorie_id <= 0) {
      errors.push('L\'ID de catégorie doit être un nombre entier positif');
      isValid = false;
    }
  }

  // Validation de l'auteur (si fourni)
  if (data.auteur_id !== undefined && data.auteur_id !== null) {
    if (!Number.isInteger(data.auteur_id) || data.auteur_id <= 0) {
      errors.push('L\'ID de l\'auteur doit être un nombre entier positif');
      isValid = false;
    }
  }

  // Validation de la priorité (si fournie)
  if (data.priorite !== undefined && data.priorite !== null) {
    if (!isValidPriorite(data.priorite)) {
      errors.push('La priorité doit être entre 1 (Basse) et 4 (Urgente)');
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Valide les données de mise à jour d'une information
 * @param data - Données de mise à jour
 * @returns Résultat de validation
 */
export function validateUpdateInformationData(
  data: UpdateInformationData
): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Au moins un champ doit être fourni
  const hasData = Object.keys(data).length > 0;
  if (!hasData) {
    errors.push('Au moins un champ doit être fourni pour la mise à jour');
    isValid = false;
  }

  // Validation du titre (si fourni)
  if (data.titre !== undefined) {
    if (!data.titre || !isValidTitre(data.titre)) {
      errors.push('Le titre doit contenir entre 3 et 200 caractères');
      isValid = false;
    }
  }

  // Validation du contenu (si fourni)
  if (data.contenu !== undefined) {
    if (!data.contenu || !isValidContenu(data.contenu)) {
      errors.push('Le contenu doit contenir au moins 10 caractères');
      isValid = false;
    }
  }

  // Validation de la catégorie (si fournie)
  if (data.categorie_id !== undefined && data.categorie_id !== null) {
    if (!Number.isInteger(data.categorie_id) || data.categorie_id <= 0) {
      errors.push('L\'ID de catégorie doit être un nombre entier positif');
      isValid = false;
    }
  }

  // Validation de la priorité (si fournie)
  if (data.priorite !== undefined && data.priorite !== null) {
    if (!isValidPriorite(data.priorite)) {
      errors.push('La priorité doit être entre 1 (Basse) et 4 (Urgente)');
      isValid = false;
    }
  }

  // Validation du status (si fourni)
  if (data.status_id !== undefined && data.status_id !== null) {
    if (!Number.isInteger(data.status_id) || data.status_id < 0 || data.status_id > 3) {
      errors.push('Le status doit être entre 0 (Brouillon) et 3 (Supprimé)');
      isValid = false;
    }
  }

  return { isValid, errors };
}

// ============================================================================
// VALIDATION DES IDENTIFIANTS
// ============================================================================

/**
 * Valide un ID d'information
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateInformationId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Valide un ID de catégorie
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateCategorieId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Valide un ID d'auteur
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateAuteurId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Valide un ID de status
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateStatusId(id: number): boolean {
  return Number.isInteger(id) && id >= 0 && id <= 3;
}

// ============================================================================
// VALIDATION DES RECHERCHES
// ============================================================================

/**
 * Valide les filtres de recherche d'informations
 * @param filters - Filtres à valider
 * @returns Résultat de validation
 */
export function validateInformationSearchFilters(
  filters: InformationSearchFilters
): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation des dates
  if (filters.date_debut && !isValidDate(filters.date_debut)) {
    errors.push('La date de début est invalide');
    isValid = false;
  }

  if (filters.date_fin && !isValidDate(filters.date_fin)) {
    errors.push('La date de fin est invalide');
    isValid = false;
  }

  if (filters.date_debut && filters.date_fin) {
    const debut = new Date(filters.date_debut);
    const fin = new Date(filters.date_fin);

    if (fin < debut) {
      errors.push('La date de fin doit être après la date de début');
      isValid = false;
    }
  }

  // Validation de la catégorie
  if (filters.categorie_id !== undefined && !validateCategorieId(filters.categorie_id)) {
    errors.push('L\'ID de catégorie est invalide');
    isValid = false;
  }

  // Validation du status
  if (filters.status_id !== undefined && !validateStatusId(filters.status_id)) {
    errors.push('L\'ID de status est invalide');
    isValid = false;
  }

  // Validation de l'auteur
  if (filters.auteur_id !== undefined && !validateAuteurId(filters.auteur_id)) {
    errors.push('L\'ID de l\'auteur est invalide');
    isValid = false;
  }

  // Validation des priorités
  if (filters.priorite_min !== undefined) {
    if (!isValidPriorite(filters.priorite_min)) {
      errors.push('La priorité minimale doit être entre 1 et 4');
      isValid = false;
    }
  }

  if (filters.priorite_max !== undefined) {
    if (!isValidPriorite(filters.priorite_max)) {
      errors.push('La priorité maximale doit être entre 1 et 4');
      isValid = false;
    }
  }

  if (
    filters.priorite_min !== undefined &&
    filters.priorite_max !== undefined &&
    filters.priorite_min > filters.priorite_max
  ) {
    errors.push('La priorité minimale ne peut pas être supérieure à la priorité maximale');
    isValid = false;
  }

  // Validation de la pagination
  if (filters.limit !== undefined) {
    if (!Number.isInteger(filters.limit) || filters.limit <= 0) {
      errors.push('La limite doit être un nombre entier positif');
      isValid = false;
    } else if (filters.limit > 1000) {
      errors.push('La limite ne peut pas dépasser 1000');
      isValid = false;
    }
  }

  if (filters.offset !== undefined) {
    if (!Number.isInteger(filters.offset) || filters.offset < 0) {
      errors.push('L\'offset doit être un nombre entier positif ou zéro');
      isValid = false;
    }
  }

  return { isValid, errors };
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Nettoie un titre
 * @param titre - Titre à nettoyer
 * @returns Titre nettoyé
 */
export function sanitizeTitre(titre: string): string {
  return titre.trim().replace(/\s+/g, ' ').substring(0, 200);
}

/**
 * Nettoie un contenu
 * @param contenu - Contenu à nettoyer
 * @returns Contenu nettoyé
 */
export function sanitizeContenu(contenu: string): string {
  return contenu.trim();
}

/**
 * Nettoie un nom de catégorie
 * @param nom - Nom à nettoyer
 * @returns Nom nettoyé
 */
export function sanitizeCategorieName(nom: string): string {
  return nom.trim().replace(/\s+/g, ' ').substring(0, 100);
}

/**
 * Nettoie une description
 * @param description - Description à nettoyer
 * @returns Description nettoyée
 */
export function sanitizeDescription(description: string): string {
  return description.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// VÉRIFICATIONS DE LOGIQUE MÉTIER
// ============================================================================

/**
 * Vérifie si une information peut être modifiée (pas archivée/supprimée)
 * @param statusId - ID du status
 * @returns True si modifiable
 */
export function isInformationModifiable(statusId: number): boolean {
  return statusId === 0 || statusId === 1; // Brouillon ou Publié
}

/**
 * Vérifie si une information peut être supprimée
 * @param statusId - ID du status
 * @returns True si supprimable
 */
export function isInformationSupprimable(statusId: number): boolean {
  return statusId !== 3; // Pas déjà supprimé
}

/**
 * Vérifie si une information peut être publiée
 * @param statusId - ID du status
 * @returns True si publiable
 */
export function isInformationPubliable(statusId: number): boolean {
  return statusId === 0; // Seulement depuis brouillon
}

/**
 * Vérifie si une information peut être archivée
 * @param statusId - ID du status
 * @returns True si archivable
 */
export function isInformationArchivable(statusId: number): boolean {
  return statusId === 1; // Seulement si publié
}

/**
 * Vérifie si une information peut être restaurée
 * @param statusId - ID du status
 * @returns True si restaurable
 */
export function isInformationRestauable(statusId: number): boolean {
  return statusId === 2 || statusId === 3; // Archivé ou Supprimé
}

/**
 * Vérifie si une information est visible publiquement
 * @param statusId - ID du status
 * @param visible - Flag de visibilité
 * @returns True si visible
 */
export function isInformationVisible(statusId: number, visible: boolean): boolean {
  return statusId === 1 && visible; // Publié ET visible
}

/**
 * Vérifie si un utilisateur peut modifier une information
 * @param isAuthor - L'utilisateur est-il l'auteur?
 * @param isAdmin - L'utilisateur est-il admin/manager?
 * @returns True si peut modifier
 */
export function canUserEditInformation(isAuthor: boolean, isAdmin: boolean): boolean {
  return isAuthor || isAdmin;
}

/**
 * Vérifie si un utilisateur peut supprimer une information
 * @param isAuthor - L'utilisateur est-il l'auteur?
 * @param isAdmin - L'utilisateur est-il admin/manager?
 * @param statusId - ID du status de l'information
 * @returns True si peut supprimer
 */
export function canUserDeleteInformation(
  isAuthor: boolean,
  isAdmin: boolean,
  statusId: number
): boolean {
  return (isAuthor || isAdmin) && isInformationSupprimable(statusId);
}

// ============================================================================
// VALIDATION COMPLÈTE
// ============================================================================

/**
 * Validation complète d'une information avant publication
 * @param titre - Titre de l'information
 * @param contenu - Contenu de l'information
 * @param auteurId - ID de l'auteur
 * @returns Résultat de validation
 */
export function validateBeforePublish(
  titre: string,
  contenu: string,
  auteurId?: number
): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (!isValidTitre(titre)) {
    errors.push('Le titre doit contenir entre 3 et 200 caractères');
    isValid = false;
  }

  if (!isValidContenu(contenu)) {
    errors.push('Le contenu doit contenir au moins 10 caractères');
    isValid = false;
  }

  if (!auteurId || auteurId <= 0) {
    errors.push('Un auteur doit être assigné à l\'information');
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * Valide les données d'une catégorie
 * @param nom - Nom de la catégorie
 * @returns Résultat de validation
 */
export function validateCategorieData(nom: string): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (!nom || nom.trim().length === 0) {
    errors.push('Le nom de la catégorie est requis');
    isValid = false;
  } else if (nom.trim().length < 2) {
    errors.push('Le nom de la catégorie doit contenir au moins 2 caractères');
    isValid = false;
  } else if (nom.trim().length > 100) {
    errors.push('Le nom de la catégorie ne peut pas dépasser 100 caractères');
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * Valide un code couleur hexadécimal
 * @param couleur - Code couleur à valider
 * @returns True si valide
 */
export function validateCouleurHex(couleur: string): boolean {
  const hexRegex = /^#[0-9A-F]{6}$/i;
  return hexRegex.test(couleur);
}

/**
 * Valide les données complètes d'une catégorie
 * @param data - Données de la catégorie
 * @returns Résultat de validation
 */
export function validateCompleteCategorieData(data: {
  nom: string;
  description?: string;
  couleur?: string;
  icone?: string;
}): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation du nom
  const nomValidation = validateCategorieData(data.nom);
  if (!nomValidation.isValid) {
    errors.push(...nomValidation.errors);
    isValid = false;
  }

  // Validation de la couleur (si fournie)
  if (data.couleur && !validateCouleurHex(data.couleur)) {
    errors.push('La couleur doit être au format hexadécimal (#RRGGBB)');
    isValid = false;
  }

  // Validation de la description (si fournie)
  if (data.description && data.description.length > 500) {
    errors.push('La description ne peut pas dépasser 500 caractères');
    isValid = false;
  }

  // Validation de l'icône (si fournie)
  if (data.icone && data.icone.length > 50) {
    errors.push('Le nom de l\'icône ne peut pas dépasser 50 caractères');
    isValid = false;
  }

  return { isValid, errors };
}
