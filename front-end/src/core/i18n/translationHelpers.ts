/**
 * ====================================================================
 * TRANSLATION HELPERS - ClubManager Front-End
 * ====================================================================
 *
 * Utilitaires pour faciliter l'utilisation de i18n dans les services
 * et les composants sans dépendre de hooks React.
 *
 * USAGE DANS LES SERVICES:
 * ```typescript
 * import { translate, formatNumber, formatCurrency, formatDate } from '@/core/i18n/translationHelpers';
 *
 * export class UserService {
 *   static getStatusLabel(status: string): string {
 *     return translate(`common.status.${status}`);
 *   }
 *
 *   static formatUserStats(stats: UserStats): FormattedStats {
 *     return {
 *       totalCourses: formatNumber(stats.total),
 *       completionRate: formatPercent(stats.rate),
 *       joinDate: formatDate(stats.joinDate)
 *     };
 *   }
 * }
 * ```
 *
 * USAGE DANS LES COMPOSANTS:
 * ```typescript
 * import { useTypedTranslation } from '@/core/i18n/translationHelpers';
 *
 * function MyComponent() {
 *   const { t, formatCurrency, formatDate } = useTypedTranslation();
 *
 *   return (
 *     <div>
 *       <p>{t('common.actions.save')}</p>
 *       <p>{formatCurrency(100)}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import i18n from "./config";
import { TFunction } from "i18next";
import { logger } from "@/core/utils/appLogger";

// ====================================================================
// TYPES
// ====================================================================

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
  | "language";

export interface TranslationOptions {
  count?: number;
  context?: string;
  defaultValue?: string;
  [key: string]: any;
}

export interface FormatOptions {
  locale?: string;
  currency?: string;
  style?: "decimal" | "currency" | "percent";
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  format?: "date" | "time" | "datetime" | "relative";
}

// ====================================================================
// TRANSLATION FUNCTIONS (for Services)
// ====================================================================

/**
 * Traduction simple (utilisable dans les services)
 * Ne nécessite pas de hook React
 *
 * @example
 * ```typescript
 * const label = translate('common.actions.save'); // "Save"
 * const greeting = translate('auth.welcome', { name: 'John' }); // "Welcome, John"
 * ```
 */
export function translate(key: string, options?: TranslationOptions): string {
  return i18n.t(key, options);
}

/**
 * Alias court pour translate
 */
export const t = translate;

/**
 * Traduction avec namespace explicite
 *
 * @example
 * ```typescript
 * const label = translateNS('common', 'actions.save');
 * ```
 */
export function translateNS(
  namespace: TranslationNamespace,
  key: string,
  options?: TranslationOptions,
): string {
  return i18n.t(`${namespace}.${key}`, options);
}

/**
 * Traduction plurielle
 *
 * @example
 * ```typescript
 * translatePlural('shop.cart.items', 5); // "5 items"
 * translatePlural('shop.cart.items', 1); // "1 item"
 * ```
 */
export function translatePlural(key: string, count: number, options?: TranslationOptions): string {
  return i18n.t(key, { count, ...options });
}

/**
 * Vérifier si une clé de traduction existe
 *
 * @example
 * ```typescript
 * if (translationExists('common.actions.save')) {
 *   // La traduction existe
 * }
 * ```
 */
export function translationExists(key: string): boolean {
  return i18n.exists(key);
}

/**
 * Obtenir la langue actuelle
 */
export function getCurrentLanguage(): string {
  return i18n.language || "en";
}

/**
 * Changer la langue
 */
export async function changeLanguage(language: string): Promise<void> {
  await i18n.changeLanguage(language);
  document.documentElement.lang = language;
}

// ====================================================================
// FORMAT FUNCTIONS (for Services)
// ====================================================================

/**
 * Formater un nombre selon la locale
 *
 * @example
 * ```typescript
 * formatNumber(1234.56); // "1,234.56" (en) | "1 234,56" (fr)
 * formatNumber(1234.56, { minimumFractionDigits: 2 }); // "1,234.56"
 * ```
 */
export function formatNumber(value: number, options?: FormatOptions): string {
  const locale = options?.locale || getCurrentLanguage();

  try {
    return new Intl.NumberFormat(locale, {
      style: options?.style || "decimal",
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    }).format(value);
  } catch (error) {
    logger.error("Error formatting number:", error as Error);
    return String(value);
  }
}

/**
 * Formater une devise (€, $, etc.)
 *
 * @example
 * ```typescript
 * formatCurrency(123.45); // "€123.45" (fr) | "$123.45" (en)
 * formatCurrency(123.45, 'USD'); // "$123.45"
 * formatCurrency(123.45, 'EUR'); // "€123.45"
 * ```
 */
export function formatCurrency(
  value: number,
  currency: string = "EUR",
  options?: FormatOptions,
): string {
  const locale = options?.locale || getCurrentLanguage();

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(value);
  } catch (error) {
    logger.error("Error formatting currency:", error as Error);
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * Formater un pourcentage
 *
 * @example
 * ```typescript
 * formatPercent(0.75); // "75%"
 * formatPercent(0.7564, { maximumFractionDigits: 1 }); // "75.6%"
 * ```
 */
export function formatPercent(value: number, options?: FormatOptions): string {
  const locale = options?.locale || getCurrentLanguage();

  try {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(value);
  } catch (error) {
    logger.error("Error formatting percent:", error as Error);
    return `${(value * 100).toFixed(2)}%`;
  }
}

/**
 * Formater une date selon la locale
 *
 * @example
 * ```typescript
 * formatDate(new Date(), { dateStyle: 'long' }); // "January 1, 2024" (en)
 * formatDate('2024-01-01', { format: 'date' }); // "01/01/2024" (fr)
 * formatDate(date, { format: 'relative' }); // "2 days ago"
 * ```
 */
export function formatDate(value: Date | string | number, options?: DateFormatOptions): string {
  const locale = options?.locale || getCurrentLanguage();
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    logger.error("Invalid date:", new Error(String(value)));
    return String(value);
  }

  try {
    // Format relatif (ex: "il y a 2 jours")
    if (options?.format === "relative") {
      return formatRelativeDate(date, locale);
    }

    // Format standard
    return new Intl.DateTimeFormat(locale, {
      dateStyle: options?.dateStyle,
      timeStyle: options?.timeStyle,
    }).format(date);
  } catch (error) {
    logger.error("Error formatting date:", error as Error);
    return date.toLocaleDateString();
  }
}

/**
 * Formater une date relative (ex: "il y a 2 jours")
 */
function formatRelativeDate(date: Date, locale: string): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const intervals = [
    { seconds: 31536000, unit: "year" },
    { seconds: 2592000, unit: "month" },
    { seconds: 86400, unit: "day" },
    { seconds: 3600, unit: "hour" },
    { seconds: 60, unit: "minute" },
    { seconds: 1, unit: "second" },
  ] as const;

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return rtf.format(-count, interval.unit);
    }
  }

  return rtf.format(0, "second");
}

/**
 * Formater une durée (ex: "2h 30m")
 *
 * @example
 * ```typescript
 * formatDuration(3661); // "1h 1m 1s" (en) | "1h 1min 1s" (fr)
 * formatDuration(90); // "1m 30s"
 * ```
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(translatePlural("common.time.hours", hours));
  }
  if (minutes > 0) {
    parts.push(translatePlural("common.time.minutes", minutes));
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(translatePlural("common.time.seconds", secs));
  }

  return parts.join(" ");
}

// ====================================================================
// VALIDATION MESSAGES HELPERS
// ====================================================================

/**
 * Obtenir un message de validation traduit
 *
 * @example
 * ```typescript
 * getValidationMessage('required', 'email'); // "Email is required"
 * getValidationMessage('minLength', 'password', { min: 8 }); // "Password must be at least 8 characters"
 * ```
 */
export function getValidationMessage(
  rule: string,
  field: string,
  params?: Record<string, any>,
): string {
  const key = `validation.${rule}`;
  return translate(key, { field: translate(`common.fields.${field}`), ...params });
}

/**
 * Obtenir un message d'erreur traduit
 *
 * @example
 * ```typescript
 * getErrorMessage('network'); // "Network error. Please check your connection."
 * getErrorMessage('unauthorized'); // "You don't have permission to perform this action."
 * ```
 */
export function getErrorMessage(errorType: string, params?: Record<string, any>): string {
  const key = `errors.${errorType}`;
  return translate(key, params);
}

// ====================================================================
// REACT HOOK (for Components)
// ====================================================================

/**
 * Hook React typé pour utilisation dans les composants
 * Fournit à la fois la fonction de traduction et les helpers de formatage
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { t, formatCurrency, formatDate, formatPercent } = useTypedTranslation();
 *
 *   return (
 *     <div>
 *       <h1>{t('common.welcome')}</h1>
 *       <p>{formatCurrency(100)}</p>
 *       <p>{formatDate(new Date())}</p>
 *       <p>{formatPercent(0.75)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTypedTranslation() {
  return {
    // Translation functions
    t: translate,
    translateNS,
    translatePlural,
    translationExists,
    getCurrentLanguage,
    changeLanguage,

    // Format functions
    formatNumber,
    formatCurrency,
    formatPercent,
    formatDate,
    formatDuration,

    // Validation & Errors
    getValidationMessage,
    getErrorMessage,
  };
}

// ====================================================================
// COMMON TRANSLATIONS (Shortcuts)
// ====================================================================

/**
 * Raccourcis pour traductions communes
 */
export const commonTranslations = {
  // Actions
  save: () => translate("common.actions.save"),
  cancel: () => translate("common.actions.cancel"),
  delete: () => translate("common.actions.delete"),
  edit: () => translate("common.actions.edit"),
  create: () => translate("common.actions.create"),
  submit: () => translate("common.actions.submit"),
  close: () => translate("common.actions.close"),
  confirm: () => translate("common.actions.confirm"),
  search: () => translate("common.actions.search"),
  filter: () => translate("common.actions.filter"),
  export: () => translate("common.actions.export"),
  import: () => translate("common.actions.import"),

  // Status
  active: () => translate("common.status.active"),
  inactive: () => translate("common.status.inactive"),
  pending: () => translate("common.status.pending"),
  completed: () => translate("common.status.completed"),
  cancelled: () => translate("common.status.cancelled"),

  // Messages
  success: () => translate("common.messages.success"),
  error: () => translate("common.messages.error"),
  warning: () => translate("common.messages.warning"),
  loading: () => translate("common.messages.loading"),
  noData: () => translate("common.messages.noData"),
  confirmDelete: () => translate("common.messages.confirmDelete"),

  // Validation
  required: (field: string) => getValidationMessage("required", field),
  invalid: (field: string) => getValidationMessage("invalid", field),
  tooShort: (field: string, min: number) => getValidationMessage("minLength", field, { min }),
  tooLong: (field: string, max: number) => getValidationMessage("maxLength", field, { max }),
};

// ====================================================================
// EXPORTS
// ====================================================================

export default {
  translate,
  t,
  translateNS,
  translatePlural,
  translationExists,
  getCurrentLanguage,
  changeLanguage,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDuration,
  getValidationMessage,
  getErrorMessage,
  useTypedTranslation,
  commonTranslations,
};
