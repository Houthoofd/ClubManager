import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // AJOUTÉ: Chargement explicite des variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')

  // CORRIGÉ: Clés Stripe adaptées à l'environnement (LIVE pour prod, TEST pour dev)
  const STRIPE_PUBLIC_KEY_LIVE = 'pk_live_51R6wB1AxYwLhmnM2RdC8scYPFA3fXhdXLHDNhwsgylIjNPV2lYNTGsnRB4iqsLD7TAgjkUj6RRyXxOtYihpT1raj00SxZnmNyL';
  const STRIPE_PUBLIC_KEY_TEST = 'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7';
  
  console.log('🔧 [Vite Config] Configuration:', {
    command,
    mode,
    isProd: mode === 'production',
    VITE_STRIPE_PUBLIC_KEY_exists: !!env.VITE_STRIPE_PUBLIC_KEY,
    VITE_STRIPE_PUBLIC_KEY_type: env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_') ? 'LIVE' : 
                                env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_') ? 'TEST' : 'UNKNOWN',
    expectedForMode: mode === 'production' ? 'LIVE' : 'TEST',
    VITE_API_BASE_URL: env.VITE_API_BASE_URL
  })

  // AJOUTÉ: Déterminer la clé Stripe selon l'environnement
  let stripeKey = env.VITE_STRIPE_PUBLIC_KEY;
  
  // Validation et fallback selon l'environnement
  if (!stripeKey) {
    console.warn(`⚠️ [Vite Config] VITE_STRIPE_PUBLIC_KEY manquant - utilisation clé ${mode === 'production' ? 'LIVE' : 'TEST'}`);
    stripeKey = mode === 'production' ? STRIPE_PUBLIC_KEY_LIVE : STRIPE_PUBLIC_KEY_TEST;
    
  } else if (mode === 'production' && !stripeKey.startsWith('pk_live_')) {
    console.error('❌ [Vite Config] ERREUR: Clé TEST en mode PRODUCTION !');
    console.error('❌ [Vite Config] Clé trouvée:', stripeKey.substring(0, 20) + '...');
    console.error('❌ [Vite Config] CORRECTION: utilisation clé LIVE');
    stripeKey = STRIPE_PUBLIC_KEY_LIVE;
    
  } else if (mode !== 'production' && !stripeKey.startsWith('pk_test_')) {
    console.warn('⚠️ [Vite Config] ATTENTION: Clé LIVE en mode DÉVELOPPEMENT');
    console.warn('⚠️ [Vite Config] Clé trouvée:', stripeKey.substring(0, 20) + '...');
    // En développement, on peut garder la clé LIVE si elle est explicitement définie
  }

  return {
    plugins: [react()],

    // CORRIGÉ: Injection des bonnes clés selon l'environnement
    define: {
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(stripeKey),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || (mode === 'production' ? 'https://clubmanagment.com/' : 'http://localhost:3000/')
      ),
      // AJOUTÉ: Variables de debug pour l'environnement
      'import.meta.env.VITE_STRIPE_MODE': JSON.stringify(stripeKey.startsWith('pk_live_') ? 'live' : 'test'),
      'import.meta.env.VITE_ENVIRONMENT_MODE': JSON.stringify(mode)
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
