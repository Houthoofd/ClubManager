/**
 * Utilitaires pour le module Inscription
 * Responsabilité: Parsing, transformation et validation des données
 */

import type {
  Cours,
  CoursRow,
  CoursRecurrent,
  CoursRecurrentRow,
  Inscription,
  InscriptionRow,
  UtilisateurInscrit,
  UtilisateurInscritRow,
  Professeur,
  ProfesseurRow,
  JourDeCours,
  JourDeCoursRow,
  SemaineAvecCours,
  SemaineAvecCoursRow,
  StatistiquesPresenceCours,
  StatistiquesPresenceCoursRow,
  StatistiquesPresenceUtilisateur,
  StatistiquesPresenceUtilisateurRow,
  CoursAvecProfesseurs,
  CoursAvecUtilisateurs,
  StatusPresence,
} from '../types/index.js';

// ============================================================================
// PARSERS - COURS
// ============================================================================

/**
 * Parser une row de cours en objet Cours
 */
export function parseCoursRow(row: CoursRow): Cours {
  return {
    id: row.id,
    date_cours: row.date_cours,
    jour_cours: row.jour_cours || undefined,
    jour_semaine: row.jour_semaine || undefined,
    type_cours: row.type_cours,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    cours_recurrent_id: row.cours_recurrent_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parser plusieurs rows de cours
 */
export function parseCoursRows(rows: CoursRow[]): Cours[] {
  return rows.map(parseCoursRow);
}

/**
 * Parser une row de cours avec professeurs (string concaténé)
 */
export function parseCoursAvecProfesseursRow(row: any): CoursAvecProfesseurs {
  const cours = parseCoursRow(row);

  let professeurs: Professeur[] = [];
  if (row.professeurs && typeof row.professeurs === 'string') {
    // Format: "id:Prenom Nom,id:Prenom Nom"
    professeurs = row.professeurs.split(',').map((prof: string) => {
      const [idPart, ...nameParts] = prof.split(':');
      const fullName = nameParts.join(':').trim();
      const [prenom, ...nomParts] = fullName.split(' ');
      return {
        id: parseInt(idPart),
        prenom: prenom || '',
        nom: nomParts.join(' ') || '',
      };
    }).filter((p: Professeur) => !isNaN(p.id));
  }

  return {
    ...cours,
    professeurs,
  };
}

/**
 * Parser plusieurs cours avec professeurs
 */
export function parseCoursAvecProfesseursRows(rows: any[]): CoursAvecProfesseurs[] {
  return rows.map(parseCoursAvecProfesseursRow);
}

// ============================================================================
// PARSERS - COURS RÉCURRENTS
// ============================================================================

/**
 * Parser une row de cours récurrent
 */
export function parseCoursRecurrentRow(row: CoursRecurrentRow): CoursRecurrent {
  return {
    id: row.id,
    jour_semaine: row.jour_semaine,
    type_cours: row.type_cours,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    date_debut: row.date_debut,
    date_fin: row.date_fin || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parser plusieurs rows de cours récurrents
 */
export function parseCoursRecurrentRows(rows: CoursRecurrentRow[]): CoursRecurrent[] {
  return rows.map(parseCoursRecurrentRow);
}

/**
 * Parser une row de jour de cours
 */
export function parseJourDeCoursRow(row: JourDeCoursRow): JourDeCours {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  return {
    id: row.id,
    jour: jours[row.jour_semaine] || '',
    jour_semaine: row.jour_semaine,
    type_cours: row.type_cours,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    professeurs: row.professeurs ? row.professeurs.split(', ').filter(p => p.trim()) : [],
    date_debut: row.date_debut,
    date_fin: row.date_fin || undefined,
  };
}

/**
 * Parser plusieurs rows de jours de cours
 */
export function parseJourDeCoursRows(rows: JourDeCoursRow[]): JourDeCours[] {
  return rows.map(parseJourDeCoursRow);
}

// ============================================================================
// PARSERS - INSCRIPTIONS
// ============================================================================

/**
 * Parser une row d'inscription
 */
export function parseInscriptionRow(row: InscriptionRow): Inscription {
  return {
    id: row.id,
    cours_id: row.cours_id,
    utilisateur_id: row.utilisateur_id,
    date_inscription: row.date_inscription,
    presence: row.presence as StatusPresence | null,
    est_valide: row.est_valide === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Parser plusieurs rows d'inscriptions
 */
export function parseInscriptionRows(rows: InscriptionRow[]): Inscription[] {
  return rows.map(parseInscriptionRow);
}

/**
 * Parser une row d'utilisateur inscrit
 */
export function parseUtilisateurInscritRow(row: UtilisateurInscritRow): UtilisateurInscrit {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email || undefined,
    presence: row.presence as StatusPresence | null,
    date_inscription: row.date_inscription || undefined,
    est_valide: row.est_valide !== null ? row.est_valide === 1 : undefined,
  };
}

/**
 * Parser plusieurs rows d'utilisateurs inscrits
 */
export function parseUtilisateurInscritRows(rows: UtilisateurInscritRow[]): UtilisateurInscrit[] {
  return rows.map(parseUtilisateurInscritRow);
}

// ============================================================================
// PARSERS - PROFESSEURS
// ============================================================================

/**
 * Parser une row de professeur
 */
export function parseProfesseurRow(row: ProfesseurRow): Professeur {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email || undefined,
  };
}

/**
 * Parser plusieurs rows de professeurs
 */
export function parseProfesseurRows(rows: ProfesseurRow[]): Professeur[] {
  return rows.map(parseProfesseurRow);
}

// ============================================================================
// PARSERS - SEMAINES
// ============================================================================

/**
 * Parser une row de semaine avec cours
 */
export function parseSemaineAvecCoursRow(row: SemaineAvecCoursRow): SemaineAvecCours {
  return {
    numero_semaine: row.numero_semaine,
    annee: row.annee,
    date_debut: row.date_debut,
    date_fin: row.date_fin,
    nombre_cours: row.nombre_cours,
  };
}

/**
 * Parser plusieurs rows de semaines
 */
export function parseSemaineAvecCoursRows(rows: SemaineAvecCoursRow[]): SemaineAvecCours[] {
  return rows.map(parseSemaineAvecCoursRow);
}

// ============================================================================
// PARSERS - STATISTIQUES
// ============================================================================

/**
 * Parser une row de statistiques de présence par cours
 */
export function parseStatistiquesPresenceCoursRow(
  row: StatistiquesPresenceCoursRow
): StatistiquesPresenceCours {
  return {
    cours_id: row.cours_id,
    date_cours: row.date_cours,
    type_cours: row.type_cours,
    total_inscrits: row.total_inscrits,
    presents: row.presents,
    absents: row.absents,
    en_attente: row.en_attente,
    taux_presence: parseFloat(
      ((row.presents / (row.total_inscrits || 1)) * 100).toFixed(2)
    ),
  };
}

/**
 * Parser plusieurs rows de statistiques de présence par cours
 */
export function parseStatistiquesPresenceCoursRows(
  rows: StatistiquesPresenceCoursRow[]
): StatistiquesPresenceCours[] {
  return rows.map(parseStatistiquesPresenceCoursRow);
}

/**
 * Parser une row de statistiques de présence par utilisateur
 */
export function parseStatistiquesPresenceUtilisateurRow(
  row: StatistiquesPresenceUtilisateurRow
): StatistiquesPresenceUtilisateur {
  return {
    utilisateur_id: row.utilisateur_id,
    nom: row.nom,
    prenom: row.prenom,
    total_cours: row.total_cours,
    presents: row.presents,
    absents: row.absents,
    en_attente: row.en_attente,
    taux_presence: parseFloat(
      ((row.presents / (row.total_cours || 1)) * 100).toFixed(2)
    ),
  };
}

/**
 * Parser plusieurs rows de statistiques de présence par utilisateur
 */
export function parseStatistiquesPresenceUtilisateurRows(
  rows: StatistiquesPresenceUtilisateurRow[]
): StatistiquesPresenceUtilisateur[] {
  return rows.map(parseStatistiquesPresenceUtilisateurRow);
}

// ============================================================================
// UTILITAIRES DE CONVERSION
// ============================================================================

/**
 * Convertir une valeur en entier de manière sécurisée
 */
export function toInt(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Convertir une valeur en booléen
 */
export function toBool(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return Boolean(value);
}

/**
 * Convertir une valeur en string (null-safe)
 */
export function toString(value: any): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

/**
 * Convertir une date SQL en Date ou string
 */
export function parseDate(value: any): Date | string | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Formater une heure pour l'affichage (HH:MM)
 */
export function formatHeure(heure: string): string {
  if (!heure) return '';
  // Si format HH:MM:SS, retourner HH:MM
  if (heure.length === 8) {
    return heure.substring(0, 5);
  }
  return heure;
}

/**
 * Formater une date pour l'affichage (DD/MM/YYYY)
 */
export function formatDateFR(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const annee = d.getFullYear();

  return `${jour}/${mois}/${annee}`;
}

/**
 * Formater une date pour SQL (YYYY-MM-DD)
 */
export function formatDateSQL(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const annee = d.getFullYear();
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');

  return `${annee}-${mois}-${jour}`;
}

// ============================================================================
// UTILITAIRES DE VALIDATION
// ============================================================================

/**
 * Valider qu'un objet cours est complet
 */
export function isValidCours(cours: any): boolean {
  return (
    cours &&
    typeof cours.id === 'number' &&
    cours.date_cours &&
    typeof cours.type_cours === 'string' &&
    typeof cours.heure_debut === 'string' &&
    typeof cours.heure_fin === 'string'
  );
}

/**
 * Valider qu'un objet inscription est complet
 */
export function isValidInscription(inscription: any): boolean {
  return (
    inscription &&
    typeof inscription.id === 'number' &&
    typeof inscription.cours_id === 'number' &&
    typeof inscription.utilisateur_id === 'number'
  );
}

/**
 * Valider un format d'heure
 */
export function isValidHeureFormat(heure: string): boolean {
  const heureRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
  return heureRegex.test(heure);
}

/**
 * Valider une plage horaire (debut < fin)
 */
export function isValidPlageHoraire(debut: string, fin: string): boolean {
  if (!isValidHeureFormat(debut) || !isValidHeureFormat(fin)) {
    return false;
  }
  return debut < fin;
}

// ============================================================================
// UTILITAIRES DE TRANSFORMATION
// ============================================================================

/**
 * Grouper des cours par date
 */
export function groupCoursByDate(cours: Cours[]): Map<string, Cours[]> {
  const grouped = new Map<string, Cours[]>();

  cours.forEach(c => {
    const dateKey = formatDateSQL(c.date_cours);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(c);
  });

  return grouped;
}

/**
 * Grouper des cours par type
 */
export function groupCoursByType(cours: Cours[]): Map<string, Cours[]> {
  const grouped = new Map<string, Cours[]>();

  cours.forEach(c => {
    if (!grouped.has(c.type_cours)) {
      grouped.set(c.type_cours, []);
    }
    grouped.get(c.type_cours)!.push(c);
  });

  return grouped;
}

/**
 * Trier des cours par date et heure
 */
export function sortCoursByDateTime(cours: Cours[]): Cours[] {
  return [...cours].sort((a, b) => {
    const dateCompare = new Date(a.date_cours).getTime() - new Date(b.date_cours).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.heure_debut.localeCompare(b.heure_debut);
  });
}

/**
 * Filtrer les cours futurs
 */
export function filterCoursFuturs(cours: Cours[]): Cours[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return cours.filter(c => new Date(c.date_cours) >= today);
}

/**
 * Filtrer les cours passés
 */
export function filterCoursPasses(cours: Cours[]): Cours[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return cours.filter(c => new Date(c.date_cours) < today);
}

// ============================================================================
// UTILITAIRES DE CALCUL
// ============================================================================

/**
 * Calculer le taux de présence
 */
export function calculateTauxPresence(presents: number, total: number): number {
  if (total === 0) return 0;
  return parseFloat(((presents / total) * 100).toFixed(2));
}

/**
 * Calculer la durée d'un cours en minutes
 */
export function calculateDureeCours(debut: string, fin: string): number {
  const [hD, mD] = debut.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);

  const minutesDebut = hD * 60 + mD;
  const minutesFin = hF * 60 + mF;

  return minutesFin - minutesDebut;
}

/**
 * Obtenir le nom du jour de la semaine
 */
export function getJourSemaineName(jourNum: number): string {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return jours[jourNum] || '';
}

/**
 * Obtenir le numéro de jour depuis le nom
 */
export function getJourSemaineNumber(jourName: string): number {
  const jours: Record<string, number> = {
    'dimanche': 0,
    'lundi': 1,
    'mardi': 2,
    'mercredi': 3,
    'jeudi': 4,
    'vendredi': 5,
    'samedi': 6,
  };
  return jours[jourName.toLowerCase()] ?? -1;
}

// ============================================================================
// EXPORT GLOBAL
// ============================================================================

export default {
  // Parsers cours
  parseCoursRow,
  parseCoursRows,
  parseCoursAvecProfesseursRow,
  parseCoursAvecProfesseursRows,

  // Parsers cours récurrents
  parseCoursRecurrentRow,
  parseCoursRecurrentRows,
  parseJourDeCoursRow,
  parseJourDeCoursRows,

  // Parsers inscriptions
  parseInscriptionRow,
  parseInscriptionRows,
  parseUtilisateurInscritRow,
  parseUtilisateurInscritRows,

  // Parsers professeurs
  parseProfesseurRow,
  parseProfesseurRows,

  // Parsers semaines
  parseSemaineAvecCoursRow,
  parseSemaineAvecCoursRows,

  // Parsers statistiques
  parseStatistiquesPresenceCoursRow,
  parseStatistiquesPresenceCoursRows,
  parseStatistiquesPresenceUtilisateurRow,
  parseStatistiquesPresenceUtilisateurRows,

  // Utilitaires
  toInt,
  toBool,
  toString,
  parseDate,
  formatHeure,
  formatDateFR,
  formatDateSQL,
  isValidCours,
  isValidInscription,
  isValidHeureFormat,
  isValidPlageHoraire,
  groupCoursByDate,
  groupCoursByType,
  sortCoursByDateTime,
  filterCoursFuturs,
  filterCoursPasses,
  calculateTauxPresence,
  calculateDureeCours,
  getJourSemaineName,
  getJourSemaineNumber,
};
