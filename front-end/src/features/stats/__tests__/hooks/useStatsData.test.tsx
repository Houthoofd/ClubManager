/**
 * ====================================================================
 * useStatsData Hook - Unit Tests
 * ====================================================================
 *
 * Tests for the useStatsData hook that loads and computes statistics
 * Includes Apollo GraphQL mocking
 *
 * @see src/features/stats/hooks/useStatsData.ts
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useStatsData } from '../../hooks/useStatsData';
import { ReactNode } from 'react';

  // Test wrapper with Apollo MockedProvider
  const createWrapper = (mocks: any[] = []) => {
    return ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

/**
 * Mock GraphQL response data
 */
const mockStatsData = {
  dashboardStats: {
    users: {
      total: 150,
      active: 120,
      newThisMonth: 25,
      newLastMonth: 20,
    },
    courses: {
      total: 10,
      enrollments: 85,
      sessionsThisWeek: 12,
    },
    revenue: {
      total: 15000,
      thisMonth: 2500,
      lastMonth: 2000,
      byMonth: [
        { month: '2024-01', amount: 1800 },
        { month: '2024-02', amount: 2000 },
        { month: '2024-03', amount: 2500 },
      ],
    },
    orders: {
      total: 300,
      thisMonth: 50,
      lastMonth: 45,
      pending: 5,
      processing: 10,
      completed: 285,
    },
    products: {
      totalSold: 450,
      topProducts: [
        {
          id: '1',
          name: 'Kimono',
          quantitySold: 50,
          revenue: 2500,
        },
        {
          id: '2',
          name: 'Ceinture',
          quantitySold: 80,
          revenue: 1600,
        },
      ],
    },
  },
};

/**
 * GraphQL Query - must match the query in useStatsData
 */
const GET_DASHBOARD_STATS = `
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
 * Helper to create Apollo mocks
 */
const createMocks = (overrides = {}) => [
  {
    request: {
      query: require('graphql-tag').gql(GET_DASHBOARD_STATS),
      variables: { period: 'month' },
    },
    result: {
      data: {
        ...mockStatsData,
        ...overrides,
      },
    },
  },
];

/**
 * Wrapper component for Apollo MockedProvider
 */
const createWrapper = (mocks: any[] = createMocks()) => {
  return ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
    </MockedProvider>
  );
};

describe('useStatsData', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with loading state', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    expect(result?.current?.isLoading).toBe(true);
    expect(result?.current?.data).toBeNull();
    expect(result?.current?.metrics).toBeNull();
    expect(result?.current?.error).toBeNull();
  });

  it('should load data successfully', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.isLoading).toBe(false);
    });

    expect(result?.current?.data).toBeDefined();
    expect(result.current.data?.users.total).toBe(150);
    expect(result.current.data?.revenue.total).toBe(15000);
    expect(result?.current?.error).toBeNull();
  });

  // ============================================================================
  // Computed Metrics Tests
  // ============================================================================

  it('should calculate user growth trend correctly', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    expect(result.current.metrics?.userGrowthTrend).toBeDefined();
    expect(result.current.metrics?.userGrowthTrend.value).toBeGreaterThan(0);
    expect(result.current.metrics?.userGrowthTrend.direction).toBe('up');
  });

  it('should calculate revenue growth trend correctly', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    const trend = result.current.metrics?.revenueGrowthTrend;
    expect(trend).toBeDefined();
    expect(trend?.value).toBeGreaterThan(0); // 2500 vs 2000 = +25%
    expect(trend?.direction).toBe('up');
  });

  it('should calculate order growth trend correctly', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    const trend = result.current.metrics?.orderGrowthTrend;
    expect(trend).toBeDefined();
    expect(trend?.value).toBeGreaterThan(0); // 50 vs 45 = +11.1%
  });

  it('should calculate average order value', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    // 15000 total revenue / 300 total orders = 50
    expect(result.current.metrics?.averageOrderValue).toBe(50);
  });

  it('should calculate average revenue per user', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    // 15000 total revenue / 150 total users = 100
    expect(result.current.metrics?.averageRevenuePerUser).toBe(100);
  });

  it('should calculate conversion rate', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    // (300 orders / 150 users) * 100 = 200%
    expect(result.current.metrics?.conversionRate).toBe(200);
  });

  // ============================================================================
  // Overview Stats Tests
  // ============================================================================

  it('should generate overview stats array', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.overviewStats.length).toBeGreaterThan(0);
    });

    expect(result?.current?.overviewStats).toBeInstanceOf(Array);
    expect(result.current.overviewStats.length).toBe(8);
  });

  it('should include total users stat', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.overviewStats.length).toBeGreaterThan(0);
    });

    const usersStat = result.current.overviewStats.find((s) => s.id === 'total-users');
    expect(usersStat).toBeDefined();
    expect(usersStat?.value).toBe(150);
    expect(usersStat?.color).toBe('blue');
    expect(usersStat?.trend).toBeDefined();
  });

  it('should include revenue stat with currency', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.overviewStats.length).toBeGreaterThan(0);
    });

    const revenueStat = result.current.overviewStats.find((s) => s.id === 'total-revenue');
    expect(revenueStat).toBeDefined();
    expect(revenueStat?.value).toBe(15000);
    expect(revenueStat?.isCurrency).toBe(true);
    expect(revenueStat?.currency).toBe('EUR');
  });

  it('should include orders stat with pending count', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.overviewStats.length).toBeGreaterThan(0);
    });

    const ordersStat = result.current.overviewStats.find((s) => s.id === 'total-orders');
    expect(ordersStat).toBeDefined();
    expect(ordersStat?.value).toBe(300);
    expect(ordersStat?.subtitle).toContain('5 pending');
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  it('should accept custom period configuration', async () => {
    const customMocks = [
      {
        request: {
          query: require('graphql-tag').gql(GET_DASHBOARD_STATS),
          variables: { period: 'year' },
        },
        result: { data: mockStatsData },
      },
    ];

    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData({ period: 'year' }), {
      wrapper: createWrapper(customMocks),
    });

    await waitFor(() => {
      expect(result?.current?.isLoading).toBe(false);
    });

    expect(result?.current?.data).toBeDefined();
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  it('should handle GraphQL errors', async () => {
    const errorMocks = [
      {
        request: {
          query: require('graphql-tag').gql(GET_DASHBOARD_STATS),
          variables: { period: 'month' },
        },
        error: new Error('Network error'),
      },
    ];

    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(errorMocks),
    });

    await waitFor(() => {
      expect(result?.current?.isLoading).toBe(false);
    });

    expect(result?.current?.error).toBeDefined();
    expect(result?.current?.data).toBeNull();
    expect(result?.current?.metrics).toBeNull();
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle zero orders gracefully', async () => {
    const zeroOrdersMocks = createMocks({
      dashboardStats: {
        ...mockStatsData.dashboardStats,
        orders: {
          total: 0,
          thisMonth: 0,
          lastMonth: 0,
          pending: 0,
          processing: 0,
          completed: 0,
        },
      },
    });

    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(zeroOrdersMocks),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    expect(result.current.metrics?.averageOrderValue).toBe(0);
  });

  it('should handle zero users gracefully', async () => {
    const zeroUsersMocks = createMocks({
      dashboardStats: {
        ...mockStatsData.dashboardStats,
        users: {
          total: 0,
          active: 0,
          newThisMonth: 0,
          newLastMonth: 0,
        },
      },
    });

    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(zeroUsersMocks),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    expect(result.current.metrics?.averageRevenuePerUser).toBe(0);
    expect(result.current.metrics?.conversionRate).toBe(0);
  });

  it('should handle negative growth trends', async () => {
    const negativeTrendMocks = createMocks({
      dashboardStats: {
        ...mockStatsData.dashboardStats,
        revenue: {
          total: 15000,
          thisMonth: 1500, // Less than last month
          lastMonth: 2000,
          byMonth: [],
        },
      },
    });

    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(negativeTrendMocks),
    });

    await waitFor(() => {
      expect(result?.current?.metrics).toBeDefined();
    });

    const trend = result.current.metrics?.revenueGrowthTrend;
    expect(trend?.direction).toBe('down');
    expect(trend?.value).toBeLessThan(0);
  });

  // ============================================================================
  // Refetch Tests
  // ============================================================================

  it('should provide refetch function', async () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useStatsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result?.current?.isLoading).toBe(false);
    });

    expect(result?.current?.refetch).toBeInstanceOf(Function);
  });
});
