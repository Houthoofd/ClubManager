import React from "react";
import { Alert } from "@patternfly/react-core";
import { env } from "@/core/config";

const StripeKeyDisplay: React.FC = () => {
  const stripeKey = env.stripe.publicKey;

  console.log("🔧 [StripeKeyDisplay] Variables d'environnement complètes:", import.meta.env);
  console.log("🔧 [StripeKeyDisplay] VITE_STRIPE_PUBLIC_KEY:", stripeKey);

  return (
    <Alert
      variant={stripeKey ? "success" : "danger"}
      title="Configuration Stripe Frontend"
      style={{ margin: "10px 0" }}
    >
      <div>
        <strong>VITE_STRIPE_PUBLIC_KEY:</strong> {stripeKey || "UNDEFINED/MANQUANT"}
      </div>
      <div>
        <strong>Longueur:</strong> {stripeKey ? stripeKey.length : 0} caractères
      </div>
      <div>
        <strong>Type:</strong> {env.stripe.isTestMode ? "TEST" : "LIVE"}
      </div>
      <div>
        <strong>Compte:</strong> {env.stripe.account || "N/A"}
      </div>
      <div>
        <strong>Environnement:</strong> {import.meta.env.MODE} (
        {import.meta.env.PROD ? "PRODUCTION" : "DEVELOPMENT"})
      </div>
      <details style={{ marginTop: "10px" }}>
        <summary>Variables VITE_ disponibles:</summary>
        <pre style={{ fontSize: "10px", marginTop: "5px" }}>
          {JSON.stringify(
            Object.keys(import.meta.env)
              .filter((key) => key.startsWith("VITE_"))
              .reduce(
                (obj, key) => {
                  obj[key] = import.meta.env[key];
                  return obj;
                },
                {} as Record<string, any>,
              ),
            null,
            2,
          )}
        </pre>
      </details>
    </Alert>
  );
};

export default StripeKeyDisplay;
