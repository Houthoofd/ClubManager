/**
 * ====================================================================
 * APP PROVIDERS - BARREL EXPORT
 * ====================================================================
 *
 * Re-exports all application-level context providers.
 * These providers wrap the entire application and provide global state/context.
 *
 * Usage:
 * ```tsx
 * // Import individual providers
 * import { UserProvider, CartProvider } from '@/app/providers';
 *
 * // Import combined provider (recommended)
 * import { AppProviders } from '@/app/providers';
 *
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
 */

// ====================================================================
// INDIVIDUAL PROVIDERS
// ====================================================================

export { CartProvider, CartContext, useCart } from "./CartProvider";
export { UserProvider, UserContext, useUser } from "./UserProvider";
export { NavigationProvider, NavigationContext, useNavigation } from "./NavigationProvider";

// ====================================================================
// COMBINED PROVIDER
// ====================================================================

/**
 * AppProviders - Combines all providers in the correct order
 *
 * This is the recommended way to set up providers in the application.
 * It includes:
 * - ApolloProvider (GraphQL)
 * - QueryClientProvider (React Query)
 * - UserProvider (User state)
 * - NavigationProvider (Navigation state)
 * - CartProvider (Shopping cart state)
 * - Elements (Stripe payments)
 * - ReactQueryDevtools (Development only)
 */
export { AppProviders, default as default } from "./AppProviders";
