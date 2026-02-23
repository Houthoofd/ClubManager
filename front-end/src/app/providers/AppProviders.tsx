/**
 * ====================================================================
 * APP PROVIDERS - CLUBMANAGER
 * ====================================================================
 *
 * Composant centralisé qui regroupe tous les providers de l'application.
 * Cela simplifie main.tsx et facilite la maintenance des providers.
 *
 * Providers inclus:
 * - ApolloProvider: Client GraphQL (queries, mutations, cache)
 * - UserProvider: Gestion de l'utilisateur connecté
 * - NavigationProvider: Gestion de la navigation
 * - CartProvider: Gestion du panier
 *
 * ⚡ Optimisations:
 * - Stripe retiré des providers globaux (lazy loading sur pages paiement)
 * - React Query retiré (utilisation exclusive d'Apollo Client pour data fetching)
 *
 * Usage:
 * ```tsx
 * <AppProviders>
 *   <AuthGuard>
 *     <App />
 *   </AuthGuard>
 * </AppProviders>
 * ```
 */

import React, { ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/core/api/apollo/apollo-client";
import { UserProvider } from "./UserProvider";
import { CartProvider } from "./CartProvider";
import { NavigationProvider } from "./NavigationProvider";

// ====================================================================
// TYPES
// ====================================================================

interface AppProvidersProps {
  children: ReactNode;
}

// ====================================================================
// COMPONENT
// ====================================================================

/**
 * AppProviders - Centralise tous les providers de l'application
 *
 * @param {ReactNode} children - Composants enfants
 * @returns {JSX.Element}
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ApolloProvider client={apolloClient}>
      <UserProvider>
        <NavigationProvider>
          <CartProvider>{children}</CartProvider>
        </NavigationProvider>
      </UserProvider>
    </ApolloProvider>
  );
};

// ====================================================================
// EXPORTS
// ====================================================================

export default AppProviders;

// Re-export des providers individuels pour faciliter les imports
export { UserProvider } from "./UserProvider";
export { CartProvider } from "./CartProvider";
export { NavigationProvider } from "./NavigationProvider";
