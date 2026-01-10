/**
 * Utilitaires de parsing pour le module Cours
 */

import type {
  Cours,
  CoursRow,
  CoursAvecProfesseurs,
  CoursRecurrent,
  CoursRecurrentRow,
  Professeur,
  ProfesseurRow,
  UtilisateurParticipant,
  UtilisateurParticipantRow,
  Inscription,
  InscriptionRow,
  JourDeCours,
  JourDeCoursRow,
  Semaine,
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,
  StatistiquesRow,
  DisponibiliteCours,
} from '../types.js';

// ============================================================================
// PARSING DES ROWS DB - COURS
// ============================================================================

/**
 * Parse une row DB en objet Cours
 * @param row - Row brute de la DB
 * @returns Cours parsé
 */
export function parseCoursRow(row: CoursRow): Cours {
  return {
    id: row.id,
    date_cours: row.date_cours,
    jour_cours: row.jour_cours,
    jour_semaine: row.jour_semaine,
    type_cours: row.type_cours,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    capacite_max: row.capacite_max,
    description: row.description,
    actif: row.actif,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parse un tableau de rows en tableau de Cours
 * @param rows - Tableau de rows brutes
 * @returns Tableau de cours parsés
 */
export function parseCoursRows(rows: CoursRow[]): Cours[] {
  return rows.map(parseCoursRow);
}

/**
 * Parse une row CoursRecurrent
 * @param row - Row brute
 * @returns CoursRecurrent parsé
 */
export function parseCoursRecurrentRow(row: CoursRecurrentRow): CoursRecurrent {
  return {
    id: row.id,
    jour_semaine: row.jour_semaine,
    type_cours: row.type_cours,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    actif: row.actif,
    created_at: row.created_at,
  };
}

/**
 * Parse un tableau de rows CoursRecurrent
 * @param rows - Tableau de rows brutes
 * @returns Tableau de cours récurrents parsés
 */
export function parseCoursRecurrentRows(rows: CoursRecurrentRow[]): CoursRecurrent[] {
  return rows.map(parseCoursRecurrentRow);
}

// ============================================================================
// PARSING DES ROWS DB - PROFESSEURS
// ============================================================================

/**
 * Parse une row Professeur
 * @param row - Row brute
 * @returns Professeur parsé
 */
export function parseProfesseurRow(row: ProfesseurRow): Professeur {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
  };
}

/**
 * Parse un tableau de rows Professeur
 * @param rows - Tableau de rows brutes
 * @returns Tableau de professeurs parsés
 */
export function parseProfesseurRows(rows: ProfesseurRow[]): Professeur[] {
  return rows.map(parseProfesseurRow);
}

/**
 * Parse une string de professeurs en tableau
 * @param profString - String de professeurs (CSV ou JSON)
 * @returns Tableau de noms de professeurs
 */
export function parseProfesseursString(profString: string | null): string[] {
  if (!profString) return [];

  try {
    // Essayer de parser comme JSON
    const parsed = JSON.parse(profString);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Si ce n'est pas du JSON, essayer CSV
    return profString.split(',').map((p) => p.trim()).filter(Boolean);
  }

  return [];
}

// ============================================================================
// PARSING DES ROWS DB - PARTICIPANTS
// ============================================================================

/**
 * Parse une row UtilisateurParticipant
 * @param row - Row brute
 * @returns UtilisateurParticipant parsé
 */
export function parseUtilisateurParticipantRow(
  row: UtilisateurParticipantRow
): UtilisateurParticipant {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    presence: row.presence,
    date_inscription: row.date_inscription,
  };
}

/**
 * Parse un tableau de rows UtilisateurParticipant
 * @param rows - Tableau de rows brutes
 * @returns Tableau de participants parsés
 */
export function parseUtilisateurParticipantRows(
  rows: UtilisateurParticipantRow[]
): UtilisateurParticipant[] {
  return rows.map(parseUtilisateurParticipantRow);
}

// ============================================================================
// PARSING DES ROWS DB - INSCRIPTIONS
// ============================================================================

/**
 * Parse une row Inscription
 * @param row - Row brute
 * @returns Inscription parsée
 */
export function parseInscriptionRow(row: InscriptionRow): Inscription {
  return {
    id: row.id,
    utilisateur_id: row.utilisateur_id,
    cours_id: row.cours_id,
    date_inscription: row.date_inscription,
    status_id: row.status_id,
    present: row.present,
    notes: row.notes,
    created_at: row.created_at,
  };
}

/**
 * Parse un tableau de rows Inscription
 * @param rows - Tableau de rows brutes
 * @returns Tableau d'inscriptions parsées
 */
export function parseInscriptionRows(rows: InscriptionRow[]): Inscription[] {
  return rows.map(parseInscriptionRow);
}

// ============================================================================
// PARSING DES ROWS DB - PLANNING
// ============================================================================

/**
 * Parse une row JourDeCours
 * @param row - Row brute
 * @returns JourDeCours parsé
 */
export function parseJourDeCoursRow(row: JourDeCoursRow): JourDeCours {
  return {
    jour: row.jour,
    type_cours: row.type_cours,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    professeurs: parseProfesseursString(row.professeurs || ''),
  };
}

/**
 * Parse un tableau de rows JourDeCours
 * @param rows - Tableau de rows brutes
 * @returns Tableau de jours de cours parsés
 */
export function parseJourDeCoursRows(rows: JourDeCoursRow[]): JourDeCours[] {
  return rows.map(parseJourDeCoursRow);
}

// ============================================================================
// PARSING DES ROWS DB - STATISTIQUES
// ============================================================================

/**
 * Parse une row StatistiquesPresenceCours
 * @param row - Row brute
 * @returns StatistiquesPresenceCours parsé
 */
export function parseStatistiquesPresenceCoursRow(
  row: StatistiquesRow
): StatistiquesPresenceCours {
  return {
    cours_id: row.cours_id!,
    type_cours: row.type_cours!,
    date_cours: row.date_cours!,
    total_inscrits: row.total_inscrits || 0,
    presents: row.presents || 0,
    absents: row.absents || 0,
    taux_presence: row.taux_presence || 0,
  };
}

/**
 * Parse une row StatistiquesPresenceUtilisateur
 * @param row - Row brute
 * @returns StatistiquesPresenceUtilisateur parsé
 */
export function parseStatistiquesPresenceUtilisateurRow(
  row: StatistiquesRow
): StatistiquesPresenceUtilisateur {
  return {
    utilisateur_id: row.utilisateur_id!,
    nom: row.nom!,
    prenom: row.prenom!,
    total_cours_inscrits: row.total_cours_inscrits || 0,
    cours_assistes: row.cours_assistes || 0,
    cours_manques: row.cours_manques || 0,
    taux_presence: row.taux_presence || 0,
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
// FORMATTING - DATES ET HEURES
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
 * Formate une heure (HH:MM)
 * @param time - Heure à formater
 * @returns Heure formatée
 */
export function formatTime(time: string): string {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return time;
}

/**
 * Formate une plage horaire
 * @param debut - Heure de début
 * @param fin - Heure de fin
 * @returns Plage formatée (ex: "18:00 - 19:30")
 */
export function formatPlageHoraire(debut: string, fin: string): string {
  return `${formatTime(debut)} - ${formatTime(fin)}`;
}

/**
 * Formate le nom d'un jour à partir du numéro
 * @param jourNum - Numéro du jour (0-6)
 * @returns Nom du jour
 */
export function formatJourSemaine(jourNum: number): string {
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return jours[jourNum] || '';
}

/**
 * Formate le nom d'un jour en minuscules
 * @param jourNum - Numéro du jour (0-6)
 * @returns Nom du jour en minuscules
 */
export function formatJourSemaineLower(jourNum: number): string {
  return formatJourSemaine(jourNum).toLowerCase();
}

// ============================================================================
// FORMATTING - COURS
// ============================================================================

/**
 * Formate le titre d'un cours
 * @param cours - Cours à formater
 * @returns Titre formaté
 */
export function formatCoursTitre(cours: Cours | CoursRecurrent): string {
  return `${cours.type_cours} - ${formatPlageHoraire(cours.heure_debut, cours.heure_fin)}`;
}

/**
 * Formate un cours pour l'affichage
 * @param cours - Cours à formater
 * @returns Objet avec champs formatés
 */
export function formatCoursForDisplay(cours: Cours) {
  return {
    ...cours,
    date_cours_formatted: formatDate(cours.date_cours),
    horaire_formatted: formatPlageHoraire(cours.heure_debut, cours.heure_fin),
    titre: formatCoursTitre(cours),
  };
}

/**
 * Formate un participant pour l'affichage
 * @param participant - Participant à formater
 * @returns Objet avec champs formatés
 */
export function formatParticipantForDisplay(participant: UtilisateurParticipant) {
  return {
    ...participant,
    full_name: `${participant.prenom} ${participant.nom}`,
    presence_text: participant.presence ? 'Présent' : 'Absent',
  };
}

// ============================================================================
// CALCULS ET STATISTIQUES
// ============================================================================

/**
 * Calcule le taux de présence en pourcentage
 * @param presents - Nombre de présents
 * @param total - Nombre total
 * @returns Taux en pourcentage (0-100)
 */
export function calculateTauxPresence(presents: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((presents / total) * 100 * 100) / 100; // Arrondi à 2 décimales
}

/**
 * Calcule le nombre de places disponibles
 * @param capaciteMax - Capacité maximale
 * @param inscrits - Nombre d'inscrits
 * @returns Nombre de places disponibles
 */
export function calculatePlacesDisponibles(capaciteMax: number, inscrits: number): number {
  return Math.max(0, capaciteMax - inscrits);
}

/**
 * Vérifie si un cours est complet
 * @param capaciteMax - Capacité maximale
 * @param inscrits - Nombre d'inscrits
 * @returns True si complet
 */
export function isCoursComplet(capaciteMax: number, inscrits: number): boolean {
  return inscrits >= capaciteMax;
}

/**
 * Crée un objet DisponibiliteCours
 * @param coursId - ID du cours
 * @param capaciteMax - Capacité maximale
 * @param placesOccupees - Places occupées
 * @returns Objet DisponibiliteCours
 */
export function createDisponibiliteCours(
  coursId: number,
  capaciteMax: number,
  placesOccupees: number
): DisponibiliteCours {
  const placesDisponibles = calculatePlacesDisponibles(capaciteMax, placesOccupees);
  return {
    cours_id: coursId,
    capacite_max: capaciteMax,
    places_occupees: placesOccupees,
    places_disponibles: placesDisponibles,
    complet: isCoursComplet(capaciteMax, placesOccupees),
  };
}

// ============================================================================
// EXTRACTION ET MANIPULATION DE DONNÉES
// ============================================================================

/**
 * Extrait les noms de professeurs d'un tableau
 * @param professeurs - Tableau de professeurs
 * @returns Tableau de noms complets
 */
export function extractProfesseursNames(professeurs: Professeur[]): string[] {
  return professeurs.map((p) => `${p.prenom} ${p.nom}`);
}

/**
 * Groupe les cours par date
 * @param cours - Tableau de cours
 * @returns Map groupée par date
 */
export function groupCoursByDate(cours: Cours[]): Map<string, Cours[]> {
  const grouped = new Map<string, Cours[]>();

  cours.forEach((c) => {
    const dateKey = formatDateForSQL(c.date_cours);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(c);
  });

  return grouped;
}

/**
 * Groupe les cours par type
 * @param cours - Tableau de cours
 * @returns Map groupée par type
 */
export function groupCoursByType(cours: Cours[]): Map<string, Cours[]> {
  const grouped = new Map<string, Cours[]>();

  cours.forEach((c) => {
    if (!grouped.has(c.type_cours)) {
      grouped.set(c.type_cours, []);
    }
    grouped.get(c.type_cours)!.push(c);
  });

  return grouped;
}

/**
 * Trie les cours par date et heure
 * @param cours - Tableau de cours
 * @returns Tableau trié
 */
export function sortCoursByDateTime(cours: Cours[]): Cours[] {
  return [...cours].sort((a, b) => {
    const dateA = new Date(a.date_cours).getTime();
    const dateB = new Date(b.date_cours).getTime();

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Si même date, trier par heure de début
    return a.heure_debut.localeCompare(b.heure_debut);
  });
}

/**
 * Filtre les cours futurs
 * @param cours - Tableau de cours
 * @returns Cours futurs uniquement
 */
export function filterCoursFuturs(cours: Cours[]): Cours[] {
  const now = new Date();
  return cours.filter((c) => new Date(c.date_cours) >= now);
}

/**
 * Filtre les cours passés
 * @param cours - Tableau de cours
 * @returns Cours passés uniquement
 */
export function filterCoursPasses(cours: Cours[]): Cours[] {
  const now = new Date();
  return cours.filter((c) => new Date(c.date_cours) < now);
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
