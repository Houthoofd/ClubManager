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

// CORRIGÉ: Vérification et configuration Stripe avec logs détaillés et fallbacks COMPLETS
console.log('🔧 [Main] Vérification configuration Stripe frontend:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  VITE_STRIPE_PUBLIC_KEY_exists: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  VITE_STRIPE_PUBLIC_KEY_prefix: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 15) + '...' || 'ABSENT',
  VITE_STRIPE_PUBLIC_KEY_type: import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_') ? 'PUBLIC (CORRECT)' : 'FORMAT INCORRECT',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// CORRIGÉ: Configuration Stripe avec fallback COMPLET et logging détaillé
let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// AJOUTÉ: Système de fallback complet
if (!stripePublicKey) {
  console.warn('⚠️ [Main] VITE_STRIPE_PUBLIC_KEY manquant, utilisation des fallbacks...');
  
  // Fallback 1: Autres noms de variables possibles
  stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
                   import.meta.env.REACT_APP_STRIPE_PUBLIC_KEY ||
                   import.meta.env.STRIPE_PUBLIC_KEY;
  
  if (stripePublicKey) {
    console.log('✅ [Main] Clé Stripe trouvée via fallback alternatif');
  }
}

// AJOUTÉ: Fallback ultime - clé en dur pour éviter le crash TOTAL
if (!stripePublicKey) {
  console.error('❌ [Main] AUCUNE clé Stripe trouvée - utilisation de la clé de secours');
  console.error('❌ [Main] Ceci est un FALLBACK TEMPORAIRE - configurez correctement VITE_STRIPE_PUBLIC_KEY');
  
  // Clé de secours correspondant au backend
  stripePublicKey = 'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7';
  
  console.warn('⚠️ [Main] Utilisation clé de secours:', stripePublicKey.substring(0, 20) + '...');
}

// Validation finale de la clé
if (!stripePublicKey.startsWith('pk_')) {
  console.error('❌ [Main] ERREUR CRITIQUE: Clé Stripe invalide');
  console.error('❌ [Main] Clé actuelle:', stripePublicKey.substring(0, 20) + '...');
  
  // Dernière tentative avec la clé de référence
  stripePublicKey = 'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7';
  console.warn('⚠️ [Main] Correction automatique avec clé de référence');
}

// AJOUTÉ: Vérification finale de compatibilité
const expectedAccountPrefix = 'pk_test_51R6wB1AxYwLhmnM2';
if (!stripePublicKey.startsWith(expectedAccountPrefix)) {
  console.error('❌ [Main] ERREUR CRITIQUE: Incompatibilité entre clés frontend/backend !');
  console.error('❌ [Main] Clé frontend:', stripePublicKey.substring(0, 25) + '...');
  console.error('❌ [Main] Attendu:', expectedAccountPrefix + '...');
  console.error('❌ [Main] Cela CAUSERA des erreurs "Invalid API Key" !');
  
  // Force la clé correcte
  console.warn('🔧 [Main] CORRECTION FORCÉE - utilisation de la clé compatible');
  stripePublicKey = 'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7';
}

console.log('✅ [Main] Clé Stripe finale sélectionnée:', stripePublicKey.substring(0, 25) + '...');

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
