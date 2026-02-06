/**
 * Index des validators du module statistiques
 * Exporte tous les schémas de validation pour faciliter les imports
 */

export {
  utilisateurIdSchema,
  userIdSchema,
  getFrequentationSchema,
  getProgressionSchema,
  getPresenceSchema,
  getPresenceRawSchema,
  emptyParamsSchema,
  paginationSchema,
  dateRangeSchema,
  type UtilisateurIdData,
  type UserIdData,
  type GetFrequentationData,
  type GetProgressionData,
  type GetPresenceData,
  type GetPresenceRawData,
  type EmptyParamsData,
  type PaginationData,
  type DateRangeData,
} from './statistiques.schema.js';
