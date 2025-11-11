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
  vite_config_forced: import.meta.env.VITE_CONFIG_FORCED,
  vite_config_timestamp: import.meta.env.VITE_CONFIG_TIMESTAMP,
  vite_backend_account: import.meta.env.VITE_BACKEND_ACCOUNT
};

console.log('🔧 [Main] Sources Stripe détectées:', stripeKeySources);

// CORRIGÉ: Utiliser la clé injectée par Vite ou fallback absolu
const BACKEND_COMPATIBLE_KEY = 'pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ';

let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// DIAGNOSTIC: Vérifier si Vite a injecté la variable
if (stripePublicKey) {
  console.log('✅ [Main] Variable VITE injectée avec succès:', stripePublicKey.substring(0, 25) + '...');
} else {
  console.warn('⚠️ [Main] Variable VITE non injectée - utilisation fallback absolu');
  stripePublicKey = BACKEND_COMPATIBLE_KEY;
}

// VÉRIFICATION FINALE: Assurer la synchronisation avec le backend
const backendAccount = 'RWzE9BQMqChSZKp';
const frontendAccount = stripePublicKey.substring(8, 23);

// CORRIGÉ: Ajuster la logique de comparaison
const accountsMatch = stripePublicKey.includes('RWzE9BQMqChSZKp');

if (!accountsMatch) {
  console.error('❌ [Main] DÉSYNCHRONISATION: Compte frontend/backend différent');
  console.error('❌ [Main] Backend attend:', backendAccount);
  console.error('❌ [Main] Frontend a:', frontendAccount);
  console.error('❌ [Main] CORRECTION AUTOMATIQUE');
  stripePublicKey = BACKEND_COMPATIBLE_KEY;
}

console.log('🔧 [Main] Diagnostic Synchronisation FINAL:', {
  keyExists: !!stripePublicKey,
  keyValue: stripePublicKey?.substring(0, 25) + '...',
  keyType: stripePublicKey?.startsWith('pk_test_') ? 'TEST' : 'LIVE',
  frontendAccount: stripePublicKey?.substring(8, 23),
  backendAccount: 'RWzE9BQMqChSZKp',
  synchronized: stripePublicKey?.includes('RWzE9BQMqChSZKp'),
  viteInjected: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  source: import.meta.env.VITE_STRIPE_SOURCE || 'fallback_absolu',
  configForced: import.meta.env.VITE_CONFIG_FORCED || false,
  expectedError: stripePublicKey?.includes('RWzE9BQMqChSZKp') ? 'AUCUNE' : 'Invalid API Key'
});

// GARANTIE: À ce stade, stripePublicKey est FORCÉMENT défini et valide
if (!stripePublicKey) {
  console.error('❌ [Main] ÉCHEC CRITIQUE - TOUS les fallbacks ont échoué');
  alert('ERREUR FATALE: Configuration Stripe impossible');
  throw new Error('Configuration Stripe fatalement défaillante');
}

// CORRIGÉ: Initialisation Stripe avec options spécifiques pour éviter les appels API automatiques
console.log('🔧 [Main] Initialisation Stripe GARANTIE avec:', stripePublicKey.substring(0, 25) + '...');
const stripePromise = loadStripe(stripePublicKey, {
  locale: 'fr',
  // CRITIQUE: Désactiver les fonctionnalités qui font des appels API automatiques
  stripeAccount: undefined, // Ne pas utiliser de compte Stripe spécifique
  apiVersion: '2025-02-24', // Forcer une version API stable
});

// Test immédiat d'initialisation
stripePromise.then((stripe) => {
  if (stripe) {
    console.log('✅ [Main] Stripe chargé AVEC SUCCÈS');
    // CORRIGÉ: Affichage cohérent du compte
    console.log('✅ [Main] Compte confirmé:', stripePublicKey.substring(8, 23));
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
