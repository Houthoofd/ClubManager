import React, { Suspense, lazy } from "react";
import { Spinner } from "@patternfly/react-core";

// Lazy load Stripe (~150KB)
const StripeProviderLazy = lazy(() => import("./StripeProvider"));

interface StripeProviderProps {
  children: React.ReactNode;
}

/**
 * Wrapper lazy-loaded pour StripeProvider
 *
 * Charge @stripe/react-stripe-js + @stripe/stripe-js (~150KB) uniquement
 * quand l'utilisateur accède aux pages de paiement/checkout
 *
 * @example
 * ```tsx
 * // Dans AppProviders.tsx
 * <StripeProvider>
 *   <Routes />
 * </StripeProvider>
 * ```
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <Spinner size="lg" aria-label="Chargement du système de paiement..." />
        </div>
      }
    >
      <StripeProviderLazy>{children}</StripeProviderLazy>
    </Suspense>
  );
};

export default StripeProvider;
