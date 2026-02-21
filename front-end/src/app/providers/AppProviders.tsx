/**
 * ====================================================================
 * APP PROVIDERS - CLUBMANAGER
 * ====================================================================
 *
 * Composant centralisé qui regroupe tous les providers de l'application.
 * Cela simplifie main.tsx et facilite la maintenance des providers.
 *
 * Providers inclus:
 * - ApolloProvider: Client GraphQL
 * - QueryClientProvider: React Query pour le caching
 * - UserProvider: Gestion de l'utilisateur connecté
 * - NavigationProvider: Gestion de la navigation
 * - CartProvider: Gestion du panier
 * - Elements: Stripe pour les paiements
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { apolloClient } from "@/core/api/apollo/apollo-client";
import { env } from "@/core/config";
import { UserProvider } from "./UserProvider";
import { CartProvider } from "./CartProvider";
import { NavigationProvider } from "./NavigationProvider";
import logger from "@/shared/utils/logger";

// ====================================================================
// CONFIGURATION STRIPE
// ====================================================================

logger.debug(
  "AppProviders",
  "Initialisation Stripe avec clé:",
  env.stripe.publicKey.substring(0, 20) + "...",
);

const stripePromise = loadStripe(env.stripe.publicKey, {
  locale: "fr",
});

// Log Stripe initialization
stripePromise
  .then((stripe) => {
    if (stripe) {
      logger.success("Stripe initialisé avec succès");
    } else {
      logger.error("Échec initialisation Stripe");
    }
  })
  .catch((error) => {
    logger.error("Erreur Stripe:", error);
  });

// ====================================================================
// CONFIGURATION REACT QUERY
// ====================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

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
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <NavigationProvider>
            <CartProvider>
              <Elements stripe={stripePromise}>
                {children}
                {/* React Query Devtools (visible uniquement en dev) */}
                <ReactQueryDevtools initialIsOpen={false} />
              </Elements>
            </CartProvider>
          </NavigationProvider>
        </UserProvider>
      </QueryClientProvider>
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
