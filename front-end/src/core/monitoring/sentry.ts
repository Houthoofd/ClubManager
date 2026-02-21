/**
 * ====================================================================
 * SENTRY ERROR TRACKING & MONITORING
 * ====================================================================
 *
 * Configuration de Sentry pour le monitoring d'erreurs en production.
 *
 * Features:
 * - 🐛 Error tracking automatique
 * - 📊 Performance monitoring
 * - 👤 User context (qui est impacté)
 * - 🌐 Session replay (optionnel)
 * - 📈 Release tracking
 *
 * Environnements:
 * - Development: Désactivé (logs console uniquement)
 * - Production: Activé avec tous les features
 */

import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Sentry DSN (Data Source Name)
 * À configurer dans les variables d'environnement
 */
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";

/**
 * Environment (development, staging, production)
 */
const ENVIRONMENT = import.meta.env.MODE || "development";

/**
 * Release version (pour tracking des déploiements)
 */
const RELEASE = import.meta.env.VITE_APP_VERSION || "1.0.0";

/**
 * Sample rates (0.0 à 1.0)
 */
const TRACES_SAMPLE_RATE = import.meta.env.PROD ? 0.1 : 1.0; // 10% en prod, 100% en dev
const REPLAYS_SESSION_SAMPLE_RATE = import.meta.env.PROD ? 0.1 : 0.0; // 10% en prod
const REPLAYS_ON_ERROR_SAMPLE_RATE = 1.0; // 100% des sessions avec erreur

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialise Sentry avec la configuration appropriée
 */
export function initSentry(): void {
  // Ne pas initialiser en développement si pas de DSN
  if (!SENTRY_DSN && !import.meta.env.PROD) {
    console.log("ℹ️ [Sentry] Désactivé en développement (pas de DSN configuré)");
    return;
  }

  // Vérifier que le DSN est configuré en production
  if (import.meta.env.PROD && !SENTRY_DSN) {
    console.error("❌ [Sentry] DSN manquant en production !");
    return;
  }

  try {
    Sentry.init({
      // DSN de votre projet Sentry
      dsn: SENTRY_DSN,

      // Environnement (dev, staging, prod)
      environment: ENVIRONMENT,

      // Version de l'application (pour tracking des releases)
      release: `clubmanager@${RELEASE}`,

      // Intégrations
      integrations: [
        // React Router integration pour le tracking de navigation
        Sentry.reactRouterV6BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),

        // Session Replay pour rejouer les sessions avec erreurs
        Sentry.replayIntegration({
          maskAllText: true, // Masquer le texte pour la confidentialité
          blockAllMedia: true, // Bloquer les médias
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: TRACES_SAMPLE_RATE,

      // Session Replay
      replaysSessionSampleRate: REPLAYS_SESSION_SAMPLE_RATE,
      replaysOnErrorSampleRate: REPLAYS_ON_ERROR_SAMPLE_RATE,

      // Filtrer les erreurs connues/non critiques
      beforeSend(event, hint) {
        // Ignorer les erreurs de réseau temporaires
        if (event.exception?.values?.[0]?.type === "NetworkError") {
          return null;
        }

        // Ignorer les erreurs de timeout
        if (event.message?.includes("timeout")) {
          return null;
        }

        // Ignorer les erreurs de cancel (requêtes annulées)
        if (event.message?.includes("cancel")) {
          return null;
        }

        return event;
      },

      // Ignorer certaines erreurs par pattern
      ignoreErrors: [
        // Erreurs navigateur
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",

        // Erreurs réseau
        "Network request failed",
        "Failed to fetch",

        // Erreurs extension navigateur
        "chrome-extension://",
        "moz-extension://",
      ],

      // Ne pas envoyer de PII (Personally Identifiable Information)
      sendDefaultPii: false,

      // Activer en production uniquement
      enabled: import.meta.env.PROD,
    });

    console.log("✅ [Sentry] Initialisé avec succès");
    console.log(`   Environment: ${ENVIRONMENT}`);
    console.log(`   Release: ${RELEASE}`);
    console.log(`   Traces Sample Rate: ${TRACES_SAMPLE_RATE * 100}%`);
  } catch (error) {
    console.error("❌ [Sentry] Erreur lors de l'initialisation:", error);
  }
}

// ============================================================================
// USER CONTEXT
// ============================================================================

/**
 * Interface pour le contexte utilisateur
 */
export interface SentryUser {
  id: string | number;
  email?: string;
  username?: string;
  role?: string;
}

/**
 * Définir le contexte utilisateur pour Sentry
 * Permet d'identifier qui est impacté par les erreurs
 */
export function setSentryUser(user: SentryUser | null): void {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.username,
    // Custom attributes
    role: user.role,
  });

  console.log("👤 [Sentry] User context set:", user.id);
}

/**
 * Nettoyer le contexte utilisateur (lors du logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
  console.log("🚪 [Sentry] User context cleared");
}

// ============================================================================
// CUSTOM CONTEXT
// ============================================================================

/**
 * Ajouter du contexte custom pour mieux comprendre les erreurs
 */
export function setSentryContext(key: string, context: Record<string, any>): void {
  Sentry.setContext(key, context);
}

/**
 * Ajouter un tag pour filtrer les erreurs
 */
export function setSentryTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

// ============================================================================
// ERROR CAPTURE
// ============================================================================

/**
 * Capturer une erreur manuellement
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capturer un message (warning, info)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
): void {
  Sentry.captureMessage(message, level);
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

/**
 * Ajouter un breadcrumb (chemin de navigation) pour tracer les actions
 */
export function addBreadcrumb(
  message: string,
  category: string = "user-action",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, any>,
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Démarrer une transaction pour mesurer la performance
 */
export function startTransaction(name: string, op: string = "custom"): Sentry.Span | undefined {
  return Sentry.startSpan({ name, op }, (span) => span);
}

/**
 * Mesurer la performance d'une fonction
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  return await Sentry.startSpan({ name, op: "function" }, async () => {
    return await fn();
  });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifier si Sentry est activé
 */
export function isSentryEnabled(): boolean {
  return import.meta.env.PROD && !!SENTRY_DSN;
}

/**
 * Obtenir le client Sentry (pour usage avancé)
 */
export function getSentryClient() {
  return Sentry;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  init: initSentry,
  setUser: setSentryUser,
  clearUser: clearSentryUser,
  setContext: setSentryContext,
  setTag: setSentryTag,
  captureError,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  measurePerformance,
  isEnabled: isSentryEnabled,
  client: Sentry,
};
