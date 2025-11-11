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

// CORRIGÉ: Vérification pour les clés LIVE en production
const expectedAccountPrefix = import.meta.env.PROD ? 'pk_live_51R6wB1AxYwLhmnM2' : 'pk_test_51R6wB1AxYwLhmnM2';
const fallbackKey = import.meta.env.PROD ? 
  'pk_live_51R6wB1AxYwLhmnM2RdC8scYPFA3fXhdXLHDNhwsgylIjNPV2lYNTGsnRB4iqsLD7TAgjkUj6RRyXxOtYihpT1raj00SxZnmNyL' :
  'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7';

console.log('🔧 [Main] Vérification configuration Stripe frontend:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  expectedKeyType: import.meta.env.PROD ? 'LIVE' : 'TEST',
  VITE_STRIPE_PUBLIC_KEY_exists: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  VITE_STRIPE_PUBLIC_KEY_prefix: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 15) + '...' || 'ABSENT',
  VITE_STRIPE_PUBLIC_KEY_type: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_') ? 'PUBLIC LIVE (PROD)' : 
                              import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_') ? 'PUBLIC TEST (DEV)' : 'FORMAT INCORRECT',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// CORRIGÉ: Configuration Stripe avec fallback pour LIVE/TEST selon l'environnement
let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// AJOUTÉ: Système de fallback adapté à l'environnement
if (!stripePublicKey) {
  console.warn('⚠️ [Main] VITE_STRIPE_PUBLIC_KEY manquant, utilisation du fallback...');
  stripePublicKey = fallbackKey;
  console.log('✅ [Main] Clé Stripe fallback utilisée pour', import.meta.env.PROD ? 'PRODUCTION' : 'DÉVELOPPEMENT');
}

// Validation finale selon l'environnement
if (import.meta.env.PROD && !stripePublicKey.startsWith('pk_live_')) {
  console.error('❌ [Main] ERREUR CRITIQUE: Clé TEST utilisée en PRODUCTION !');
  console.error('❌ [Main] Clé actuelle:', stripePublicKey.substring(0, 20) + '...');
  
  // Force la clé LIVE correcte
  console.warn('🔧 [Main] CORRECTION FORCÉE - utilisation de la clé LIVE');
  stripePublicKey = fallbackKey;
  
} else if (!import.meta.env.PROD && !stripePublicKey.startsWith('pk_test_')) {
  console.warn('⚠️ [Main] ATTENTION: Clé LIVE utilisée en DÉVELOPPEMENT');
  console.warn('⚠️ [Main] Clé actuelle:', stripePublicKey.substring(0, 20) + '...');
}

// AJOUTÉ: Vérification finale de compatibilité selon l'environnement
if (!stripePublicKey.startsWith(expectedAccountPrefix)) {
  console.error('❌ [Main] ERREUR CRITIQUE: Incompatibilité entre clés frontend/backend !');
  console.error('❌ [Main] Clé frontend:', stripePublicKey.substring(0, 25) + '...');
  console.error('❌ [Main] Attendu pour', import.meta.env.PROD ? 'PRODUCTION' : 'DÉVELOPPEMENT', ':', expectedAccountPrefix + '...');
  console.error('❌ [Main] Cela CAUSERA des erreurs "Invalid API Key" !');
  
  // Force la clé correcte selon l'environnement
  console.warn('🔧 [Main] CORRECTION FORCÉE - utilisation de la clé compatible');
  stripePublicKey = fallbackKey;
}

console.log('✅ [Main] Clé Stripe finale sélectionnée:', stripePublicKey.substring(0, 25) + '...');
console.log('✅ [Main] Mode:', import.meta.env.PROD ? 'PRODUCTION (LIVE)' : 'DÉVELOPPEMENT (TEST)');

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
