import React, { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { env } from "@/core/config";

interface StripeProviderProps {
  children: React.ReactNode;
}

/**
 * StripeProvider - Eager Implementation
 *
 * Fournit le contexte Stripe pour les paiements.
 * Charge Stripe SDK (~150KB) au démarrage.
 *
 * ⚠️ Ce fichier est utilisé via lazy loading dans StripeProvider.lazy.tsx
 * pour éviter de charger Stripe dans le bundle initial.
 *
 * @see {@link StripeProvider.lazy.tsx} pour l'implémentation lazy-loaded
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Initialiser Stripe avec la clé publique
  const stripePromise = useMemo(() => {
    const key = env.stripe.publicKey;

    if (!key) {
      console.warn(
        "[StripeProvider] Aucune clé Stripe configurée. Les paiements ne fonctionneront pas.",
      );
      return null;
    }

    return loadStripe(key);
  }, []);

  // Si pas de clé Stripe, on retourne juste les enfants sans le provider
  if (!stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        // Options par défaut pour l'apparence
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0066cc",
          },
        },
        // Langue française par défaut
        locale: "fr",
      }}
    >
      {children}
    </Elements>
  );
};

export default StripeProvider;
