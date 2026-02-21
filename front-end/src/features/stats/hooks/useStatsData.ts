/**
 * useStatsData Hook
 *
 * Business logic hook for loading and calculating statistics data
 * Integrates with GraphQL queries and provides computed metrics
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  calculateTrend,
  calculateAverage,
  calculateSum,
  calculateGrowthRate,
  TrendData,
} from '../utils/stats-formatters';
import { StatItem } from '../components/StatsOverview/StatsOverview.types';

/**
 * GraphQL Query for Dashboard Statistics
 */
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($period: String) {
    dashboardStats(period: $period) {
      users {
        total
        active
        newThisMonth
        newLastMonth
      }
      courses {
        total
        enrollments
        sessionsThisWeek
      }
      revenue {
        total
        thisMonth
        lastMonth
        byMonth
      }
      orders {
        total
        thisMonth
        lastMonth
        pending
        processing
        completed
      }
      products {
        totalSold
        topProducts {
          id
          name
          quantitySold
          revenue
        }
      }
    }
  }
`;

/**
 * Stats data structure
 */
export interface StatsData {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    newLastMonth: number;
  };
  courses: {
    total: number;
    enrollments: number;
    sessionsThisWeek: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    byMonth: Array<{ month: string; amount: number }>;
  };
  orders: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    pending: number;
    processing: number;
    completed: number;
  };
  products: {
    totalSold: number;
    topProducts: Array<{
      id: string;
      name: string;
      quantitySold: number;
      revenue: number;
    }>;
  };
}

/**
 * Computed metrics
 */
export interface ComputedMetrics {
  userGrowthTrend: TrendData;
  revenueGrowthTrend: TrendData;
  orderGrowthTrend: TrendData;
  averageOrderValue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
}

/**
 * Return type for useStatsData hook
 */
export interface UseStatsDataReturn {
  /**
   * Raw statistics data from API
   */
  data: StatsData | null;

  /**
   * Computed metrics and trends
   */
  metrics: ComputedMetrics | null;

  /**
   * Overview stat items ready for StatsOverview component
   */
  overviewStats: StatItem[];

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Refetch data
   */
  refetch: () => void;
}

/**
 * Hook configuration
 */
export interface UseStatsDataConfig {
  /**
   * Time period for statistics
   * @default 'month'
   */
  period?: 'week' | 'month' | 'year' | 'all';

  /**
   * Auto-refresh interval in milliseconds
   * @default undefined (no auto-refresh)
   */
  refreshInterval?: number;

  /**
   * Enable polling
   * @default false
   */
  enablePolling?: boolean;
}

/**
 * useStatsData hook
 *
 * Loads and computes statistics data from GraphQL API
 *
 * @param config - Hook configuration
 * @returns Statistics data, metrics, and loading states
 *
 * @example
 * ```tsx
 * const { data, metrics, overviewStats, isLoading } = useStatsData({
 *   period: 'month',
 *   refreshInterval: 60000,
 * });
 *
 * return (
 *   <>
 *     {isLoading && <Spinner />}
 *     <StatsOverview stats={overviewStats} />
 *   </>
 * );
 * ```
 */
export const useStatsData = (
  config: UseStatsDataConfig = {}
): UseStatsDataReturn => {
  const { period = 'month', refreshInterval, enablePolling = false } = config;

  // GraphQL query
  const { data: queryData, loading, error, refetch } = useQuery(GET_DASHBOARD_STATS, {
    variables: { period },
    fetchPolicy: 'cache-and-network',
    pollInterval: enablePolling ? refreshInterval : undefined,
  });

  const data: StatsData | null = queryData?.dashboardStats || null;

  /**
   * Calculate computed metrics
   */
  const metrics = useMemo((): ComputedMetrics | null => {
    if (!data) return null;

    // User growth trend
    const userGrowthTrend = calculateTrend(
      data.users.newThisMonth,
      data.users.newLastMonth
    );

    // Revenue growth trend
    const revenueGrowthTrend = calculateTrend(
      data.revenue.thisMonth,
      data.revenue.lastMonth
    );

    // Order growth trend
    const orderGrowthTrend = calculateTrend(
      data.orders.thisMonth,
      data.orders.lastMonth
    );

    // Average order value
    const averageOrderValue =
      data.orders.total > 0 ? data.revenue.total / data.orders.total : 0;

    // Average revenue per user
    const averageRevenuePerUser =
      data.users.total > 0 ? data.revenue.total / data.users.total : 0;

    // Conversion rate (orders / users)
    const conversionRate =
      data.users.total > 0 ? (data.orders.total / data.users.total) * 100 : 0;

    return {
      userGrowthTrend,
      revenueGrowthTrend,
      orderGrowthTrend,
      averageOrderValue,
      averageRevenuePerUser,
      conversionRate,
    };
  }, [data]);

  /**
   * Generate overview stat items for dashboard
   */
  const overviewStats = useMemo((): StatItem[] => {
    if (!data || !metrics) return [];

    return [
      {
        id: 'total-users',
        title: 'stats.metrics.totalUsers',
        value: data.users.total,
        color: 'blue',
        trend: metrics.userGrowthTrend,
        subtitle: 'stats.metrics.newMembers',
      },
      {
        id: 'total-revenue',
        title: 'stats.metrics.revenue',
        value: data.revenue.total,
        color: 'green',
        trend: metrics.revenueGrowthTrend,
        isCurrency: true,
        currency: 'EUR',
      },
      {
        id: 'total-orders',
        title: 'stats.metrics.orders',
        value: data.orders.total,
        color: 'purple',
        trend: metrics.orderGrowthTrend,
        subtitle: `${data.orders.pending} pending`,
      },
      {
        id: 'total-courses',
        title: 'stats.metrics.totalCourses',
        value: data.courses.total,
        color: 'cyan',
        subtitle: `${data.courses.enrollments} enrollments`,
      },
      {
        id: 'active-users',
        title: 'stats.metrics.activeUsers',
        value: data.users.active,
        color: 'orange',
      },
      {
        id: 'weekly-sessions',
        title: 'stats.metrics.weeklySessions',
        value: data.courses.sessionsThisWeek,
        color: 'gold',
      },
      {
        id: 'monthly-revenue',
        title: 'stats.metrics.monthlyRevenue',
        value: data.revenue.thisMonth,
        color: 'green',
        trend: metrics.revenueGrowthTrend,
        isCurrency: true,
        currency: 'EUR',
      },
      {
        id: 'average-order-value',
        title: 'stats.metrics.averageValue',
        value: metrics.averageOrderValue,
        color: 'blue',
        isCurrency: true,
        currency: 'EUR',
      },
    ];
  }, [data, metrics]);

  return {
    data,
    metrics,
    overviewStats,
    isLoading: loading,
    error: error || null,
    refetch,
  };
};

export default useStatsData;
