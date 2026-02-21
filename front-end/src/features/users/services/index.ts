/**
 * ====================================================================
 * USER SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les services métier liés aux utilisateurs.
 *
 * Usage:
 * ```tsx
 * import { UserService } from '@/features/users/services';
 *
 * // Utiliser les fonctions du service
 * const fullName = UserService.formatUserFullName(user);
 * const age = UserService.calculateUserAge(user.dateNaissance);
 * const canDelete = UserService.canDeleteUser(user);
 * ```
 *
 * Ou importer des fonctions spécifiques:
 * ```tsx
 * import { formatUserFullName, calculateUserAge } from '@/features/users/services';
 * ```
 */

// ============================================================================
// Export everything from user.service.ts
// ============================================================================

export * from "./user.service";
export { default as UserService } from "./user.service";

export * from "./user-stats.service";
export { default as UserStatsService } from "./user-stats.service";

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  User,
  UserStatus,
  UserRole,
  Subscription,
  UserFilters,
  UserStats,
  CreateUserInput,
  UpdateUserInput,
} from "./user.service";

export type { AttendanceRecord, AttendanceStats, MonthlyComparison } from "./user-stats.service";
