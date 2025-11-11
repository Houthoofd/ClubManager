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

// AJOUTÉ: Debug complet des variables d'environnement au démarrage
console.log('🔧 [Main] === DEBUG VARIABLES D\'ENVIRONNEMENT DÉTAILLÉ ===');
console.log('🔧 [Main] import.meta.env COMPLET:', import.meta.env);
console.log('🔧 [Main] NODE_ENV:', import.meta.env.NODE_ENV);
console.log('🔧 [Main] MODE:', import.meta.env.MODE);
console.log('🔧 [Main] PROD:', import.meta.env.PROD);
console.log('🔧 [Main] DEV:', import.meta.env.DEV);
console.log('🔧 [Main] VITE_STRIPE_PUBLIC_KEY:', import.meta.env.VITE_STRIPE_PUBLIC_KEY);
console.log('🔧 [Main] VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('🔧 [Main] VITE_STRIPE_SOURCE:', import.meta.env.VITE_STRIPE_SOURCE);
console.log('🔧 [Main] VITE_ENV_FILE_LOADED:', import.meta.env.VITE_ENV_FILE_LOADED);
console.log('🔧 [Main] Toutes les variables VITE_:', 
  Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((obj, key) => ({ ...obj, [key]: import.meta.env[key] }), {})
);
console.log('🔧 [Main] === FIN DEBUG ===');

// AJOUTÉ: Debug ultra-détaillé avec diagnostic complet
console.log('🔧 [Main] === DEBUG ULTRA-DÉTAILLÉ ===');
console.log('🔧 [Main] import.meta.env COMPLET:', import.meta.env);
console.log('🔧 [Main] Variables Vite détectées:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

// DIAGNOSTIC: Vérification des sources multiples
const stripeKeySources = {
  vite_stripe_public_key: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  vite_stripe_source: import.meta.env.VITE_STRIPE_SOURCE,
  vite_env_file_loaded: import.meta.env.VITE_ENV_FILE_LOADED,
  vite_config_timestamp: import.meta.env.VITE_CONFIG_TIMESTAMP,
  vite_debug_config: import.meta.env.VITE_DEBUG_CONFIG
};

console.log('🔧 [Main] Sources Stripe détectées:', stripeKeySources);

// CORRIGÉ: Forcer la clé compatible avec le backend
const BACKEND_COMPATIBLE_KEY = 'pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ';

let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// FALLBACK 1: Si undefined ou mauvais compte, forcer la clé compatible backend
if (!stripePublicKey || !stripePublicKey.includes('RWzE9BQMqChSZKp')) {
  console.warn('⚠️ [Main] SYNCHRONISATION FORCÉE avec le backend');
  console.warn('⚠️ [Main] Clé actuelle:', stripePublicKey?.substring(0, 25) + '...' || 'UNDEFINED');
  console.warn('⚠️ [Main] Clé backend compatible:', BACKEND_COMPATIBLE_KEY.substring(0, 25) + '...');
  stripePublicKey = BACKEND_COMPATIBLE_KEY;
}

// VÉRIFICATION FINALE: S'assurer de la synchronisation
const backendAccount = 'RWzE9BQMqChSZKp';
const frontendAccount = stripePublicKey.substring(8, 25);

if (frontendAccount !== backendAccount) {
  console.error('❌ [Main] DÉSYNCHRONISATION CRITIQUE détectée !');
  console.error('❌ [Main] Backend compte:', backendAccount);
  console.error('❌ [Main] Frontend compte:', frontendAccount);
  console.error('❌ [Main] CORRECTION FORCÉE');
  stripePublicKey = BACKEND_COMPATIBLE_KEY;
}

console.log('🔧 [Main] Diagnostic Synchronisation FINAL:', {
  keyExists: !!stripePublicKey,
  keyValue: stripePublicKey?.substring(0, 25) + '...',
  keyType: stripePublicKey?.startsWith('pk_test_') ? 'TEST' : 'LIVE',
  frontendAccount: stripePublicKey?.substring(8, 25),
  backendAccount: 'RWzE9BQMqChSZKp',
  synchronized: stripePublicKey?.includes('RWzE9BQMqChSZKp'),
  source: import.meta.env.VITE_STRIPE_SOURCE || 'backend_sync_forced',
  expectedError: stripePublicKey?.includes('RWzE9BQMqChSZKp') ? 'AUCUNE' : 'Invalid API Key'
});

// GARANTIE: À ce stade, stripePublicKey est FORCÉMENT défini et valide
if (!stripePublicKey) {
  console.error('❌ [Main] ÉCHEC CRITIQUE - TOUS les fallbacks ont échoué');
  alert('ERREUR FATALE: Configuration Stripe impossible');
  throw new Error('Configuration Stripe fatalement défaillante');
}

// CORRIGÉ: Initialisation Stripe garantie
console.log('🔧 [Main] Initialisation Stripe GARANTIE avec:', stripePublicKey.substring(0, 25) + '...');
const stripePromise = loadStripe(stripePublicKey, {
  locale: 'fr'
});

// Test immédiat d'initialisation
stripePromise.then((stripe) => {
  if (stripe) {
    console.log('✅ [Main] Stripe chargé AVEC SUCCÈS');
    console.log('✅ [Main] Compte confirmé:', stripePublicKey.substring(8, 25));
  } else {
    console.error('❌ [Main] Échec chargement Stripe avec clé:', stripePublicKey.substring(0, 25) + '...');
  }
}).catch((error) => {
  console.error('❌ [Main] Erreur critique Stripe:', error);
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
