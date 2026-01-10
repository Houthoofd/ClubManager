/**
 * Module Informations - Point d'entrée principal
 *
 * Ce module gère tous les aspects des informations du club:
 * - Gestion des informations/actualités
 * - Catégorisation et priorités
 * - Publication et archivage
 * - Référentiels (status, genres, grades, plans tarifaires)
 */

// ============================================================================
// EXPORTS PRINCIPAUX
// ============================================================================

/**
 * Classe principale de gestion des informations (legacy)
 * @deprecated Utiliser InformationsRepository à la place
 */
export { Informations } from "./informations.js";

/**
 * Repository pattern pour les informations (recommandé)
 */
export {
  InformationsRepository,
  getInformationsRepository,
} from "./informations.repository.js";

/**
 * Repositories modulaires (nouvelle architecture)
 */
export {
  InformationsReadRepository,
  getInformationsReadRepository,
  InformationsWriteRepository,
  getInformationsWriteRepository,
  InformationsValidationRepository,
  getInformationsValidationRepository,
  InformationsStatisticsRepository,
  getInformationsStatisticsRepository,
  InformationsRepositories,
  getInformationsRepositories,
  getAllInformationsRepositories,
} from "./repositories/index.js";

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Types principaux
  Information,
  InformationAvecRelations,
  Status,
  Genre,
  Grade,
  PlanTarifaire,
  CategorieInformation,

  // Données d'entrée
  CreateInformationData,
  UpdateInformationData,

  // Résultats
  InformationConfirmationResult,
  PaginatedInformationResult,
  InformationStatistiques,
  InformationResume,

  // Filtres
  InformationSearchFilters,
  InformationSortOptions,

  // Historique et tracking
  InformationHistorique,
  InformationNotification,
  InformationVue,

  // Types SQL bruts
  InformationRow,
  InformationAvecRelationsRow,
  StatusRow,
  GenreRow,
  GradeRow,
  PlanTarifaireRow,
  CategorieInformationRow,

  // Statistiques
  CountByCategorie,
  CountByStatus,

  // Référentiels
  Referentiels,
  ReferentielsOptions,

  // Enums
  InformationStatus,
  InformationPriorite,
  InformationTypeContenu,

  // Types utilitaires
  UpdatableInformationFields,
} from "./types.js";

// ============================================================================
// TYPE GUARDS ET VALIDATIONS
// ============================================================================

export {
  isValidInformation,
  isValidTitre,
  isValidContenu,
  isValidPriorite,
  isValidDate,
} from "./types.js";

// ============================================================================
// QUERIES SQL
// ============================================================================

/**
 * Toutes les requêtes SQL du module
 * Pour un usage avancé ou personnalisé
 */
export * as InformationsQueries from "./queries/index.js";

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Utilitaires de parsing et validation
 */
export * as InformationsUtils from "./utils/index.js";

// ============================================================================
// EXEMPLES D'UTILISATION
// ============================================================================

/**
 * @example
 * // Utilisation du repository (recommandé)
 * import { getInformationsRepository } from '@db/clients/informations';
 *
 * const infoRepo = getInformationsRepository();
 * const informations = await infoRepo.findAll();
 *
 * @example
 * // Créer une nouvelle information
 * import { getInformationsRepository } from '@db/clients/informations';
 *
 * const infoRepo = getInformationsRepository();
 * const result = await infoRepo.create({
 *   titre: 'Nouvelle actualité',
 *   contenu: 'Contenu de l\'actualité...',
 *   priorite: 2,
 *   visible: true
 * });
 *
 * @example
 * // Rechercher des informations
 * import { getInformationsRepository } from '@db/clients/informations';
 *
 * const infoRepo = getInformationsRepository();
 * const results = await infoRepo.search({
 *   titre: 'karaté',
 *   priorite_min: 2,
 *   limit: 20
 * });
 *
 * @example
 * // Utilisation de la classe legacy
 * import { Informations } from '@db/clients/informations';
 *
 * const info = new Informations();
 * const toutes = await info.obtenirToutesLesInformations();
 *
 * @example
 * // Import des types
 * import type { Information, CreateInformationData } from '@db/clients/informations';
 *
 * const newInfo: CreateInformationData = {
 *   titre: 'Stage de Karaté',
 *   contenu: 'Inscription ouverte pour le stage...',
 *   priorite: 3,
 *   categorie_id: 1
 * };
 *
 * @example
 * // Utiliser les référentiels
 * import { getInformationsRepository } from '@db/clients/informations';
 *
 * const infoRepo = getInformationsRepository();
 * const status = await infoRepo.getAllStatus();
 * const genres = await infoRepo.getAllGenres();
 * const grades = await infoRepo.getAllGrades();
 * const plans = await infoRepo.getAllPlansTarifaires();
 *
 * @example
 * // Utiliser les repositories modulaires (nouvelle architecture)
 * import { getInformationsRepositories } from '@db/clients/informations';
 *
 * const repos = getInformationsRepositories();
 *
 * // Lecture
 * const informations = await repos.read.findAll();
 * const info = await repos.read.findById(42);
 * const results = await repos.read.search({ page: 1, limit: 20 });
 *
 * // Écriture
 * const newInfo = await repos.write.create(data);
 * await repos.write.update(42, updateData);
 * await repos.write.publish(42);
 *
 * // Validation
 * const validation = await repos.validation.validateForCreation(data);
 * const canEdit = await repos.validation.canUserEdit(userId, infoId);
 *
 * // Statistiques
 * const stats = await repos.statistics.getGeneralStatistics();
 * const trends = await repos.statistics.getTrends(30);
 * const report = await repos.statistics.generateFullReport();
 */
