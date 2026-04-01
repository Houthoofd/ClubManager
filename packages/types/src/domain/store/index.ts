/**
 * Store Domain Types Index
 * Exports centralisés de tous les types du domaine Store
 */

// Category (catégories d'articles)
export * from "./Category.types.js";

// Size (tailles d'articles)
export * from "./Size.types.js";

// Article (articles de la boutique)
export * from "./Article.types.js";

// Image (images additionnelles des articles)
export * from "./Image.types.js";

// Stock (gestion des stocks par article et taille)
export * from "./Stock.types.js";

// Order (commandes)
export * from "./Order.types.js";

// OrderItem (articles dans les commandes)
export * from "./OrderItem.types.js";

// StockMovement (mouvements de stock)
export * from "./StockMovement.types.js";

/**
 * Re-export des types les plus utilisés
 */

// Category
export type {
  Category,
  CategoryWithRelations,
  CategoryWithStats,
  CategoryWithArticles,
  CategoryPublic,
  CategoryBasic,
  CategoryListItem,
  CategoryMenuItem,
} from "./Category.types.js";

// Size
export type {
  Size,
  SizeWithRelations,
  SizeWithStats,
  SizeWithArticles,
  SizePublic,
  SizeBasic,
  SizeListItem,
  SizeOption,
  SizeWithAvailability,
} from "./Size.types.js";

// Article
export type {
  Article,
  ArticleWithRelations,
  ArticleWithImages,
  ArticleWithStocks,
  ArticleWithStats,
  ArticlePublic,
  ArticleBasic,
  ArticleListItem,
  ArticleCatalogItem,
  ArticleDetail,
  ArticleCartItem,
  ArticleWithSizeAvailability,
  ArticleSummary,
} from "./Article.types.js";

// Image
export type {
  Image,
  ImageWithRelations,
  ImageWithArticle,
  ImagePublic,
  ImageBasic,
  ImageListItem,
  ImageGalleryItem,
  ImageWithMetadata,
  ImageUploadData,
  ImageSorted,
} from "./Image.types.js";

// Stock
export type {
  Stock,
  StockWithRelations,
  StockWithDetails,
  StockWithStatus,
  StockWithHistory,
  StockPublic,
  StockBasic,
  StockListItem,
  StockInventoryItem,
  StockLowItem,
  StockGroupedByArticle,
  StockGroupedBySize,
  StockAvailability,
  StockStats,
  StockSummary,
  StockAdjustment,
  StockReplenishmentSuggestion,
} from "./Stock.types.js";

// Order
export type {
  Order,
  OrderWithRelations,
  OrderWithItems,
  OrderWithDetails,
  OrderPublic,
  OrderBasic,
  OrderListItem,
  OrderHistoryItem,
  OrderDetail,
  OrderCart,
  OrderStats,
  OrderMonthlySummary,
  OrderDailySummary,
  OrderWithUser,
  OrderExport,
  OrderWithArticleDetails,
  OrderNotification,
} from "./Order.types.js";

// OrderItem
export type {
  OrderItem,
  OrderItemWithRelations,
  OrderItemWithDetails,
  OrderItemWithOrder,
  OrderItemPublic,
  OrderItemBasic,
  OrderItemListItem,
  OrderItemCart,
  OrderItemReceipt,
  OrderItemStats,
  OrderItemGroupedByArticle,
  OrderItemGroupedBySize,
  OrderItemExport,
  OrderItemWithStockValidation,
  OrderItemSummary,
  OrderItemNotification,
  OrderItemsBySummary,
  OrderItemPriceUpdate,
} from "./OrderItem.types.js";

// StockMovement
export type {
  StockMovement,
  StockMovementWithRelations,
  StockMovementWithDetails,
  StockMovementPublic,
  StockMovementBasic,
  StockMovementListItem,
  StockMovementHistoryItem,
  StockMovementGroupedByType,
  StockMovementGroupedByArticle,
  StockMovementGroupedByDate,
  StockMovementExport,
  StockMovementStats,
  StockMovementMonthlySummary,
  StockMovementWithValue,
  StockMovementAudit,
  StockMovementTimeline,
} from "./StockMovement.types.js";

// Re-export constants and enums from Order and StockMovement
export {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "./Order.types.js";

export {
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPE_COLORS,
  STOCK_MOVEMENT_TYPE_ICONS,
} from "./StockMovement.types.js";
