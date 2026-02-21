/**
 * Orders Components - Barrel Export
 *
 * Re-exports all components for the orders feature.
 * Centralizes component imports for cleaner imports elsewhere.
 *
 * Usage:
 *   import { TableauCommandes, FiltrageCommandes, StatistiquesCommandes } from '@/features/orders/components';
 */

// ============================================================================
// Orders Display Components
// ============================================================================

export { default as TableauCommandes } from './TableauCommandes';

// ============================================================================
// Orders Filtering
// ============================================================================

export { default as FiltrageCommandes } from './FiltrageCommandes';

// ============================================================================
// Orders Statistics
// ============================================================================

export { default as StatistiquesCommandes } from './StatistiquesCommandes';

// ============================================================================
// Sub-folder Components
// ============================================================================

// Note: commandes subfolder components can be added here if needed
// export * from './commandes';
