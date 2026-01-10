/**
 * Utilitaires de validation pour le module Cours
 */

import {
  isValidTimeFormat,
  isValidDate,
  isValidJourSemaine,
  JOURS_MAPPING,
} from '../types.js';

import type {
  CreateCoursData,
  CreateCoursRecurrentData,
  UpdateCoursData,
  UpdateCoursRecurrentData,
  InscriptionData,
  CoursSearchFilters,
} from '../types.js';

// ============================================================================
// VALIDATION DES COURS
// ============================================================================

/**
 * Résultat de validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valide les données de création d'un cours ponctuel
 * @param data - Données du cours
 * @returns Résultat de validation
 */
export function validateCreateCoursData(data: CreateCoursData): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation de la date
  if (!data.date_cours) {
    errors.push('La date du cours est requise');
    isValid = false;
  } else if (!isValidDate(data.date_cours)) {
    errors.push('La date du cours est invalide');
    isValid = false;
  } else {
    const courseDate = new Date(data.date_cours);
    const now = new Date();
    if (courseDate < now) {
      errors.push('La date du cours doit être dans le futur');
      isValid = false;
    }
  }

  // Validation du type de cours
  if (!data.type_cours || data.type_cours.trim().length === 0) {
    errors.push('Le type de cours est requis');
    isValid = false;
  } else if (data.type_cours.trim().length < 3) {
    errors.push('Le type de cours doit contenir au moins 3 caractères');
    isValid = false;
  }

  // Validation de l'heure de début
  if (!data.heure_debut) {
    errors.push("L'heure de début est requise");
    isValid = false;
  } else if (!isValidTimeFormat(data.heure_debut)) {
    errors.push("L'heure de début est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de l'heure de fin
  if (!data.heure_fin) {
    errors.push("L'heure de fin est requise");
    isValid = false;
  } else if (!isValidTimeFormat(data.heure_fin)) {
    errors.push("L'heure de fin est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de la cohérence des heures
  if (data.heure_debut && data.heure_fin && isValidTimeFormat(data.heure_debut) && isValidTimeFormat(data.heure_fin)) {
    if (data.heure_debut >= data.heure_fin) {
      errors.push("L'heure de fin doit être après l'heure de début");
      isValid = false;
    }

    // Vérifier que le cours dure au moins 30 minutes
    const [startHour, startMin] = data.heure_debut.split(':').map(Number);
    const [endHour, endMin] = data.heure_fin.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (durationMinutes < 30) {
      errors.push('Le cours doit durer au moins 30 minutes');
      isValid = false;
    }

    if (durationMinutes > 240) {
      errors.push('Le cours ne peut pas durer plus de 4 heures');
      isValid = false;
    }
  }

  // Validation de la capacité maximale
  if (data.capacite_max !== undefined && data.capacite_max !== null) {
    if (!Number.isInteger(data.capacite_max) || data.capacite_max <= 0) {
      errors.push('La capacité maximale doit être un nombre entier positif');
      isValid = false;
    } else if (data.capacite_max > 100) {
      errors.push('La capacité maximale ne peut pas dépasser 100 personnes');
      isValid = false;
    }
  }

  // Validation de la description
  if (data.description && data.description.length > 500) {
    errors.push('La description ne peut pas dépasser 500 caractères');
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * Valide les données de création d'un cours récurrent
 * @param data - Données du cours récurrent
 * @returns Résultat de validation
 */
export function validateCreateCoursRecurrentData(
  data: CreateCoursRecurrentData
): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation du jour de la semaine
  if (data.jour_semaine === undefined || data.jour_semaine === null) {
    errors.push('Le jour de la semaine est requis');
    isValid = false;
  } else if (!isValidJourSemaine(data.jour_semaine)) {
    errors.push('Le jour de la semaine est invalide (doit être entre 0 et 6 ou un nom de jour)');
    isValid = false;
  }

  // Validation du type de cours
  if (!data.type_cours || data.type_cours.trim().length === 0) {
    errors.push('Le type de cours est requis');
    isValid = false;
  } else if (data.type_cours.trim().length < 3) {
    errors.push('Le type de cours doit contenir au moins 3 caractères');
    isValid = false;
  }

  // Validation de l'heure de début
  if (!data.heure_debut) {
    errors.push("L'heure de début est requise");
    isValid = false;
  } else if (!isValidTimeFormat(data.heure_debut)) {
    errors.push("L'heure de début est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de l'heure de fin
  if (!data.heure_fin) {
    errors.push("L'heure de fin est requise");
    isValid = false;
  } else if (!isValidTimeFormat(data.heure_fin)) {
    errors.push("L'heure de fin est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de la cohérence des heures
  if (data.heure_debut && data.heure_fin && isValidTimeFormat(data.heure_debut) && isValidTimeFormat(data.heure_fin)) {
    if (data.heure_debut >= data.heure_fin) {
      errors.push("L'heure de fin doit être après l'heure de début");
      isValid = false;
    }

    const [startHour, startMin] = data.heure_debut.split(':').map(Number);
    const [endHour, endMin] = data.heure_fin.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (durationMinutes < 30) {
      errors.push('Le cours doit durer au moins 30 minutes');
      isValid = false;
    }

    if (durationMinutes > 240) {
      errors.push('Le cours ne peut pas durer plus de 4 heures');
      isValid = false;
    }
  }

  // Validation des dates de début et fin
  if (data.date_debut && !isValidDate(data.date_debut)) {
    errors.push('La date de début est invalide');
    isValid = false;
  }

  if (data.date_fin && !isValidDate(data.date_fin)) {
    errors.push('La date de fin est invalide');
    isValid = false;
  }

  if (data.date_debut && data.date_fin) {
    const debut = new Date(data.date_debut);
    const fin = new Date(data.date_fin);

    if (fin <= debut) {
      errors.push('La date de fin doit être après la date de début');
      isValid = false;
    }

    // Vérifier que la période ne dépasse pas 1 an
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      errors.push('La période ne peut pas dépasser 1 an');
      isValid = false;
    }
  }

  // Validation des professeurs
  if (data.professeurs && Array.isArray(data.professeurs)) {
    if (data.professeurs.length === 0) {
      errors.push('Au moins un professeur doit être associé au cours');
      isValid = false;
    }

    data.professeurs.forEach((prof, index) => {
      if (!prof || prof.trim().length === 0) {
        errors.push(`Le nom du professeur ${index + 1} est invalide`);
        isValid = false;
      }
    });
  }

  return { isValid, errors };
}

/**
 * Valide les données de mise à jour d'un cours
 * @param data - Données de mise à jour
 * @returns Résultat de validation
 */
export function validateUpdateCoursData(data: UpdateCoursData): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation de la date (si fournie)
  if (data.date_cours !== undefined) {
    if (!isValidDate(data.date_cours)) {
      errors.push('La date du cours est invalide');
      isValid = false;
    }
  }

  // Validation du type de cours (si fourni)
  if (data.type_cours !== undefined) {
    if (!data.type_cours || data.type_cours.trim().length === 0) {
      errors.push('Le type de cours ne peut pas être vide');
      isValid = false;
    } else if (data.type_cours.trim().length < 3) {
      errors.push('Le type de cours doit contenir au moins 3 caractères');
      isValid = false;
    }
  }

  // Validation de l'heure de début (si fournie)
  if (data.heure_debut !== undefined && !isValidTimeFormat(data.heure_debut)) {
    errors.push("L'heure de début est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de l'heure de fin (si fournie)
  if (data.heure_fin !== undefined && !isValidTimeFormat(data.heure_fin)) {
    errors.push("L'heure de fin est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de la cohérence des heures
  if (data.heure_debut && data.heure_fin) {
    if (data.heure_debut >= data.heure_fin) {
      errors.push("L'heure de fin doit être après l'heure de début");
      isValid = false;
    }
  }

  // Validation de la capacité maximale (si fournie)
  if (data.capacite_max !== undefined && data.capacite_max !== null) {
    if (!Number.isInteger(data.capacite_max) || data.capacite_max <= 0) {
      errors.push('La capacité maximale doit être un nombre entier positif');
      isValid = false;
    } else if (data.capacite_max > 100) {
      errors.push('La capacité maximale ne peut pas dépasser 100 personnes');
      isValid = false;
    }
  }

  // Validation de la description (si fournie)
  if (data.description !== undefined && data.description && data.description.length > 500) {
    errors.push('La description ne peut pas dépasser 500 caractères');
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * Valide les données de mise à jour d'un cours récurrent
 * @param data - Données de mise à jour
 * @returns Résultat de validation
 */
export function validateUpdateCoursRecurrentData(
  data: UpdateCoursRecurrentData
): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation du type de cours (si fourni)
  if (data.type_cours !== undefined) {
    if (!data.type_cours || data.type_cours.trim().length === 0) {
      errors.push('Le type de cours ne peut pas être vide');
      isValid = false;
    } else if (data.type_cours.trim().length < 3) {
      errors.push('Le type de cours doit contenir au moins 3 caractères');
      isValid = false;
    }
  }

  // Validation de l'heure de début (si fournie)
  if (data.heure_debut !== undefined && !isValidTimeFormat(data.heure_debut)) {
    errors.push("L'heure de début est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de l'heure de fin (si fournie)
  if (data.heure_fin !== undefined && !isValidTimeFormat(data.heure_fin)) {
    errors.push("L'heure de fin est invalide (format attendu: HH:MM)");
    isValid = false;
  }

  // Validation de la cohérence des heures
  if (data.heure_debut && data.heure_fin) {
    if (data.heure_debut >= data.heure_fin) {
      errors.push("L'heure de fin doit être après l'heure de début");
      isValid = false;
    }
  }

  // Validation des professeurs (si fournis)
  if (data.professeurs !== undefined && Array.isArray(data.professeurs)) {
    if (data.professeurs.length === 0) {
      errors.push('Au moins un professeur doit être associé au cours');
      isValid = false;
    }

    data.professeurs.forEach((prof, index) => {
      if (!prof || prof.trim().length === 0) {
        errors.push(`Le nom du professeur ${index + 1} est invalide`);
        isValid = false;
      }
    });
  }

  return { isValid, errors };
}

// ============================================================================
// VALIDATION DES INSCRIPTIONS
// ============================================================================

/**
 * Valide les données d'inscription
 * @param data - Données d'inscription
 * @returns Résultat de validation
 */
export function validateInscriptionData(data: InscriptionData): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // Validation de l'utilisateur
  if (!data.utilisateur_id || !Number.isInteger(data.utilisateur_id) || data.utilisateur_id <= 0) {
    errors.push("L'ID de l'utilisateur est requis et doit être un nombre entier positif");
    isValid = false;
  }

  // Validation du cours
  if (!data.cours_id || !Number.isInteger(data.cours_id) || data.cours_id <= 0) {
    errors.push("L'ID du cours est requis et doit être un nombre entier positif");
    isValid = false;
  }

  // Validation des notes (si fournies)
  if (data.notes !== undefined && data.notes !== null && data.notes.length > 500) {
    errors.push('Les notes ne peuvent pas dépasser 500 caractères');
    isValid = false;
  }

  return { isValid, errors };
}

// ============================================================================
// VALIDATION DES IDENTIFIANTS
// ============================================================================

/**
 * Valide un ID de cours
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateCoursId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Valide un ID de cours récurrent
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateCoursRecurrentId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Valide un ID d'inscription
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateInscriptionId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Valide un ID d'utilisateur
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateUtilisateurId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Valide un ID de professeur
 * @param id - ID à valider
 * @returns True si valide
 */
export function validateProfesseurId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

// ============================================================================
// VALIDATION DES RECHERCHES
// ============================================================================

/**
 * Valide les filtres de recherche de cours
 * @param filters - Filtres à valider
 * @returns Résultat de validation
 */
export function validateCoursSearchFilters(filters: CoursSearchFilters): ValidationResult {
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

  // Validation du jour de la semaine
  if (filters.jour_semaine !== undefined && !isValidJourSemaine(filters.jour_semaine)) {
    errors.push('Le jour de la semaine est invalide');
    isValid = false;
  }

  // Validation des heures
  if (filters.heure_debut && !isValidTimeFormat(filters.heure_debut)) {
    errors.push("L'heure de début est invalide");
    isValid = false;
  }

  if (filters.heure_fin && !isValidTimeFormat(filters.heure_fin)) {
    errors.push("L'heure de fin est invalide");
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
      errors.push("L'offset doit être un nombre entier positif ou zéro");
      isValid = false;
    }
  }

  return { isValid, errors };
}

// ============================================================================
// VALIDATION DES HORAIRES
// ============================================================================

/**
 * Vérifie qu'une heure de début est cohérente avec une heure de fin
 * @param debut - Heure de début
 * @param fin - Heure de fin
 * @returns True si cohérent
 */
export function validateHoraireCoherence(debut: string, fin: string): boolean {
  if (!isValidTimeFormat(debut) || !isValidTimeFormat(fin)) {
    return false;
  }
  return debut < fin;
}

/**
 * Vérifie qu'un cours a une durée minimale
 * @param debut - Heure de début
 * @param fin - Heure de fin
 * @param minMinutes - Durée minimale en minutes (défaut: 30)
 * @returns True si la durée est suffisante
 */
export function validateMinDuration(
  debut: string,
  fin: string,
  minMinutes: number = 30
): boolean {
  if (!isValidTimeFormat(debut) || !isValidTimeFormat(fin)) {
    return false;
  }

  const [startHour, startMin] = debut.split(':').map(Number);
  const [endHour, endMin] = fin.split(':').map(Number);
  const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

  return durationMinutes >= minMinutes;
}

/**
 * Vérifie qu'un cours ne dépasse pas une durée maximale
 * @param debut - Heure de début
 * @param fin - Heure de fin
 * @param maxMinutes - Durée maximale en minutes (défaut: 240)
 * @returns True si la durée ne dépasse pas le maximum
 */
export function validateMaxDuration(
  debut: string,
  fin: string,
  maxMinutes: number = 240
): boolean {
  if (!isValidTimeFormat(debut) || !isValidTimeFormat(fin)) {
    return false;
  }

  const [startHour, startMin] = debut.split(':').map(Number);
  const [endHour, endMin] = fin.split(':').map(Number);
  const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

  return durationMinutes <= maxMinutes;
}

// ============================================================================
// VALIDATION DES CAPACITÉS
// ============================================================================

/**
 * Valide une capacité maximale
 * @param capacite - Capacité à valider
 * @returns True si valide
 */
export function validateCapaciteMax(capacite: number): boolean {
  return Number.isInteger(capacite) && capacite > 0 && capacite <= 100;
}

/**
 * Vérifie si un cours peut accepter de nouvelles inscriptions
 * @param capacite - Capacité maximale
 * @param inscrits - Nombre d'inscrits actuels
 * @returns True si des places sont disponibles
 */
export function canAcceptNewInscription(capacite: number, inscrits: number): boolean {
  return inscrits < capacite;
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Nettoie un nom de type de cours
 * @param type - Type à nettoyer
 * @returns Type nettoyé
 */
export function sanitizeTypeCours(type: string): string {
  return type.trim().replace(/\s+/g, ' ');
}

/**
 * Nettoie une description
 * @param description - Description à nettoyer
 * @returns Description nettoyée
 */
export function sanitizeDescription(description: string): string {
  return description.trim().replace(/\s+/g, ' ');
}

/**
 * Nettoie des notes
 * @param notes - Notes à nettoyer
 * @returns Notes nettoyées
 */
export function sanitizeNotes(notes: string): string {
  return notes.trim().replace(/\s+/g, ' ');
}

/**
 * Nettoie un nom de professeur
 * @param name - Nom à nettoyer
 * @returns Nom nettoyé
 */
export function sanitizeProfesseurName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// VÉRIFICATIONS DE LOGIQUE MÉTIER
// ============================================================================

/**
 * Vérifie si un cours peut être modifié (pas encore passé)
 * @param dateCours - Date du cours
 * @returns True si modifiable
 */
export function isCoursModifiable(dateCours: Date | string): boolean {
  const courseDate = typeof dateCours === 'string' ? new Date(dateCours) : dateCours;
  const now = new Date();
  return courseDate > now;
}

/**
 * Vérifie si un cours peut être supprimé (pas déjà commencé)
 * @param dateCours - Date du cours
 * @returns True si supprimable
 */
export function isCoursSupprimable(dateCours: Date | string): boolean {
  const courseDate = typeof dateCours === 'string' ? new Date(dateCours) : dateCours;
  const now = new Date();
  return courseDate > now;
}

/**
 * Vérifie si une inscription peut être annulée (cours pas encore commencé)
 * @param dateCours - Date du cours
 * @param heureDebut - Heure de début
 * @returns True si annulable
 */
export function isInscriptionAnnulable(dateCours: Date | string, heureDebut: string): boolean {
  const courseDate = typeof dateCours === 'string' ? new Date(dateCours) : dateCours;
  const now = new Date();

  // Si le cours est dans le futur, c'est annulable
  if (courseDate > now) {
    return true;
  }

  // Si c'est aujourd'hui, vérifier l'heure
  if (
    courseDate.getDate() === now.getDate() &&
    courseDate.getMonth() === now.getMonth() &&
    courseDate.getFullYear() === now.getFullYear()
  ) {
    const [hour, min] = heureDebut.split(':').map(Number);
    const courseTime = hour * 60 + min;
    const nowTime = now.getHours() * 60 + now.getMinutes();
    return nowTime < courseTime;
  }

  return false;
}

/**
 * Convertit un nom de jour en numéro
 * @param jour - Nom du jour
 * @returns Numéro du jour (0-6)
 */
export function jourNameToNumber(jour: string): number {
  const jourLower = jour.toLowerCase();
  return JOURS_MAPPING[jourLower] ?? -1;
}
