/**
 * ====================================================================
 * COURSE SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les services métier liés aux cours/séances.
 *
 * Usage:
 * ```tsx
 * import { CourseService } from '@/features/courses/services';
 *
 * // Utiliser les fonctions du service
 * const timeSlot = CourseService.formatSessionTimeSlot(session);
 * const isAvailable = CourseService.canEnrollInSession(session);
 * const occupancy = CourseService.getOccupancyRate(session);
 * ```
 *
 * Ou importer des fonctions spécifiques:
 * ```tsx
 * import { formatSessionDate, isSessionFull } from '@/features/courses/services';
 * ```
 */

// ============================================================================
// Export everything from course.service.ts
// ============================================================================

export * from './course.service';
export { default as CourseService } from './course.service';

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Course,
  Session,
  CourseType,
  CourseLevel,
  SessionStatus,
  SessionFilters,
  SessionStats,
} from './course.service';
