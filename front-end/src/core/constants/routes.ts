/**
 * ====================================================================
 * APPLICATION ROUTES CONSTANTS
 * ====================================================================
 *
 * Centralized route path definitions for the entire application.
 * Use these constants instead of hardcoding paths to avoid typos and
 * enable easier refactoring.
 *
 * Usage:
 * ```tsx
 * import { ROUTES } from '@/core/constants';
 *
 * // In components
 * <Link to={ROUTES.SHOP.LIST}>Go to Shop</Link>
 *
 * // In navigation
 * navigate(ROUTES.COURSES.ADD);
 * ```
 */

// ====================================================================
// ROOT ROUTES
// ====================================================================

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',

  // ====================================================================
  // AUTH ROUTES
  // ====================================================================
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  // ====================================================================
  // USER ROUTES
  // ====================================================================
  USERS: {
    LIST: '/utilisateurs',
    ADD: '/utilisateurs/ajouter',
    DETAIL: (id: string | number = ':id') => `/utilisateurs/${id}`,
    EDIT: (id: string | number = ':id') => `/utilisateurs/${id}/modifier`,
  },

  // ====================================================================
  // COURSE ROUTES
  // ====================================================================
  COURSES: {
    LIST: '/cours',
    ADD: '/cours/ajouter',
    DETAIL: (id: string | number = ':id') => `/cours/${id}`,
    EDIT: (id: string | number = ':id') => `/cours/${id}/modifier`,
    INSCRIPTIONS: '/cours/inscriptions',
    PARTICIPANTS: (id: string | number = ':id') => `/cours/${id}/participants`,
  },

  // ====================================================================
  // SHOP ROUTES
  // ====================================================================
  SHOP: {
    LIST: '/magasin',
    DETAIL: (id: string | number = ':id') => `/magasin/article/${id}`,
    ADD_ARTICLE: '/magasin/ajouter',
    CART: '/panier',
    CHECKOUT: '/checkout',
    SUCCESS: '/success',
    CANCEL: '/cancel',
  },

  // ====================================================================
  // ORDER ROUTES
  // ====================================================================
  ORDERS: {
    LIST: '/commandes',
    DETAIL: (id: string | number = ':id') => `/commandes/${id}`,
  },

  // ====================================================================
  // MESSAGE ROUTES
  // ====================================================================
  MESSAGES: {
    LIST: '/messages',
    DETAIL: (id: string | number = ':id') => `/messages/${id}`,
    COMPOSE: '/messages/nouveau',
    TYPES: '/messages/types',
  },

  // ====================================================================
  // TEACHER ROUTES
  // ====================================================================
  TEACHERS: {
    LIST: '/professeurs',
    DETAIL: (id: string | number = ':id') => `/professeurs/${id}`,
    PLANNING: '/professeurs/planning',
    PLANNING_DETAIL: (id: string | number = ':id') => `/professeurs/${id}/planning`,
  },

  // ====================================================================
  // STATS ROUTES
  // ====================================================================
  STATS: {
    DASHBOARD: '/statistiques',
    COURSES: '/statistiques/cours',
    USERS: '/statistiques/utilisateurs',
    REVENUE: '/statistiques/revenus',
    SHOP: '/statistiques/magasin',
  },

  // ====================================================================
  // SETTINGS ROUTES
  // ====================================================================
  SETTINGS: {
    PROFILE: '/parametres/profil',
    ACCOUNT: '/parametres/compte',
    PREFERENCES: '/parametres/preferences',
    NOTIFICATIONS: '/parametres/notifications',
  },

  // ====================================================================
  // ERROR ROUTES
  // ====================================================================
  ERRORS: {
    NOT_FOUND: '/404',
    UNAUTHORIZED: '/401',
    FORBIDDEN: '/403',
    SERVER_ERROR: '/500',
  },
} as const;

// ====================================================================
// PUBLIC ROUTES (No authentication required)
// ====================================================================

export const PUBLIC_ROUTES = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
  ROUTES.ERRORS.NOT_FOUND,
  ROUTES.ERRORS.UNAUTHORIZED,
  ROUTES.ERRORS.FORBIDDEN,
  ROUTES.ERRORS.SERVER_ERROR,
] as const;

// ====================================================================
// PROTECTED ROUTES (Require authentication)
// ====================================================================

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.USERS.LIST,
  ROUTES.COURSES.LIST,
  ROUTES.SHOP.LIST,
  ROUTES.ORDERS.LIST,
  ROUTES.MESSAGES.LIST,
  ROUTES.TEACHERS.LIST,
  ROUTES.STATS.DASHBOARD,
] as const;

// ====================================================================
// ROUTE GROUPS FOR NAVIGATION
// ====================================================================

export const ROUTE_GROUPS = {
  MAIN: [
    { path: ROUTES.DASHBOARD, label: 'navigation.dashboard' },
    { path: ROUTES.COURSES.LIST, label: 'navigation.courses' },
    { path: ROUTES.USERS.LIST, label: 'navigation.users' },
    { path: ROUTES.SHOP.LIST, label: 'navigation.shop' },
  ],
  MANAGEMENT: [
    { path: ROUTES.ORDERS.LIST, label: 'navigation.orders' },
    { path: ROUTES.MESSAGES.LIST, label: 'navigation.messages' },
    { path: ROUTES.TEACHERS.LIST, label: 'navigation.teachers' },
  ],
  ANALYTICS: [
    { path: ROUTES.STATS.DASHBOARD, label: 'navigation.statistics' },
  ],
} as const;

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Check if a route is public (doesn't require authentication)
 */
export const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
};

/**
 * Check if a route is protected (requires authentication)
 */
export const isProtectedRoute = (path: string): boolean => {
  return !isPublicRoute(path);
};

/**
 * Get breadcrumb items for a given route
 */
export const getBreadcrumbsForRoute = (path: string): Array<{ label: string; path: string }> => {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: 'navigation.home', path: ROUTES.HOME },
  ];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip numeric IDs in breadcrumbs
    if (/^\d+$/.test(segment)) {
      continue;
    }

    breadcrumbs.push({
      label: `navigation.${segment}`,
      path: currentPath,
    });
  }

  return breadcrumbs;
};

// ====================================================================
// TYPE EXPORTS
// ====================================================================

export type RouteKeys = keyof typeof ROUTES;
export type RouteValues = (typeof ROUTES)[RouteKeys];
