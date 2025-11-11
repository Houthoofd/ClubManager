import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // AJOUTÉ: Chargement explicite des variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')

  console.log('🔧 [Vite Config] Configuration:', {
    command,
    mode,
    VITE_STRIPE_PUBLIC_KEY_exists: !!env.VITE_STRIPE_PUBLIC_KEY,
    VITE_API_BASE_URL: env.VITE_API_BASE_URL
  })

  return {
    plugins: [react()],

    // AJOUTÉ: Configuration explicite des variables d'environnement
    define: {
      // S'assurer que les variables VITE_ sont disponibles
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(
        env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51R6wB1AxYwLhmnM2kYoAxL3bQkKz5E58oevHMV31eAIPRMPDWrVEI6PKiBUoi1X00MewYIc70kOk7NYw77tl6uMG00D7ylKKV7'
      ),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || (mode === 'production' ? 'https://clubmanagment.com/' : 'http://localhost:3000/')
      )
    },

    // AJOUTÉ: Configuration du serveur de développement
    server: {
      port: 5173,
      host: true
    },

    // AJOUTÉ: Configuration du build
    build: {
      outDir: 'dist',
      sourcemap: false,
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
    envPrefix: ['VITE_', 'REACT_APP_'],
  }
})
