/**
 * ====================================================================
 * I18N TYPESCRIPT TYPES
 * ====================================================================
 *
 * TypeScript type definitions for i18next translations.
 * Provides autocomplete and type safety for translation keys.
 *
 * Usage:
 * ```tsx
 * import { useTranslation } from 'react-i18next';
 * import type { TranslationKey } from '@/core/i18n/types';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   const key: TranslationKey = 'common.actions.save'; // Type-safe!
 *   return <button>{t(key)}</button>;
 * }
 * ```
 */

// ====================================================================
// SUPPORTED LANGUAGES
// ====================================================================

export type SupportedLanguage = 'en' | 'fr' | 'nl';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  nl: '🇳🇱',
};

// ====================================================================
// NAMESPACE TYPES
// ====================================================================

/**
 * All available translation namespaces
 */
export type TranslationNamespace =
  | 'common'
  | 'navigation'
  | 'auth'
  | 'shop'
  | 'courses'
  | 'users'
  | 'messages'
  | 'orders'
  | 'stats'
  | 'teachers'
  | 'errors'
  | 'validation'
  | 'language';

/**
 * Common namespace keys
 */
export type CommonKey =
  | `common.actions.${string}`
  | `common.labels.${string}`
  | `common.status.${string}`
  | `common.messages.${string}`
  | `common.time.${string}`
  | `common.pagination.${string}`;

/**
 * Navigation namespace keys
 */
export type NavigationKey =
  | `navigation.menu.${string}`
  | `navigation.breadcrumbs.${string}`
  | `navigation.footer.${string}`;

/**
 * Auth namespace keys
 */
export type AuthKey =
  | `auth.login.${string}`
  | `auth.register.${string}`
  | `auth.forgotPassword.${string}`
  | `auth.profile.${string}`
  | `auth.roles.${string}`
  | `auth.permissions.${string}`;

/**
 * Shop namespace keys
 */
export type ShopKey =
  | `shop.products.${string}`
  | `shop.productDetails.${string}`
  | `shop.cart.${string}`
  | `shop.checkout.${string}`
  | `shop.categories.${string}`;

/**
 * Courses namespace keys
 */
export type CoursesKey =
  | `courses.list.${string}`
  | `courses.details.${string}`
  | `courses.create.${string}`
  | `courses.edit.${string}`
  | `courses.levels.${string}`;

/**
 * Users namespace keys
 */
export type UsersKey =
  | `users.list.${string}`
  | `users.details.${string}`
  | `users.create.${string}`
  | `users.edit.${string}`
  | `users.fields.${string}`;

/**
 * Messages namespace keys
 */
export type MessagesKey =
  | `messages.list.${string}`
  | `messages.compose.${string}`
  | `messages.view.${string}`
  | `messages.notifications.${string}`;

/**
 * Orders namespace keys
 */
export type OrdersKey =
  | `orders.list.${string}`
  | `orders.details.${string}`
  | `orders.status.${string}`
  | `orders.actions.${string}`;

/**
 * Stats namespace keys
 */
export type StatsKey =
  | `stats.dashboard.${string}`
  | `stats.metrics.${string}`
  | `stats.charts.${string}`;

/**
 * Teachers namespace keys
 */
export type TeachersKey =
  | `teachers.list.${string}`
  | `teachers.details.${string}`
  | `teachers.create.${string}`
  | `teachers.edit.${string}`;

/**
 * Errors namespace keys
 */
export type ErrorsKey =
  | `errors.${string}`
  | `errors.form.${string}`
  | `errors.boundary.${string}`;

/**
 * Validation namespace keys
 */
export type ValidationKey =
  | `validation.${string}`
  | `validation.password.${string}`;

/**
 * Language namespace keys
 */
export type LanguageKey = `language.${string}`;

/**
 * Union of all translation keys
 */
export type TranslationKey =
  | CommonKey
  | NavigationKey
  | AuthKey
  | ShopKey
  | CoursesKey
  | UsersKey
  | MessagesKey
  | OrdersKey
  | StatsKey
  | TeachersKey
  | ErrorsKey
  | ValidationKey
  | LanguageKey;

// ====================================================================
// TRANSLATION FUNCTION TYPES
// ====================================================================

/**
 * Translation function options
 */
export interface TranslationOptions {
  /**
   * Default value if translation is missing
   */
  defaultValue?: string;

  /**
   * Interpolation values
   */
  [key: string]: any;
}

/**
 * Translation function type
 */
export type TFunction = (
  key: TranslationKey | string,
  options?: TranslationOptions
) => string;

// ====================================================================
// LANGUAGE SELECTOR TYPES
// ====================================================================

/**
 * Language option for selector
 */
export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
  nativeName: string;
}

/**
 * Predefined language options
 */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    nativeName: 'English',
  },
  {
    code: 'fr',
    name: 'French',
    flag: '🇫🇷',
    nativeName: 'Français',
  },
  {
    code: 'nl',
    name: 'Dutch',
    flag: '🇳🇱',
    nativeName: 'Nederlands',
  },
];

// ====================================================================
// UTILITY TYPES
// ====================================================================

/**
 * Extract namespace from key
 */
export type ExtractNamespace<T extends string> = T extends `${infer NS}.${string}`
  ? NS
  : never;

/**
 * Check if key belongs to namespace
 */
export type BelongsToNamespace<
  K extends string,
  NS extends TranslationNamespace
> = K extends `${NS}.${string}` ? K : never;

/**
 * Deep partial type for translations
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ====================================================================
// RE-EXPORT FROM react-i18next
// ====================================================================

export type { UseTranslationOptions, UseTranslationResponse } from 'react-i18next';
