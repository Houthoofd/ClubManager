/**
 * Users Components - Barrel Export
 *
 * Re-exports all components for the users feature.
 * Centralizes component imports for cleaner imports elsewhere.
 *
 * Usage:
 *   import { FormulaireUtilisateur, StatistiquesUtilisateur } from '@/features/users/components';
 */

// ============================================================================
// User Forms
// ============================================================================

export { default as FormulaireUtilisateur } from './FormulaireUtilisateur';
export { default as FormulaireUtilisateurAjout } from './FormulaireUtilisateurAjout';

// ============================================================================
// User Tabs
// ============================================================================

export { default as OngletAjoutUtilisateur } from './OngletAjoutUtilisateur';
export { default as OngletTableauUtilisateurs } from './OngletTableauUtilisateurs';

// ============================================================================
// User Statistics & Info
// ============================================================================

export { default as EcheancesPaiement } from './EcheancesPaiement';
export { default as StatistiquesUtilisateur } from './StatistiquesUtilisateur';

// ============================================================================
// Sub-folder Components
// ============================================================================

// Note: utilisateurs subfolder components can be added here if needed
// export * from './utilisateurs';
