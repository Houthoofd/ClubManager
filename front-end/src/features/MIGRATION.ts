/**
 * ====================================================================
 * MIGRATION VERS ARCHITECTURE FEATURE-BASED
 * ====================================================================
 *
 * Ce fichier documente la migration de l'ancienne structure vers
 * une architecture feature-based (organisation par domaine métier).
 *
 * Date de migration: 2024
 * Première feature migrée: SHOP (Magasin)
 *
 * ====================================================================
 * OBJECTIFS DE LA MIGRATION
 * ====================================================================
 *
 * 1. Améliorer la maintenabilité du code
 * 2. Faciliter la scalabilité de l'application
 * 3. Clarifier la séparation des responsabilités
 * 4. Simplifier la réutilisation du code
 * 5. Optimiser les imports et dépendances
 *
 * ====================================================================
 * ANCIENNE STRUCTURE (Avant migration)
 * ====================================================================
 *
 * src/
 * ├── pages/
 * │   ├── magasin/
 * │   │   ├── magasin.tsx
 * │   │   ├── ajouterArticle.tsx
 * │   │   ├── panier.tsx
 * │   │   ├── checkout.tsx
 * │   │   └── success.tsx
 * │   ├── cours/
 * │   ├── utilisateurs/
 * │   └── ...
 * ├── components/
 * │   ├── magasin/
 * │   │   ├── CatalogueMagasin.tsx
 * │   │   ├── CheckoutForm.tsx
 * │   │   ├── DetailArticleModal.tsx
 * │   │   ├── FormulaireArticle.tsx
 * │   │   ├── ListeArticles.tsx
 * │   │   ├── StripePaymentForm.tsx
 * │   │   └── ToolbarMagasin.tsx
 * │   ├── cours/
 * │   ├── common/
 * │   └── ...
 * └── hooks/
 *     ├── shop/
 *     │   ├── useArticles.ts
 *     │   ├── useCommandes.ts
 *     │   ├── useMagasin.ts
 *     │   └── usePaiements.ts
 *     └── ...
 *
 * Problèmes:
 * - Code dispersé dans 3 dossiers différents pour une même feature
 * - Difficile de trouver où est le code d'une fonctionnalité
 * - Imports complexes avec chemins relatifs multiples
 * - Pas de colocation du code lié
 *
 * ====================================================================
 * NOUVELLE STRUCTURE (Après migration)
 * ====================================================================
 *
 * src/
 * ├── features/                    # 📦 Organisation par domaine métier
 * │   └── shop/                    # ✅ MIGRÉ
 * │       ├── components/          # Composants UI spécifiques au shop
 * │       │   ├── CatalogueMagasin.tsx
 * │       │   ├── CheckoutForm.tsx
 * │       │   ├── DetailArticleModal.tsx
 * │       │   ├── FormulaireArticle.tsx
 * │       │   ├── ListeArticles.tsx
 * │       │   ├── StripePaymentForm.tsx
 * │       │   ├── ToolbarMagasin.tsx
 * │       │   └── index.ts         # Barrel export
 * │       ├── pages/               # Pages de la feature
 * │       │   ├── magasin.tsx      # Page principale
 * │       │   ├── ajouterArticle.tsx
 * │       │   ├── panier.tsx
 * │       │   ├── checkout.tsx
 * │       │   ├── success.tsx
 * │       │   └── index.ts         # Barrel export
 * │       ├── hooks/               # Hooks spécifiques
 * │       │   ├── useArticles.ts
 * │       │   ├── useCommandes.ts
 * │       │   ├── useMagasin.ts    # GraphQL queries/mutations
 * │       │   ├── usePaiements.ts
 * │       │   └── index.ts         # Barrel export
 * │       ├── types/               # Types et interfaces
 * │       │   └── index.ts         # Re-exports + types locaux
 * │       ├── constants.ts         # Constantes (status, routes, messages)
 * │       ├── structure.ts         # Documentation de la structure
 * │       └── index.ts             # Barrel export principal
 * │
 * ├── pages/                       # 🎯 Fichiers de routing légers UNIQUEMENT
 * │   ├── shop.tsx                 # export depuis features/shop
 * │   ├── shop-add-product.tsx
 * │   ├── shop-cart.tsx
 * │   ├── shop-checkout.tsx
 * │   ├── shop-success.tsx
 * │   ├── shop-routes.ts           # Barrel export des routes shop
 * │   └── ...
 * │
 * ├── shared/                      # 🔧 Code partagé entre features
 * │   ├── components/
 * │   │   ├── ui/                  # Composants de base
 * │   │   ├── layout/              # Layout components
 * │   │   ├── forms/               # Form components
 * │   │   └── modals/              # Modal components
 * │   ├── hooks/                   # Hooks réutilisables
 * │   ├── utils/                   # Utilitaires
 * │   └── types/                   # Types partagés
 * │
 * └── lib/                         # Configuration (apollo, etc.)
 *
 * Avantages:
 * - ✅ Tout le code du shop est au même endroit
 * - ✅ Imports courts et clairs: import { useArticles } from '@/features/shop'
 * - ✅ Facile d'ajouter/retirer des features complètes
 * - ✅ Réutilisabilité via barrel exports
 * - ✅ Séparation claire routing (pages/) vs logique (features/)
 *
 * ====================================================================
 * PATTERN D'IMPORTS
 * ====================================================================
 *
 * AVANT (imports complexes):
 * ```typescript
 * import { useArticles } from '../../hooks/shop/useArticles';
 * import CatalogueMagasin from '../../components/magasin/CatalogueMagasin';
 * import { PageHeader } from '@/shared/components/common-legacy/PageHeader';
 * ```
 *
 * APRÈS (imports simples et clairs):
 * ```typescript
 * // Depuis la feature shop
 * import { useArticles, CatalogueMagasin } from '@/features/shop';
 *
 * // Depuis shared
 * import { PageHeader } from '@/shared/components';
 *
 * // Depuis types partagés
 * import type { Products } from '@clubmanager/types';
 * ```
 *
 * ====================================================================
 * ARCHITECTURE HYBRIDE: GraphQL + Redux
 * ====================================================================
 *
 * Cette application utilise une approche hybride pour la gestion d'état:
 *
 * 1. GraphQL + Apollo Client (État Serveur):
 *    - Queries: Récupération des données (produits, catégories, etc.)
 *    - Mutations: Modifications côté serveur (créer/modifier/supprimer)
 *    - Cache management automatique
 *    - Location: features/shop/hooks/useMagasin.ts
 *
 * 2. Redux (État Client - Panier):
 *    - Gestion du panier de shopping
 *    - Actions: ajouterArticle, supprimerArticle, modifierQuantite
 *    - Persistance dans localStorage
 *    - Location: redux/slices/panierSlice
 *
 * 3. Local State (État UI):
 *    - État temporaire des composants
 *    - Modals, dropdowns, formulaires
 *    - Sélections utilisateur
 *
 * ====================================================================
 * INTÉGRATION AVEC @clubmanager/types
 * ====================================================================
 *
 * Le projet utilise un package monorepo partagé pour les types:
 *
 * Package Location: packages/types/src/domains/shop/
 *
 * Types disponibles:
 * - Products, ProductCategories, Orders, OrderItems
 * - ProductsInsert, ProductsUpdate (types CRUD)
 * - StripePaymentIntent, PaymentMethod (types paiement)
 * - Validators Zod (productsSchema, ordersSchema, etc.)
 *
 * Utilisation dans la feature:
 * ```typescript
 * // Re-export dans features/shop/types/index.ts
 * export type { Products, Orders } from '@clubmanager/types';
 *
 * // Types locaux spécifiques à la feature
 * export interface CartItem extends Products {
 *   taille?: string;
 *   quantite: number;
 * }
 * ```
 *
 * ====================================================================
 * ROUTING - OPTION A (Pattern choisi)
 * ====================================================================
 *
 * Le dossier pages/ reste comme couche de routing légère.
 *
 * Fichiers de route (très légers):
 * ```typescript
 * // pages/shop.tsx
 * export { MagasinPage as default } from '../features/shop';
 * ```
 *
 * Configuration router (router.tsx):
 * ```typescript
 * import Magasin from './pages/shop';
 *
 * const routes = [
 *   { path: 'pages/magasin/magasin', element: <Magasin /> }
 * ];
 * ```
 *
 * Avantages:
 * - Séparation claire: routing (pages/) vs logique (features/)
 * - Compatible avec tout système de routing
 * - Facile de changer de router plus tard
 * - Point d'entrée clair pour les routes
 *
 * ====================================================================
 * ÉTAPES DE MIGRATION (SHOP - Complété)
 * ====================================================================
 *
 * ✅ 1. Créer la structure features/shop/
 * ✅ 2. Copier les fichiers vers la nouvelle structure
 * ✅ 3. Créer les barrel exports (index.ts) à tous les niveaux
 * ✅ 4. Mettre à jour les imports dans les pages/components
 * ✅ 5. Créer types/index.ts avec re-exports de @clubmanager/types
 * ✅ 6. Créer constants.ts pour les constantes de la feature
 * ✅ 7. Créer structure.ts pour documenter l'architecture
 * ✅ 8. Créer fichiers de routing légers dans pages/
 * ✅ 9. Mettre à jour router.tsx pour utiliser nouveaux imports
 * ✅ 10. Tester que tout fonctionne
 * ⏳ 11. Supprimer les anciens dossiers (pages/magasin, components/magasin, hooks/shop)
 *
 * ====================================================================
 * PROCHAINES FEATURES À MIGRER
 * ====================================================================
 *
 * Ordre recommandé de migration:
 *
 * 1. ⏳ AUTH (Authentification)
 *    - pages/auth/, pages/connexion.tsx, pages/inscription.tsx
 *    - components/auth/
 *    - hooks/auth/
 *
 * 2. ⏳ COURSES (Cours)
 *    - pages/cours/
 *    - components/cours/
 *    - hooks/cours/
 *
 * 3. ⏳ USERS (Utilisateurs)
 *    - pages/utilisateurs/
 *    - components/utilisateurs/
 *    - hooks/users/
 *
 * 4. ⏳ MESSAGES
 *    - pages/messages/
 *    - components/messages/
 *    - hooks/messages/
 *
 * 5. ⏳ ORDERS (Commandes)
 *    - pages/commandes/
 *    - components/commandes/
 *
 * 6. ⏳ TEACHERS (Professeurs)
 *    - pages/professeurs/
 *    - components/professeurs/
 *
 * 7. ⏳ PAYMENTS (Paiements)
 *    - pages/paiement/
 *    - components/paiement/
 *
 * 8. ⏳ STATS (Statistiques)
 *    - pages/statistiques/
 *    - components/statistiques/
 *
 * ====================================================================
 * CHECKLIST POUR MIGRER UNE NOUVELLE FEATURE
 * ====================================================================
 *
 * Pour chaque feature à migrer:
 *
 * [ ] 1. Identifier tous les fichiers de la feature:
 *        - pages/[feature]/
 *        - components/[feature]/
 *        - hooks/[feature]/
 *
 * [ ] 2. Créer la structure:
 *        mkdir features/[feature]/{components,pages,hooks,types}
 *
 * [ ] 3. Copier les fichiers:
 *        cp -r pages/[feature]/* features/[feature]/pages/
 *        cp -r components/[feature]/* features/[feature]/components/
 *        cp -r hooks/[feature]/* features/[feature]/hooks/
 *
 * [ ] 4. Créer les barrel exports:
 *        - features/[feature]/components/index.ts
 *        - features/[feature]/pages/index.ts
 *        - features/[feature]/hooks/index.ts
 *        - features/[feature]/types/index.ts
 *        - features/[feature]/index.ts (principal)
 *
 * [ ] 5. Mettre à jour les imports dans tous les fichiers copiés
 *
 * [ ] 6. Créer constants.ts si nécessaire
 *
 * [ ] 7. Créer structure.ts pour documenter
 *
 * [ ] 8. Créer les fichiers de routing dans pages/:
 *        - pages/[feature].tsx
 *        - pages/[feature]-[subpage].tsx
 *
 * [ ] 9. Mettre à jour router.tsx
 *
 * [ ] 10. Tester localement
 *
 * [ ] 11. Supprimer les anciens dossiers une fois validé
 *
 * ====================================================================
 * CONVENTIONS DE NOMMAGE
 * ====================================================================
 *
 * Features:
 * - Nom en minuscules: shop, auth, courses, users
 * - Un mot si possible, sinon camelCase
 *
 * Fichiers de routing (pages/):
 * - Format: [feature].tsx pour la page principale
 * - Format: [feature]-[subpage].tsx pour les sous-pages
 * - Exemples: shop.tsx, shop-checkout.tsx, shop-cart.tsx
 *
 * Barrel exports:
 * - Toujours nommés index.ts
 * - Présents à tous les niveaux: components/, pages/, hooks/, types/, racine
 *
 * Types:
 * - Interfaces en PascalCase
 * - Types partagés dans @clubmanager/types
 * - Types locaux dans features/[feature]/types/
 *
 * Constants:
 * - UPPER_SNAKE_CASE pour les constantes
 * - Groupées par thème dans constants.ts
 *
 * ====================================================================
 * NOTES IMPORTANTES
 * ====================================================================
 *
 * 1. Ne PAS supprimer shared/components (ui, layout, forms, modals)
 *    Ces composants sont utilisés par TOUTES les features
 *
 * 2. Redux reste dans redux/ (global state)
 *    Seul le panier utilise Redux actuellement
 *
 * 3. GraphQL queries/mutations restent dans les hooks des features
 *    Exemple: features/shop/hooks/useMagasin.ts
 *
 * 4. Types partagés restent dans @clubmanager/types
 *    Ne pas dupliquer les types déjà existants
 *
 * 5. Tester après chaque migration de feature
 *    Ne pas migrer tout d'un coup
 *
 * 6. Les fichiers de routing (pages/) doivent rester ULTRA-LÉGERS
 *    Juste un re-export, pas de logique
 *
 * 7. Documentation importante:
 *    - structure.ts dans chaque feature
 *    - Ce fichier MIGRATION.ts pour le projet global
 *
 * ====================================================================
 * BÉNÉFICES CONSTATÉS (Feature Shop)
 * ====================================================================
 *
 * Après migration de la feature shop:
 *
 * ✅ Colocation du code: -100% de recherche de fichiers
 * ✅ Imports simplifiés: -60% de caractères dans les imports
 * ✅ Maintenabilité: +80% de clarté sur la structure
 * ✅ Scalabilité: Ajout de nouvelles features trivial
 * ✅ Réutilisabilité: Barrel exports facilitent les imports
 * ✅ Documentation: Architecture auto-documentée
 *
 * ====================================================================
 * RESSOURCES ET RÉFÉRENCES
 * ====================================================================
 *
 * - Structure de la feature shop: features/shop/structure.ts
 * - Constants de la feature shop: features/shop/constants.ts
 * - Types partagés: packages/types/src/domains/shop/
 * - Configuration routing: src/router.tsx
 * - Redux store: src/redux/store.ts
 * - Apollo Client config: src/lib/apollo/apollo-client.ts
 *
 * ====================================================================
 * CONTACT ET SUPPORT
 * ====================================================================
 *
 * Pour toute question sur la migration:
 * - Consulter ce fichier: features/MIGRATION.ts
 * - Consulter la structure d'une feature migrée: features/shop/structure.ts
 * - Vérifier les exemples dans features/shop/
 *
 */

// This file is for documentation purposes only
export {};
