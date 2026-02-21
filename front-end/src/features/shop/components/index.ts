/**
 * Shop Components - Barrel Export
 *
 * Re-exports all components for the shop feature.
 * Centralizes component imports for cleaner imports elsewhere.
 *
 * Usage:
 *   import { CatalogueMagasin, CheckoutForm, FormulaireArticle } from '@/features/shop/components';
 */

// ============================================================================
// Catalog & Display Components
// ============================================================================

export { default as CatalogueMagasin } from "./CatalogueMagasin";
export { default as ListeArticles } from "./ListeArticles";
export { default as ToolbarMagasin } from "./ToolbarMagasin";

// ============================================================================
// Article Components
// ============================================================================

export { default as FormulaireArticle } from "./FormulaireArticle";
export { default as DetailArticleModal } from "./DetailArticleModal";

// ============================================================================
// Checkout & Payment Components
// ============================================================================

export { default as CheckoutForm } from "./CheckoutForm";
export { default as StripePaymentForm } from "./StripePaymentForm";

// ============================================================================
// Sub-folder Components
// ============================================================================

// Note: magasin and features-shop subfolder components can be added here if needed
// export * from './magasin';
// export * from './features-shop';
