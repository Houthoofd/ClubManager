/**
 * ====================================================================
 * STATS SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour les statistiques et analytics.
 * Gère les KPIs, tendances, agrégations, comparaisons temporelles.
 *
 * @module features/stats/services
 */

// ============================================================================
// Types
// ============================================================================

export interface KPI {
  label: string;
  value: number;
  unit?: string;
  trend?: TrendDirection;
  changePercentage?: number;
  changeValue?: number;
  icon?: string;
  color?: string;
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface PeriodComparison {
  currentPeriod: {
    label: string;
    value: number;
    data: TimeSeriesData[];
  };
  previousPeriod: {
    label: string;
    value: number;
    data: TimeSeriesData[];
  };
  change: number;
  changePercentage: number;
  trend: TrendDirection;
}

export interface CategoryDistribution {
  category: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface DashboardStats {
  kpis: KPI[];
  revenue: {
    total: number;
    trend: TrendDirection;
    byMonth: TimeSeriesData[];
  };
  users: {
    total: number;
    active: number;
    new: number;
    trend: TrendDirection;
  };
  sessions: {
    total: number;
    completed: number;
    averageOccupancy: number;
    trend: TrendDirection;
  };
  products: {
    totalSold: number;
    revenue: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
}

export interface PerformanceMetrics {
  conversionRate: number;
  retentionRate: number;
  churnRate: number;
  averageSessionValue: number;
  customerLifetimeValue: number;
  monthlyRecurringRevenue: number;
}

// ============================================================================
// KPI Calculations
// ============================================================================

/**
 * Calcule un KPI avec tendance
 *
 * @param label - Libellé du KPI
 * @param currentValue - Valeur actuelle
 * @param previousValue - Valeur précédente (pour comparaison)
 * @param unit - Unité (€, %, etc.)
 * @returns KPI complet
 */
export const calculateKPI = (
  label: string,
  currentValue: number,
  previousValue?: number,
  unit?: string
): KPI => {
  const changeValue = previousValue !== undefined ? currentValue - previousValue : undefined;
  const changePercentage =
    previousValue !== undefined && previousValue !== 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : undefined;

  let trend: TrendDirection = 'stable';
  if (changePercentage !== undefined) {
    if (changePercentage > 5) trend = 'up';
    else if (changePercentage < -5) trend = 'down';
  }

  return {
    label,
    value: currentValue,
    unit,
    trend,
    changePercentage: changePercentage ? Math.round(changePercentage * 10) / 10 : undefined,
    changeValue,
  };
};

/**
 * Formate un KPI pour affichage
 *
 * @param kpi - KPI à formater
 * @returns KPI formaté
 */
export const formatKPI = (kpi: KPI): string => {
  const valueStr = kpi.unit ? `${kpi.value} ${kpi.unit}` : kpi.value.toString();
  return valueStr;
};

/**
 * Formate le changement d'un KPI
 *
 * @param kpi - KPI
 * @returns String formaté (ex: "+15.5% (↗)")
 */
export const formatKPIChange = (kpi: KPI): string | null => {
  if (kpi.changePercentage === undefined) return null;

  const sign = kpi.changePercentage >= 0 ? '+' : '';
  const arrow = kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→';

  return `${sign}${kpi.changePercentage}% (${arrow})`;
};

/**
 * Détermine la couleur d'un KPI selon la tendance
 *
 * @param kpi - KPI
 * @param inverse - Inverser les couleurs (ex: baisse = bon pour churn rate)
 * @returns Couleur
 */
export const getKPIColor = (kpi: KPI, inverse: boolean = false): string => {
  if (!kpi.trend) return '#6c757d'; // gray

  const isPositive = kpi.trend === 'up';
  const shouldBeGreen = inverse ? !isPositive : isPositive;

  if (kpi.trend === 'stable') return '#0066cc'; // blue
  return shouldBeGreen ? '#28a745' : '#dc3545'; // green or red
};

// ============================================================================
// Time Series Analysis
// ============================================================================

/**
 * Calcule la moyenne d'une série temporelle
 *
 * @param data - Données temporelles
 * @returns Moyenne
 */
export const calculateAverage = (data: TimeSeriesData[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + item.value, 0);
  return Math.round((sum / data.length) * 100) / 100;
};

/**
 * Calcule le total d'une série temporelle
 *
 * @param data - Données temporelles
 * @returns Total
 */
export const calculateTotal = (data: TimeSeriesData[]): number => {
  return data.reduce((acc, item) => acc + item.value, 0);
};

/**
 * Trouve le maximum d'une série
 *
 * @param data - Données temporelles
 * @returns Valeur max et sa date
 */
export const findMaxValue = (data: TimeSeriesData[]): TimeSeriesData | null => {
  if (data.length === 0) return null;
  return data.reduce((max, current) => (current.value > max.value ? current : max));
};

/**
 * Trouve le minimum d'une série
 *
 * @param data - Données temporelles
 * @returns Valeur min et sa date
 */
export const findMinValue = (data: TimeSeriesData[]): TimeSeriesData | null => {
  if (data.length === 0) return null;
  return data.reduce((min, current) => (current.value < min.value ? current : min));
};

/**
 * Calcule le taux de croissance
 *
 * @param data - Données temporelles (triées par date)
 * @returns Taux de croissance en %
 */
export const calculateGrowthRate = (data: TimeSeriesData[]): number => {
  if (data.length < 2) return 0;

  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;

  if (firstValue === 0) return 0;

  const growthRate = ((lastValue - firstValue) / firstValue) * 100;
  return Math.round(growthRate * 10) / 10;
};

/**
 * Détecte la tendance d'une série temporelle
 *
 * @param data - Données temporelles
 * @returns Tendance
 */
export const detectTrend = (data: TimeSeriesData[]): TrendDirection => {
  if (data.length < 3) return 'stable';

  // Compare les moyennes de la première et deuxième moitié
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstAvg = calculateAverage(firstHalf);
  const secondAvg = calculateAverage(secondHalf);

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
};

/**
 * Calcule une moyenne mobile
 *
 * @param data - Données temporelles
 * @param window - Taille de la fenêtre (défaut: 3)
 * @returns Données lissées
 */
export const calculateMovingAverage = (
  data: TimeSeriesData[],
  window: number = 3
): TimeSeriesData[] => {
  if (data.length < window) return data;

  return data.map((_, index) => {
    const start = Math.max(0, index - Math.floor(window / 2));
    const end = Math.min(data.length, start + window);
    const slice = data.slice(start, end);
    const avg = calculateAverage(slice);

    return {
      date: data[index].date,
      value: Math.round(avg * 100) / 100,
      label: data[index].label,
    };
  });
};

// ============================================================================
// Period Comparison
// ============================================================================

/**
 * Compare deux périodes
 *
 * @param currentData - Données période actuelle
 * @param previousData - Données période précédente
 * @param currentLabel - Label période actuelle
 * @param previousLabel - Label période précédente
 * @returns Comparaison
 */
export const comparePeriods = (
  currentData: TimeSeriesData[],
  previousData: TimeSeriesData[],
  currentLabel: string = 'Période actuelle',
  previousLabel: string = 'Période précédente'
): PeriodComparison => {
  const currentTotal = calculateTotal(currentData);
  const previousTotal = calculateTotal(previousData);

  const change = currentTotal - previousTotal;
  const changePercentage =
    previousTotal !== 0 ? ((change / previousTotal) * 100) : 0;

  let trend: TrendDirection = 'stable';
  if (changePercentage > 5) trend = 'up';
  else if (changePercentage < -5) trend = 'down';

  return {
    currentPeriod: {
      label: currentLabel,
      value: currentTotal,
      data: currentData,
    },
    previousPeriod: {
      label: previousLabel,
      value: previousTotal,
      data: previousData,
    },
    change,
    changePercentage: Math.round(changePercentage * 10) / 10,
    trend,
  };
};

/**
 * Compare mois par mois (année en cours vs année précédente)
 *
 * @param currentYearData - Données année actuelle
 * @param previousYearData - Données année précédente
 * @returns Comparaisons mensuelles
 */
export const compareYearOverYear = (
  currentYearData: TimeSeriesData[],
  previousYearData: TimeSeriesData[]
): Array<{ month: string; current: number; previous: number; change: number }> => {
  const comparisons: Array<{ month: string; current: number; previous: number; change: number }> = [];

  currentYearData.forEach((current, index) => {
    const previous = previousYearData[index];
    if (previous) {
      const change = ((current.value - previous.value) / previous.value) * 100;
      comparisons.push({
        month: current.label || current.date,
        current: current.value,
        previous: previous.value,
        change: Math.round(change * 10) / 10,
      });
    }
  });

  return comparisons;
};

// ============================================================================
// Distribution & Aggregation
// ============================================================================

/**
 * Calcule la distribution par catégorie
 *
 * @param data - Map catégorie -> valeur
 * @returns Distribution avec pourcentages
 */
export const calculateDistribution = (
  data: Record<string, number>
): CategoryDistribution[] => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  if (total === 0) return [];

  return Object.entries(data).map(([category, value]) => ({
    category,
    value,
    percentage: Math.round((value / total) * 100 * 10) / 10,
  }));
};

/**
 * Trie une distribution par valeur
 *
 * @param distribution - Distribution
 * @param order - Ordre de tri
 * @returns Distribution triée
 */
export const sortDistribution = (
  distribution: CategoryDistribution[],
  order: 'asc' | 'desc' = 'desc'
): CategoryDistribution[] => {
  return [...distribution].sort((a, b) => {
    const comparison = a.value - b.value;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Récupère le top N des catégories
 *
 * @param distribution - Distribution
 * @param n - Nombre d'éléments
 * @returns Top N
 */
export const getTopCategories = (
  distribution: CategoryDistribution[],
  n: number = 5
): CategoryDistribution[] => {
  return sortDistribution(distribution, 'desc').slice(0, n);
};

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * Calcule le taux de conversion
 *
 * @param conversions - Nombre de conversions
 * @param visitors - Nombre de visiteurs
 * @returns Taux en %
 */
export const calculateConversionRate = (conversions: number, visitors: number): number => {
  if (visitors === 0) return 0;
  return Math.round((conversions / visitors) * 100 * 10) / 10;
};

/**
 * Calcule le taux de rétention
 *
 * @param retained - Nombre d'utilisateurs retenus
 * @param total - Nombre total d'utilisateurs
 * @returns Taux en %
 */
export const calculateRetentionRate = (retained: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((retained / total) * 100 * 10) / 10;
};

/**
 * Calcule le taux de churn (désabonnement)
 *
 * @param churned - Nombre d'utilisateurs partis
 * @param total - Nombre total d'utilisateurs
 * @returns Taux en %
 */
export const calculateChurnRate = (churned: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((churned / total) * 100 * 10) / 10;
};

/**
 * Calcule la Customer Lifetime Value (CLV)
 *
 * @param averageOrderValue - Valeur moyenne commande
 * @param purchaseFrequency - Fréquence d'achat (par an)
 * @param customerLifespan - Durée de vie client (en années)
 * @returns CLV
 */
export const calculateCLV = (
  averageOrderValue: number,
  purchaseFrequency: number,
  customerLifespan: number
): number => {
  const clv = averageOrderValue * purchaseFrequency * customerLifespan;
  return Math.round(clv * 100) / 100;
};

/**
 * Calcule le revenu récurrent mensuel (MRR)
 *
 * @param activeSubscriptions - Nombre d'abonnements actifs
 * @param averageSubscriptionPrice - Prix moyen abonnement
 * @returns MRR
 */
export const calculateMRR = (
  activeSubscriptions: number,
  averageSubscriptionPrice: number
): number => {
  return Math.round(activeSubscriptions * averageSubscriptionPrice * 100) / 100;
};

/**
 * Calcule toutes les métriques de performance
 *
 * @param data - Données brutes
 * @returns Métriques complètes
 */
export const calculatePerformanceMetrics = (data: {
  conversions: number;
  visitors: number;
  retained: number;
  churned: number;
  totalUsers: number;
  totalRevenue: number;
  totalOrders: number;
  activeSubscriptions: number;
  avgSubscriptionPrice: number;
}): PerformanceMetrics => {
  const conversionRate = calculateConversionRate(data.conversions, data.visitors);
  const retentionRate = calculateRetentionRate(data.retained, data.totalUsers);
  const churnRate = calculateChurnRate(data.churned, data.totalUsers);
  const averageSessionValue = data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0;
  const customerLifetimeValue = calculateCLV(averageSessionValue, 12, 3); // Estimé 12x/an sur 3 ans
  const monthlyRecurringRevenue = calculateMRR(data.activeSubscriptions, data.avgSubscriptionPrice);

  return {
    conversionRate,
    retentionRate,
    churnRate,
    averageSessionValue: Math.round(averageSessionValue * 100) / 100,
    customerLifetimeValue,
    monthlyRecurringRevenue,
  };
};

// ============================================================================
// Formatting
// ============================================================================

/**
 * Formate un nombre avec séparateurs de milliers
 *
 * @param value - Nombre
 * @returns Nombre formaté
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

/**
 * Formate un pourcentage
 *
 * @param value - Valeur (0-100)
 * @param decimals - Nombre de décimales
 * @returns Pourcentage formaté
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formate une devise
 *
 * @param amount - Montant
 * @returns Montant formaté
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Formate un nombre compact (1.2K, 1.5M)
 *
 * @param value - Nombre
 * @returns Nombre compact
 */
export const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // KPI
  calculateKPI,
  formatKPI,
  formatKPIChange,
  getKPIColor,

  // Time Series
  calculateAverage,
  calculateTotal,
  findMaxValue,
  findMinValue,
  calculateGrowthRate,
  detectTrend,
  calculateMovingAverage,

  // Comparisons
  comparePeriods,
  compareYearOverYear,

  // Distribution
  calculateDistribution,
  sortDistribution,
  getTopCategories,

  // Performance
  calculateConversionRate,
  calculateRetentionRate,
  calculateChurnRate,
  calculateCLV,
  calculateMRR,
  calculatePerformanceMetrics,

  // Formatting
  formatNumber,
  formatPercentage,
  formatCurrency,
  formatCompactNumber,
};
