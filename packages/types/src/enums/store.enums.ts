/**
 * @file Store Domain Enums
 * @description Enums for store domain (orders, stock movements, etc.)
 */

/**
 * Order status enum
 * Maps to ENUM in commandes.statut
 */
export enum OrderStatus {
  PENDING = 'en_attente',
  PAID = 'payee',
  SHIPPED = 'expediee',
  DELIVERED = 'livree',
  CANCELLED = 'annulee',
}

/**
 * Stock movement type enum
 * Maps to ENUM in mouvements_stock.type_mouvement
 */
export enum StockMovementType {
  ORDER = 'commande',
  DELIVERY = 'livraison',
  CANCELLATION = 'annulation',
  RETURN = 'retour',
  ADJUSTMENT = 'ajustement',
  INVENTORY = 'inventaire',
}

/**
 * All valid order statuses as array
 */
export const ORDER_STATUSES = Object.values(OrderStatus) as [string, ...string[]];

/**
 * All valid stock movement types as array
 */
export const STOCK_MOVEMENT_TYPES = Object.values(StockMovementType) as [string, ...string[]];
