import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // CRITIQUE: Clé Stripe forcée directement sans dépendre des fichiers .env
  const STRIPE_PUBLIC_KEY_FORCE = 'pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ';
  const API_BASE_URL_FORCE = 'https://clubmanagment.com/';
  
  console.log('🔧 [Vite Config] CONFIGURATION FORCÉE:', {
    command,
    mode,
    stripe_key_forced: STRIPE_PUBLIC_KEY_FORCE.substring(0, 25) + '...',
    api_url_forced: API_BASE_URL_FORCE,
    account: STRIPE_PUBLIC_KEY_FORCE.substring(8, 23),
    type: 'TEST (synchronisé avec backend)'
  });

  return {
    plugins: [react()],

    // CRITIQUE: Forcer TOUTES les variables directement via define
    define: {
      // FORCE ABSOLUE: Variables injectées directement dans le code
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(STRIPE_PUBLIC_KEY_FORCE),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(API_BASE_URL_FORCE),
      'import.meta.env.VITE_STRIPE_SOURCE': JSON.stringify('vite_config_forced'),
      'import.meta.env.VITE_BACKEND_ACCOUNT': JSON.stringify('RWzE9BQMqChSZKp'),
      'import.meta.env.VITE_CONFIG_FORCED': JSON.stringify(true),
      'import.meta.env.VITE_CONFIG_TIMESTAMP': JSON.stringify(new Date().toISOString()),
      'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode)
    },

    server: {
      port: 5173,
      host: true
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      // CRITIQUE: Même variables forcées pour le build
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
