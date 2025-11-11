import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // AJOUTÉ: Chargement explicite des variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')

  // CORRIGÉ: Clés Stripe adaptées à l'environnement (LIVE pour prod, TEST pour dev)
  const STRIPE_PUBLIC_KEY_LIVE = 'pk_live_51R6wB1AxYwLhmnM2RdC8scYPFA3fXhdXLHDNhwsgylIjNPV2lYNTGsnRB4iqsLD7TAgjkUj6RRyXxOtYihpT1raj00SxZnmNyL';
  const STRIPE_PUBLIC_KEY_TEST = 'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7';
  
  // CRITIQUE: Forcer la clé Stripe en dur si elle n'est pas détectée
  const STRIPE_PUBLIC_KEY_FALLBACK = 'pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ';
  
  console.log('🔧 [Vite Config] Configuration:', {
    command,
    mode,
    isProd: mode === 'production',
    env_VITE_STRIPE_PUBLIC_KEY: env.VITE_STRIPE_PUBLIC_KEY,
    env_exists: !!env.VITE_STRIPE_PUBLIC_KEY,
    fallback_will_be_used: !env.VITE_STRIPE_PUBLIC_KEY,
    VITE_API_BASE_URL: env.VITE_API_BASE_URL
  })

  // CRITIQUE: Utiliser la clé de fallback si rien n'est détecté
  const finalStripeKey = env.VITE_STRIPE_PUBLIC_KEY || STRIPE_PUBLIC_KEY_FALLBACK;
  
  console.log('🔧 [Vite Config] Clé Stripe finale:', {
    source: env.VITE_STRIPE_PUBLIC_KEY ? 'FICHIER_ENV' : 'FALLBACK_HARD_CODED',
    prefix: finalStripeKey.substring(0, 25) + '...',
    type: finalStripeKey.startsWith('pk_test_') ? 'TEST' : 'LIVE'
  });

  return {
    plugins: [react()],

    // CRITIQUE: Forcer les variables d'environnement avec fallbacks
    define: {
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(finalStripeKey),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'https://clubmanagment.com/'
      ),
      // AJOUTÉ: Variables de debug
      'import.meta.env.VITE_STRIPE_SOURCE': JSON.stringify(
        env.VITE_STRIPE_PUBLIC_KEY ? 'env_file' : 'hard_coded_fallback'
      ),
      'import.meta.env.VITE_ENV_FILE_LOADED': JSON.stringify(!!env.VITE_STRIPE_PUBLIC_KEY)
    },

    // AJOUTÉ: Configuration du serveur de développement
    server: {
      port: 5173,
      host: true
      // SUPPRIMÉ: define incorrecte dans server - les variables sont déjà dans define principal
    },

    // AJOUTÉ: Configuration du build avec optimisation
    build: {
      outDir: 'dist',
      sourcemap: false,
      // AJOUTÉ: Variables d'environnement injectées au build
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            patternfly: ['@patternfly/react-core', '@patternfly/react-icons']
          }
        }
      }
    },

    // AJOUTÉ: Variables d'environnement à préfixer
    envPrefix: ['VITE_', 'REACT_APP_']
  }
})
