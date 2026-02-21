/**
 * ====================================================================
 * GUIDE D'INTÉGRATION i18n - ClubManager
 * ====================================================================
 *
 * Ce guide montre comment intégrer l'internationalisation (i18n) dans
 * TOUS les composants du projet ClubManager.
 *
 * CONFIGURATION ACTUELLE:
 * ✅ i18next installé et configuré
 * ✅ 3 langues supportées: EN (défaut), FR, NL
 * ✅ 13 namespaces organisés
 * ✅ ~700 traductions par langue
 * ✅ Détection automatique de la langue
 * ✅ Persistence dans localStorage
 *
 * FICHIERS IMPORTANTS:
 * - /core/i18n/config.ts - Configuration i18next
 * - /core/i18n/locales/en/index.ts - Traductions anglais
 * - /core/i18n/locales/fr/index.ts - Traductions français
 * - /core/i18n/locales/nl/index.ts - Traductions néerlandais
 * - /shared/components/LanguageSelector.tsx - Sélecteur de langue
 *
 * ====================================================================
 */

import React, { ComponentType } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/core/i18n';

/* ====================================================================
   1. UTILISATION BASIQUE - Hook useTranslation
   ==================================================================== */

/**
 * Exemple 1: Traductions simples
 */
const SimpleTranslationExample = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.actions.save')}</button>
      <button>{t('common.actions.cancel')}</button>
      <p>{t('common.messages.success')}</p>
    </div>
  );
};

/**
 * Exemple 2: Traductions avec interpolation
 */
const InterpolationExample = () => {
  const { t } = useTranslation();
  const userName = 'Jean';
  const itemCount = 5;

  return (
    <div>
      {/* Simple interpolation */}
      <p>{t('common.welcome', { name: userName })}</p>
      {/* EN: Welcome, Jean! */}
      {/* FR: Bienvenue, Jean! */}

      {/* Pluralization */}
      <p>{t('shop.cart.itemsCount', { count: itemCount })}</p>
      {/* EN: 5 items */}
      {/* FR: 5 articles */}

      {/* Multiple variables */}
      <p>{t('orders.totalAmount', { amount: 99.99, currency: 'EUR' })}</p>
      {/* EN: Total: €99.99 */}
      {/* FR: Total: 99,99 € */}
    </div>
  );
};

/**
 * Exemple 3: Traductions avec contexte
 */
const ContextExample = () => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Différents contextes pour le même mot */}
      <button>{t('common.actions.delete')}</button>
      <p>{t('courses.delete.confirmation')}</p>

      {/* Namespaces spécifiques */}
      <h2>{t('auth.login.title')}</h2>
      <p>{t('shop.products.description')}</p>
      <span>{t('errors.network.message')}</span>
    </div>
  );
};

/* ====================================================================
   2. COMPOSANT Trans - HTML et formatage complexe
   ==================================================================== */

/**
 * Exemple 4: Trans pour HTML riche
 */
const TransComponentExample = () => {
  const userName = 'Marie';

  return (
    <div>
      {/* Simple HTML */}
      <Trans i18nKey="auth.terms.accept">
        I accept the <a href="/terms">Terms and Conditions</a>
      </Trans>

      {/* Avec interpolation */}
      <Trans i18nKey="common.welcomeMessage" values={{ name: userName }}>
        Welcome back, <strong>{{ name: userName }}</strong>!
      </Trans>

      {/* Composants React */}
      <Trans
        i18nKey="courses.enrollment.info"
        components={{
          bold: <strong />,
          link: <a href="/courses" />,
        }}
      />
    </div>
  );
};

/* ====================================================================
   3. TRADUCTIONS DANS LES SERVICES
   ==================================================================== */

/**
 * ⚠️ IMPORTANT: Les services doivent rester PURS (pas de hooks)
 *
 * Solution 1: Retourner des clés i18n, traduire dans le composant
 * Solution 2: Passer la fonction t en paramètre
 */

// ❌ MAUVAIS - Hook dans un service
class BadUserService {
  static getUserStatus(user: any) {
    const { t } = useTranslation(); // ❌ Erreur: hooks uniquement dans composants
    return t('users.status.active');
  }
}

// ✅ BON - Retourner des clés
class GoodUserService {
  static getUserStatusKey(user: any): string {
    return user.isActive ? 'users.status.active' : 'users.status.inactive';
  }

  static getValidationErrorKey(field: string): string {
    return `validation.errors.${field}`;
  }
}

// Utilisation dans le composant
const UserStatusExample = ({ user }: any) => {
  const { t } = useTranslation();
  const statusKey = GoodUserService.getUserStatusKey(user);

  return <span>{t(statusKey)}</span>;
};

// ✅ BON Alternative - Passer t en paramètre
class UserServiceWithT {
  static formatUserDisplay(user: any, t: (key: string) => string): string {
    const status = user.isActive ? t('users.status.active') : t('users.status.inactive');
    const role = t(`users.roles.${user.role}`);
    return `${user.name} - ${status} - ${role}`;
  }
}

const UserDisplayExample = ({ user }: any) => {
  const { t } = useTranslation();
  const displayText = UserServiceWithT.formatUserDisplay(user, t);

  return <p>{displayText}</p>;
};

/* ====================================================================
   4. HOOK PERSONNALISÉ useI18nService
   ==================================================================== */

/**
 * Hook pour faciliter l'utilisation de services avec i18n
 */
export const useI18nService = () => {
  const { t, i18n } = useTranslation();

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage: (lang: string) => changeLanguage(lang),

    // Helper pour traduire des tableaux
    translateArray: (keys: string[]) => keys.map(key => t(key)),

    // Helper pour traduire des objets
    translateObject: (obj: Record<string, string>) =>
      Object.entries(obj).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: t(value)
      }), {}),

    // Helper pour formatter les dates selon la langue
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat(i18n.language).format(date);
    },

    // Helper pour formatter les nombres
    formatNumber: (num: number) => {
      return new Intl.NumberFormat(i18n.language).format(num);
    },

    // Helper pour formatter les devises
    formatCurrency: (amount: number, currency = 'EUR') => {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency
      }).format(amount);
    }
  };
};

// Exemple d'utilisation
const I18nServiceExample = () => {
  const { t, formatCurrency, formatDate, currentLanguage } = useI18nService();

  return (
    <div>
      <p>{t('common.currentLanguage')}: {currentLanguage}</p>
      <p>{formatCurrency(99.99)}</p>
      <p>{formatDate(new Date())}</p>
    </div>
  );
};

/* ====================================================================
   5. INTÉGRATION DANS LES COMPOSANTS UI
   ==================================================================== */

/**
 * Exemple 5: Boutons et actions
 */
const ButtonsExample = () => {
  const { t } = useTranslation();

  return (
    <div>
      <button>{t('common.actions.save')}</button>
      <button>{t('common.actions.cancel')}</button>
      <button>{t('common.actions.delete')}</button>
      <button>{t('common.actions.edit')}</button>
      <button>{t('common.actions.create')}</button>
      <button>{t('common.actions.search')}</button>
      <button>{t('common.actions.filter')}</button>
      <button>{t('common.actions.export')}</button>
      <button>{t('common.actions.import')}</button>
      <button aria-label={t('common.actions.close')} />
    </div>
  );
};

/**
 * Exemple 6: Formulaires
 */
const FormExample = () => {
  const { t } = useTranslation();

  return (
    <form>
      <label htmlFor="email">
        {t('auth.fields.email')}
        <input
          id="email"
          type="email"
          placeholder={t('auth.placeholders.email')}
          aria-label={t('auth.fields.email')}
        />
      </label>

      <label htmlFor="password">
        {t('auth.fields.password')}
        <input
          id="password"
          type="password"
          placeholder={t('auth.placeholders.password')}
        />
      </label>

      <button type="submit">
        {t('auth.login.submit')}
      </button>

      {/* Messages d'erreur */}
      <p className="error">{t('validation.errors.required')}</p>
      <p className="error">{t('validation.errors.emailInvalid')}</p>
    </form>
  );
};

/**
 * Exemple 7: Tableaux et listes
 */
const TableExample = () => {
  const { t } = useTranslation();

  return (
    <table>
      <thead>
        <tr>
          <th>{t('users.fields.name')}</th>
          <th>{t('users.fields.email')}</th>
          <th>{t('users.fields.role')}</th>
          <th>{t('users.fields.status')}</th>
          <th>{t('common.labels.actions')}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Jean Dupont</td>
          <td>jean@example.com</td>
          <td>{t('users.roles.student')}</td>
          <td>{t('users.status.active')}</td>
          <td>
            <button>{t('common.actions.edit')}</button>
            <button>{t('common.actions.delete')}</button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

/**
 * Exemple 8: Messages et notifications
 */
const MessagesExample = () => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Success */}
      <div className="alert alert-success">
        {t('common.messages.saveSuccess')}
      </div>

      {/* Error */}
      <div className="alert alert-error">
        {t('errors.generic.message')}
      </div>

      {/* Warning */}
      <div className="alert alert-warning">
        {t('common.messages.unsavedChanges')}
      </div>

      {/* Info */}
      <div className="alert alert-info">
        {t('common.messages.loading')}
      </div>
    </div>
  );
};

/* ====================================================================
   6. INTÉGRATION AVEC LES HOCs
   ==================================================================== */

/**
 * HOC pour garantir que i18n est initialisé
 */
export function withI18nReady<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  const WithI18nReady: React.FC<P> = (props) => {
    const { ready } = useTranslation();

    if (!ready) {
      return <div>Loading translations...</div>;
    }

    return <Component {...props} />;
  };

  WithI18nReady.displayName = `withI18nReady(${Component.displayName || Component.name})`;
  return WithI18nReady;
}

/**
 * Exemple de composition avec autres HOCs
 */
import { withAuth } from '@/hocs/withAuth';
import { withErrorBoundary } from '@/hocs/withErrorBoundary';

const MyProtectedPage = () => {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
};

// Composition
export const EnhancedPage = withAuth(
  withI18nReady(
    withErrorBoundary(MyProtectedPage, { componentName: 'MyProtectedPage' })
  )
);

/* ====================================================================
   7. PATTERNS COMMUNS
   ==================================================================== */

/**
 * Pattern 1: Statut avec couleurs
 */
const StatusWithI18n = ({ status }: { status: string }) => {
  const { t } = useTranslation();

  const statusConfig = {
    active: { key: 'users.status.active', color: 'green' },
    inactive: { key: 'users.status.inactive', color: 'red' },
    pending: { key: 'users.status.pending', color: 'orange' },
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <span style={{ color: config.color }}>
      {t(config.key)}
    </span>
  );
};

/**
 * Pattern 2: Dropdown options
 */
const DropdownWithI18n = () => {
  const { t } = useTranslation();

  const roleOptions = [
    { value: 'student', label: t('users.roles.student') },
    { value: 'teacher', label: t('users.roles.teacher') },
    { value: 'admin', label: t('users.roles.admin') },
    { value: 'parent', label: t('users.roles.parent') },
  ];

  return (
    <select>
      {roleOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

/**
 * Pattern 3: Confirmation modals
 */
const ConfirmDeleteModal = ({ itemName }: { itemName: string }) => {
  const { t } = useTranslation();

  return (
    <div className="modal">
      <h2>{t('common.confirm.delete.title')}</h2>
      <p>
        <Trans i18nKey="common.confirm.delete.message" values={{ item: itemName }}>
          Are you sure you want to delete <strong>{{ item: itemName }}</strong>?
        </Trans>
      </p>
      <button>{t('common.actions.delete')}</button>
      <button>{t('common.actions.cancel')}</button>
    </div>
  );
};

/**
 * Pattern 4: Empty states
 */
const EmptyStateWithI18n = ({ type }: { type: string }) => {
  const { t } = useTranslation();

  return (
    <div className="empty-state">
      <h3>{t(`${type}.empty.title`)}</h3>
      <p>{t(`${type}.empty.message`)}</p>
      <button>{t(`${type}.empty.action`)}</button>
    </div>
  );
};

/* ====================================================================
   8. CHECKLIST D'INTÉGRATION PAR COMPOSANT
   ==================================================================== */

/**
 * ✅ CHECKLIST POUR CHAQUE COMPOSANT:
 *
 * [ ] Importer useTranslation
 * [ ] Remplacer tous les textes hardcodés par t()
 * [ ] Ajouter les clés manquantes dans les 3 fichiers de locales
 * [ ] Traduire les placeholders
 * [ ] Traduire les aria-label (accessibilité)
 * [ ] Traduire les title (tooltips)
 * [ ] Traduire les messages d'erreur
 * [ ] Traduire les messages de succès
 * [ ] Traduire les confirmations
 * [ ] Vérifier les dates/nombres (utiliser formatters)
 * [ ] Tester avec les 3 langues (EN, FR, NL)
 * [ ] Vérifier que rien n'est coupé/tronqué
 * [ ] Vérifier les pluriels
 */

/* ====================================================================
   9. ORGANISATION DES TRADUCTIONS
   ==================================================================== */

/**
 * STRUCTURE RECOMMANDÉE DES CLÉS:
 *
 * common.actions.{action}           → save, cancel, delete, edit, etc.
 * common.labels.{label}             → name, email, status, etc.
 * common.messages.{message}         → success, error, loading, etc.
 * common.status.{status}            → active, inactive, pending, etc.
 *
 * {feature}.{page}.{element}        → users.list.title, courses.create.submit
 * {feature}.fields.{field}          → users.fields.name, courses.fields.level
 * {feature}.errors.{error}          → users.errors.notFound
 * {feature}.empty.{part}            → courses.empty.title
 *
 * validation.errors.{rule}          → required, minLength, emailInvalid
 * errors.{type}.{part}              → errors.network.message
 */

/* ====================================================================
   10. MIGRATION DES COMPOSANTS EXISTANTS
   ==================================================================== */

/**
 * ÉTAPES DE MIGRATION:
 *
 * 1. AUDIT
 *    - Identifier tous les textes hardcodés
 *    - Lister tous les messages d'erreur
 *    - Noter les formatages de dates/nombres
 *
 * 2. CRÉER LES CLÉS
 *    - Ajouter dans locales/en/index.ts
 *    - Traduire dans locales/fr/index.ts
 *    - Traduire dans locales/nl/index.ts
 *
 * 3. REFACTORER
 *    - Importer useTranslation
 *    - Remplacer texte par t('key')
 *    - Utiliser Trans pour HTML
 *    - Utiliser formatters pour dates/nombres
 *
 * 4. TESTER
 *    - Tester avec EN
 *    - Tester avec FR
 *    - Tester avec NL
 *    - Vérifier responsive (textes plus longs)
 *
 * 5. VALIDER
 *    - Code review
 *    - Tests automatisés
 *    - Validation par native speakers
 */

/* ====================================================================
   11. EXEMPLE COMPLET - AVANT/APRÈS
   ==================================================================== */

// ❌ AVANT - Textes hardcodés
const UserProfileBefore = ({ user }: any) => {
  return (
    <div>
      <h1>User Profile</h1>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
      <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
      <p>Balance: €{user.balance.toFixed(2)}</p>
      <button>Edit Profile</button>
      <button>Delete Account</button>
      {user.courses.length === 0 && <p>No courses enrolled</p>}
    </div>
  );
};

// ✅ APRÈS - Avec i18n
const UserProfileAfter = ({ user }: any) => {
  const { t, formatDate, formatCurrency } = useI18nService();

  return (
    <div>
      <h1>{t('users.profile.title')}</h1>
      <p>{t('users.fields.name')}: {user.name}</p>
      <p>{t('users.fields.email')}: {user.email}</p>
      <p>
        {t('users.fields.status')}:{' '}
        {t(user.isActive ? 'users.status.active' : 'users.status.inactive')}
      </p>
      <p>
        {t('users.fields.memberSince')}: {formatDate(new Date(user.createdAt))}
      </p>
      <p>
        {t('users.fields.balance')}: {formatCurrency(user.balance)}
      </p>
      <button>{t('users.actions.editProfile')}</button>
      <button>{t('users.actions.deleteAccount')}</button>
      {user.courses.length === 0 && (
        <p>{t('users.profile.noCoursesEnrolled')}</p>
      )}
    </div>
  );
};

/* ====================================================================
   12. RESSOURCES ET RÉFÉRENCES
   ==================================================================== */

/**
 * DOCUMENTATION:
 * - i18next: https://www.i18next.com/
 * - react-i18next: https://react.i18next.com/
 * - Configuration locale: /core/i18n/config.ts
 * - Traductions: /core/i18n/locales/{en,fr,nl}/index.ts
 *
 * COMPOSANTS UTILES:
 * - LanguageSelector: /shared/components/LanguageSelector.tsx
 * - useTranslation: Hook principal
 * - Trans: Pour HTML riche
 * - useI18nService: Hook personnalisé (ci-dessus)
 *
 * HELPERS:
 * - changeLanguage(lang)
 * - getCurrentLanguage()
 * - getSupportedLanguages()
 *
 * NAMESPACES DISPONIBLES:
 * - common, navigation, auth, shop, courses
 * - users, messages, orders, stats, teachers
 * - errors, validation, language
 */

export default {
  SimpleTranslationExample,
  InterpolationExample,
  TransComponentExample,
  UserStatusExample,
  I18nServiceExample,
  ButtonsExample,
  FormExample,
  TableExample,
  MessagesExample,
  StatusWithI18n,
  DropdownWithI18n,
  ConfirmDeleteModal,
  EmptyStateWithI18n,
  UserProfileAfter,
  useI18nService,
  withI18nReady,
};
