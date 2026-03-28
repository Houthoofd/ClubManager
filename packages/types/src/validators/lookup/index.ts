/**
 * @fileoverview Lookup Tables Validators Index
 * @module @clubmanager/types/validators/lookup
 *
 * Central export point for all Lookup tables validators.
 * Exports schemas and types for genres, grades, and status.
 */

// ============================================================================
// GENRE VALIDATORS
// ============================================================================

export {
  // Schemas
  genreBaseSchema,
  createGenreSchema,
  updateGenreSchema,
  listGenresSchema,
  genreIdSchema,
  genreIdStringSchema,
  genreIdParamSchema,
  genreResponseSchema,
  genresListResponseSchema,
  genreStatsSchema,
  // Types
  type Genre,
  type CreateGenre,
  type UpdateGenre,
  type ListGenresQuery,
  type GenreIdParam,
  type GenreResponse,
  type GenresListResponse,
  type GenreStats,
} from './genre.validators.js';

// ============================================================================
// GRADE VALIDATORS
// ============================================================================

export {
  // Schemas
  gradeBaseSchema,
  createGradeSchema,
  updateGradeSchema,
  listGradesSchema,
  gradesByOrderRangeSchema,
  gradeIdSchema,
  gradeIdStringSchema,
  gradeIdParamSchema,
  gradeResponseSchema,
  gradesListResponseSchema,
  gradeStatsSchema,
  gradeProgressionSchema,
  // Types
  type Grade,
  type CreateGrade,
  type UpdateGrade,
  type ListGradesQuery,
  type GradesByOrderRangeQuery,
  type GradeIdParam,
  type GradeResponse,
  type GradesListResponse,
  type GradeStats,
  type GradeProgression,
} from './grade.validators.js';

// ============================================================================
// STATUS VALIDATORS
// ============================================================================

export {
  // Schemas
  statusBaseSchema,
  createStatusSchema,
  updateStatusSchema,
  listStatusesSchema,
  statusIdSchema,
  statusIdStringSchema,
  statusIdParamSchema,
  statusResponseSchema,
  statusesListResponseSchema,
  statusStatsSchema,
  // Types
  type Status,
  type CreateStatus,
  type UpdateStatus,
  type ListStatusesQuery,
  type StatusIdParam,
  type StatusResponse,
  type StatusesListResponse,
  type StatusStats,
} from './status.validators.js';
