/**
 * Utilitaires de parsing pour le module Compte
 */

import type {
  Utilisateur,
  UtilisateurRow,
  UtilisateurAvecRelations,
  UtilisateurAvecRelationsRow,
  CompteInfo,
  CompteInfoRow,
  Genre,
  GenreRow,
  Grade,
  GradeRow,
  Status,
  StatusRow,
  PlanTarifaire,
  PlanTarifaireRow,
} from '../types.js';

// ============================================================================
// PARSING DES ROWS DB
// ============================================================================

/**
 * Parse une row DB en objet Utilisateur
 * @param row - Row brute de la DB
 * @returns Utilisateur parsé
 */
export function parseUtilisateurRow(row: UtilisateurRow): Utilisateur {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    nom_utilisateur: row.nom_utilisateur,
    email: row.email,
    password: row.password || undefined,
    genre_id: row.genre_id,
    date_of_birth: row.date_of_birth,
    status_id: row.status_id,
    grade_id: row.grade_id,
    abonnement_id: row.abonnement_id,
    phone: row.phone || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parse un tableau de rows en tableau d'Utilisateurs
 * @param rows - Tableau de rows brutes
 * @returns Tableau d'utilisateurs parsés
 */
export function parseUtilisateurRows(rows: UtilisateurRow[]): Utilisateur[] {
  return rows.map(parseUtilisateurRow);
}

/**
 * Parse une row avec relations en objet UtilisateurAvecRelations
 * @param row - Row brute avec relations
 * @returns Utilisateur avec relations parsé
 */
export function parseUtilisateurAvecRelationsRow(
  row: UtilisateurAvecRelationsRow
): UtilisateurAvecRelations {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    nom_utilisateur: row.nom_utilisateur,
    email: row.email,
    genres: row.genres || undefined,
    status: row.status || undefined,
    grades: row.grades || undefined,
    abonnement: row.abonnement || undefined,
    date_of_birth: row.date_of_birth,
    phone: row.phone || undefined,
  };
}

/**
 * Parse une row CompteInfo
 * @param row - Row brute
 * @returns CompteInfo parsé
 */
export function parseCompteInfoRow(row: CompteInfoRow): CompteInfo {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    date_of_birth: row.date_of_birth,
    phone: row.phone || undefined,
  };
}

/**
 * Parse une row Genre
 * @param row - Row brute
 * @returns Genre parsé
 */
export function parseGenreRow(row: GenreRow): Genre {
  return {
    id: row.id,
    genre_name: row.genre_name,
  };
}

/**
 * Parse une row Grade
 * @param row - Row brute
 * @returns Grade parsé
 */
export function parseGradeRow(row: GradeRow): Grade {
  return {
    id: row.id,
    grade_id: row.grade_id,
    nom_grade: row.nom_grade,
  };
}

/**
 * Parse une row Status
 * @param row - Row brute
 * @returns Status parsé
 */
export function parseStatusRow(row: StatusRow): Status {
  return {
    id: row.id,
    nom_role: row.nom_role,
  };
}

/**
 * Parse une row PlanTarifaire
 * @param row - Row brute
 * @returns PlanTarifaire parsé
 */
export function parsePlanTarifaireRow(row: PlanTarifaireRow): PlanTarifaire {
  return {
    id: row.id,
    nom_plan: row.nom_plan,
    prix: Number(row.prix),
    duree: row.duree,
  };
}

// ============================================================================
// CONVERSION DE TYPES
// ============================================================================

/**
 * Convertit une valeur en nombre
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
 * Convertit une valeur en entier
 * @param value - Valeur à convertir
 * @returns Entier
 */
export function toInt(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'string' ? parseInt(value, 10) || 0 : Math.floor(value);
}

/**
 * Convertit une valeur en booléen
 * @param value - Valeur à convertir
 * @returns Booléen
 */
export function toBoolean(value: number | string | boolean | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  const str = value.toLowerCase();
  return str === 'true' || str === '1' || str === 'yes' || str === 'oui';
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Formate un nom complet (prénom + nom)
 * @param firstName - Prénom
 * @param lastName - Nom
 * @returns Nom complet
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

/**
 * Formate une date pour l'affichage
 * @param date - Date à formater
 * @returns String formatée
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Formate une date pour l'affichage avec heure
 * @param date - Date à formater
 * @returns String formatée
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '';
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
 * Formate une date pour SQL (YYYY-MM-DD)
 * @param date - Date à formater
 * @returns String formatée pour SQL
 */
export function formatDateForSQL(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param phone - Téléphone à formater
 * @returns Téléphone formaté
 */
export function formatPhone(phone: string | null): string {
  if (!phone) return '';
  // Retire tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');

  // Format français (06 12 34 56 78)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  // Format international (+33 6 12 34 56 78)
  if (cleaned.length === 11 && cleaned.startsWith('33')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }

  return phone;
}

/**
 * Formate un utilisateur pour l'affichage
 * @param user - Utilisateur à formater
 * @returns Objet avec champs formatés
 */
export function formatUtilisateurForDisplay(user: Utilisateur | UtilisateurAvecRelations) {
  return {
    ...user,
    full_name: formatFullName(user.first_name, user.last_name),
    date_of_birth_formatted: formatDate(user.date_of_birth),
    phone_formatted: 'phone' in user ? formatPhone(user.phone || null) : undefined,
  };
}

// ============================================================================
// MASQUAGE DE DONNÉES SENSIBLES
// ============================================================================

/**
 * Masque un email (garde le début et le domaine)
 * @param email - Email à masquer
 * @returns Email masqué
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
  const masked = localPart.slice(0, visibleChars) + '***';
  return `${masked}@${domain}`;
}

/**
 * Masque un numéro de téléphone
 * @param phone - Téléphone à masquer
 * @returns Téléphone masqué
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';

  const visible = cleaned.slice(-4);
  return '******' + visible;
}

/**
 * Retire le mot de passe d'un utilisateur
 * @param user - Utilisateur
 * @returns Utilisateur sans mot de passe
 */
export function removePassword(user: Utilisateur): Omit<Utilisateur, 'password'> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Retire le mot de passe d'un tableau d'utilisateurs
 * @param users - Tableau d'utilisateurs
 * @returns Tableau d'utilisateurs sans mot de passe
 */
export function removePasswords(users: Utilisateur[]): Omit<Utilisateur, 'password'>[] {
  return users.map(removePassword);
}

// ============================================================================
// EXTRACTION DE DONNÉES
// ============================================================================

/**
 * Extrait les initiales d'un utilisateur
 * @param firstName - Prénom
 * @param lastName - Nom
 * @returns Initiales (ex: "JD")
 */
export function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

/**
 * Calcule l'âge à partir de la date de naissance
 * @param dateOfBirth - Date de naissance
 * @returns Âge en années
 */
export function calculateAge(dateOfBirth: Date | string | null): number | null {
  if (!dateOfBirth) return null;

  const birth = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Extrait le domaine d'un email
 * @param email - Email
 * @returns Domaine (ex: "gmail.com")
 */
export function extractEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
}

// ============================================================================
// TRANSFORMATION DE DONNÉES
// ============================================================================

/**
 * Convertit les noms de champs snake_case en camelCase
 * @param obj - Objet à convertir
 * @returns Objet avec clés en camelCase
 */
export function snakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = snakeToCamel(obj[key]);
    }
  }
  return converted;
}

/**
 * Convertit les noms de champs camelCase en snake_case
 * @param obj - Objet à convertir
 * @returns Objet avec clés en snake_case
 */
export function camelToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      converted[snakeKey] = camelToSnake(obj[key]);
    }
  }
  return converted;
}

/**
 * Prépare les données pour la mise à jour en DB
 * @param data - Données à préparer
 * @returns Données préparées pour SQL
 */
export function prepareUpdateData(data: any): any {
  const prepared: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== undefined) {
      // Convertir les dates en format SQL
      if (data[key] instanceof Date) {
        prepared[key] = formatDateForSQL(data[key]);
      }
      // Nettoyer les strings
      else if (typeof data[key] === 'string') {
        prepared[key] = data[key].trim();
      }
      // Autres valeurs
      else {
        prepared[key] = data[key];
      }
    }
  }

  return prepared;
}
