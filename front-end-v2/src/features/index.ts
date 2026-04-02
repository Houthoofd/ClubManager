/**
 * Features Layer - Public API
 *
 * This layer contains business features - user-facing functionality
 * that provides value to the end user. Each feature is self-contained
 * and implements a complete user scenario.
 *
 * Import Restrictions (Feature-Sliced Design):
 * ✅ Can be imported by: app, pages, widgets
 * ✅ Can import from: entities, shared
 * ❌ Cannot import from: app, pages, widgets, other features
 *
 * Features should be independent and not depend on each other.
 *
 * @module features
 *
 * @example
 * ```typescript
 * import { LoginForm, useAuth } from '@features/auth';
 * import { CourseEnrollmentForm } from '@features/course-enrollment';
 * ```
 */

// ============================================================================
// Authentication Feature
// ============================================================================

export {
  // API
  authApi,

  // Hooks
  useAuth,
  useLogin,
  useRegister,
  useLogout,
  useProfile,
  useUpdateProfile,
  useForgotPassword,
  useResetPassword,
  useRefreshToken,
  useRequireAuth,
  useRequireRole,

  // Types
  type LoginCredentials,
  type RegisterData,
  type AuthUser,
  type AuthResponse,
  type UserRole,
  type Permission,
  type ForgotPasswordData,
  type ResetPasswordData,
  type UpdateProfileData,

  // Utilities
  hasRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,

  // UI Components
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm,
} from './auth';

// ============================================================================
// Future Features (to be implemented)
// ============================================================================

// Course Enrollment Feature
// export { CourseEnrollmentForm, useCourseEnrollment } from './course-enrollment';

// Payment Feature
// export { PaymentForm, usePayment } from './payment';

// Profile Management Feature
// export { ProfileEditor, useProfileUpdate } from './profile';

// Notifications Feature
// export { NotificationCenter, useNotifications } from './notifications';
