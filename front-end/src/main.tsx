import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import App from "./App";
import AuthGuard from "./components/auth/AuthGuard";
import { UserProvider } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import { NavigationProvider } from "./context/NavigationContext";
import { apolloClient } from "./lib/apollo/apollo-client";
import logger from "./utils/logger";
import "@patternfly/react-core/dist/styles/base.css";
import "./styles/global.css";
import "./styles/tabs.css";
import "./styles/sidebar.css";
import "./styles/sidebar-initial.css";
import "./styles/cards.css";
import "./styles/panel.css";
import "./styles/modals.css";
import "./styles/forms.css";
import "./styles/tables.css";
import "./styles/participants.css";
import "./styles/professeurs.css";
import "./styles/cours.css";
import "./styles/inscription.css";
import "./styles/dashboard.css";
import "./styles/users.css";
import "./styles/pages.css";
import "./styles/auth-guard.css";

// Configuration Stripe
const STRIPE_PUBLIC_KEY =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  "pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ";

logger.debug(
  "Main",
  "Initialisation Stripe avec clé:",
  STRIPE_PUBLIC_KEY.substring(0, 20) + "...",
);

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY, {
  locale: "fr",
});

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

// Configuration React Query
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

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <NavigationProvider>
            <CartProvider>
              <Elements stripe={stripePromise}>
                <AuthGuard>
                  <App />
                </AuthGuard>
              </Elements>
            </CartProvider>
          </NavigationProvider>
        </UserProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ApolloProvider>
  </React.StrictMode>,
);
