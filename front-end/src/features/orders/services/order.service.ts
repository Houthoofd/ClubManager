/**
 * ====================================================================
 * ORDER SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour la gestion des commandes.
 * Gère les paiements, statuts, calculs, validations, etc.
 *
 * @module features/orders/services
 */

// ============================================================================
// Types
// ============================================================================

export interface Order {
  id: string;
  numeroCommande: string;
  utilisateur: {
    id: string;
    nom: string;
    prenom: string;
    email?: string;
  };
  articles: OrderItem[];
  dateCommande: string;
  statut: OrderStatus;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  methodePaiement?: PaymentMethod;
  notes?: string;
  dateExpiration?: string;
}

export interface OrderItem {
  id: string;
  article: {
    id: string;
    nom: string;
    prix: number;
  };
  quantite: number;
  prixUnitaire: number;
  total: number;
}

export type OrderStatus =
  | 'PENDING'      // En attente
  | 'CONFIRMED'    // Confirmée
  | 'PROCESSING'   // En traitement
  | 'COMPLETED'    // Terminée
  | 'CANCELLED'    // Annulée
  | 'REFUNDED';    // Remboursée

export type PaymentMethod =
  | 'CASH'         // Espèces
  | 'CARD'         // Carte bancaire
  | 'TRANSFER'     // Virement
  | 'ACCOUNT';     // Compte utilisateur

export interface OrderFilters {
  search?: string;
  statut?: OrderStatus;
  methodePaiement?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  utilisateurId?: string;
  minAmount?: number;
  maxAmount?: number;
  onlyUnpaid?: boolean;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalUnpaid: number;
  averageOrderValue: number;
}

export interface PaymentSchedule {
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  pourcentagePaye: number;
  estSolde: boolean;
  estEnRetard: boolean;
}

// ============================================================================
// Order Display & Formatting
// ============================================================================

/**
 * Formate le numéro de commande
 *
 * @param order - Commande
 * @returns Numéro formaté (ex: "CMD-2024-00123")
 */
export const formatOrderNumber = (order: Order): string => {
  return order.numeroCommande || `CMD-${order.id.slice(0, 8)}`;
};

/**
 * Formate le statut de la commande
 *
 * @param statut - Statut de la commande
 * @returns { label: string, variant: string }
 */
export const formatOrderStatus = (
  statut: OrderStatus
): { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' } => {
  const statusMap = {
    PENDING: { label: 'En attente', variant: 'warning' as const },
    CONFIRMED: { label: 'Confirmée', variant: 'info' as const },
    PROCESSING: { label: 'En traitement', variant: 'info' as const },
    COMPLETED: { label: 'Terminée', variant: 'success' as const },
    CANCELLED: { label: 'Annulée', variant: 'danger' as const },
    REFUNDED: { label: 'Remboursée', variant: 'default' as const },
  };

  return statusMap[statut] || { label: statut, variant: 'default' as const };
};

/**
 * Formate la méthode de paiement
 *
 * @param methode - Méthode de paiement
 * @returns Label formaté
 */
export const formatPaymentMethod = (methode?: PaymentMethod): string => {
  const methodMap = {
    CASH: 'Espèces',
    CARD: 'Carte bancaire',
    TRANSFER: 'Virement',
    ACCOUNT: 'Compte utilisateur',
  };

  return methode ? methodMap[methode] : 'Non spécifié';
};

/**
 * Formate la date de commande
 *
 * @param date - Date ISO string
 * @returns Date formatée
 */
export const formatOrderDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formate un montant en euros
 *
 * @param amount - Montant
 * @returns Montant formaté
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// ============================================================================
// Order Calculations
// ============================================================================

/**
 * Calcule le montant total de la commande
 *
 * @param items - Articles de la commande
 * @returns Montant total
 */
export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => total + item.total, 0);
};

/**
 * Calcule le montant restant à payer
 *
 * @param order - Commande
 * @returns Montant restant
 */
export const calculateRemainingAmount = (order: Order): number => {
  return Math.max(0, order.montantTotal - order.montantPaye);
};

/**
 * Calcule le pourcentage payé
 *
 * @param order - Commande
 * @returns Pourcentage (0-100)
 */
export const calculatePaymentPercentage = (order: Order): number => {
  if (order.montantTotal === 0) return 0;
  return Math.round((order.montantPaye / order.montantTotal) * 100);
};

/**
 * Vérifie si la commande est entièrement payée
 *
 * @param order - Commande
 * @returns true si soldée
 */
export const isOrderPaid = (order: Order): boolean => {
  return order.montantPaye >= order.montantTotal;
};

/**
 * Vérifie si la commande a un paiement partiel
 *
 * @param order - Commande
 * @returns true si paiement partiel
 */
export const hasPartialPayment = (order: Order): boolean => {
  return order.montantPaye > 0 && order.montantPaye < order.montantTotal;
};

/**
 * Calcule l'échéancier de paiement
 *
 * @param order - Commande
 * @returns Échéancier
 */
export const calculatePaymentSchedule = (order: Order): PaymentSchedule => {
  const montantRestant = calculateRemainingAmount(order);
  const pourcentagePaye = calculatePaymentPercentage(order);
  const estSolde = isOrderPaid(order);
  const estEnRetard = isOrderOverdue(order);

  return {
    montantTotal: order.montantTotal,
    montantPaye: order.montantPaye,
    montantRestant,
    pourcentagePaye,
    estSolde,
    estEnRetard,
  };
};

// ============================================================================
// Order Status & Validation
// ============================================================================

/**
 * Vérifie si la commande est en attente
 *
 * @param order - Commande
 * @returns true si en attente
 */
export const isPending = (order: Order): boolean => {
  return order.statut === 'PENDING';
};

/**
 * Vérifie si la commande est terminée
 *
 * @param order - Commande
 * @returns true si terminée
 */
export const isCompleted = (order: Order): boolean => {
  return order.statut === 'COMPLETED';
};

/**
 * Vérifie si la commande est annulée
 *
 * @param order - Commande
 * @returns true si annulée
 */
export const isCancelled = (order: Order): boolean => {
  return order.statut === 'CANCELLED';
};

/**
 * Vérifie si la commande est en retard de paiement
 *
 * @param order - Commande
 * @returns true si en retard
 */
export const isOrderOverdue = (order: Order): boolean => {
  if (!order.dateExpiration || isOrderPaid(order)) return false;

  const now = new Date();
  const expirationDate = new Date(order.dateExpiration);
  return now > expirationDate;
};

/**
 * Calcule le nombre de jours avant expiration
 *
 * @param order - Commande
 * @returns Nombre de jours (négatif si expiré)
 */
export const getDaysUntilExpiration = (order: Order): number | null => {
  if (!order.dateExpiration) return null;

  const now = new Date();
  const expirationDate = new Date(order.dateExpiration);
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Vérifie si la commande peut être modifiée
 *
 * @param order - Commande
 * @returns { canEdit: boolean, reason?: string }
 */
export const canEditOrder = (order: Order): { canEdit: boolean; reason?: string } => {
  if (order.statut === 'COMPLETED') {
    return { canEdit: false, reason: 'Commande déjà terminée' };
  }

  if (order.statut === 'CANCELLED') {
    return { canEdit: false, reason: 'Commande annulée' };
  }

  if (order.statut === 'REFUNDED') {
    return { canEdit: false, reason: 'Commande remboursée' };
  }

  return { canEdit: true };
};

/**
 * Vérifie si la commande peut être annulée
 *
 * @param order - Commande
 * @returns { canCancel: boolean, reason?: string }
 */
export const canCancelOrder = (order: Order): { canCancel: boolean; reason?: string } => {
  if (order.statut === 'COMPLETED') {
    return { canCancel: false, reason: 'Commande déjà terminée' };
  }

  if (order.statut === 'CANCELLED') {
    return { canCancel: false, reason: 'Commande déjà annulée' };
  }

  if (order.montantPaye > 0) {
    return { canCancel: false, reason: 'Un paiement a déjà été effectué. Demander un remboursement.' };
  }

  return { canCancel: true };
};

/**
 * Vérifie si la commande peut être remboursée
 *
 * @param order - Commande
 * @returns { canRefund: boolean, reason?: string }
 */
export const canRefundOrder = (order: Order): { canRefund: boolean; reason?: string } => {
  if (order.statut === 'REFUNDED') {
    return { canRefund: false, reason: 'Commande déjà remboursée' };
  }

  if (order.montantPaye === 0) {
    return { canRefund: false, reason: 'Aucun paiement à rembourser' };
  }

  return { canRefund: true };
};

/**
 * Détermine le prochain statut possible
 *
 * @param currentStatus - Statut actuel
 * @returns Liste des statuts possibles
 */
export const getNextPossibleStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  const statusWorkflow: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  };

  return statusWorkflow[currentStatus] || [];
};

// ============================================================================
// Order Filtering & Sorting
// ============================================================================

/**
 * Filtre les commandes selon des critères
 *
 * @param orders - Liste de commandes
 * @param filters - Critères de filtrage
 * @returns Commandes filtrées
 */
export const filterOrders = (orders: Order[], filters: OrderFilters): Order[] => {
  return orders.filter((order) => {
    // Recherche textuelle (numéro, utilisateur)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const numero = formatOrderNumber(order).toLowerCase();
      const userName = `${order.utilisateur.prenom} ${order.utilisateur.nom}`.toLowerCase();

      if (!numero.includes(searchLower) && !userName.includes(searchLower)) {
        return false;
      }
    }

    // Filtre par statut
    if (filters.statut && order.statut !== filters.statut) {
      return false;
    }

    // Filtre par méthode de paiement
    if (filters.methodePaiement && order.methodePaiement !== filters.methodePaiement) {
      return false;
    }

    // Filtre par date
    if (filters.dateFrom && new Date(order.dateCommande) < new Date(filters.dateFrom)) {
      return false;
    }

    if (filters.dateTo && new Date(order.dateCommande) > new Date(filters.dateTo)) {
      return false;
    }

    // Filtre par utilisateur
    if (filters.utilisateurId && order.utilisateur.id !== filters.utilisateurId) {
      return false;
    }

    // Filtre par montant
    if (filters.minAmount !== undefined && order.montantTotal < filters.minAmount) {
      return false;
    }

    if (filters.maxAmount !== undefined && order.montantTotal > filters.maxAmount) {
      return false;
    }

    // Filtre par impayés uniquement
    if (filters.onlyUnpaid && isOrderPaid(order)) {
      return false;
    }

    return true;
  });
};

/**
 * Trie les commandes par date
 *
 * @param orders - Liste de commandes
 * @param order - Ordre de tri
 * @returns Commandes triées
 */
export const sortOrdersByDate = (orders: Order[], order: 'asc' | 'desc' = 'desc'): Order[] => {
  return [...orders].sort((a, b) => {
    const dateA = new Date(a.dateCommande).getTime();
    const dateB = new Date(b.dateCommande).getTime();

    const comparison = dateA - dateB;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les commandes par montant
 *
 * @param orders - Liste de commandes
 * @param order - Ordre de tri
 * @returns Commandes triées
 */
export const sortOrdersByAmount = (orders: Order[], order: 'asc' | 'desc' = 'desc'): Order[] => {
  return [...orders].sort((a, b) => {
    const comparison = a.montantTotal - b.montantTotal;
    return order === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// Order Statistics
// ============================================================================

/**
 * Calcule les statistiques des commandes
 *
 * @param orders - Liste de commandes
 * @returns Statistiques
 */
export const calculateOrderStats = (orders: Order[]): OrderStats => {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(isPending).length;
  const completedOrders = orders.filter(isCompleted).length;
  const cancelledOrders = orders.filter(isCancelled).length;

  const totalRevenue = orders
    .filter((o) => o.statut !== 'CANCELLED' && o.statut !== 'REFUNDED')
    .reduce((sum, o) => sum + o.montantTotal, 0);

  const totalUnpaid = orders
    .filter((o) => o.statut !== 'CANCELLED' && o.statut !== 'REFUNDED')
    .reduce((sum, o) => sum + calculateRemainingAmount(o), 0);

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalUnpaid: Math.round(totalUnpaid * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
  };
};

/**
 * Groupe les commandes par statut
 *
 * @param orders - Liste de commandes
 * @returns Map statut -> commandes
 */
export const groupOrdersByStatus = (orders: Order[]): Record<OrderStatus, Order[]> => {
  return orders.reduce((acc, order) => {
    if (!acc[order.statut]) {
      acc[order.statut] = [];
    }
    acc[order.statut].push(order);
    return acc;
  }, {} as Record<OrderStatus, Order[]>);
};

/**
 * Groupe les commandes par utilisateur
 *
 * @param orders - Liste de commandes
 * @returns Map userId -> commandes
 */
export const groupOrdersByUser = (orders: Order[]): Record<string, Order[]> => {
  return orders.reduce((acc, order) => {
    const userId = order.utilisateur.id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);
};

/**
 * Obtient les commandes en retard de paiement
 *
 * @param orders - Liste de commandes
 * @returns Commandes en retard
 */
export const getOverdueOrders = (orders: Order[]): Order[] => {
  return orders.filter(isOrderOverdue);
};

/**
 * Obtient les commandes avec paiement partiel
 *
 * @param orders - Liste de commandes
 * @returns Commandes avec paiement partiel
 */
export const getPartiallyPaidOrders = (orders: Order[]): Order[] => {
  return orders.filter(hasPartialPayment);
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // Formatting
  formatOrderNumber,
  formatOrderStatus,
  formatPaymentMethod,
  formatOrderDate,
  formatAmount,

  // Calculations
  calculateOrderTotal,
  calculateRemainingAmount,
  calculatePaymentPercentage,
  isOrderPaid,
  hasPartialPayment,
  calculatePaymentSchedule,

  // Status & Validation
  isPending,
  isCompleted,
  isCancelled,
  isOrderOverdue,
  getDaysUntilExpiration,
  canEditOrder,
  canCancelOrder,
  canRefundOrder,
  getNextPossibleStatuses,

  // Filtering & Sorting
  filterOrders,
  sortOrdersByDate,
  sortOrdersByAmount,

  // Statistics
  calculateOrderStats,
  groupOrdersByStatus,
  groupOrdersByUser,
  getOverdueOrders,
  getPartiallyPaidOrders,
};
