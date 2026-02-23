/**
 * ====================================================================
 * MAIN ENTRY POINT - CLUBMANAGER
 * ====================================================================
 *
 * Point d'entrée principal de l'application React.
 * Simplifié grâce à:
 * - AppProviders: Centralise tous les providers
 * - styles/index.css: Centralise tous les styles
 * - Zustand stores: State management global
 * - i18n: Internationalisation (EN/FR/NL)
 *
 * Architecture:
 * - AppProviders gère tous les contexts (Apollo, React Query, User, Cart, i18n, etc.)
 * - AuthGuard protège l'application et gère l'authentification
 * - App contient le router et la structure principale
 * - Zustand stores gèrent l'état global (auth, cart, UI)
 *
 * ────────────────────────────────────────────────────────────────────
 * 🎉 PHASE 7 - INTERNATIONALISATION (i18n) COMPLÉTÉE !
 * ────────────────────────────────────────────────────────────────────
 *
 * ✅ react-i18next installé et configuré
 * ✅ Support EN, FR, NL (détection auto + persistence)
 * ✅ Traductions complètes (11 namespaces)
 * ✅ TypeScript types pour autocomplete
 * ✅ LanguageSelector component (PatternFly)
 * ✅ Browser language detection
 * ✅ localStorage persistence
 *
 * Usage:
 * - const { t } = useTranslation();
 * - <LanguageSelector variant="compact" />
 * - Documentation: docs/I18N_GUIDE.md
 *
 * ────────────────────────────────────────────────────────────────────
 * 🎉 PHASE 6 - MIGRATION REDUX → ZUSTAND 100% COMPLÉTÉE !
 * ────────────────────────────────────────────────────────────────────
 *
 * ✅ Redux COMPLÈTEMENT supprimé (@reduxjs/toolkit, react-redux)
 * ✅ Zustand actif pour TOUT le state management
 * ✅ Layer de compatibilité SUPPRIMÉ (migration terminée !)
 * ✅ Tous les composants migrés vers Zustand natif
 * ✅ Persistance localStorage automatique
 * ✅ Bundle size réduit (~30KB économisés)
 * ✅ Performance améliorée (moins de re-renders)
 * ✅ Code plus simple et maintenable
 *
 * Stores Zustand actifs:
 * - cartStore (panier) - remplace panierSlice
 * - authStore (authentification) - remplace authSlice
 * - uiStore (notifications, thème)
 *
 * DevTools: window.__STORES__ (console browser)
 * Debug: ZustandDebugger component (dev mode)
 *
 * ────────────────────────────────────────────────────────────────────
 * 🎉 PHASE 5 (PARTIELLE) - SENTRY MONITORING INTÉGRÉ !
 * ────────────────────────────────────────────────────────────────────
 *
 * ✅ Sentry installé (@sentry/react 10.39.0)
 * ✅ Error tracking automatique (production only)
 * ✅ Performance monitoring (10% sample rate)
 * ✅ User context tracking (login/logout)
 * ✅ Session replay sur erreurs
 * ✅ Error Boundary UI personnalisée
 * ✅ Breadcrumbs pour tracer les actions
 *
 * Configuration:
 * - src/core/monitoring/sentry.ts (error tracking)
 * - src/core/monitoring/SentryErrorBoundary.tsx (UI fallback)
 * - src/core/monitoring/README_SENTRY_SETUP.ts (guide complet)
 *
 * Setup requis:
 * 1. Créer compte gratuit sur sentry.io
 * 2. Créer projet React
 * 3. Ajouter VITE_SENTRY_DSN dans .env.production
 * 4. Consulter README_SENTRY_SETUP.ts pour détails
 *
 * Note: En développement, Sentry est désactivé (logs console uniquement)
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./app/providers";
import AuthGuard from "./features/auth/components/AuthGuard";
import App from "./app/App";
import { initializeStores } from "./store";
import { initSentry } from "./core/monitoring/sentry";
import SentryErrorBoundary from "./core/monitoring/SentryErrorBoundary";
import { I18nLoader } from "./core/i18n/I18nLoader";
import { isDev } from "@/core/config/env";
import "./core/i18n/config"; // Initialize i18n BEFORE React
import { displayBundleOptimizationStatus } from "./core/utils/bundleOptimizationStatus";

// ====================================================================
// STYLES
// ====================================================================

// ====================================================================
// INITIALIZATION
// ====================================================================

// Initialize Sentry (error tracking & monitoring)
// DOIT être initialisé AVANT tout le reste pour capturer toutes les erreurs
initSentry();

// Initialize i18n (internationZustand stores (auth migration, theme setup, etc.)
initializeStores();

// Display migration success banner in development
if (isDev) {
  console.log("");

  // Display bundle optimization status
  displayBundleOptimizationStatus();
}

// ====================================================================
// STYLES
// ====================================================================

// PatternFly base styles (UI framework)
import "@patternfly/react-core/dist/styles/base.css";

// Application styles (centralisés)
import "./styles/index.css";

// ====================================================================
// ROOT ELEMENT
// ====================================================================

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

// ====================================================================
// RENDER
// ====================================================================

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <SentryErrorBoundary showDialog={true}>
      <I18nLoader>
        <AppProviders>
          <AuthGuard>
            <App />
          </AuthGuard>
        </AppProviders>
      </I18nLoader>
    </SentryErrorBoundary>
  </React.StrictMode>,
);
