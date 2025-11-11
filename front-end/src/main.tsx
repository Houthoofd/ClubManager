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
console.log('🔧 [Main] === DEBUG VARIABLES D\'ENVIRONNEMENT ===');
console.log('🔧 [Main] NODE_ENV:', import.meta.env.NODE_ENV);
console.log('🔧 [Main] MODE:', import.meta.env.MODE);
console.log('🔧 [Main] PROD:', import.meta.env.PROD);
console.log('🔧 [Main] DEV:', import.meta.env.DEV);
console.log('🔧 [Main] VITE_STRIPE_PUBLIC_KEY:', import.meta.env.VITE_STRIPE_PUBLIC_KEY);
console.log('🔧 [Main] VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('🔧 [Main] Toutes les variables VITE_:', 
  Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((obj, key) => ({ ...obj, [key]: import.meta.env[key] }), {})
);
console.log('🔧 [Main] === FIN DEBUG ===');

// CORRIGÉ: Diagnostic complet avant initialisation Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

console.log('🔧 [Main] Diagnostic Stripe:', {
  keyExists: !!stripePublicKey,
  keyValue: stripePublicKey || 'UNDEFINED',
  keyLength: stripePublicKey ? stripePublicKey.length : 0,
  keyType: stripePublicKey ? (
    stripePublicKey.startsWith('pk_test_') ? 'TEST' : 
    stripePublicKey.startsWith('pk_live_') ? 'LIVE' : 'FORMAT INCONNU'
  ) : 'ABSENT'
});

if (!stripePublicKey) {
  console.error('❌ [Main] CRITIQUE: VITE_STRIPE_PUBLIC_KEY est undefined !');
  console.error('❌ [Main] Vérifications à effectuer:');
  console.error('  1. Le fichier .env.production existe-t-il ?');
  console.error('  2. Contient-il VITE_STRIPE_PUBLIC_KEY=... ?');
  console.error('  3. Le serveur a-t-il été redémarré après modification ?');
  console.error('  4. Le build a-t-il été refait ?');
  
  alert('ERREUR: Clé Stripe non configurée. Vérifiez la console pour plus de détails.');
}

// CORRIGÉ: Initialisation Stripe seulement si la clé existe
let stripePromise = null;
if (stripePublicKey) {
  console.log('🔧 [Main] Initialisation Stripe avec clé:', stripePublicKey.substring(0, 25) + '...');
  stripePromise = loadStripe(stripePublicKey, {
    locale: 'fr'
  });
} else {
  console.error('❌ [Main] Stripe NON initialisé - clé manquante');
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
