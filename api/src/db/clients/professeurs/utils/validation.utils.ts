/**
 * Utilitaires de validation pour le module professeurs
 * Responsabilité: Validation des données et règles métier
 */

import type {
  Professeur,
  ProfesseurComplet,
  Utilisateur,
  AjouterProfesseurDTO,
  AjouterProfesseursBatchDTO,
  ModifierStatutProfesseurDTO,
} from '../types.js';

// ============================================================================
// Validation des emails
// ============================================================================

/**
 * Regex pour validation d'email basique
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Normalise un email (lowercase et trim)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// Validation des IDs
// ============================================================================

/**
 * Valide un ID (doit être un nombre positif)
 */
export function isValidId(id: any): id is number {
  return typeof id === 'number' && id > 0 && Number.isInteger(id);
}

/**
 * Valide un tableau d'IDs
 */
export function areValidIds(ids: any[]): ids is number[] {
  if (!Array.isArray(ids) || ids.length === 0) {
    return false;
  }
  return ids.every(isValidId);
}

// ============================================================================
// Validation des noms
// ============================================================================

/**
 * Valide un nom (prénom ou nom de famille)
 * - Doit être une chaîne non vide
 * - Entre 1 et 100 caractères
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}

/**
 * Valide un nom d'utilisateur
 * - Doit être une chaîne non vide
 * - Entre 3 et 50 caractères
 * - Alphanumerique + underscore + tiret
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 50) {
    return false;
  }
  // Permet lettres, chiffres, underscore, tiret
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

// ============================================================================
// Validation des statuts
// ============================================================================

/**
 * Liste des statuts valides
 */
export const VALID_STATUS_IDS = [0, 1, 2, 3, 4, 5] as const;

/**
 * Valide un status_id
 */
export function isValidStatusId(statusId: number): boolean {
  return VALID_STATUS_IDS.includes(statusId as any);
}

/**
 * Vérifie si un statut correspond à un professeur
 */
export function isProfesseurStatus(statusId: number): boolean {
  return statusId === 5;
}

/**
 * Vérifie si un statut correspond à un utilisateur régulier
 */
export function isUtilisateurStatus(statusId: number): boolean {
  return statusId === 1;
}

// ============================================================================
// Validation des dates
// ============================================================================

/**
 * Valide une date de naissance
 * - Doit être dans le passé
 * - Pas plus de 150 ans dans le passé
 */
export function isValidDateOfBirth(date: string | Date): boolean {
  if (!date) {
    return false;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const now = new Date();
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 150);

  return dateObj < now && dateObj > minDate;
}

/**
 * Formate une date au format YYYY-MM-DD
 */
export function formatDateForDB(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ============================================================================
// Validation des heures de cours
// ============================================================================

/**
 * Valide un format d'heure (HH:MM ou HH:MM:SS)
 */
export function isValidTimeFormat(time: string): boolean {
  if (!time || typeof time !== 'string') {
    return false;
  }

  // Format HH:MM ou HH:MM:SS
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time);
}

/**
 * Valide qu'une heure de fin est après une heure de début
 */
export function isValidTimeRange(heureDebut: string, heureFin: string): boolean {
  if (!isValidTimeFormat(heureDebut) || !isValidTimeFormat(heureFin)) {
    return false;
  }

  const [debutH, debutM] = heureDebut.split(':').map(Number);
  const [finH, finM] = heureFin.split(':').map(Number);

  const debutMinutes = debutH * 60 + debutM;
  const finMinutes = finH * 60 + finM;

  return finMinutes > debutMinutes;
}

// ============================================================================
// Validation des jours de la semaine
// ============================================================================

/**
 * Valide un jour de la semaine (0-6)
 */
export function isValidDayOfWeek(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

// ============================================================================
// Validation des objets DTO
// ============================================================================

/**
 * Valide un AjouterProfesseurDTO
 */
export function isValidAjouterProfesseurDTO(dto: any): dto is AjouterProfesseurDTO {
  return (
    dto &&
    typeof dto === 'object' &&
    'id' in dto &&
    isValidId(dto.id)
  );
}

/**
 * Valide un AjouterProfesseursBatchDTO
 */
export function isValidAjouterProfesseursBatchDTO(dto: any): dto is AjouterProfesseursBatchDTO {
  if (!dto || typeof dto !== 'object') {
    return false;
  }

  if (!('utilisateurs' in dto) || !Array.isArray(dto.utilisateurs)) {
    return false;
  }

  if (dto.utilisateurs.length === 0) {
    return false;
  }

  // Vérifie que tous les éléments sont soit des nombres, soit des objets avec id
  return dto.utilisateurs.every((u: any) => {
    if (typeof u === 'number') {
      return isValidId(u);
    }
    if (typeof u === 'object' && u !== null) {
      return isValidId(u.id);
    }
    return false;
  });
}

/**
 * Valide un ModifierStatutProfesseurDTO
 */
export function isValidModifierStatutProfesseurDTO(dto: any): dto is ModifierStatutProfesseurDTO {
  return (
    dto &&
    typeof dto === 'object' &&
    'id' in dto &&
    'status_id' in dto &&
    isValidId(dto.id) &&
    typeof dto.status_id === 'number' &&
    isValidStatusId(dto.status_id)
  );
}

// ============================================================================
// Validation des objets métier
// ============================================================================

/**
 * Valide qu'un objet Professeur a tous les champs requis
 */
export function isValidProfesseurObject(prof: Partial<Professeur>): prof is Professeur {
  return !!(
    prof &&
    isValidId(prof.id) &&
    isValidName(prof.nom || '') &&
    isValidName(prof.prenom || '') &&
    isValidEmail(prof.email || '') &&
    isValidId(prof.genre_id) &&
    isValidId(prof.grade_id)
  );
}

/**
 * Valide qu'un objet Utilisateur a tous les champs requis
 */
export function isValidUtilisateurObject(user: Partial<Utilisateur>): user is Utilisateur {
  return !!(
    user &&
    isValidId(user.id) &&
    isValidName(user.first_name || '') &&
    isValidName(user.last_name || '') &&
    isValidEmail(user.email || '') &&
    isValidId(user.genre_id) &&
    isValidId(user.grade_id) &&
    typeof user.status_id === 'number' &&
    isValidStatusId(user.status_id)
  );
}

// ============================================================================
// Validation de données pour mise à jour
// ============================================================================

/**
 * Valide les données pour une mise à jour d'utilisateur
 */
export function validateUpdateUserData(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  genreId?: number;
  gradeId?: number;
  dateOfBirth?: string | Date;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.firstName !== undefined && !isValidName(data.firstName)) {
    errors.push('Le prénom est invalide');
  }

  if (data.lastName !== undefined && !isValidName(data.lastName)) {
    errors.push('Le nom est invalide');
  }

  if (data.email !== undefined && !isValidEmail(data.email)) {
    errors.push('L\'email est invalide');
  }

  if (data.genreId !== undefined && !isValidId(data.genreId)) {
    errors.push('Le genre_id est invalide');
  }

  if (data.gradeId !== undefined && !isValidId(data.gradeId)) {
    errors.push('Le grade_id est invalide');
  }

  if (data.dateOfBirth !== undefined && !isValidDateOfBirth(data.dateOfBirth)) {
    errors.push('La date de naissance est invalide');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Utilitaires de nettoyage
// ============================================================================

/**
 * Nettoie et valide un email
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }
  const normalized = normalizeEmail(email);
  return isValidEmail(normalized) ? normalized : null;
}

/**
 * Nettoie un nom (trim et capitalise première lettre)
 */
export function sanitizeName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return null;
  }
  const trimmed = name.trim();
  if (!isValidName(trimmed)) {
    return null;
  }
  // Capitalise la première lettre
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Nettoie un nom d'utilisateur
 */
export function sanitizeUsername(username: string): string | null {
  if (!username || typeof username !== 'string') {
    return null;
  }
  const trimmed = username.trim().toLowerCase();
  return isValidUsername(trimmed) ? trimmed : null;
}

// ============================================================================
// Validation de contraintes métier
// ============================================================================

/**
 * Vérifie si un utilisateur peut être promu professeur
 */
export function canBePromotedToProfesseur(user: Utilisateur): { can: boolean; reason?: string } {
  if (!user) {
    return { can: false, reason: 'Utilisateur non fourni' };
  }

  if (user.status_id === 5) {
    return { can: false, reason: 'L\'utilisateur est déjà professeur' };
  }

  if (!isValidEmail(user.email)) {
    return { can: false, reason: 'L\'email de l\'utilisateur est invalide' };
  }

  if (!isValidName(user.first_name) || !isValidName(user.last_name)) {
    return { can: false, reason: 'Le nom de l\'utilisateur est invalide' };
  }

  return { can: true };
}

/**
 * Vérifie si un professeur peut être rétrogradé
 */
export function canBeDemotedFromProfesseur(
  professeur: ProfesseurComplet,
  hasActiveCours: boolean
): { can: boolean; reason?: string } {
  if (!professeur) {
    return { can: false, reason: 'Professeur non fourni' };
  }

  if (professeur.status_id !== 5) {
    return { can: false, reason: 'L\'utilisateur n\'est pas professeur' };
  }

  if (hasActiveCours) {
    return { can: false, reason: 'Le professeur a des cours actifs' };
  }

  return { can: true };
}

// ============================================================================
// Validation d'intégrité
// ============================================================================

/**
 * Vérifie l'intégrité d'un objet (pas de champs undefined dans les champs requis)
 */
export function checkObjectIntegrity<T extends object>(
  obj: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null) {
      missingFields.push(String(field));
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Valide l'intégrité d'un Professeur
 */
export function checkProfesseurIntegrity(prof: Partial<Professeur>): {
  isValid: boolean;
  missingFields: string[];
} {
  return checkObjectIntegrity(prof as Professeur, [
    'id',
    'nom',
    'prenom',
    'email',
    'nom_utilisateur',
    'genre_id',
    'grade_id',
    'date_naissance',
  ]);
}

/**
 * Valide l'intégrité d'un Utilisateur
 */
export function checkUtilisateurIntegrity(user: Partial<Utilisateur>): {
  isValid: boolean;
  missingFields: string[];
} {
  return checkObjectIntegrity(user as Utilisateur, [
    'id',
    'first_name',
    'last_name',
    'email',
    'nom_utilisateur',
    'genre_id',
    'grade_id',
    'date_of_birth',
    'status_id',
  ]);
}
