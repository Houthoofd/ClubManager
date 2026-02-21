/**
 * ====================================================================
 * UI Components - Barrel Export
 * ====================================================================
 *
 * Re-exports all UI primitive components.
 * These are reusable, generic UI components wrapping PatternFly.
 *
 * Usage:
 * ```tsx
 * import { Spinner, Alert, EmptyState, Skeleton } from '@/shared/components/ui';
 * ```
 */

// ============================================================================
// Loading Components
// ============================================================================

export { Spinner, FullPageSpinner } from "./Spinner";
export type { SpinnerProps, SpinnerSize } from "./Spinner";

export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonFormField,
  SkeletonPage,
  SkeletonTable,
  SkeletonStats,
  SkeletonDataList,
  SkeletonGallery,
  SkeletonProfile,
  SkeletonButton,
} from "./Skeleton";
export type { SkeletonProps, SkeletonShape } from "./Skeleton";

// ============================================================================
// Feedback Components
// ============================================================================

export { Alert, SuccessAlert, ErrorAlert, WarningAlert, InfoAlert } from "./Alert";
export type { AlertProps, AlertVariant } from "./Alert";

// ============================================================================
// Empty State Components
// ============================================================================

export { EmptyState, EmptySearchResults, EmptyList } from "./EmptyState";
export type { EmptyStateProps, EmptyStateVariant } from "./EmptyState";

// ============================================================================
// Image Components
// ============================================================================

export { OptimizedImage } from "./OptimizedImage";

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Loading States:
 * ---------------
 * // Simple spinner
 * <Spinner />
 * <Spinner size="lg" text="Loading data..." />
 *
 * // Full page loading
 * <FullPageSpinner text="Loading application..." />
 *
 * // Skeleton placeholders
 * <Skeleton width="200px" height="20px" />
 * <SkeletonText lines={3} />
 * <SkeletonCard />
 * <SkeletonTableRow columns={4} />
 * <SkeletonTable rows={5} columns={4} />
 * <SkeletonStats />
 * <SkeletonDataList items={3} />
 * <SkeletonGallery items={6} columns={3} />
 * <SkeletonProfile />
 * <SkeletonButton size="lg" />
 *
 * Alerts:
 * -------
 * // Basic alert
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved.
 * </Alert>
 *
 * // Convenience wrappers
 * <SuccessAlert title="Saved!" dismissible />
 * <ErrorAlert title="Error" dismissible onDismiss={handleClose}>
 *   Failed to save changes.
 * </ErrorAlert>
 * <WarningAlert title="Warning" timeout={5000} />
 *
 * Empty States:
 * -------------
 * // Custom empty state
 * <EmptyState
 *   icon={SearchIcon}
 *   title="No results"
 *   description="Try adjusting your filters"
 *   primaryAction={<Button onClick={clearFilters}>Clear</Button>}
 * />
 *
 * // Convenience wrappers
 * <EmptySearchResults onClearFilters={handleClear} />
 * <EmptyList entityName="users" onAdd={handleAddUser} />
 *
 * Optimized Images:
 * -----------------
 * // Lazy-loaded image with WebP support
 * <OptimizedImage
 *   src="/images/article.jpg"
 *   alt="Article description"
 *   placeholderSrc="/images/article-thumb.jpg"
 *   responsiveWidths={[400, 800, 1200]}
 *   formats={['webp', 'jpeg']}
 * />
 */
