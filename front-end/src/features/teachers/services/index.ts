/**
 * ====================================================================
 * TEACHER SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les services métier liés aux professeurs.
 *
 * Usage:
 * ```tsx
 * import { TeacherService } from '@/features/teachers/services';
 *
 * // Utiliser les fonctions du service
 * const fullName = TeacherService.formatTeacherFullName(teacher);
 * const isAvailable = TeacherService.isAvailableOnDay(teacher, 'LUNDI');
 * const performance = TeacherService.calculateTeacherPerformance(teacher, sessions);
 * ```
 *
 * Ou importer des fonctions spécifiques:
 * ```tsx
 * import { formatRating, getExpertiseLevel, detectScheduleConflicts } from '@/features/teachers/services';
 * ```
 */

// ============================================================================
// Export everything from teacher.service.ts
// ============================================================================

export * from "./teacher.service";
export { default as TeacherService } from "./teacher.service";

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Teacher,
  TeacherStatus,
  TeacherLevel,
  Availability,
  DayOfWeek,
  TeacherSession,
  TeacherPerformance,
  TeacherFilters,
  TeacherStats,
  ScheduleConflict,
} from "./teacher.service";
