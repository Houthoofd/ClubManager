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
console.log('🔧 [Main] import.meta.env complet:', import.meta.env);
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

// CORRIGÉ: Une seule déclaration de stripePublicKey avec fallback
let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// SOLUTION DE SECOURS: Si undefined, forcer la clé
if (!stripePublicKey) {
  console.warn('⚠️ [Main] VITE_STRIPE_PUBLIC_KEY undefined - SOLUTION DE SECOURS ACTIVÉE');
  stripePublicKey = 'pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ';
  console.warn('⚠️ [Main] Clé forcée en dur:', stripePublicKey.substring(0, 25) + '...');
}

console.log('🔧 [Main] Diagnostic Stripe FINAL:', {
  keyExists: !!stripePublicKey,
  keyValue: stripePublicKey?.substring(0, 25) + '...' || 'UNDEFINED',
  keyLength: stripePublicKey ? stripePublicKey.length : 0,
  keyType: stripePublicKey ? (
    stripePublicKey.startsWith('pk_test_') ? 'TEST' : 
    stripePublicKey.startsWith('pk_live_') ? 'LIVE' : 'FORMAT INCONNU'
  ) : 'ABSENT',
  source: import.meta.env.VITE_STRIPE_SOURCE || 'hard_coded_fallback'
});

if (!stripePublicKey) {
  console.error('❌ [Main] ÉCHEC TOTAL - Même la solution de secours a échoué !');
  alert('ERREUR CRITIQUE: Impossible de configurer Stripe. Contactez l\'administrateur.');
}

// CORRIGÉ: Une seule déclaration de stripePromise
let stripePromise = null;
if (stripePublicKey) {
  console.log('🔧 [Main] Initialisation Stripe RÉUSSIE avec:', stripePublicKey.substring(0, 25) + '...');
  stripePromise = loadStripe(stripePublicKey, {
    locale: 'fr'
  });
  
  // Test d'initialisation
  stripePromise.then((stripe) => {
    if (stripe) {
      console.log('✅ [Main] Stripe chargé avec succès');
    } else {
      console.error('❌ [Main] Échec du chargement Stripe');
    }
  }).catch((error) => {
    console.error('❌ [Main] Erreur chargement Stripe:', error);
  });
} else {
  console.error('❌ [Main] Stripe NON initialisé - échec complet');
  // Fallback: créer un mock pour éviter les erreurs
  stripePromise = Promise.resolve(null);
}

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
