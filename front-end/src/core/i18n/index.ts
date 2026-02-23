/**
 * ====================================================================
 * I18N MODULE - CENTRALIZED EXPORTS
 * ====================================================================
 *
 * Centralized exports for i18n functionality.
 * Import everything you need from this single entry point.
 *
 * Usage:
 * ```tsx
 * import { useTranslation, changeLanguage, SUPPORTED_LANGUAGES } from '@/core/i18n';
 * ```
 */

// ====================================================================
// CORE
// ====================================================================

export { default as i18n } from "./config";
export {
  changeLanguage,
  getCurrentLanguage,
  isLanguageSupported,
  getSupportedLanguages,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  STORAGE_KEY,
} from "./config";

// ====================================================================
// LAZY LOADING
// ====================================================================

export { lazyI18nBackend } from "./lazyBackend";
export { I18nLoader } from "./I18nLoader";

// ====================================================================
// TYPES
// ====================================================================

// Types are defined in react-i18next
// No custom types file needed

// ====================================================================
// REACT-I18NEXT HOOKS
// ====================================================================

export { useTranslation, Trans, Translation } from "react-i18next";

// ====================================================================
// LOCALES
// ====================================================================

export { en } from "./locales/en";
export { fr } from "./locales/fr";
export { nl } from "./locales/nl";
