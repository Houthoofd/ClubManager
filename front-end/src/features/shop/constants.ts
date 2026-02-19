/**
 * Shop Feature Constants
 */

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Payment Status
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Delivery Methods
export const DELIVERY_METHOD = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  DIGITAL: 'digital',
} as const;

export type DeliveryMethod = typeof DELIVERY_METHOD[keyof typeof DELIVERY_METHOD];

// Stripe Payment Intent Status
export const STRIPE_PAYMENT_STATUS = {
  REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  REQUIRES_ACTION: 'requires_action',
  PROCESSING: 'processing',
  REQUIRES_CAPTURE: 'requires_capture',
  CANCELED: 'canceled',
  SUCCEEDED: 'succeeded',
} as const;

export type StripePaymentStatus = typeof STRIPE_PAYMENT_STATUS[keyof typeof STRIPE_PAYMENT_STATUS];

// Currency
export const CURRENCY = {
  EUR: 'eur',
  USD: 'usd',
} as const;

export const DEFAULT_CURRENCY = CURRENCY.EUR;

// Product Types
export const PRODUCT_TYPE = {
  PHYSICAL: true,
  VIRTUAL: false,
} as const;

// Default values
export const DEFAULT_PRODUCT_QUANTITY = 1;
export const MIN_PRODUCT_QUANTITY = 1;
export const MAX_PRODUCT_QUANTITY = 99;

// Cart
export const CART_STORAGE_KEY = 'panier';
export const PENDING_ORDER_CLEAR_CART_KEY = 'pendingOrderClearCart';
export const LAST_CART_KEY = 'dernierPanier';

// Routes
export const SHOP_ROUTES = {
  SHOP: '/pages/magasin/magasin',
  ADD_PRODUCT: '/pages/magasin/ajouterArticle',
  CART: '/pages/magasin/panier',
  CHECKOUT: '/pages/magasin/checkout',
  SUCCESS: '/pages/magasin/success',
} as const;

// Messages
export const SHOP_MESSAGES = {
  ADD_TO_CART_SUCCESS: 'Article ajouté au panier',
  REMOVE_FROM_CART_SUCCESS: 'Article retiré du panier',
  CART_UPDATED: 'Panier mis à jour',
  ORDER_CREATED_SUCCESS: 'Commande créée avec succès',
  PAYMENT_SUCCESS: 'Paiement effectué avec succès',
  PAYMENT_CANCELLED: 'Paiement annulé',
  PAYMENT_FAILED: 'Échec du paiement',
  OUT_OF_STOCK: 'Produit en rupture de stock',
  INSUFFICIENT_STOCK: 'Stock insuffisant',
} as const;

// Error Messages
export const SHOP_ERRORS = {
  LOAD_PRODUCTS_ERROR: 'Erreur lors du chargement des produits',
  LOAD_CATEGORIES_ERROR: 'Erreur lors du chargement des catégories',
  CREATE_ORDER_ERROR: 'Erreur lors de la création de la commande',
  PAYMENT_ERROR: 'Erreur lors du paiement',
  INVALID_QUANTITY: 'Quantité invalide',
  PRODUCT_NOT_FOUND: 'Produit introuvable',
} as const;

// Stock sizes (if applicable)
export const PRODUCT_SIZES = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
} as const;

export type ProductSize = typeof PRODUCT_SIZES[keyof typeof PRODUCT_SIZES];
