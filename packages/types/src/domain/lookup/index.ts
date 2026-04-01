/**
 * @fileoverview Lookup Tables Domain Types
 * @module @clubmanager/types/domain/lookup
 *
 * Domain types for the Lookup tables module.
 * Re-exports types inferred from Zod validators for consistency.
 */

// ============================================================================
// GENRE TYPES
// ============================================================================

export type {
  Genre,
  CreateGenre,
  UpdateGenre,
  GenreResponse,
  GenresListResponse,
  GenreStats,
} from '../../validators/lookup/genre.validators.js';

// ============================================================================
// GRADE TYPES
// ============================================================================

export type {
  Grade,
  CreateGrade,
  UpdateGrade,
  GradeResponse,
  GradesListResponse,
  GradeStats,
  GradeProgression,
} from '../../validators/lookup/grade.validators.js';

// ============================================================================
// STATUS TYPES
// ============================================================================

export type {
  Status,
  CreateStatus,
  UpdateStatus,
  StatusResponse,
  StatusesListResponse,
  StatusStats,
} from '../../validators/lookup/status.validators.js';
