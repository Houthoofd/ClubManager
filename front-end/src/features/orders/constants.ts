/**
 * Constants for the Orders feature
 *
 * This file contains all constant values used across the orders domain,
 * including order statuses, payment methods, validation rules, messages, etc.
 */

// ============================================================================
// Order Status
// ============================================================================

/**
 * Available order status values
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const ORDER_STATUS_OPTIONS = Object.values(ORDER_STATUS);

/**
 * Order status display labels
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.PENDING]: 'En attente',
  [ORDER_STATUS.PROCESSING]: 'En cours',
  [ORDER_STATUS.COMPLETED]: 'Complétée',
  [ORDER_STATUS.CANCELLED]: 'Annulée',
  [ORDER_STATUS.REFUNDED]: 'Remboursée',
};

/**
 * Order status colors (for UI badges/chips)
 */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  [ORDER_STATUS.PENDING]: 'orange',
  [ORDER_STATUS.PROCESSING]: 'blue',
  [ORDER_STATUS.COMPLETED]: 'green',
  [ORDER_STATUS.CANCELLED]: 'red',
  [ORDER_STATUS.REFUNDED]: 'purple',
};

/**
 * Order status icons
 */
export const ORDER_STATUS_ICONS: Record<string, string> = {
  [ORDER_STATUS.PENDING]: 'clock',
  [ORDER_STATUS.PROCESSING]: 'sync',
  [ORDER_STATUS.COMPLETED]: 'check-circle',
  [ORDER_STATUS.CANCELLED]: 'times-circle',
  [ORDER_STATUS.REFUNDED]: 'undo',
};

// ============================================================================
// Payment Methods
// ============================================================================

/**
 * Available payment methods
 */
export const PAYMENT_METHODS = {
  CARD: 'card',
  CASH: 'cash',
  TRANSFER: 'transfer',
  STRIPE: 'stripe',
} as const;

export const PAYMENT_METHOD_OPTIONS = Object.values(PAYMENT_METHODS);

/**
 * Payment method display labels
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PAYMENT_METHODS.CARD]: 'Carte bancaire',
  [PAYMENT_METHODS.CASH]: 'Espèces',
  [PAYMENT_METHODS.TRANSFER]: 'Virement',
  [PAYMENT_METHODS.STRIPE]: 'Stripe',
};

/**
 * Payment method icons
 */
export const PAYMENT_METHOD_ICONS: Record<string, string> = {
  [PAYMENT_METHODS.CARD]: 'credit-card',
  [PAYMENT_METHODS.CASH]: 'money-bill',
  [PAYMENT_METHODS.TRANSFER]: 'exchange-alt',
  [PAYMENT_METHODS.STRIPE]: 'stripe',
};

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Minimum order amount (in euros)
 */
export const MIN_ORDER_AMOUNT = 1;

/**
 * Maximum order amount (in euros)
 */
export const MAX_ORDER_AMOUNT = 10000;

/**
 * Maximum items per order
 */
export const MAX_ITEMS_PER_ORDER = 50;

/**
 * Minimum quantity per item
 */
export const MIN_ITEM_QUANTITY = 1;

/**
 * Maximum quantity per item
 */
export const MAX_ITEM_QUANTITY = 100;

// ============================================================================
// UI Constants
// ============================================================================

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Page size options
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Table columns configuration
 */
export const ORDER_TABLE_COLUMNS = [
  { key: 'id', label: 'N°', sortable: true },
  { key: 'user_name', label: 'Client', sortable: true },
  { key: 'total_amount', label: 'Montant', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'payment_method', label: 'Paiement', sortable: false },
  { key: 'created_at', label: 'Date', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
] as const;

/**
 * Date range filter presets
 */
export const DATE_RANGE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom',
} as const;

/**
 * Date range preset labels
 */
export const DATE_RANGE_PRESET_LABELS: Record<string, string> = {
  [DATE_RANGE_PRESETS.TODAY]: "Aujourd'hui",
  [DATE_RANGE_PRESETS.YESTERDAY]: 'Hier',
  [DATE_RANGE_PRESETS.THIS_WEEK]: 'Cette semaine',
  [DATE_RANGE_PRESETS.LAST_WEEK]: 'Semaine dernière',
  [DATE_RANGE_PRESETS.THIS_MONTH]: 'Ce mois-ci',
  [DATE_RANGE_PRESETS.LAST_MONTH]: 'Mois dernier',
  [DATE_RANGE_PRESETS.THIS_YEAR]: 'Cette année',
  [DATE_RANGE_PRESETS.CUSTOM]: 'Personnalisé',
};

// ============================================================================
// Messages
// ============================================================================

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'La commande a été créée avec succès !',
  ORDER_UPDATED: 'La commande a été mise à jour avec succès !',
  ORDER_CANCELLED: 'La commande a été annulée avec succès !',
  ORDER_REFUNDED: 'La commande a été remboursée avec succès !',
  STATUS_UPDATED: 'Le statut de la commande a été mis à jour avec succès !',
  PAYMENT_PROCESSED: 'Le paiement a été traité avec succès !',
  EMAIL_SENT: 'Email de confirmation envoyé au client.',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  ORDER_NOT_FOUND: 'Commande introuvable.',
  INVALID_AMOUNT: 'Montant invalide.',
  INVALID_STATUS: 'Statut invalide.',
  EMPTY_CART: 'Le panier est vide.',
  INSUFFICIENT_STOCK: 'Stock insuffisant pour un ou plusieurs articles.',
  PAYMENT_FAILED: 'Le paiement a échoué.',
  REFUND_FAILED: 'Le remboursement a échoué.',
  CANNOT_CANCEL: 'Cette commande ne peut pas être annulée.',
  CANNOT_REFUND: 'Cette commande ne peut pas être remboursée.',
  LOADING_ERROR: 'Erreur lors du chargement des commandes.',
  SAVE_ERROR: "Erreur lors de l'enregistrement.",
  UPDATE_ERROR: 'Erreur lors de la mise à jour.',
  PERMISSION_DENIED: "Vous n'avez pas les permissions nécessaires.",
};

/**
 * Warning messages
 */
export const WARNING_MESSAGES = {
  PENDING_PAYMENT: 'Paiement en attente.',
  LOW_STOCK: 'Stock faible pour certains articles.',
  LARGE_ORDER: 'Commande importante - vérifiez la disponibilité.',
  OLD_ORDER: 'Cette commande date de plus de 30 jours.',
  NO_PAYMENT_METHOD: 'Aucune méthode de paiement sélectionnée.',
};

/**
 * Confirmation messages
 */
export const CONFIRMATION_MESSAGES = {
  CANCEL_ORDER: 'Êtes-vous sûr de vouloir annuler cette commande ?',
  REFUND_ORDER: 'Êtes-vous sûr de vouloir rembourser cette commande ?',
  DELETE_ORDER: 'Êtes-vous sûr de vouloir supprimer cette commande ?',
  UPDATE_STATUS: 'Êtes-vous sûr de vouloir modifier le statut de cette commande ?',
  PROCESS_PAYMENT: 'Confirmer le traitement du paiement ?',
};

/**
 * Info messages
 */
export const INFO_MESSAGES = {
  NO_ORDERS: 'Aucune commande trouvée.',
  FILTER_ACTIVE: 'Filtres actifs appliqués.',
  LOADING_ORDERS: 'Chargement des commandes...',
  PROCESSING_PAYMENT: 'Traitement du paiement en cours...',
};

// ============================================================================
// API/GraphQL Constants
// ============================================================================

/**
 * Query keys for React Query cache
 */
export const QUERY_KEYS = {
  ORDERS: 'orders',
  ORDER_DETAILS: 'order-details',
  USER_ORDERS: 'user-orders',
  ORDER_STATS: 'order-stats',
  PENDING_ORDERS: 'pending-orders',
  COMPLETED_ORDERS: 'completed-orders',
} as const;

/**
 * Mutation keys
 */
export const MUTATION_KEYS = {
  CREATE_ORDER: 'create-order',
  UPDATE_ORDER: 'update-order',
  UPDATE_STATUS: 'update-order-status',
  CANCEL_ORDER: 'cancel-order',
  REFUND_ORDER: 'refund-order',
  DELETE_ORDER: 'delete-order',
  PROCESS_PAYMENT: 'process-payment',
} as const;

/**
 * Cache invalidation delay (ms)
 */
export const CACHE_INVALIDATION_DELAY = 500;

/**
 * Polling interval for pending orders (ms)
 */
export const PENDING_ORDERS_POLLING_INTERVAL = 30000; // 30 seconds

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature flags for orders module
 */
export const FEATURES = {
  ENABLE_AUTO_REFUND: false,
  ENABLE_ORDER_TRACKING: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_SMS_NOTIFICATIONS: false,
  ENABLE_INVOICE_GENERATION: true,
  ENABLE_ORDER_EXPORT: true,
  ENABLE_BULK_ACTIONS: true,
} as const;

// ============================================================================
// Export all constants as a single object (optional convenience export)
// ============================================================================

export const ORDERS_CONSTANTS = {
  ORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_ICONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,
  MIN_ORDER_AMOUNT,
  MAX_ORDER_AMOUNT,
  MAX_ITEMS_PER_ORDER,
  MIN_ITEM_QUANTITY,
  MAX_ITEM_QUANTITY,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  ORDER_TABLE_COLUMNS,
  DATE_RANGE_PRESETS,
  DATE_RANGE_PRESET_LABELS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  CONFIRMATION_MESSAGES,
  INFO_MESSAGES,
  QUERY_KEYS,
  MUTATION_KEYS,
  CACHE_INVALIDATION_DELAY,
  PENDING_ORDERS_POLLING_INTERVAL,
  FEATURES,
} as const;
