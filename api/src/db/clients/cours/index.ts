/**
 * Module Cours - Point d'entrée principal
 *
 * Ce module gère tous les aspects des cours de karaté:
 * - Cours ponctuels et récurrents
 * - Inscriptions et présences
 * - Planning hebdomadaire
 * - Statistiques de présence
 * - Gestion des professeurs
 */

// ============================================================================
// EXPORTS PRINCIPAUX
// ============================================================================

/**
 * Classe principale de gestion des cours (legacy)
 * @deprecated Utiliser CoursRepository à la place
 */
export { Cours } from './cours.js';

/**
 * Repository pattern pour les cours (recommandé)
 */
export { CoursRepository, getCoursRepository } from './cours.repository.js';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Types principaux
  Cours as CoursType,
  CoursAvecProfesseurs,
  CoursAvecUtilisateurs,
  CoursRecurrent,
  JourDeCours,
  Professeur,
  UtilisateurParticipant,
  Inscription,
  Semaine,

  // Statistiques
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,
  DisponibiliteCours,
  ResumeHebdomadaire,

  // Données d'entrée
  CreateCoursRecurrentData,
  UpdateCoursRecurrentData,
  CreateCoursData,
  InscriptionData,

  // Résultats
  VerificationInscription,
  CoursConfirmationResult,

  // Filtres
  CoursSearchFilters,
  InscriptionSearchFilters,

  // Types SQL bruts
  CoursRow,
  CoursRecurrentRow,
  InscriptionRow,
  ProfesseurRow,
  UtilisateurParticipantRow,
  JourDeCoursRow,
  StatistiquesRow,

  // Résultats paginés
  PaginatedCoursResult,
  PaginatedInscriptionResult,

  // Enums
  JourSemaine,
  InscriptionStatus,
  TypeCours,
} from './types.js';

// ============================================================================
// CONSTANTES
// ============================================================================

export { JOURS_MAPPING, JOURS_NAMES } from './types.js';

// ============================================================================
// TYPE GUARDS ET VALIDATIONS
// ============================================================================

export {
  isValidCours,
  isValidTimeFormat,
  isValidDate,
  isValidJourSemaine,
} from './types.js';

// ============================================================================
// QUERIES SQL
// ============================================================================

/**
 * Toutes les requêtes SQL du module
 * Pour un usage avancé ou personnalisé
 */
export * as CoursQueries from './queries/index.js';

// ============================================================================
// GRAPHQL
// ============================================================================

/**
 * Schémas et resolvers GraphQL
 */
export { coursTypeDefs, coursResolvers } from '../../../graphql/cours/index.js';

// ============================================================================
// EXEMPLES D'UTILISATION
// ============================================================================

/**
 * @example
 * // Utilisation du repository (recommandé)
 * import { getCoursRepository } from '@db/clients/cours';
 *
 * const coursRepo = getCoursRepository();
 * const cours = await coursRepo.findAll();
 *
 * @example
 * // Utilisation de la classe legacy
 * import { Cours } from '@db/clients/cours';
 *
 * const coursClient = new Cours();
 * const joursDeCours = await coursClient.obtenirLesJoursDeCours();
 *
 * @example
 * // Import des types
 * import type { CoursType, CreateCoursRecurrentData } from '@db/clients/cours';
 *
 * const newCours: CreateCoursRecurrentData = {
 *   jour_semaine: 1, // Lundi
 *   type_cours: 'Karaté',
 *   heure_debut: '18:00',
 *   heure_fin: '19:30',
 *   professeurs: ['Dupont', 'Martin']
 * };
 */
