/**
 * useUserFilter Hook
 *
 * Business logic hook for filtering users by role, status, and other criteria
 * Provides comprehensive filtering capabilities for user management
 */

import { useState, useMemo, useCallback } from 'react';
import { User } from '../components/UserCard/UserCard.types';
import { UserRole, UserStatus, filterUsersByRole, filterUsersByStatus } from '../utils/user-formatters';

/**
 * Filter state interface
 */
export interface UserFilterState {
  /**
   * Selected role filter
   */
  role: UserRole | 'all';

  /**
   * Selected status filter
   */
  status: UserStatus | 'all';

  /**
   * Grade filter
   */
  grade?: string | 'all';

  /**
   * Subscription filter
   */
  subscription?: string | 'all';

  /**
   * Join date range - start date
   */
  joinDateStart?: Date;

  /**
   * Join date range - end date
   */
  joinDateEnd?: Date;
}

/**
 * Return type for useUserFilter hook
 */
export interface UseUserFilterReturn {
  /**
   * Current filter state
   */
  filters: UserFilterState;

  /**
   * Filtered users based on all active filters
   */
  filteredUsers: User[];

  /**
   * Set role filter
   */
  setRoleFilter: (role: UserRole | 'all') => void;

  /**
   * Set status filter
   */
  setStatusFilter: (status: UserStatus | 'all') => void;

  /**
   * Set grade filter
   */
  setGradeFilter: (grade: string | 'all') => void;

  /**
   * Set subscription filter
   */
  setSubscriptionFilter: (subscription: string | 'all') => void;

  /**
   * Set join date range filter
   */
  setJoinDateRange: (start?: Date, end?: Date) => void;

  /**
   * Clear all filters
   */
  clearFilters: () => void;

  /**
   * Clear specific filter
   */
  clearFilter: (filterKey: keyof UserFilterState) => void;

  /**
   * Whether any filter is active
   */
  hasActiveFilters: boolean;

  /**
   * Number of active filters
   */
  activeFilterCount: number;

  /**
   * Number of results found
   */
  resultCount: number;
}

/**
 * Initial filter state
 */
const initialFilterState: UserFilterState = {
  role: 'all',
  status: 'all',
  grade: 'all',
  subscription: 'all',
  joinDateStart: undefined,
  joinDateEnd: undefined,
};

/**
 * useUserFilter hook
 *
 * @param users - Array of users to filter
 * @returns Filter state and filtered users
 *
 * @example
 * ```tsx
 * const { filters, filteredUsers, setRoleFilter, setStatusFilter, clearFilters } = useUserFilter(users);
 *
 * return (
 *   <>
 *     <Select value={filters.role} onChange={setRoleFilter}>
 *       <option value="all">All Roles</option>
 *       <option value="admin">Admin</option>
 *       <option value="student">Student</option>
 *     </Select>
 *     <UserList users={filteredUsers} />
 *   </>
 * );
 * ```
 */
export const useUserFilter = (users: User[]): UseUserFilterReturn => {
  const [filters, setFilters] = useState<UserFilterState>(initialFilterState);

  /**
   * Filter users based on all active filters
   */
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter by role
    if (filters.role !== 'all') {
      result = filterUsersByRole(result, filters.role);
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = filterUsersByStatus(result, filters.status);
    }

    // Filter by grade
    if (filters.grade && filters.grade !== 'all') {
      result = result.filter((user) => user.grade === filters.grade);
    }

    // Filter by subscription
    if (filters.subscription && filters.subscription !== 'all') {
      result = result.filter((user) => user.subscription === filters.subscription);
    }

    // Filter by join date range
    if (filters.joinDateStart && filters.joinDateEnd) {
      result = result.filter((user) => {
        const userDate = typeof user.createdAt === 'string'
          ? new Date(user.createdAt)
          : user.createdAt;
        return userDate >= filters.joinDateStart! && userDate <= filters.joinDateEnd!;
      });
    } else if (filters.joinDateStart) {
      // Only start date - filter users after start date
      result = result.filter((user) => {
        const userDate = typeof user.createdAt === 'string'
          ? new Date(user.createdAt)
          : user.createdAt;
        return userDate >= filters.joinDateStart!;
      });
    } else if (filters.joinDateEnd) {
      // Only end date - filter users before end date
      result = result.filter((user) => {
        const userDate = typeof user.createdAt === 'string'
          ? new Date(user.createdAt)
          : user.createdAt;
        return userDate <= filters.joinDateEnd!;
      });
    }

    return result;
  }, [users, filters]);

  /**
   * Set role filter
   */
  const setRoleFilter = useCallback((role: UserRole | 'all') => {
    setFilters((prev) => ({ ...prev, role }));
  }, []);

  /**
   * Set status filter
   */
  const setStatusFilter = useCallback((status: UserStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  /**
   * Set grade filter
   */
  const setGradeFilter = useCallback((grade: string | 'all') => {
    setFilters((prev) => ({ ...prev, grade }));
  }, []);

  /**
   * Set subscription filter
   */
  const setSubscriptionFilter = useCallback((subscription: string | 'all') => {
    setFilters((prev) => ({ ...prev, subscription }));
  }, []);

  /**
   * Set join date range filter
   */
  const setJoinDateRange = useCallback((start?: Date, end?: Date) => {
    setFilters((prev) => ({
      ...prev,
      joinDateStart: start,
      joinDateEnd: end,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  /**
   * Clear specific filter
   */
  const clearFilter = useCallback((filterKey: keyof UserFilterState) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: initialFilterState[filterKey],
    }));
  }, []);

  /**
   * Calculate number of active filters
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.role !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.grade && filters.grade !== 'all') count++;
    if (filters.subscription && filters.subscription !== 'all') count++;
    if (filters.joinDateStart || filters.joinDateEnd) count++;
    return count;
  }, [filters]);

  /**
   * Check if any filter is active
   */
  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    filteredUsers,
    setRoleFilter,
    setStatusFilter,
    setGradeFilter,
    setSubscriptionFilter,
    setJoinDateRange,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
    resultCount: filteredUsers.length,
  };
};

export default useUserFilter;
