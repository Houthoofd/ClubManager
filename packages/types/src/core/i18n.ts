/**
 * Internationalization (i18n) Types
 *
 * Type definitions for i18next translations and language management.
 * Provides autocomplete and type safety for translation keys.
 */

// ============================================================================
// SUPPORTED LANGUAGES
// ============================================================================

/**
 * Supported language codes
 */
export type SupportedLanguage = "en" | "fr" | "nl" | "de";

/**
 * Language display names
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  fr: "Français",
  nl: "Nederlands",
  de: "Deutsch",
};

/**
 * Language flag emojis
 */
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  nl: "🇳🇱",
  de: "🇩🇪",
};

// ============================================================================
// NAMESPACE TYPES
// ============================================================================

/**
 * All available translation namespaces
 */
export type TranslationNamespace =
  | "common"
  | "navigation"
  | "auth"
  | "shop"
  | "courses"
  | "users"
  | "messages"
  | "orders"
  | "stats"
  | "teachers"
  | "errors"
  | "validation"
  | "language"
  | "dashboard"
  | "settings"
  | "notifications"
  | "reports";

/**
 * Common namespace keys
 */
export type CommonKey =
  | `common.actions.${string}`
  | `common.labels.${string}`
  | `common.status.${string}`
  | `common.messages.${string}`
  | `common.time.${string}`
  | `common.pagination.${string}`
  | `common.filters.${string}`
  | `common.confirmations.${string}`;

/**
 * Navigation namespace keys
 */
export type NavigationKey =
  | `navigation.menu.${string}`
  | `navigation.breadcrumbs.${string}`
  | `navigation.footer.${string}`
  | `navigation.sidebar.${string}`;

/**
 * Auth namespace keys
 */
export type AuthKey =
  | `auth.login.${string}`
  | `auth.register.${string}`
  | `auth.forgotPassword.${string}`
  | `auth.resetPassword.${string}`
  | `auth.profile.${string}`
  | `auth.roles.${string}`
  | `auth.permissions.${string}`
  | `auth.verification.${string}`;

/**
 * Shop namespace keys
 */
export type ShopKey =
  | `shop.products.${string}`
  | `shop.productDetails.${string}`
  | `shop.cart.${string}`
  | `shop.checkout.${string}`
  | `shop.categories.${string}`
  | `shop.payment.${string}`;

/**
 * Courses namespace keys
 */
export type CoursesKey =
  | `courses.list.${string}`
  | `courses.details.${string}`
  | `courses.create.${string}`
  | `courses.edit.${string}`
  | `courses.levels.${string}`
  | `courses.schedule.${string}`
  | `courses.enrollment.${string}`;

/**
 * Users namespace keys
 */
export type UsersKey =
  | `users.list.${string}`
  | `users.details.${string}`
  | `users.create.${string}`
  | `users.edit.${string}`
  | `users.fields.${string}`
  | `users.status.${string}`;

/**
 * Messages namespace keys
 */
export type MessagesKey =
  | `messages.list.${string}`
  | `messages.compose.${string}`
  | `messages.view.${string}`
  | `messages.notifications.${string}`
  | `messages.inbox.${string}`
  | `messages.sent.${string}`;

/**
 * Orders namespace keys
 */
export type OrdersKey =
  | `orders.list.${string}`
  | `orders.details.${string}`
  | `orders.status.${string}`
  | `orders.actions.${string}`
  | `orders.payment.${string}`;

/**
 * Stats namespace keys
 */
export type StatsKey =
  | `stats.dashboard.${string}`
  | `stats.metrics.${string}`
  | `stats.charts.${string}`
  | `stats.reports.${string}`;

/**
 * Teachers namespace keys
 */
export type TeachersKey =
  | `teachers.list.${string}`
  | `teachers.details.${string}`
  | `teachers.create.${string}`
  | `teachers.edit.${string}`
  | `teachers.schedule.${string}`;

/**
 * Errors namespace keys
 */
export type ErrorsKey =
  | `errors.${string}`
  | `errors.form.${string}`
  | `errors.api.${string}`
  | `errors.boundary.${string}`
  | `errors.network.${string}`;

/**
 * Validation namespace keys
 */
export type ValidationKey =
  | `validation.${string}`
  | `validation.password.${string}`
  | `validation.email.${string}`
  | `validation.required.${string}`;

/**
 * Language namespace keys
 */
export type LanguageKey = `language.${string}`;

/**
 * Dashboard namespace keys
 */
export type DashboardKey =
  | `dashboard.${string}`
  | `dashboard.widgets.${string}`
  | `dashboard.stats.${string}`;

/**
 * Settings namespace keys
 */
export type SettingsKey =
  | `settings.${string}`
  | `settings.account.${string}`
  | `settings.privacy.${string}`
  | `settings.notifications.${string}`;

/**
 * Notifications namespace keys
 */
export type NotificationsKey =
  | `notifications.${string}`
  | `notifications.types.${string}`;

/**
 * Reports namespace keys
 */
export type ReportsKey = `reports.${string}` | `reports.generate.${string}`;

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
  | LanguageKey
  | DashboardKey
  | SettingsKey
  | NotificationsKey
  | ReportsKey;

// ============================================================================
// TRANSLATION FUNCTION TYPES
// ============================================================================

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
  count?: number;
  context?: string;
  replace?: Record<string, string | number>;

  /**
   * Additional parameters
   */
  [key: string]: any;
}

/**
 * Translation function type
 */
export type TFunction = (
  key: TranslationKey | string,
  options?: TranslationOptions | string,
) => string;

/**
 * Plural translation function
 */
export type PluralTFunction = (
  key: TranslationKey | string,
  count: number,
  options?: TranslationOptions,
) => string;

// ============================================================================
// LANGUAGE SELECTOR TYPES
// ============================================================================

/**
 * Language option for selector
 */
export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
  nativeName: string;
  direction?: "ltr" | "rtl";
}

/**
 * Predefined language options
 */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    flag: "🇬🇧",
    nativeName: "English",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    flag: "🇫🇷",
    nativeName: "Français",
    direction: "ltr",
  },
  {
    code: "nl",
    name: "Dutch",
    flag: "🇳🇱",
    nativeName: "Nederlands",
    direction: "ltr",
  },
  {
    code: "de",
    name: "German",
    flag: "🇩🇪",
    nativeName: "Deutsch",
    direction: "ltr",
  },
];

// ============================================================================
// TRANSLATION RESOURCES
// ============================================================================

/**
 * Translation resource for a single namespace
 */
export type TranslationResource = Record<string, string | Record<string, any>>;

/**
 * Translation resources for all namespaces
 */
export type NamespaceResources = Record<
  TranslationNamespace,
  TranslationResource
>;

/**
 * Complete language resources
 */
export type LanguageResources = Record<SupportedLanguage, NamespaceResources>;

/**
 * Translation file structure
 */
export interface TranslationFile {
  [key: string]: string | TranslationFile;
}

// ============================================================================
// I18N CONFIGURATION
// ============================================================================

/**
 * i18next configuration options
 */
export interface I18nConfig {
  /**
   * Default language
   */
  defaultLanguage: SupportedLanguage;

  /**
   * Fallback language
   */
  fallbackLanguage?: SupportedLanguage;

  /**
   * Available languages
   */
  supportedLanguages: SupportedLanguage[];

  /**
   * Default namespace
   */
  defaultNamespace?: TranslationNamespace;

  /**
   * Namespaces to load
   */
  namespaces?: TranslationNamespace[];

  /**
   * Debug mode
   */
  debug?: boolean;

  /**
   * Interpolation settings
   */
  interpolation?: {
    escapeValue?: boolean;
    prefix?: string;
    suffix?: string;
  };

  /**
   * Detection settings
   */
  detection?: {
    order?: ("localStorage" | "navigator" | "htmlTag")[];
    caches?: ("localStorage" | "cookie")[];
    lookupLocalStorage?: string;
    lookupCookie?: string;
  };
}

// ============================================================================
// TRANSLATION HELPERS
// ============================================================================

/**
 * Pluralization rules
 */
export interface PluralRule {
  language: SupportedLanguage;
  rule: (count: number) => number;
}

/**
 * Date/Time format options
 */
export interface DateTimeFormatOptions {
  locale?: SupportedLanguage;
  format?: "short" | "medium" | "long" | "full";
  dateStyle?: "short" | "medium" | "long" | "full";
  timeStyle?: "short" | "medium" | "long" | "full";
}

/**
 * Number format options
 */
export interface NumberFormatOptions {
  locale?: SupportedLanguage;
  style?: "decimal" | "currency" | "percent";
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Currency format options
 */
export interface CurrencyFormatOptions extends NumberFormatOptions {
  currency: string;
  currencyDisplay?: "symbol" | "code" | "name";
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract namespace from key
 */
export type ExtractNamespace<T extends string> =
  T extends `${infer NS}.${string}` ? NS : never;

/**
 * Check if key belongs to namespace
 */
export type BelongsToNamespace<
  K extends string,
  NS extends TranslationNamespace,
> = K extends `${NS}.${string}` ? K : never;

/**
 * Deep partial type for translations
 * @deprecated Use DeepPartial from core/common instead
 */
import type { DeepPartial } from "./common.js";
export type { DeepPartial };

/**
 * Translation key path
 */
export type KeyPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${KeyPath<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

// ============================================================================
// TRANSLATION CONTEXT
// ============================================================================

/**
 * Translation context for React
 */
export interface I18nContext {
  language: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  t: TFunction;
  ready: boolean;
}

/**
 * Translation loading state
 */
export interface I18nLoadingState {
  loading: boolean;
  error?: Error | null;
  ready: boolean;
}

// ============================================================================
// TRANSLATION VALIDATION
// ============================================================================

/**
 * Missing translation report
 */
export interface MissingTranslation {
  key: string;
  namespace: TranslationNamespace;
  language: SupportedLanguage;
  timestamp: Date;
}

/**
 * Translation coverage report
 */
export interface TranslationCoverage {
  language: SupportedLanguage;
  namespace: TranslationNamespace;
  total: number;
  translated: number;
  missing: number;
  coverage: number;
}

/**
 * Translation quality metrics
 */
export interface TranslationQuality {
  language: SupportedLanguage;
  completeness: number;
  consistency: number;
  issues: Array<{
    type: "missing" | "unused" | "duplicate" | "placeholder";
    key: string;
    message: string;
  }>;
}

// ============================================================================
// LOCALE DATA
// ============================================================================

/**
 * Locale metadata
 */
export interface LocaleMetadata {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

/**
 * Time zone information
 */
export interface TimeZoneInfo {
  name: string;
  offset: number;
  abbr: string;
}
