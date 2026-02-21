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

export { default as i18n } from './config';
export {
  changeLanguage,
  getCurrentLanguage,
  isLanguageSupported,
  getSupportedLanguages,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  STORAGE_KEY,
} from './config';

// ====================================================================
// TYPES
// ====================================================================

export type {
  SupportedLanguage,
  TranslationNamespace,
  TranslationKey,
  CommonKey,
  NavigationKey,
  AuthKey,
  ShopKey,
  CoursesKey,
  UsersKey,
  MessagesKey,
  OrdersKey,
  StatsKey,
  TeachersKey,
  ErrorsKey,
  ValidationKey,
  LanguageKey,
  TFunction,
  TranslationOptions,
  LanguageOption,
  UseTranslationOptions,
  UseTranslationResponse,
} from './types';

export {
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  LANGUAGE_OPTIONS,
} from './types';

// ====================================================================
// REACT-I18NEXT HOOKS
// ====================================================================

export { useTranslation, Trans, Translation } from 'react-i18next';

// ====================================================================
// LOCALES
// ====================================================================

export { en } from './locales/en';
export { fr } from './locales/fr';
export { nl } from './locales/nl';
