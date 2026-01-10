/**
 * Utilitaires de parsing pour le module Informations
 */

import type {
  Information,
  InformationRow,
  InformationAvecRelations,
  InformationAvecRelationsRow,
  Status,
  StatusRow,
  Genre,
  GenreRow,
  Grade,
  GradeRow,
  PlanTarifaire,
  PlanTarifaireRow,
  CategorieInformation,
  CategorieInformationRow,
  InformationResume,
} from '../types.js';

// ============================================================================
// PARSING DES ROWS DB - INFORMATIONS
// ============================================================================

/**
 * Parse une row DB en objet Information
 * @param row - Row brute de la DB
 * @returns Information parsée
 */
export function parseInformationRow(row: InformationRow): Information {
  return {
    id: row.id,
    titre: row.titre,
    contenu: row.contenu,
    date_creation: row.date_creation,
    date_modification: row.date_modification,
    status_id: row.status_id,
    auteur_id: row.auteur_id,
    categorie_id: row.categorie_id,
    priorite: row.priorite,
    visible: Boolean(row.visible),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parse un tableau de rows en tableau d'Informations
 * @param rows - Tableau de rows brutes
 * @returns Tableau d'informations parsées
 */
export function parseInformationRows(rows: InformationRow[]): Information[] {
  return rows.map(parseInformationRow);
}

/**
 * Parse une row avec relations en objet InformationAvecRelations
 * @param row - Row brute avec relations
 * @returns Information avec relations parsée
 */
export function parseInformationAvecRelationsRow(
  row: InformationAvecRelationsRow
): InformationAvecRelations {
  return {
    id: row.id,
    titre: row.titre,
    contenu: row.contenu,
    date_creation: row.date_creation,
    date_modification: row.date_modification,
    status_id: row.status_id,
    auteur_id: row.auteur_id,
    categorie_id: row.categorie_id,
    priorite: row.priorite,
    visible: Boolean(row.visible),
    auteur: row.auteur,
    categorie: row.categorie,
    status: row.status,
  };
}

/**
 * Parse un tableau de rows avec relations
 * @param rows - Tableau de rows brutes
 * @returns Tableau d'informations avec relations parsées
 */
export function parseInformationAvecRelationsRows(
  rows: InformationAvecRelationsRow[]
): InformationAvecRelations[] {
  return rows.map(parseInformationAvecRelationsRow);
}

// ============================================================================
// PARSING DES ROWS DB - RÉFÉRENTIELS
// ============================================================================

/**
 * Parse une row Status
 * @param row - Row brute
 * @returns Status parsé
 */
export function parseStatusRow(row: StatusRow): Status {
  return {
    id: row.id,
    nom_role: row.nom_role,
    description: row.description,
  };
}

/**
 * Parse un tableau de rows Status
 * @param rows - Tableau de rows brutes
 * @returns Tableau de status parsés
 */
export function parseStatusRows(rows: StatusRow[]): Status[] {
  return rows.map(parseStatusRow);
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
 * Parse un tableau de rows Genre
 * @param rows - Tableau de rows brutes
 * @returns Tableau de genres parsés
 */
export function parseGenreRows(rows: GenreRow[]): Genre[] {
  return rows.map(parseGenreRow);
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
    ordre: row.ordre,
  };
}

/**
 * Parse un tableau de rows Grade
 * @param rows - Tableau de rows brutes
 * @returns Tableau de grades parsés
 */
export function parseGradeRows(rows: GradeRow[]): Grade[] {
  return rows.map(parseGradeRow);
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
    description: row.description,
  };
}

/**
 * Parse un tableau de rows PlanTarifaire
 * @param rows - Tableau de rows brutes
 * @returns Tableau de plans tarifaires parsés
 */
export function parsePlanTarifaireRows(rows: PlanTarifaireRow[]): PlanTarifaire[] {
  return rows.map(parsePlanTarifaireRow);
}

/**
 * Parse une row CategorieInformation
 * @param row - Row brute
 * @returns CategorieInformation parsée
 */
export function parseCategorieInformationRow(
  row: CategorieInformationRow
): CategorieInformation {
  return {
    id: row.id,
    nom: row.nom,
    description: row.description,
    couleur: row.couleur,
    icone: row.icone,
  };
}

/**
 * Parse un tableau de rows CategorieInformation
 * @param rows - Tableau de rows brutes
 * @returns Tableau de catégories parsées
 */
export function parseCategorieInformationRows(
  rows: CategorieInformationRow[]
): CategorieInformation[] {
  return rows.map(parseCategorieInformationRow);
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
// FORMATTING - DATES
// ============================================================================

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
 * Formate une date relative (il y a X jours)
 * @param date - Date à formater
 * @returns String relative
 */
export function formatDateRelative(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} ans`;
}

// ============================================================================
// FORMATTING - INFORMATIONS
// ============================================================================

/**
 * Crée un résumé d'une information (extrait du contenu)
 * @param info - Information complète
 * @param maxLength - Longueur maximale de l'extrait (défaut: 200)
 * @returns InformationResume
 */
export function createInformationResume(
  info: Information,
  maxLength: number = 200
): InformationResume {
  const extrait = info.contenu.length > maxLength
    ? info.contenu.substring(0, maxLength) + '...'
    : info.contenu;

  return {
    id: info.id,
    titre: info.titre,
    extrait,
    date_creation: info.date_creation,
    priorite: info.priorite,
  };
}

/**
 * Formate une information pour l'affichage
 * @param info - Information à formater
 * @returns Objet avec champs formatés
 */
export function formatInformationForDisplay(info: Information) {
  return {
    ...info,
    date_creation_formatted: formatDate(info.date_creation),
    date_creation_relative: formatDateRelative(info.date_creation),
    date_modification_formatted: info.date_modification
      ? formatDate(info.date_modification)
      : null,
    contenu_extrait: createInformationResume(info, 150).extrait,
    priorite_label: getPrioriteLabel(info.priorite || 2),
    status_label: getStatusLabel(info.status_id),
  };
}

/**
 * Obtient le label d'une priorité
 * @param priorite - Numéro de priorité (1-4)
 * @returns Label de la priorité
 */
export function getPrioriteLabel(priorite: number): string {
  const labels: Record<number, string> = {
    1: 'Basse',
    2: 'Normale',
    3: 'Haute',
    4: 'Urgente',
  };
  return labels[priorite] || 'Normale';
}

/**
 * Obtient le label d'un status
 * @param statusId - ID du status
 * @returns Label du status
 */
export function getStatusLabel(statusId: number): string {
  const labels: Record<number, string> = {
    0: 'Brouillon',
    1: 'Publié',
    2: 'Archivé',
    3: 'Supprimé',
  };
  return labels[statusId] || 'Inconnu';
}

/**
 * Obtient la couleur associée à une priorité
 * @param priorite - Numéro de priorité (1-4)
 * @returns Code couleur
 */
export function getPrioriteCouleur(priorite: number): string {
  const couleurs: Record<number, string> = {
    1: '#28a745', // Vert
    2: '#007bff', // Bleu
    3: '#ffc107', // Orange
    4: '#dc3545', // Rouge
  };
  return couleurs[priorite] || '#007bff';
}

// ============================================================================
// EXTRACTION ET MANIPULATION
// ============================================================================

/**
 * Extrait le texte brut d'un contenu HTML
 * @param html - Contenu HTML
 * @returns Texte brut
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Compte les mots dans un texte
 * @param text - Texte à analyser
 * @returns Nombre de mots
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Estime le temps de lecture (en minutes)
 * @param text - Texte à analyser
 * @param wordsPerMinute - Mots par minute (défaut: 200)
 * @returns Temps de lecture en minutes
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const words = countWords(text);
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Groupe les informations par catégorie
 * @param informations - Tableau d'informations avec relations
 * @returns Map groupée par catégorie
 */
export function groupInformationsByCategorie(
  informations: InformationAvecRelations[]
): Map<string, InformationAvecRelations[]> {
  const grouped = new Map<string, InformationAvecRelations[]>();

  informations.forEach((info) => {
    const categorie = info.categorie || 'Sans catégorie';
    if (!grouped.has(categorie)) {
      grouped.set(categorie, []);
    }
    grouped.get(categorie)!.push(info);
  });

  return grouped;
}

/**
 * Groupe les informations par priorité
 * @param informations - Tableau d'informations
 * @returns Map groupée par priorité
 */
export function groupInformationsByPriorite(
  informations: Information[]
): Map<number, Information[]> {
  const grouped = new Map<number, Information[]>();

  informations.forEach((info) => {
    const priorite = info.priorite || 2;
    if (!grouped.has(priorite)) {
      grouped.set(priorite, []);
    }
    grouped.get(priorite)!.push(info);
  });

  return grouped;
}

/**
 * Trie les informations par date de création
 * @param informations - Tableau d'informations
 * @param order - Ordre de tri ('ASC' ou 'DESC')
 * @returns Tableau trié
 */
export function sortInformationsByDate(
  informations: Information[],
  order: 'ASC' | 'DESC' = 'DESC'
): Information[] {
  return [...informations].sort((a, b) => {
    const dateA = new Date(a.date_creation).getTime();
    const dateB = new Date(b.date_creation).getTime();
    return order === 'DESC' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Trie les informations par priorité
 * @param informations - Tableau d'informations
 * @returns Tableau trié (priorité décroissante)
 */
export function sortInformationsByPriorite(
  informations: Information[]
): Information[] {
  return [...informations].sort((a, b) => {
    const prioriteA = a.priorite || 2;
    const prioriteB = b.priorite || 2;
    return prioriteB - prioriteA;
  });
}

/**
 * Filtre les informations visibles uniquement
 * @param informations - Tableau d'informations
 * @returns Informations visibles
 */
export function filterVisibleInformations(
  informations: Information[]
): Information[] {
  return informations.filter((info) => info.visible);
}

/**
 * Filtre les informations récentes (N derniers jours)
 * @param informations - Tableau d'informations
 * @param days - Nombre de jours
 * @returns Informations récentes
 */
export function filterRecentInformations(
  informations: Information[],
  days: number = 7
): Information[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return informations.filter((info) => {
    const dateCreation = new Date(info.date_creation);
    return dateCreation >= cutoffDate;
  });
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
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
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

// ============================================================================
// VALIDATION DE DONNÉES
// ============================================================================

/**
 * Vérifie si une date est dans le futur
 * @param date - Date à vérifier
 * @returns True si dans le futur
 */
export function isDateInFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

/**
 * Vérifie si une date est dans le passé
 * @param date - Date à vérifier
 * @returns True si dans le passé
 */
export function isDateInPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Vérifie si une date est aujourd'hui
 * @param date - Date à vérifier
 * @returns True si aujourd'hui
 */
export function isDateToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Calcule le nombre de jours depuis une date
 * @param date - Date de référence
 * @returns Nombre de jours
 */
export function daysSince(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
