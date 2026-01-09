/**
 * Utilitaires de validation pour le module Compte
 */

import type {
  Utilisateur,
  UpdateCompteData,
  UpdateUtilisateurData,
  CompteInfo,
} from '../types.js';
import { isValidEmail, isValidDate, isValidPhone } from '../types.js';

// ============================================================================
// VALIDATION DES DONNÉES UTILISATEUR
// ============================================================================

/**
 * Valide les données d'un utilisateur
 * @param user - Utilisateur à valider
 * @returns Objet avec isValid et errors
 */
export function validateUtilisateur(user: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!user) {
    errors.push('Utilisateur manquant');
    return { isValid: false, errors };
  }

  // Validation de l'ID
  if (typeof user.id !== 'number' || user.id <= 0) {
    errors.push('ID utilisateur invalide');
  }

  // Validation du prénom
  if (!user.first_name || typeof user.first_name !== 'string' || user.first_name.trim().length === 0) {
    errors.push('Prénom invalide');
  } else if (user.first_name.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  } else if (user.first_name.trim().length > 50) {
    errors.push('Le prénom ne peut pas dépasser 50 caractères');
  }

  // Validation du nom
  if (!user.last_name || typeof user.last_name !== 'string' || user.last_name.trim().length === 0) {
    errors.push('Nom invalide');
  } else if (user.last_name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  } else if (user.last_name.trim().length > 50) {
    errors.push('Le nom ne peut pas dépasser 50 caractères');
  }

  // Validation de l'email
  if (!user.email || typeof user.email !== 'string') {
    errors.push('Email invalide');
  } else if (!isValidEmail(user.email)) {
    errors.push('Format d\'email invalide');
  }

  // Validation du status_id
  if (typeof user.status_id !== 'number' || user.status_id < 0) {
    errors.push('Status ID invalide');
  }

  // Validation du nom d'utilisateur (si présent)
  if (user.nom_utilisateur !== undefined && user.nom_utilisateur !== null) {
    if (typeof user.nom_utilisateur !== 'string' || user.nom_utilisateur.trim().length === 0) {
      errors.push('Nom d\'utilisateur invalide');
    } else if (user.nom_utilisateur.trim().length < 3) {
      errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    } else if (user.nom_utilisateur.trim().length > 30) {
      errors.push('Le nom d\'utilisateur ne peut pas dépasser 30 caractères');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(user.nom_utilisateur)) {
      errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }
  }

  // Validation de la date de naissance (si présente)
  if (user.date_of_birth !== null && user.date_of_birth !== undefined) {
    const dateStr = typeof user.date_of_birth === 'string' ? user.date_of_birth : user.date_of_birth.toString();
    if (!isValidDate(dateStr)) {
      errors.push('Date de naissance invalide');
    } else {
      const birthDate = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 150) {
        errors.push('Date de naissance incohérente');
      }
    }
  }

  // Validation du téléphone (si présent)
  if (user.phone !== null && user.phone !== undefined && user.phone !== '') {
    if (!isValidPhone(user.phone)) {
      errors.push('Format de téléphone invalide');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// VALIDATION DES DONNÉES DE MISE À JOUR
// ============================================================================

/**
 * Valide les données de mise à jour d'un compte
 * @param data - Données à valider
 * @returns Objet avec isValid et errors
 */
export function validateUpdateCompteData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || Object.keys(data).length === 0) {
    errors.push('Aucune donnée à mettre à jour');
    return { isValid: false, errors };
  }

  // Validation du prénom (si présent)
  if (data.first_name !== undefined) {
    if (typeof data.first_name !== 'string' || data.first_name.trim().length === 0) {
      errors.push('Prénom invalide');
    } else if (data.first_name.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    } else if (data.first_name.trim().length > 50) {
      errors.push('Le prénom ne peut pas dépasser 50 caractères');
    }
  }

  // Validation du nom (si présent)
  if (data.last_name !== undefined) {
    if (typeof data.last_name !== 'string' || data.last_name.trim().length === 0) {
      errors.push('Nom invalide');
    } else if (data.last_name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    } else if (data.last_name.trim().length > 50) {
      errors.push('Le nom ne peut pas dépasser 50 caractères');
    }
  }

  // Validation de l'email (si présent)
  if (data.email !== undefined) {
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email invalide');
    } else if (!isValidEmail(data.email)) {
      errors.push('Format d\'email invalide');
    }
  }

  // Validation de la date de naissance (si présente)
  if (data.date_of_birth !== undefined && data.date_of_birth !== null) {
    if (!isValidDate(data.date_of_birth)) {
      errors.push('Date de naissance invalide');
    } else {
      const birthDate = new Date(data.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 150) {
        errors.push('Date de naissance incohérente');
      }
    }
  }

  // Validation du téléphone (si présent)
  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    if (!isValidPhone(data.phone)) {
      errors.push('Format de téléphone invalide');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Valide les données de mise à jour d'un utilisateur (admin)
 * @param data - Données à valider
 * @returns Objet avec isValid et errors
 */
export function validateUpdateUtilisateurData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || Object.keys(data).length === 0) {
    errors.push('Aucune donnée à mettre à jour');
    return { isValid: false, errors };
  }

  // Validation de l'email (si présent)
  if (data.email !== undefined) {
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email invalide');
    } else if (!isValidEmail(data.email)) {
      errors.push('Format d\'email invalide');
    }
  }

  // Validation de la date de naissance (si présente)
  if (data.date_naissance !== undefined && data.date_naissance !== null) {
    if (!isValidDate(data.date_naissance)) {
      errors.push('Date de naissance invalide');
    }
  }

  // Validation du genre (si présent)
  if (data.genres !== undefined && data.genres !== null) {
    const isNumber = typeof data.genres === 'number';
    const isString = typeof data.genres === 'string';
    if (!isNumber && !isString) {
      errors.push('Genre invalide (doit être un ID ou un nom)');
    } else if (isNumber && data.genres <= 0) {
      errors.push('ID de genre invalide');
    } else if (isString && data.genres.trim().length === 0) {
      errors.push('Nom de genre invalide');
    }
  }

  // Validation du grade (si présent)
  if (data.grades !== undefined && data.grades !== null) {
    const isNumber = typeof data.grades === 'number';
    const isString = typeof data.grades === 'string';
    if (!isNumber && !isString) {
      errors.push('Grade invalide (doit être un ID ou un nom)');
    } else if (isNumber && data.grades <= 0) {
      errors.push('ID de grade invalide');
    } else if (isString && data.grades.trim().length === 0) {
      errors.push('Nom de grade invalide');
    }
  }

  // Validation de l'abonnement (si présent)
  if (data.abonnement !== undefined && data.abonnement !== null) {
    const isNumber = typeof data.abonnement === 'number';
    const isString = typeof data.abonnement === 'string';
    if (!isNumber && !isString) {
      errors.push('Abonnement invalide (doit être un ID ou un nom)');
    } else if (isNumber && data.abonnement <= 0) {
      errors.push('ID d\'abonnement invalide');
    } else if (isString && data.abonnement.trim().length === 0) {
      errors.push('Nom d\'abonnement invalide');
    }
  }

  // Validation du status (si présent)
  if (data.status !== undefined && data.status !== null) {
    const isNumber = typeof data.status === 'number';
    const isString = typeof data.status === 'string';
    if (!isNumber && !isString) {
      errors.push('Status invalide (doit être un ID ou un nom)');
    } else if (isNumber && data.status < 0) {
      errors.push('ID de status invalide');
    } else if (isString && data.status.trim().length === 0) {
      errors.push('Nom de status invalide');
    }
  }

  // Validation du mot de passe (si présent)
  if (data.password !== undefined && data.password !== null && data.password !== '') {
    if (typeof data.password !== 'string') {
      errors.push('Mot de passe invalide');
    } else if (data.password.length < 60) {
      // Hash bcrypt fait au moins 60 caractères
      errors.push('Le mot de passe doit être hashé');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// VALIDATION DES IDs
// ============================================================================

/**
 * Valide un ID utilisateur
 * @param userId - ID à valider
 * @returns true si valide
 */
export function validateUserId(userId: any): boolean {
  return typeof userId === 'number' && userId > 0 && Number.isInteger(userId);
}

/**
 * Valide un ID de genre
 * @param genreId - ID à valider
 * @returns true si valide
 */
export function validateGenreId(genreId: any): boolean {
  return typeof genreId === 'number' && genreId > 0 && Number.isInteger(genreId);
}

/**
 * Valide un ID de grade
 * @param gradeId - ID à valider
 * @returns true si valide
 */
export function validateGradeId(gradeId: any): boolean {
  return typeof gradeId === 'number' && gradeId > 0 && Number.isInteger(gradeId);
}

/**
 * Valide un ID de status
 * @param statusId - ID à valider
 * @returns true si valide
 */
export function validateStatusId(statusId: any): boolean {
  return typeof statusId === 'number' && statusId >= 0 && Number.isInteger(statusId);
}

/**
 * Valide un ID d'abonnement
 * @param abonnementId - ID à valider
 * @returns true si valide
 */
export function validateAbonnementId(abonnementId: any): boolean {
  return typeof abonnementId === 'number' && abonnementId > 0 && Number.isInteger(abonnementId);
}

// ============================================================================
// VALIDATION DES NOMS
// ============================================================================

/**
 * Valide un nom (prénom ou nom de famille)
 * @param name - Nom à valider
 * @returns true si valide
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

/**
 * Valide un nom d'utilisateur
 * @param username - Nom d'utilisateur à valider
 * @returns true si valide
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim();
  return (
    trimmed.length >= 3 &&
    trimmed.length <= 30 &&
    /^[a-zA-Z0-9_-]+$/.test(trimmed)
  );
}

// ============================================================================
// VALIDATION DES DONNÉES DE MOT DE PASSE
// ============================================================================

/**
 * Valide les données de mise à jour du mot de passe
 * @param data - Données à valider
 * @returns Objet avec isValid et errors
 */
export function validatePasswordUpdateData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Données manquantes');
    return { isValid: false, errors };
  }

  // Validation de l'ID
  if (!validateUserId(data.id)) {
    errors.push('ID utilisateur invalide');
  }

  // Validation du hash
  if (!data.hash || typeof data.hash !== 'string') {
    errors.push('Hash de mot de passe manquant');
  } else if (data.hash.length < 60) {
    errors.push('Hash de mot de passe invalide (doit être un hash bcrypt)');
  }

  // Validation du flag isCreation
  if (typeof data.isCreation !== 'boolean') {
    errors.push('Flag isCreation invalide (doit être un booléen)');
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// VALIDATION DE RECHERCHE
// ============================================================================

/**
 * Valide les paramètres de recherche
 * @param params - Paramètres à valider
 * @returns Objet avec isValid et errors
 */
export function validateSearchParams(params: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params || Object.keys(params).length === 0) {
    errors.push('Aucun critère de recherche fourni');
    return { isValid: false, errors };
  }

  // Au moins un critère doit être fourni
  const hasCriteria =
    params.name ||
    params.email ||
    params.status !== undefined ||
    params.genre !== undefined ||
    params.grade !== undefined ||
    params.abonnement !== undefined;

  if (!hasCriteria) {
    errors.push('Au moins un critère de recherche est requis');
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// UTILITAIRES DE VALIDATION
// ============================================================================

/**
 * Vérifie si un utilisateur peut être modifié
 * @param statusId - Status de l'utilisateur
 * @returns true si modifiable
 */
export function isUserModifiable(statusId: number): boolean {
  // Un utilisateur actif (status_id = 1) est modifiable
  return statusId === 1;
}

/**
 * Vérifie si un utilisateur peut être supprimé
 * @param statusId - Status de l'utilisateur
 * @returns true si supprimable
 */
export function isUserDeletable(statusId: number): boolean {
  // Un utilisateur actif (status_id = 1) peut être supprimé (soft delete)
  return statusId === 1;
}

/**
 * Vérifie si une valeur est un ID numérique ou un nom
 * @param value - Valeur à vérifier
 * @returns 'id' | 'name' | 'invalid'
 */
export function getValueType(value: any): 'id' | 'name' | 'invalid' {
  if (typeof value === 'number' && value > 0 && Number.isInteger(value)) {
    return 'id';
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return 'name';
  }
  return 'invalid';
}

/**
 * Sanitize un nom (retire les espaces superflus, met en forme)
 * @param name - Nom à nettoyer
 * @returns Nom nettoyé
 */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Sanitize un email (lowercase, trim)
 * @param email - Email à nettoyer
 * @returns Email nettoyé
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Sanitize un nom d'utilisateur (lowercase, trim)
 * @param username - Nom d'utilisateur à nettoyer
 * @returns Nom d'utilisateur nettoyé
 */
export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Sanitize un numéro de téléphone (retire les espaces et caractères spéciaux)
 * @param phone - Téléphone à nettoyer
 * @returns Téléphone nettoyé
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').trim();
}
