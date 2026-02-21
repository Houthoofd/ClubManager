/**
 * Shared Hooks - Barrel Export
 *
 * Re-exports hooks from features and shared utilities.
 * This provides a centralized import location for all hooks.
 *
 * Usage:
 *   import { useAuth, useToast } from '@/shared/hooks';
 */

// ============================================================================
// Auth Hooks
// ============================================================================
// Re-export from auth feature when hooks are consolidated
// export * from "@/features/auth/hooks";

// ============================================================================
// Utility Hooks - Generic/Reusable Hooks
// ============================================================================

export * from "./utils";

// ============================================================================
// Feature-Specific Hooks
// ============================================================================
// These should be imported directly from features, not through shared
// Example: import { useOrders } from '@/features/orders/hooks';

/**
 * NOTE: Feature-specific hooks should be imported directly from their features:
 *
 * Auth:      import { ... } from '@/features/auth/hooks';
 * Courses:   import { ... } from '@/features/courses/hooks';
 * Messages:  import { ... } from '@/features/messages/hooks';
 * Orders:    import { ... } from '@/features/orders/hooks';
 * Shop:      import { ... } from '@/features/shop/hooks';
 * Stats:     import { ... } from '@/features/stats/hooks';
 * Teachers:  import { ... } from '@/features/teachers/hooks';
 * Users:     import { ... } from '@/features/users/hooks';
 */
