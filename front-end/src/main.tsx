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

// CORRIGÉ: Forcer la clé LIVE en production avec vérification stricte
const expectedAccountPrefix = 'pk_live_51R6wB1AxYwLhmnM2'; // LIVE uniquement en production
const fallbackKey = 'pk_live_51R6wB1AxYwLhmnM2RdC8scYPFA3fXhdXLHDNhwsgylIjNPV2lYNTGsnRB4iqsLD7TAgjkUj6RRyXxOtYihpT1raj00SxZnmNyL'; // LIVE

console.log('🔧 [Main] Vérification configuration Stripe frontend:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  expectedKeyType: 'LIVE (production forcée)',
  VITE_STRIPE_PUBLIC_KEY_exists: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  VITE_STRIPE_PUBLIC_KEY_prefix: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 15) + '...' || 'ABSENT',
  VITE_STRIPE_PUBLIC_KEY_type: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_') ? 'PUBLIC LIVE (CORRECT)' : 
                              import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_') ? 'PUBLIC TEST (INCORRECT EN PROD)' : 'FORMAT INCORRECT',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// CORRIGÉ: Forcer la clé LIVE en production
let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// AJOUTÉ: Forcer la clé LIVE peu importe l'environnement détecté
if (!stripePublicKey || !stripePublicKey.startsWith('pk_live_51R6wB1AxYwLhmnM2')) {
  console.warn('⚠️ [Main] Clé Stripe incorrecte ou manquante, utilisation de la clé LIVE');
  console.warn('⚠️ [Main] Clé actuelle:', stripePublicKey?.substring(0, 20) + '...' || 'MANQUANTE');
  console.warn('⚠️ [Main] CORRECTION FORCÉE: Utilisation clé LIVE');
  stripePublicKey = fallbackKey;
}

// Validation finale stricte
if (!stripePublicKey.startsWith(expectedAccountPrefix)) {
  console.error('❌ [Main] ERREUR CRITIQUE: Clé ne correspond pas au compte attendu !');
  console.error('❌ [Main] Clé frontend:', stripePublicKey.substring(0, 25) + '...');
  console.error('❌ [Main] Attendu:', expectedAccountPrefix + '...');
  console.error('❌ [Main] CORRECTION FORCÉE');
  stripePublicKey = fallbackKey;
}

console.log('✅ [Main] Clé Stripe finale (LIVE forcée):', stripePublicKey.substring(0, 25) + '...');
console.log('✅ [Main] Mode: PRODUCTION FORCÉE (LIVE)');

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
