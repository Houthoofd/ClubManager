import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // AJOUTÉ: Chargement explicite des variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')

  // AJOUTÉ: Clé Stripe de référence (correspondant au backend)
  const STRIPE_PUBLIC_KEY_REFERENCE = 'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7';
  
  console.log('🔧 [Vite Config] Configuration:', {
    command,
    mode,
    VITE_STRIPE_PUBLIC_KEY_exists: !!env.VITE_STRIPE_PUBLIC_KEY,
    VITE_STRIPE_PUBLIC_KEY_valid: env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_51R6wB1'),
    VITE_API_BASE_URL: env.VITE_API_BASE_URL,
    using_fallback: !env.VITE_STRIPE_PUBLIC_KEY
  })

  // AJOUTÉ: Déterminer la clé Stripe à utiliser avec validation
  let stripeKey = env.VITE_STRIPE_PUBLIC_KEY;
  
  // Validation et fallback
  if (!stripeKey) {
    console.warn('⚠️ [Vite Config] VITE_STRIPE_PUBLIC_KEY manquant - utilisation clé de référence');
    stripeKey = STRIPE_PUBLIC_KEY_REFERENCE;
  } else if (!stripeKey.startsWith('pk_test_51R6wB1')) {
    console.error('❌ [Vite Config] Clé Stripe incompatible avec le backend !');
    console.error('❌ [Vite Config] Clé trouvée:', stripeKey.substring(0, 20) + '...');
    console.error('❌ [Vite Config] CORRECTION: utilisation clé de référence');
    stripeKey = STRIPE_PUBLIC_KEY_REFERENCE;
  }

  return {
    plugins: [react()],

    // CORRIGÉ: Injection forcée des variables avec validation
    define: {
      // CRITIQUE: Forcer la bonne clé Stripe
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(stripeKey),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || (mode === 'production' ? 'https://clubmanagment.com/' : 'http://localhost:3000/')
      ),
      // AJOUTÉ: Variables de debug
      'import.meta.env.VITE_DEBUG_STRIPE': JSON.stringify(true),
      'import.meta.env.VITE_STRIPE_ACCOUNT': JSON.stringify('51R6wB1AxYwLhmnM2')
    },

    // AJOUTÉ: Configuration du serveur de développement
    server: {
      port: 5173,
      host: true,
      // AJOUTÉ: Variables d'environnement forcées pour le dev
      define: {
        'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(STRIPE_PUBLIC_KEY_REFERENCE)
      }
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
