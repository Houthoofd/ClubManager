/**
 * Pages Layer - Public API
 *
 * This layer contains page components that represent entire application screens.
 * Each page composes widgets, features, and entities to create complete user interfaces.
 *
 * Import Restrictions (Feature-Sliced Design):
 * ✅ Can import from: widgets, features, entities, shared
 * ✅ Can be imported by: app (router)
 * ❌ Cannot import from: app
 * ❌ Cannot import from other pages
 *
 * @module pages
 *
 * @example
 * ```typescript
 * import { LoginPage } from '@pages/auth';
 * import { DashboardPage } from '@pages/dashboard';
 * import { CoursesPage } from '@pages/courses';
 * ```
 */

// ============================================================================
// Authentication Pages
// ============================================================================

export { LoginPage } from './auth/LoginPage';
export { RegisterPage } from './auth/RegisterPage';
export { ForgotPasswordPage } from './auth/ForgotPasswordPage';
export { ResetPasswordPage } from './auth/ResetPasswordPage';

// ============================================================================
// Dashboard Pages
// ============================================================================

// export { DashboardPage } from './dashboard/DashboardPage';

// ============================================================================
// Course Pages
// ============================================================================

// export { CoursesPage } from './courses/CoursesPage';
// export { CourseDetailPage } from './courses/CourseDetailPage';
// export { CourseEnrollmentPage } from './courses/CourseEnrollmentPage';

// ============================================================================
// Member Pages
// ============================================================================

// export { MembersPage } from './members/MembersPage';
// export { MemberDetailPage } from './members/MemberDetailPage';

// ============================================================================
// Error Pages
// ============================================================================

// export { NotFoundPage } from './errors/NotFoundPage';
// export { UnauthorizedPage } from './errors/UnauthorizedPage';
// export { ServerErrorPage } from './errors/ServerErrorPage';
