/**
 * Entities Layer - Public API
 *
 * This layer contains business entities - reusable data models and their
 * associated logic that represent core business concepts.
 *
 * Entities are domain-specific and represent the vocabulary of your business.
 * They include data structures, validation logic, and entity-specific operations.
 *
 * Import Restrictions (Feature-Sliced Design):
 * ✅ Can be imported by: app, pages, widgets, features
 * ✅ Can import from: shared
 * ❌ Cannot import from: app, pages, widgets, features
 *
 * @module entities
 *
 * @example
 * ```typescript
 * // Define an entity
 * export interface User {
 *   id: string;
 *   email: string;
 *   name: string;
 *   role: UserRole;
 * }
 *
 * // Export from entities/user
 * export { User, type UserRole } from './user';
 * ```
 */

// ============================================================================
// User Entity
// ============================================================================

// export { User, type UserRole, type UserPermission } from './user';
// export { useUser, useUserQuery } from './user';

// ============================================================================
// Course Entity
// ============================================================================

// export { Course, type CourseStatus, type CourseLevel } from './course';
// export { useCourse, useCourseQuery } from './course';

// ============================================================================
// Member Entity
// ============================================================================

// export { Member, type MemberStatus, type MembershipTier } from './member';
// export { useMember, useMemberQuery } from './member';

// ============================================================================
// Session Entity
// ============================================================================

// export { Session, type SessionStatus } from './session';
// export { useSession, useSessionQuery } from './session';

/**
 * Note: Entities are typically created as needed when implementing features.
 *
 * Structure for each entity:
 * entities/
 * └── user/
 *     ├── model/
 *     │   ├── types.ts        # Entity types and interfaces
 *     │   └── validation.ts   # Entity validation logic
 *     ├── api/
 *     │   └── userApi.ts     # Entity-specific API calls
 *     ├── lib/
 *     │   └── helpers.ts     # Entity utility functions
 *     └── index.ts           # Public API
 */
