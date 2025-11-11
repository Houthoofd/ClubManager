import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import App from './App';
import AuthGuard from './components/auth/AuthGuard';
import store from './redux/store';
import '@patternfly/react-core/dist/styles/base.css';
import './styles/global.css';
import './styles/tabs.css';
import './styles/sidebar.css';
import './styles/sidebar-initial.css';
import './styles/cards.css';
import './styles/panel.css';
import './styles/modals.css';
import './styles/forms.css';
import './styles/tables.css';
import './styles/participants.css';
import './styles/professeurs.css';
import './styles/cours.css';
import './styles/inscription.css';
import './styles/dashboard.css';
import './styles/users.css';
import './styles/pages.css';
import './styles/auth-guard.css';

// CORRIGÉ: Vérification et configuration Stripe avec logs détaillés
console.log('🔧 [Main] Vérification configuration Stripe frontend:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  VITE_STRIPE_PUBLIC_KEY_exists: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  VITE_STRIPE_PUBLIC_KEY_prefix: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 15) + '...' || 'ABSENT',
  VITE_STRIPE_PUBLIC_KEY_type: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_') ? 'PUBLIC (CORRECT)' : 'FORMAT INCORRECT',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
});

// CORRIGÉ: Validation stricte de la clé publique
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  console.error('❌ [Main] ERREUR CRITIQUE: VITE_STRIPE_PUBLIC_KEY manquant');
  console.error('❌ [Main] Variables d\'environnement disponibles:', import.meta.env);
  throw new Error('Configuration Stripe manquante - VITE_STRIPE_PUBLIC_KEY requis');
}

if (!stripePublicKey.startsWith('pk_')) {
  console.error('❌ [Main] ERREUR CRITIQUE: VITE_STRIPE_PUBLIC_KEY ne commence pas par "pk_"');
  console.error('❌ [Main] Clé actuelle:', stripePublicKey.substring(0, 20) + '...');
  throw new Error('Configuration Stripe incorrecte - clé publique invalide');
}

// AJOUTÉ: Vérification que la clé correspond au même compte que le backend
const expectedAccountPrefix = 'pk_test_51R6wB1AxYwLhmnM2'; // Doit correspondre au backend
if (!stripePublicKey.startsWith(expectedAccountPrefix)) {
  console.warn('⚠️ [Main] ATTENTION: La clé publique ne correspond pas au compte backend attendu');
  console.warn('⚠️ [Main] Clé publique:', stripePublicKey.substring(0, 25) + '...');
  console.warn('⚠️ [Main] Attendu:', expectedAccountPrefix + '...');
  console.warn('⚠️ [Main] Cela peut causer des erreurs "Invalid API Key"');
}

// CORRIGÉ: Initialisation Stripe avec configuration restrictive
console.log('🔧 [Main] Initialisation Stripe avec clé publique...');
const stripePromise = loadStripe(stripePublicKey, {
  // CORRIGÉ: Configuration valide pour loadStripe
  locale: 'fr'
  // SUPPRIMÉ: appearance - cette option n'existe pas dans loadStripe
});

// AJOUTÉ: Vérification de l'initialisation
stripePromise.then((stripe) => {
  if (stripe) {
    console.log('✅ [Main] Stripe initialisé avec succès côté frontend');
  } else {
    console.error('❌ [Main] Échec de l\'initialisation Stripe');
  }
}).catch((error) => {
  console.error('❌ [Main] Erreur lors de l\'initialisation Stripe:', error);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Elements stripe={stripePromise}>
          <AuthGuard>
            <App />
          </AuthGuard>
        </Elements>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
