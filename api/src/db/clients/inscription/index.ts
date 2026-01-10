/**
 * Module Inscription - Export principal
 * Point d'entrée centralisé pour le module inscription
 */

// Repository (principal)
export {
  InscriptionRepository,
  getInscriptionRepository
} from './inscription.repository.js';

// Types
export type {
  // Types principaux
  Cours,
  CoursRecurrent,
  Inscription,
  UtilisateurInscrit,
  Professeur,
  JourDeCours,
  SemaineAvecCours,

  // Statistiques
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,

  // Types composés
  CoursAvecProfesseurs,
  CoursAvecUtilisateurs,

  // Participants
  Participant,

  // Résultats
  VerificationInscription,
  ConfirmationResult,
  SearchResult,
  OperationResult,

  // Types pour opérations
  CreateCoursRecurrentData,
  UpdateCoursRecurrentData,
  CreateCoursData,
  InscriptionData,
  UpdatePresenceData,

  // Types SQL (Rows)
  CoursRow,
  CoursRecurrentRow,
  InscriptionRow,
  UtilisateurInscritRow,
  ProfesseurRow,
  JourDeCoursRow,
  SemaineAvecCoursRow,
  StatistiquesPresenceCoursRow,
  StatistiquesPresenceUtilisateurRow,

  // Options
  CoursFilterOptions,
  InscriptionFilterOptions,
  StatistiquesOptions,

  // Types utilitaires
  UpdatableCoursFields,
  UpdatableCoursRecurrentFields,
  UpdatableInscriptionFields,
} from './types/index.js';

// Enums
export {
  JourSemaine,
  StatusPresence,
  JOURS_MAPPING,
} from './types/index.js';

// Type guards et validateurs
export {
  isValidCours,
  isValidInscription,
  isValidJourSemaine,
  isValidHeureFormat,
  isValidDateCours,
  isValidPresence,
} from './types/index.js';

// Helpers de conversion
export {
  jourToNumber,
  numberToJour,
  formatDateForSQL,
  formatTimeForSQL,
} from './types/index.js';

// Utilitaires (parsers et formatage)
export {
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

  // Utilitaires de conversion
  toInt,
  toBool,
  toString,
  parseDate,

  // Formatage
  formatHeure,
  formatDateFR,
  formatDateSQL,

  // Validation
  isValidPlageHoraire,

  // Transformation
  groupCoursByDate,
  groupCoursByType,
  sortCoursByDateTime,
  filterCoursFuturs,
  filterCoursPasses,

  // Calculs
  calculateTauxPresence,
  calculateDureeCours,
  getJourSemaineName,
  getJourSemaineNumber,
} from './utils/index.js';

// GraphQL (optionnel)
export {
  typeDefs as inscriptionTypeDefs,
  resolvers as inscriptionResolvers,
} from './inscription.graphql.js';

// Queries SQL (pour usage avancé)
export * as queries from './queries/index.js';

/**
 * USAGE RECOMMANDÉ:
 *
 * ```typescript
 * // Import principal (repository)
 * import { getInscriptionRepository } from '@/db/clients/inscription';
 *
 * // Import des types
 * import type { Cours, Inscription } from '@/db/clients/inscription';
 *
 * // Import des utilitaires
 * import { formatDateSQL, parseCoursRow } from '@/db/clients/inscription';
 *
 * // Import GraphQL
 * import { inscriptionTypeDefs, inscriptionResolvers } from '@/db/clients/inscription';
 *
 * // Utilisation
 * const repo = getInscriptionRepository();
 * const cours = await repo.findAllCours();
 * ```
 *
 * NOTES:
 * - Préférer l'import via getInscriptionRepository() (singleton)
 * - Utiliser les types pour la sécurité TypeScript
 * - Les queries SQL sont disponibles mais à utiliser avec précaution
 * - GraphQL typeDefs et resolvers prêts pour Apollo Server
 */

// Default export pour compatibilité
export { getInscriptionRepository as default } from './inscription.repository.js';
