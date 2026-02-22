/**
 * ====================================================================
 * I18N CONFIGURATION - ClubManager Front-End
 * ====================================================================
 *
 * Configuration i18next pour support multilingue (EN/FR/NL)
 *
 * FEATURES:
 * ✅ Détection automatique langue navigateur
 * ✅ Persistence localStorage ('clubmanager_language')
 * ✅ ~700 traductions par langue
 * ✅ 13 namespaces organisés (common, auth, shop, courses, etc.)
 * ✅ TypeScript autocomplete
 * ✅ Fallback automatique vers EN
 *
 * LANGUES SUPPORTÉES:
 * - en: English (par défaut)
 * - fr: Français
 * - nl: Nederlands
 *
 * USAGE BASIQUE:
 * ```tsx
 * import { useTranslation } from 'react-i18next';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   return <button>{t('common.actions.save')}</button>;
 * }
 * ```
 *
 * INTERPOLATION:
 * ```tsx
 * <p>{t('shop.cart.itemsCount', { count: 5 })}</p>
 * // EN: "5 items" | FR: "5 articles" | NL: "5 items"
 * ```
 *
 * CHANGER DE LANGUE:
 * ```tsx
 * import { changeLanguage } from '@/core/i18n';
 * await changeLanguage('fr'); // Français
 * ```
 *
 * COMPOSANT LANGUAGE SELECTOR:
 * ```tsx
 * import { LanguageSelector } from '@/shared/components/LanguageSelector';
 * <LanguageSelector variant="compact" /> // Intégré dans Header.tsx
 * ```
 *
 * NAMESPACES DISPONIBLES:
 * - common: actions, labels, status, messages, time, pagination
 * - navigation: menu, breadcrumbs, footer
 * - auth: login, register, profile, roles, permissions
 * - shop: products, cart, checkout, categories
 * - courses: list, details, create, edit, levels
 * - users: list, details, fields
 * - messages: inbox, compose, notifications
 * - orders: list, details, status, actions
 * - stats: dashboard, metrics, charts
 * - teachers: list, details
 * - errors: generic, form, boundary
 * - validation: form validation rules
 * - language: language selector labels
 *
 * AJOUTER UNE TRADUCTION:
 * 1. Ajouter clé dans locales/en/index.ts
 * 2. Ajouter traduction dans locales/fr/index.ts
 * 3. Ajouter traduction dans locales/nl/index.ts
 * 4. Utiliser: t('namespace.key')
 *
 * ⚠️ IMPORTANT: Toujours ajouter dans LES 3 LANGUES !
 *
 * DÉTECTION & PERSISTENCE:
 * Ordre: localStorage → navigator.language → htmlTag → 'en'
 * Clé storage: 'clubmanager_language'
 * Auto-update <html lang="...">
 *
 * DEBUG MODE:
 * Activé en DEV (import.meta.env.DEV)
 * Logs clés manquantes dans console
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { logger } from "@/core/utils/appLogger";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { nl } from "./locales/nl";

// ====================================================================
// CONFIGURATION
// ====================================================================

const SUPPORTED_LANGUAGES = ["en", "fr", "nl"] as const;
const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "clubmanager_language";

// ====================================================================
// RESOURCES
// ====================================================================

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  nl: { translation: nl },
};

// ====================================================================
// INITIALIZATION
// ====================================================================

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,

    // Default language
    fallbackLng: DEFAULT_LANGUAGE,

    // Supported languages
    supportedLngs: [...SUPPORTED_LANGUAGES],

    // Language detection order
    detection: {
      // Order of language detection
      order: [
        "localStorage", // Check localStorage first
        "navigator", // Then browser language
        "htmlTag", // Then <html lang="...">
      ],

      // Cache user language selection
      caches: ["localStorage"],

      // localStorage key
      lookupLocalStorage: STORAGE_KEY,

      // Don't lookup from query string or cookie (security)
      lookupQuerystring: undefined,
      lookupCookie: undefined,
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Namespace configuration
    defaultNS: "translation",
    ns: ["translation"],

    // React options
    react: {
      useSuspense: false, // Disable suspense for now
    },

    // Development options
    debug: import.meta.env.DEV,

    // Load all languages at once (small app)
    load: "languageOnly",

    // Missing key handler
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (import.meta.env.DEV) {
        logger.warn(
          `🌍 [i18n] Missing translation key: "${key}" for languages: ${lngs.join(", ")}`,
        );
      }
    },
  });

// ====================================================================
// HELPERS
// ====================================================================

/**
 * Change application language
 */
export const changeLanguage = async (language: (typeof SUPPORTED_LANGUAGES)[number]) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    logger.error(`🌍 [i18n] Unsupported language: ${language}`);
    return;
  }

  await i18n.changeLanguage(language);

  // Update HTML lang attribute
  document.documentElement.lang = language;

  // Log in development
  if (import.meta.env.DEV) {
    logger.info(`🌍 [i18n] Language changed to: ${language}`);
  }
};

/**
 * Get current language
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || DEFAULT_LANGUAGE;
};

/**
 * Check if language is supported
 */
export const isLanguageSupported = (language: string): boolean => {
  return SUPPORTED_LANGUAGES.includes(language as any);
};

/**
 * Get all supported languages
 */
export const getSupportedLanguages = () => {
  return SUPPORTED_LANGUAGES;
};

// ====================================================================
// EXPORTS
// ====================================================================

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, STORAGE_KEY };
export default i18n;
