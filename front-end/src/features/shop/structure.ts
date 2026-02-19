/**
 * ====================================================================
 * SHOP FEATURE STRUCTURE DOCUMENTATION
 * ====================================================================
 *
 * This file documents the architecture and organization of the shop feature.
 *
 * DIRECTORY STRUCTURE:
 * ====================
 *
 * features/shop/
 * ├── components/           # UI components specific to shop
 * │   ├── CatalogueMagasin.tsx
 * │   ├── CheckoutForm.tsx
 * │   ├── DetailArticleModal.tsx
 * │   ├── FormulaireArticle.tsx
 * │   ├── ListeArticles.tsx
 * │   ├── StripePaymentForm.tsx
 * │   ├── ToolbarMagasin.tsx
 * │   └── index.ts         # Barrel export
 * │
 * ├── pages/               # Route components
 * │   ├── magasin.tsx      # Main shop page
 * │   ├── ajouterArticle.tsx
 * │   ├── panier.tsx       # Cart page
 * │   ├── checkout.tsx     # Checkout page
 * │   ├── success.tsx      # Order success page
 * │   └── index.ts         # Barrel export
 * │
 * ├── hooks/               # Custom hooks for shop logic
 * │   ├── useArticles.ts   # Product/article hooks
 * │   ├── useCommandes.ts  # Order management hooks
 * │   ├── useMagasin.ts    # Shop-related hooks
 * │   ├── usePaiements.ts  # Payment hooks
 * │   └── index.ts         # Barrel export
 * │
 * ├── types/               # TypeScript types & validators
 * │   └── index.ts         # Re-exports from @clubmanager/types + local types
 * │
 * ├── constants.ts         # Feature-specific constants
 * ├── structure.ts         # This file
 * └── index.ts             # Main barrel export for entire feature
 *
 *
 * IMPORT PATTERNS:
 * ================
 *
 * Internal imports (within shop feature):
 *   import { useArticlesParCategorie } from '../hooks/useMagasin';
 *   import { CatalogueMagasin } from '../components';
 *
 * External imports (from other features or shared):
 *   import { RightSidePanel } from '../../../components/common/panel/rightSidePanel';
 *   import { PageHeader } from '../../../components/common/PageHeader';
 *   import { RootState } from '../../../redux/store';
 *
 * Shared package imports:
 *   import type { Products, Orders } from '@clubmanager/types';
 *   import { productsSchema } from '@clubmanager/types';
 *
 * From other parts of the app:
 *   import { useAuth } from '@/features/auth';
 *   import { Button } from '@/shared/components/ui';
 *
 *
 * TYPES & VALIDATION:
 * ===================
 *
 * The shop feature uses types and validators from the shared @clubmanager/types package:
 *
 * - Base types: Products, ProductCategories, Orders, OrderItems
 * - Insert types: ProductsInsert, OrdersInsert, etc.
 * - Update types: ProductsUpdate, OrdersUpdate, etc.
 * - Validators: productsSchema, ordersSchema, etc. (using Zod)
 * - Payment types: StripePaymentIntent, StripeCustomer, etc.
 *
 * Local feature-specific types are defined in types/index.ts:
 * - CartItem: Extended Products with cart-specific properties
 * - ArticleWithCategory: Products joined with category
 * - OrderWithItems: Orders with items array
 *
 *
 * STATE MANAGEMENT:
 * =================
 *
 * This feature uses a HYBRID approach:
 *
 * 1. GraphQL + Apollo Client (Server State - READ):
 *    - Product queries: useGetProductsQuery, useGetProductCategoriesQuery
 *    - Stock queries: useGetStockSizesQuery
 *    - Generated hooks from codegen
 *    - Cache management via Apollo Client
 *    - Location: hooks/useMagasin.ts
 *
 * 2. GraphQL + Apollo Client (Server State - WRITE):
 *    - Product mutations: useCreateProductMutation, useUpdateProductMutation
 *    - Order mutations: useCreateOrderMutation
 *    - Payment mutations: useCreatePaymentIntentMutation
 *    - Auto-refetch queries after mutations
 *
 * 3. Redux (Client State - Cart/Panier):
 *    - Cart state: redux/slices/panierSlice
 *    - Actions: ajouterArticle, supprimerArticle, modifierQuantite, viderPanier
 *    - Selectors: state.panier.articles, state.panier.isOpen
 *    - Persisted in localStorage
 *
 * 4. Local State (Component UI State):
 *    - UI state: modals, dropdowns, form inputs
 *    - Temporary selections: selected product, selected size
 *    - Expanded categories, loading states
 *
 *
 * DATA FLOW:
 * ==========
 *
 * 1. Products Display:
 *    GraphQL Query → useArticlesParCategorie hook → magasin.tsx page → CatalogueMagasin component
 *
 * 2. Add to Cart:
 *    User action → ajouterAuPanier function → Redux dispatch → panierSlice reducer → State update
 *
 * 3. Checkout:
 *    Cart items → CheckoutForm → useCreateOrderMutation → GraphQL mutation → Backend
 *
 * 4. Payment:
 *    Order created → StripePaymentForm → useCreatePaymentIntent → Stripe API → Payment confirmation
 *
 *
 * INTEGRATION POINTS:
 * ===================
 *
 * With Auth Feature:
 *   - User authentication for orders
 *   - Customer/user relationship
 *
 * With Shared Components:
 *   - PageHeader, RightSidePanel, Modal
 *   - Form components, UI elements
 *
 * With Backend (GraphQL):
 *   - Product queries: getProducts, getProductCategories
 *   - Order mutations: createOrder, updateOrderStatus
 *   - Payment mutations: createPaymentIntent, confirmPayment
 *
 * With External Services:
 *   - Stripe for payments
 *   - Image storage for product images
 *
 *
 * MIGRATION NOTES:
 * ================
 *
 * This feature was migrated from REST to GraphQL:
 * - All data fetching now uses Apollo Client hooks
 * - Validators use Zod schemas from @clubmanager/types
 * - Types are shared across frontend/backend via monorepo package
 *
 * Previous structure:
 *   pages/magasin/          → features/shop/pages/
 *   components/magasin/     → features/shop/components/
 *   hooks/shop/             → features/shop/hooks/
 *
 *
 * FUTURE IMPROVEMENTS:
 * ====================
 *
 * - [ ] Add unit tests for hooks
 * - [ ] Add integration tests for checkout flow
 * - [ ] Implement optimistic updates for cart operations
 * - [ ] Add product search/filtering
 * - [ ] Implement product reviews/ratings
 * - [ ] Add inventory management for admins
 * - [ ] Support for product variants (colors, sizes)
 * - [ ] Wishlist functionality
 * - [ ] Order history and tracking
 *
 */

// This file is for documentation purposes only
export {};
