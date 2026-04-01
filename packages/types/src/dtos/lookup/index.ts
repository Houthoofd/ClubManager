/**
 * @fileoverview Lookup Tables DTOs
 * @module @clubmanager/types/dtos/lookup
 *
 * Data Transfer Objects for the Lookup tables module.
 * Re-exports types from validators for API request/response structures.
 */

// ============================================================================
// GENRE DTOs
// ============================================================================

export type {
  CreateGenre,
  UpdateGenre,
  GenreResponse,
  GenresListResponse,
  GenreStats,
  ListGenresQuery,
} from '../../validators/lookup/genre.validators.js';

// ============================================================================
// GRADE DTOs
// ============================================================================

export type {
  CreateGrade,
  UpdateGrade,
  GradeResponse,
  GradesListResponse,
  GradeStats,
  GradeProgression,
  ListGradesQuery,
  GradesByOrderRangeQuery,
} from '../../validators/lookup/grade.validators.js';

// ============================================================================
// STATUS DTOs
// ============================================================================

export type {
  CreateStatus,
  UpdateStatus,
  StatusResponse,
  StatusesListResponse,
  StatusStats,
  ListStatusesQuery,
} from '../../validators/lookup/status.validators.js';
