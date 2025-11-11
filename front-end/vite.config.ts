import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // AJOUTÉ: Chargement explicite des variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')

  // CRITIQUE: Clé Stripe de secours - SYNCHRONISÉE avec le backend (RWzE9BQ)
  const STRIPE_PUBLIC_KEY_BACKEND_SYNC = 'pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ';
  
  console.log('🔧 [Vite Config] Synchronisation avec backend:', {
    backend_secret_account: 'RWzE9BQMqChSZKp', // Détecté dans les logs
    frontend_public_account: STRIPE_PUBLIC_KEY_BACKEND_SYNC.substring(8, 25),
    accounts_match: STRIPE_PUBLIC_KEY_BACKEND_SYNC.includes('RWzE9BQMqChSZKp'),
    env_VITE_STRIPE_PUBLIC_KEY: env.VITE_STRIPE_PUBLIC_KEY,
    will_force_sync: true
  });

  // CRITIQUE: FORCER la synchronisation avec le backend
  const finalStripeKey = STRIPE_PUBLIC_KEY_BACKEND_SYNC; // Toujours utiliser la clé synchronisée
  
  console.log('🔧 [Vite Config] Clé Stripe FORCÉE pour synchronisation:', {
    source: 'FORCED_BACKEND_SYNC',
    prefix: finalStripeKey.substring(0, 25) + '...',
    type: finalStripeKey.startsWith('pk_test_') ? 'TEST' : 'LIVE',
    account: finalStripeKey.substring(8, 25),
    backend_compatible: finalStripeKey.includes('RWzE9BQMqChSZKp')
  });

  return {
    plugins: [react()],

    // CRITIQUE: Forcer la clé synchronisée avec le backend
    define: {
      // FORCE: Clé Stripe synchronisée avec le backend
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(finalStripeKey),
      
      // FORCE: API Base URL
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://clubmanagment.com/'),
      
      // FORCE: Variables de debug avec info sync
      'import.meta.env.VITE_STRIPE_SOURCE': JSON.stringify('backend_sync_forced'),
      'import.meta.env.VITE_BACKEND_ACCOUNT': JSON.stringify('RWzE9BQMqChSZKp'),
      'import.meta.env.VITE_SYNC_TIMESTAMP': JSON.stringify(new Date().toISOString()),
      'import.meta.env.VITE_DEBUG_CONFIG': JSON.stringify(true)
    },

    // AJOUTÉ: Variables d'environnement à préfixer (incluant tous les formats possibles)
    envPrefix: ['VITE_', 'REACT_APP_', 'VUE_APP_'],

    // AJOUTÉ: Configuration explicite pour le serveur de développement
    server: {
      port: 5173,
      host: true
    },

    // AJOUTÉ: Configuration du build avec clé forcée
    build: {
      outDir: 'dist',
      sourcemap: false,
      // CRITIQUE: Forcer la clé synchronisée dans le build
      define: {
        'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(finalStripeKey),
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://clubmanagment.com/'),
        'import.meta.env.VITE_STRIPE_SOURCE': JSON.stringify('build_backend_sync')
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            patternfly: ['@patternfly/react-core', '@patternfly/react-icons']
          }
        }
      }
    }
  }
})
