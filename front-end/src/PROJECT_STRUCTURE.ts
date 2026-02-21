/**
 * ====================================================================
 * CLUBMANAGER - PROJECT STRUCTURE DOCUMENTATION
 * ====================================================================
 *
 * This file documents the standardized project structure for the
 * ClubManager front-end application. All features should follow
 * this structure for consistency and maintainability.
 *
 * Last updated: Phase 1 - Quick Wins completed
 * ====================================================================
 */

/**
 * ====================================================================
 * PHASE 1 COMPLETION STATUS ✅
 * ====================================================================
 *
 * 1. ✅ Barrel exports created for all features
 *    - All features now have complete index.ts files
 *    - Pages, components, and hooks properly exported
 *
 * 2. ✅ Core constants module created
 *    - routes.ts: Application route paths and navigation helpers
 *    - validation.ts: Global validation rules and regex patterns
 *    - api.ts: API endpoints, HTTP config, error codes
 *    - business.ts: Domain-specific business rules
 *    - index.ts: Central export with quick access exports
 *
 * 3. ✅ Standardized shop and courses features
 *    - Well-organized barrel exports with documentation
 *    - Logical component grouping
 *    - Complete type and constant exports
 */

/**
 * ====================================================================
 * RECOMMENDED FOLDER STRUCTURE
 * ====================================================================
 *
 * src/
 * ├── app/                      # App-level configuration
 * ├── assets/                   # Static assets (images, fonts, etc.)
 * ├── core/                     # ✅ Core application modules
 * │   ├── api/                  # Apollo Client, GraphQL setup
 * │   ├── config/               # Environment configuration
 * │   ├── constants/            # ✅ NEW - Global constants
 * │   │   ├── index.ts          # ✅ Barrel export
 * │   │   ├── routes.ts         # ✅ Route paths
 * │   │   ├── validation.ts     # ✅ Validation rules
 * │   │   ├── api.ts            # ✅ API config & endpoints
 * │   │   └── business.ts       # ✅ Business rules
 * │   ├── i18n/                 # Internationalization
 * │   ├── monitoring/           # Sentry, error tracking
 * │   ├── services/             # Business services
 * │   ├── utils/                # Core utilities
 * │   └── index.ts              # ✅ Updated - Core barrel export
 * │
 * ├── features/                 # ✅ Feature modules (domain-driven)
 * │   ├── auth/                 # ✅ Authentication feature
 * │   │   ├── components/       # ✅ Auth-specific components
 * │   │   │   └── index.ts      # ✅ Components barrel
 * │   │   ├── hooks/            # ✅ Auth hooks
 * │   │   │   └── index.ts      # ✅ Hooks barrel
 * │   │   ├── pages/            # ✅ Auth pages
 * │   │   │   └── index.ts      # ✅ Pages barrel
 * │   │   ├── types/            # Auth TypeScript types
 * │   │   ├── constants.ts      # Auth constants
 * │   │   ├── index.ts          # ✅ Feature barrel export
 * │   │   └── routes.tsx        # Auth routes config
 * │   │
 * │   ├── courses/              # ✅ Courses feature
 * │   │   ├── components/       # ✅ Course components
 * │   │   │   ├── inscription/  # Sub-category components
 * │   │   │   ├── planning/     # Sub-category components
 * │   │   │   └── index.ts      # ✅ NEW - Components barrel
 * │   │   ├── hooks/            # ✅ Course hooks
 * │   │   │   └── index.ts      # ✅ Hooks barrel
 * │   │   ├── pages/            # ✅ Course pages
 * │   │   │   └── index.ts      # ✅ NEW - Pages barrel
 * │   │   ├── types/            # Course types
 * │   │   ├── constants.ts      # Course constants
 * │   │   ├── index.ts          # ✅ IMPROVED - Feature barrel
 * │   │   ├── routes.tsx        # Course routes config
 * │   │   └── types.ts          # Course types
 * │   │
 * │   ├── messages/             # ✅ Messages feature
 * │   │   ├── components/       # ✅ Message components
 * │   │   │   └── index.ts      # ✅ NEW - Components barrel
 * │   │   ├── hooks/            # ✅ Message hooks
 * │   │   │   └── index.ts      # ✅ Hooks barrel
 * │   │   ├── pages/            # ✅ Message pages
 * │   │   │   └── index.ts      # ✅ Pages barrel
 * │   │   ├── constants.ts      # Message constants
 * │   │   ├── index.ts          # ✅ Feature barrel
 * │   │   ├── routes.tsx        # Message routes
 * │   │   └── types.ts          # Message types
 * │   │
 * │   ├── orders/               # ✅ Orders feature
 * │   │   ├── components/       # ✅ Order components
 * │   │   │   └── index.ts      # ✅ NEW - Components barrel
 * │   │   ├── pages/            # ✅ Order pages
 * │   │   │   └── index.ts      # ✅ Pages barrel
 * │   │   ├── constants.ts      # Order constants
 * │   │   ├── index.ts          # ✅ Feature barrel
 * │   │   ├── routes.tsx        # Order routes
 * │   │   └── types.ts          # Order types
 * │   │
 * │   ├── shop/                 # ✅ Shop feature
 * │   │   ├── components/       # ✅ Shop components
 * │   │   │   └── index.ts      # ✅ IMPROVED - Components barrel
 * │   │   ├── hooks/            # ✅ Shop hooks
 * │   │   │   └── index.ts      # ✅ Hooks barrel
 * │   │   ├── pages/            # ✅ Shop pages
 * │   │   │   └── index.ts      # ✅ Pages barrel
 * │   │   ├── types/            # Shop types
 * │   │   ├── constants.ts      # Shop constants
 * │   │   ├── index.ts          # ✅ IMPROVED - Feature barrel
 * │   │   └── routes.tsx        # Shop routes
 * │   │
 * │   ├── stats/                # ✅ Statistics feature
 * │   ├── teachers/             # ✅ Teachers feature
 * │   │   ├── components/       # ✅ Teacher components
 * │   │   │   └── index.ts      # ✅ NEW - Components barrel
 * │   │   ├── hooks/            # ✅ Teacher hooks
 * │   │   │   └── index.ts      # ✅ Hooks barrel
 * │   │   ├── pages/            # ✅ Teacher pages
 * │   │   │   └── index.ts      # ✅ NEW - Pages barrel
 * │   │   ├── constants.ts      # Teacher constants
 * │   │   ├── index.ts          # ✅ Feature barrel
 * │   │   └── routes.tsx        # Teacher routes
 * │   │
 * │   └── users/                # ✅ Users feature
 * │       ├── components/       # ✅ User components
 * │       │   └── index.ts      # ✅ NEW - Components barrel
 * │       ├── hooks/            # ✅ User hooks
 * │       │   └── index.ts      # ✅ Hooks barrel
 * │       ├── pages/            # ✅ User pages
 * │       │   └── index.ts      # ✅ NEW - Pages barrel
 * │       ├── constants.ts      # User constants
 * │       ├── index.ts          # ✅ Feature barrel
 * │       ├── routes.tsx        # User routes
 * │       └── types.ts          # User types
 * │
 * ├── shared/                   # Shared/common modules
 * │   ├── api/                  # Shared API utilities
 * │   ├── components/           # ✅ Shared components
 * │   │   ├── common-legacy/    # Legacy common components
 * │   │   ├── debug/            # Debug components
 * │   │   ├── forms/            # Form components
 * │   │   ├── gestion/          # Management components
 * │   │   ├── layout/           # Layout components
 * │   │   ├── modals/           # Modal components
 * │   │   ├── ui/               # UI primitives (to be expanded)
 * │   │   ├── uploads/          # Upload components
 * │   │   ├── ErrorBoundary.tsx # Error boundary
 * │   │   ├── LanguageSelector.tsx # i18n selector
 * │   │   └── index.ts          # ✅ Shared components barrel
 * │   ├── constants/            # ✅ Shared constants
 * │   │   ├── index.ts          # ✅ Constants barrel
 * │   │   └── validationConstants.ts # Shared validation
 * │   ├── hooks/                # ✅ Shared hooks
 * │   │   ├── utils/            # Utility hooks
 * │   │   └── index.ts          # ✅ Hooks barrel
 * │   ├── types/                # Shared TypeScript types
 * │   ├── utils/                # Shared utilities
 * │   └── index.ts              # ✅ Shared barrel export
 * │
 * ├── store/                    # Zustand stores
 * ├── styles/                   # Global styles
 * └── main.tsx                  # App entry point
 */

/**
 * ====================================================================
 * BARREL EXPORT PATTERN (index.ts)
 * ====================================================================
 *
 * Every feature module and subfolder should have an index.ts file
 * that re-exports its public API. This enables clean imports:
 *
 * ❌ BAD:
 * import { CoursCard } from '@/features/courses/components/CoursCard';
 * import { AddCoursePage } from '@/features/courses/pages/AddCoursePage';
 * import { useCours } from '@/features/courses/hooks/useCours';
 *
 * ✅ GOOD:
 * import { CoursCard, AddCoursePage, useCours } from '@/features/courses';
 *
 * BARREL EXPORT CHECKLIST:
 * □ Every feature has a main index.ts
 * □ components/ subfolder has index.ts
 * □ hooks/ subfolder has index.ts
 * □ pages/ subfolder has index.ts
 * □ types/ subfolder has index.ts (if exists)
 * □ All barrel exports include JSDoc comments
 * □ Exports are grouped logically (e.g., by category)
 */

/**
 * ====================================================================
 * IMPORT PATH ALIASES (@/)
 * ====================================================================
 *
 * The project uses TypeScript path aliases for clean imports:
 *
 * @/app          → src/app
 * @/assets       → src/assets
 * @/core         → src/core
 * @/features     → src/features
 * @/shared       → src/shared
 * @/store        → src/store
 * @/styles       → src/styles
 *
 * USAGE EXAMPLES:
 * import { ROUTES, VALIDATION, API } from '@/core/constants';
 * import { useAuth } from '@/features/auth';
 * import { Button, Modal } from '@/shared/components';
 * import { useToast } from '@/shared/hooks';
 */

/**
 * ====================================================================
 * CORE CONSTANTS MODULE
 * ====================================================================
 *
 * Centralized constants for the entire application.
 * Located in: src/core/constants/
 *
 * MODULES:
 * --------
 *
 * 1. routes.ts - Application routing
 *    - ROUTES: All app route paths
 *    - PUBLIC_ROUTES: Routes accessible without auth
 *    - PROTECTED_ROUTES: Routes requiring authentication
 *    - ROUTE_GROUPS: Navigation menu groups
 *    - Helper functions: isPublicRoute(), getBreadcrumbsForRoute()
 *
 * 2. validation.ts - Validation rules
 *    - VALIDATION: Regex patterns, min/max lengths, formats
 *    - VALIDATION_MESSAGES: i18n keys for error messages
 *    - Helper functions: isValidEmail(), isValidPassword(), etc.
 *
 * 3. api.ts - API configuration
 *    - API: Base URLs, timeouts, retry config, cache settings
 *    - API_ENDPOINTS: All REST/GraphQL endpoints
 *    - HTTP_METHODS, HTTP_STATUS, API_ERROR_CODES
 *    - Helper functions: buildQueryString(), shouldRetryRequest(), etc.
 *
 * 4. business.ts - Business domain rules
 *    - BUSINESS.COURSES: Course-related rules (max participants, etc.)
 *    - BUSINESS.USERS: User/membership rules
 *    - BUSINESS.SHOP: Shop/order rules
 *    - BUSINESS.PAYMENTS: Payment rules and fees
 *    - Helper functions: canEnrollInCourse(), formatPrice(), etc.
 *
 * USAGE:
 * ------
 * import { ROUTES, VALIDATION, API, BUSINESS } from '@/core/constants';
 *
 * // Use in navigation
 * navigate(ROUTES.COURSES.LIST);
 *
 * // Use in validation
 * if (!isValidEmail(email)) { ... }
 *
 * // Use in API calls
 * fetch(`${API.BASE_URL}${API_ENDPOINTS.USERS.LIST}`);
 *
 * // Use in business logic
 * if (participants >= BUSINESS.COURSES.MAX_PARTICIPANTS_PER_COURSE) { ... }
 */

/**
 * ====================================================================
 * FEATURE MODULE STRUCTURE (STANDARD)
 * ====================================================================
 *
 * Each feature should follow this structure:
 *
 * feature-name/
 * ├── components/           # Feature-specific components
 * │   ├── ComponentA.tsx
 * │   ├── ComponentB.tsx
 * │   └── index.ts          # ✅ Barrel export
 * ├── hooks/                # Feature-specific hooks
 * │   ├── useFeature.ts
 * │   └── index.ts          # ✅ Barrel export
 * ├── pages/                # Feature page components
 * │   ├── ListPage.tsx
 * │   ├── DetailPage.tsx
 * │   └── index.ts          # ✅ Barrel export
 * ├── types/                # TypeScript types (optional folder)
 * │   └── index.ts
 * ├── constants.ts          # Feature constants
 * ├── index.ts              # ✅ Main feature barrel export
 * ├── routes.tsx            # Feature routes configuration
 * └── types.ts              # Feature types (if not in folder)
 *
 * NOTES:
 * - hooks-legacy/ folders contain old Redux code (to be cleaned up)
 * - Some features may have additional subfolders (e.g., utils/, services/)
 * - Always create index.ts for subfolders with 2+ files
 */

/**
 * ====================================================================
 * SHARED MODULE GUIDELINES
 * ====================================================================
 *
 * The shared/ folder contains reusable components, hooks, and utilities
 * that are NOT tied to any specific feature.
 *
 * WHAT GOES IN SHARED:
 * - Generic UI components (Button, Input, Modal, etc.)
 * - Layout components (Header, Sidebar, Footer)
 * - Reusable hooks (useDebounce, useLocalStorage, etc.)
 * - Common utilities (formatDate, slugify, etc.)
 * - Shared constants (non-business-specific)
 * - Shared types (generic TypeScript types)
 *
 * WHAT DOES NOT GO IN SHARED:
 * - Feature-specific components
 * - Business logic
 * - Feature-specific hooks
 * - Domain models
 *
 * EXAMPLE:
 * ✅ shared/components/ui/Button.tsx (generic button)
 * ❌ shared/components/CoursCard.tsx (belongs in features/courses)
 */

/**
 * ====================================================================
 * NAMING CONVENTIONS
 * ====================================================================
 *
 * FILES & FOLDERS:
 * - Components: PascalCase (e.g., UserCard.tsx, AddCoursePage.tsx)
 * - Hooks: camelCase with 'use' prefix (e.g., useAuth.ts, useCours.ts)
 * - Utils: camelCase (e.g., formatDate.ts, validation.ts)
 * - Constants: camelCase (e.g., constants.ts, routes.ts)
 * - Types: camelCase (e.g., types.ts, index.ts)
 * - Barrel exports: always index.ts
 *
 * VARIABLES & CONSTANTS:
 * - React components: PascalCase (const Button = () => {})
 * - Hooks: camelCase (const useAuth = () => {})
 * - Constants: UPPER_SNAKE_CASE (const MAX_LENGTH = 100)
 * - Types/Interfaces: PascalCase (type User = {}, interface IConfig)
 * - Regular variables: camelCase (const userName = 'John')
 *
 * EXPORTS:
 * - Prefer named exports for utilities and hooks
 * - Use default exports for components (React best practice)
 * - Always document exports with JSDoc comments
 */

/**
 * ====================================================================
 * NEXT STEPS (PHASE 2 & 3)
 * ====================================================================
 *
 * PHASE 2 - QUALITY (4-6h):
 * □ Create custom reusable hooks in shared/hooks/
 *   - useDebounce, useLocalStorage, useMediaQuery
 *   - usePagination, useSort, useFilter
 * □ Centralize error handling
 *   - Create ErrorBoundary wrapper with Sentry
 *   - Create useErrorHandler hook
 *   - Map GraphQL/API errors to i18n messages
 * □ Create UI primitive components in shared/components/ui/
 *   - Button, Input, Select, Checkbox, Radio
 *   - Modal, Dialog, Tooltip, Popover
 *   - Card, Badge, Alert, Toast
 * □ Add loading states and skeletons
 * □ Create form validation helpers using VALIDATION constants
 *
 * PHASE 3 - ADVANCED (optional):
 * □ Add test fixtures in __fixtures__/
 * □ Create HOCs (withAuth, withPermissions, etc.)
 * □ Separate business logic into services/
 * □ Add E2E tests with Playwright
 * □ Add Storybook for component documentation
 * □ Create CI/CD pipeline (lint, test, build, deploy)
 */

/**
 * ====================================================================
 * BEST PRACTICES CHECKLIST
 * ====================================================================
 *
 * CODE ORGANIZATION:
 * ✅ Use barrel exports (index.ts) everywhere
 * ✅ Group related code in features
 * ✅ Keep shared/ truly generic and reusable
 * ✅ Use @/ path aliases for imports
 * ✅ One component per file (except closely related components)
 *
 * CONSTANTS & CONFIGURATION:
 * ✅ Use ROUTES constants instead of hardcoded paths
 * ✅ Use VALIDATION constants for form validation
 * ✅ Use API constants for endpoints and config
 * ✅ Use BUSINESS constants for domain rules
 * ✅ Never hardcode magic numbers or strings
 *
 * TYPES & VALIDATION:
 * ✅ Define TypeScript types for all data structures
 * ✅ Use strict TypeScript mode
 * ✅ Validate user input with VALIDATION helpers
 * ✅ Handle errors gracefully with try/catch
 *
 * IMPORTS:
 * ✅ Import from barrel exports (@/features/courses)
 * ✅ Import from @/core/constants for all constants
 * ✅ Keep imports organized (core → features → shared → relative)
 * ✅ Avoid circular dependencies
 *
 * DOCUMENTATION:
 * ✅ Add JSDoc comments to all exports
 * ✅ Document complex logic inline
 * ✅ Keep this PROJECT_STRUCTURE.ts updated
 * ✅ No .md or .txt files (use .ts for documentation)
 */

/**
 * ====================================================================
 * QUICK REFERENCE COMMANDS
 * ====================================================================
 *
 * DEV SERVER:
 * npm run dev          # Start development server
 *
 * BUILD:
 * npm run build        # Production build
 * npm run preview      # Preview production build
 *
 * LINTING & FORMATTING:
 * npm run lint         # Run ESLint
 * npm run format       # Format with Prettier
 *
 * TESTING:
 * npm run test         # Run unit tests
 * npm run test:watch   # Run tests in watch mode
 * npm run test:e2e     # Run E2E tests (if configured)
 *
 * TYPE CHECKING:
 * npm run typecheck    # Run TypeScript compiler checks
 *
 * GRAPHQL:
 * npm run codegen      # Generate GraphQL types
 */

// Export an object for runtime access to structure info if needed
export const PROJECT_INFO = {
  name: 'ClubManager Front-End',
  structure: 'Feature-based (domain-driven)',
  phase1Completed: true,
  lastUpdated: new Date().toISOString(),
  features: [
    'auth',
    'courses',
    'messages',
    'orders',
    'shop',
    'stats',
    'teachers',
    'users',
  ] as const,
  coreModules: ['api', 'config', 'constants', 'i18n', 'monitoring', 'services', 'utils'] as const,
} as const;
