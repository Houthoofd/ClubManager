/**
 * ====================================================================
 * PRODUCT SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour la gestion des produits et du shop.
 * Gère l'inventaire, les prix, les promotions, le panier, etc.
 *
 * @module features/shop/services
 */

// ============================================================================
// Types
// ============================================================================

export interface Product {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  prixPromo?: number;
  stock: number;
  categorie: string;
  image?: string;
  actif: boolean;
  nouveaute?: boolean;
  populaire?: boolean;
  minStock?: number;
  maxQuantiteParCommande?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductFilters {
  search?: string;
  categorie?: string;
  prixMin?: number;
  prixMax?: number;
  inStockOnly?: boolean;
  nouveautes?: boolean;
  promotions?: boolean;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averagePrice: number;
  totalInventoryValue: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

// ============================================================================
// Product Display & Formatting
// ============================================================================

/**
 * Formate le prix d'un produit avec symbole €
 *
 * @param price - Prix en euros
 * @returns Prix formaté (ex: "25,99 €")
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

/**
 * Calcule le pourcentage de réduction
 *
 * @param product - Produit avec prix et prix promo
 * @returns Pourcentage de réduction (0 si pas de promo)
 */
export const getDiscountPercentage = (product: Product): number => {
  if (!product.prixPromo || product.prixPromo >= product.prix) {
    return 0;
  }

  const discount = ((product.prix - product.prixPromo) / product.prix) * 100;
  return Math.round(discount);
};

/**
 * Formate le badge de réduction
 *
 * @param product - Produit
 * @returns String formaté (ex: "-25%") ou null
 */
export const formatDiscountBadge = (product: Product): string | null => {
  const percentage = getDiscountPercentage(product);
  return percentage > 0 ? `-${percentage}%` : null;
};

/**
 * Obtient le prix effectif (promo si disponible, sinon prix normal)
 *
 * @param product - Produit
 * @returns Prix effectif
 */
export const getEffectivePrice = (product: Product): number => {
  return product.prixPromo && product.prixPromo < product.prix
    ? product.prixPromo
    : product.prix;
};

/**
 * Calcule l'économie réalisée avec une promo
 *
 * @param product - Produit
 * @param quantity - Quantité achetée
 * @returns Montant économisé
 */
export const calculateSavings = (product: Product, quantity: number = 1): number => {
  if (!product.prixPromo || product.prixPromo >= product.prix) {
    return 0;
  }

  return (product.prix - product.prixPromo) * quantity;
};

// ============================================================================
// Stock Management
// ============================================================================

/**
 * Vérifie si un produit est en stock
 *
 * @param product - Produit
 * @returns true si stock > 0
 */
export const isInStock = (product: Product): boolean => {
  return product.stock > 0;
};

/**
 * Vérifie si le stock est bas (< minStock ou < 10 par défaut)
 *
 * @param product - Produit
 * @returns true si stock faible
 */
export const isLowStock = (product: Product): boolean => {
  const threshold = product.minStock || 10;
  return product.stock > 0 && product.stock <= threshold;
};

/**
 * Vérifie si le stock est critique (< 5)
 *
 * @param product - Produit
 * @returns true si stock critique
 */
export const isCriticalStock = (product: Product): boolean => {
  return product.stock > 0 && product.stock < 5;
};

/**
 * Calcule le niveau de stock
 *
 * @param product - Produit
 * @returns 'out' | 'critical' | 'low' | 'ok'
 */
export const getStockLevel = (product: Product): 'out' | 'critical' | 'low' | 'ok' => {
  if (product.stock === 0) return 'out';
  if (isCriticalStock(product)) return 'critical';
  if (isLowStock(product)) return 'low';
  return 'ok';
};

/**
 * Formate le statut du stock pour affichage
 *
 * @param product - Produit
 * @returns { label: string, variant: string }
 */
export const formatStockStatus = (
  product: Product
): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } => {
  const level = getStockLevel(product);

  const statusMap = {
    out: { label: 'Rupture de stock', variant: 'danger' as const },
    critical: { label: `Stock critique (${product.stock})`, variant: 'danger' as const },
    low: { label: `Stock faible (${product.stock})`, variant: 'warning' as const },
    ok: { label: `En stock (${product.stock})`, variant: 'success' as const },
  };

  return statusMap[level];
};

/**
 * Vérifie si une quantité peut être achetée
 *
 * @param product - Produit
 * @param quantity - Quantité souhaitée
 * @returns { available: boolean, reason?: string }
 */
export const canPurchaseQuantity = (
  product: Product,
  quantity: number
): { available: boolean; reason?: string } => {
  if (!product.actif) {
    return { available: false, reason: 'Produit non disponible' };
  }

  if (quantity <= 0) {
    return { available: false, reason: 'Quantité invalide' };
  }

  if (quantity > product.stock) {
    return { available: false, reason: `Stock insuffisant (${product.stock} disponible${product.stock > 1 ? 's' : ''})` };
  }

  if (product.maxQuantiteParCommande && quantity > product.maxQuantiteParCommande) {
    return { available: false, reason: `Maximum ${product.maxQuantiteParCommande} par commande` };
  }

  return { available: true };
};

// ============================================================================
// Product Filtering & Sorting
// ============================================================================

/**
 * Filtre les produits selon des critères
 *
 * @param products - Liste de produits
 * @param filters - Critères de filtrage
 * @returns Liste filtrée
 */
export const filterProducts = (products: Product[], filters: ProductFilters): Product[] => {
  return products.filter((product) => {
    // Recherche textuelle (nom, description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nom = product.nom.toLowerCase();
      const desc = product.description?.toLowerCase() || '';

      if (!nom.includes(searchLower) && !desc.includes(searchLower)) {
        return false;
      }
    }

    // Filtre par catégorie
    if (filters.categorie && product.categorie !== filters.categorie) {
      return false;
    }

    // Filtre par prix
    const effectivePrice = getEffectivePrice(product);

    if (filters.prixMin !== undefined && effectivePrice < filters.prixMin) {
      return false;
    }

    if (filters.prixMax !== undefined && effectivePrice > filters.prixMax) {
      return false;
    }

    // Filtre stock disponible uniquement
    if (filters.inStockOnly && !isInStock(product)) {
      return false;
    }

    // Filtre nouveautés
    if (filters.nouveautes && !product.nouveaute) {
      return false;
    }

    // Filtre promotions
    if (filters.promotions && !product.prixPromo) {
      return false;
    }

    return true;
  });
};

/**
 * Trie les produits par prix
 *
 * @param products - Liste de produits
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Liste triée
 */
export const sortProductsByPrice = (products: Product[], order: 'asc' | 'desc' = 'asc'): Product[] => {
  return [...products].sort((a, b) => {
    const priceA = getEffectivePrice(a);
    const priceB = getEffectivePrice(b);

    const comparison = priceA - priceB;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les produits par nom (alphabétique)
 *
 * @param products - Liste de produits
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Liste triée
 */
export const sortProductsByName = (products: Product[], order: 'asc' | 'desc' = 'asc'): Product[] => {
  return [...products].sort((a, b) => {
    const comparison = a.nom.localeCompare(b.nom, 'fr-FR');
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les produits par popularité
 *
 * @param products - Liste de produits
 * @returns Liste triée (populaires en premier)
 */
export const sortProductsByPopularity = (products: Product[]): Product[] => {
  return [...products].sort((a, b) => {
    if (a.populaire && !b.populaire) return -1;
    if (!a.populaire && b.populaire) return 1;
    return 0;
  });
};

// ============================================================================
// Cart Management
// ============================================================================

/**
 * Ajoute un produit au panier
 *
 * @param cart - Panier actuel
 * @param product - Produit à ajouter
 * @param quantity - Quantité à ajouter
 * @returns Nouveau panier
 */
export const addToCart = (cart: CartItem[], product: Product, quantity: number = 1): CartItem[] => {
  const existingItem = cart.find((item) => item.product.id === product.id);

  if (existingItem) {
    // Augmente la quantité si déjà dans le panier
    return cart.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    // Ajoute nouveau produit
    return [...cart, { product, quantity }];
  }
};

/**
 * Met à jour la quantité d'un produit dans le panier
 *
 * @param cart - Panier actuel
 * @param productId - ID du produit
 * @param quantity - Nouvelle quantité
 * @returns Nouveau panier
 */
export const updateCartItemQuantity = (
  cart: CartItem[],
  productId: string,
  quantity: number
): CartItem[] => {
  if (quantity <= 0) {
    // Retire le produit si quantité = 0
    return cart.filter((item) => item.product.id !== productId);
  }

  return cart.map((item) =>
    item.product.id === productId ? { ...item, quantity } : item
  );
};

/**
 * Retire un produit du panier
 *
 * @param cart - Panier actuel
 * @param productId - ID du produit à retirer
 * @returns Nouveau panier
 */
export const removeFromCart = (cart: CartItem[], productId: string): CartItem[] => {
  return cart.filter((item) => item.product.id !== productId);
};

/**
 * Vide complètement le panier
 *
 * @returns Panier vide
 */
export const clearCart = (): CartItem[] => {
  return [];
};

/**
 * Calcule le sous-total du panier (avant réductions et taxes)
 *
 * @param cart - Items du panier
 * @returns Sous-total
 */
export const calculateCartSubtotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => {
    const price = getEffectivePrice(item.product);
    return total + price * item.quantity;
  }, 0);
};

/**
 * Calcule le total des économies (réductions)
 *
 * @param cart - Items du panier
 * @returns Total économisé
 */
export const calculateCartSavings = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => {
    return total + calculateSavings(item.product, item.quantity);
  }, 0);
};

/**
 * Calcule le nombre total d'articles dans le panier
 *
 * @param cart - Items du panier
 * @returns Nombre total d'articles
 */
export const getCartItemCount = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Calcule les taxes (TVA 21% en Belgique)
 *
 * @param subtotal - Sous-total
 * @param taxRate - Taux de TVA (0.21 par défaut)
 * @returns Montant de la TVA
 */
export const calculateTax = (subtotal: number, taxRate: number = 0.21): number => {
  return Math.round(subtotal * taxRate * 100) / 100;
};

/**
 * Calcule le récapitulatif complet du panier
 *
 * @param cart - Items du panier
 * @param discountCode - Code promo optionnel
 * @returns Récapitulatif complet
 */
export const calculateCartSummary = (
  cart: CartItem[],
  discountCode?: { percentage: number } | { amount: number }
): Cart => {
  const subtotal = calculateCartSubtotal(cart);
  const savings = calculateCartSavings(cart);

  let discount = savings;

  // Applique le code promo si fourni
  if (discountCode) {
    if ('percentage' in discountCode) {
      discount += (subtotal * discountCode.percentage) / 100;
    } else {
      discount += discountCode.amount;
    }
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const tax = calculateTax(subtotalAfterDiscount);
  const total = subtotalAfterDiscount + tax;

  return {
    items: cart,
    subtotal,
    discount,
    tax,
    total,
  };
};

/**
 * Valide le panier avant commande
 *
 * @param cart - Items du panier
 * @returns { valid: boolean, errors: string[] }
 */
export const validateCart = (cart: CartItem[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (cart.length === 0) {
    errors.push('Le panier est vide');
  }

  cart.forEach((item) => {
    const check = canPurchaseQuantity(item.product, item.quantity);
    if (!check.available) {
      errors.push(`${item.product.nom}: ${check.reason}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Product Statistics
// ============================================================================

/**
 * Calcule les statistiques des produits
 *
 * @param products - Liste de produits
 * @returns Statistiques agrégées
 */
export const calculateProductStats = (products: Product[]): ProductStats => {
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.actif).length;
  const lowStockProducts = products.filter(isLowStock).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;

  const averagePrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.prix, 0) / products.length
      : 0;

  const totalInventoryValue = products.reduce((sum, p) => sum + p.prix * p.stock, 0);

  return {
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    averagePrice: Math.round(averagePrice * 100) / 100,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
  };
};

/**
 * Groupe les produits par catégorie
 *
 * @param products - Liste de produits
 * @returns Map de catégorie -> produits
 */
export const groupProductsByCategory = (products: Product[]): Record<string, Product[]> => {
  return products.reduce((acc, product) => {
    const category = product.categorie || 'Autres';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
};

/**
 * Obtient les produits les plus populaires
 *
 * @param products - Liste de produits
 * @param limit - Nombre de produits à retourner
 * @returns Produits populaires
 */
export const getPopularProducts = (products: Product[], limit: number = 10): Product[] => {
  return products
    .filter((p) => p.populaire && p.actif)
    .slice(0, limit);
};

/**
 * Obtient les nouveautés
 *
 * @param products - Liste de produits
 * @param limit - Nombre de produits à retourner
 * @returns Nouveaux produits
 */
export const getNewProducts = (products: Product[], limit: number = 10): Product[] => {
  return products
    .filter((p) => p.nouveaute && p.actif)
    .slice(0, limit);
};

/**
 * Obtient les produits en promotion
 *
 * @param products - Liste de produits
 * @returns Produits avec prix promo
 */
export const getPromotionalProducts = (products: Product[]): Product[] => {
  return products.filter((p) => p.prixPromo && p.prixPromo < p.prix && p.actif);
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // Formatting
  formatPrice,
  getDiscountPercentage,
  formatDiscountBadge,
  getEffectivePrice,
  calculateSavings,

  // Stock
  isInStock,
  isLowStock,
  isCriticalStock,
  getStockLevel,
  formatStockStatus,
  canPurchaseQuantity,

  // Filtering & Sorting
  filterProducts,
  sortProductsByPrice,
  sortProductsByName,
  sortProductsByPopularity,

  // Cart
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  calculateCartSubtotal,
  calculateCartSavings,
  getCartItemCount,
  calculateTax,
  calculateCartSummary,
  validateCart,

  // Statistics
  calculateProductStats,
  groupProductsByCategory,
  getPopularProducts,
  getNewProducts,
  getPromotionalProducts,
};
