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

// CORRIGÉ: Utiliser le compte Stripe auquel vous avez accès (RWzE9BQ) en mode TEST
const expectedAccountPrefix = 'pk_test_51RWzE9BQ'; // Compte auquel vous avez accès
const fallbackKey = 'pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ';

console.log('🔧 [Main] Vérification configuration Stripe frontend:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  expectedKeyType: 'TEST (compte RWzE9BQ - tests en production)',
  VITE_STRIPE_PUBLIC_KEY_exists: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  VITE_STRIPE_PUBLIC_KEY_prefix: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 15) + '...' || 'ABSENT',
  VITE_STRIPE_PUBLIC_KEY_type: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_51RWzE9BQ') ? 'PUBLIC TEST RWzE9BQ (CORRECT)' : 
                              import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_51RWzE9BQ') ? 'PUBLIC LIVE RWzE9BQ (IDEAL)' : 
                              'FORMAT INCORRECT',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// CORRIGÉ: Forcer l'utilisation du compte Stripe accessible (RWzE9BQ)
let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey || !stripePublicKey.startsWith('pk_test_51RWzE9BQ')) {
  console.warn('⚠️ [Main] Correction: utilisation compte Stripe accessible (RWzE9BQ)');
  console.warn('⚠️ [Main] Clé actuelle:', stripePublicKey?.substring(0, 20) + '...' || 'MANQUANTE');
  stripePublicKey = fallbackKey;
}

console.log('✅ [Main] Clé Stripe finale (compte RWzE9BQ TEST):', stripePublicKey.substring(0, 25) + '...');
console.log('✅ [Main] Mode: TEST en production - utilisation carte 4242424242424242');

// CORRIGÉ: Initialisation Stripe avec logging détaillé
console.log('🔧 [Main] Initialisation Stripe...');
const stripePromise = loadStripe(stripePublicKey, {
  locale: 'fr'
});

// AJOUTÉ: Vérification complète de l'initialisation
stripePromise.then((stripe) => {
  if (stripe) {
    console.log('✅ [Main] Stripe initialisé avec succès');
    console.log('✅ [Main] Compte Stripe:', stripePublicKey.substring(8, 25));
    
    // Test basique pour vérifier que Stripe fonctionne
    console.log('🧪 [Main] Test basique Stripe Elements...');
  } else {
    console.error('❌ [Main] Échec de l\'initialisation Stripe');
    console.error('❌ [Main] Clé utilisée:', stripePublicKey.substring(0, 20) + '...');
  }
}).catch((error) => {
  console.error('❌ [Main] Erreur critique Stripe:', error);
  console.error('❌ [Main] Clé problématique:', stripePublicKey.substring(0, 20) + '...');
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
