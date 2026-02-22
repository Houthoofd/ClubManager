/**
 * ====================================================================
 * useUserFilter Hook - Unit Tests
 * ====================================================================
 *
 * Tests for the useUserFilter hook that handles user filtering functionality
 *
 * @see src/features/users/hooks/useUserFilter.ts
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserFilter } from '../../hooks/useUserFilter';
import { User } from '../../components/UserCard/UserCard.types';

/**
 * Mock user data for testing
 */
const mockUsers: User[] = [
  {
    id: 1,
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+32 123 456 789',
    grade: 'Ceinture Noire',
    status: 'active',
    role: 'student',
    avatarUrl: 'https://example.com/avatar1.jpg',
    joinedDate: '2023-01-15',
  },
  {
    id: 2,
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@example.com',
    phone: '+32 987 654 321',
    grade: 'Ceinture Marron',
    status: 'active',
    role: 'teacher',
    avatarUrl: 'https://example.com/avatar2.jpg',
    joinedDate: '2023-02-20',
  },
  {
    id: 3,
    firstName: 'Pierre',
    lastName: 'Dubois',
    email: 'pierre.dubois@example.com',
    phone: '+32 555 666 777',
    grade: 'Ceinture Verte',
    status: 'inactive',
    role: 'student',
    avatarUrl: 'https://example.com/avatar3.jpg',
    joinedDate: '2023-03-10',
  },
  {
    id: 4,
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@example.com',
    grade: 'Ceinture Bleue',
    status: 'active',
    role: 'student',
    joinedDate: '2023-04-05',
  },
  {
    id: 5,
    firstName: 'Thomas',
    lastName: 'Petit',
    email: 'thomas.petit@example.com',
    grade: 'Ceinture Blanche',
    status: 'pending',
    role: 'student',
    joinedDate: '2024-01-10',
  },
  {
    id: 6,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    grade: 'Ceinture Noire',
    status: 'active',
    role: 'admin',
    joinedDate: '2020-01-01',
  },
];

describe('useUserFilter', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    expect(result.current.filters.status).toBe('all');
    expect(result.current.filters.role).toBe('all');
    expect(result.current.filters.grade).toBe('all');
    expect(result.current.filteredUsers).toEqual(mockUsers);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should initialize with custom filters', () => {
    const { result } = renderHook(() =>
      useUserFilter(mockUsers, {
        initialFilters: {
          status: 'active',
          role: 'student',
        },
      })
    );

    expect(result.current.filters.status).toBe('active');
    expect(result.current.filters.role).toBe('student');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should return all users when no filters active', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    expect(result.current.filteredUsers).toHaveLength(mockUsers.length);
    expect(result.current.filteredUsers).toEqual(mockUsers);
  });

  // ============================================================================
  // Status Filter Tests
  // ============================================================================

  it('should filter users by active status', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
    });

    expect(result.current.filteredUsers.every((u) => u.status === 'active')).toBe(true);
    expect(result.current.filteredUsers).toHaveLength(4);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should filter users by inactive status', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('inactive');
    });

    expect(result.current.filteredUsers.every((u) => u.status === 'inactive')).toBe(true);
    expect(result.current.filteredUsers).toHaveLength(1);
  });

  it('should filter users by pending status', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('pending');
    });

    expect(result.current.filteredUsers.every((u) => u.status === 'pending')).toBe(true);
    expect(result.current.filteredUsers).toHaveLength(1);
  });

  it('should return all users when status filter is "all"', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
    });

    expect(result.current.filteredUsers.length).toBeLessThan(mockUsers.length);

    act(() => {
      result.current.setStatusFilter('all');
    });

    expect(result.current.filteredUsers).toHaveLength(mockUsers.length);
  });

  // ============================================================================
  // Role Filter Tests
  // ============================================================================

  it('should filter users by student role', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setRoleFilter('student');
    });

    expect(result.current.filteredUsers.every((u) => u.role === 'student')).toBe(true);
    expect(result.current.filteredUsers).toHaveLength(4);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should filter users by teacher role', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setRoleFilter('teacher');
    });

    expect(result.current.filteredUsers.every((u) => u.role === 'teacher')).toBe(true);
    expect(result.current.filteredUsers).toHaveLength(1);
  });

  it('should filter users by admin role', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setRoleFilter('admin');
    });

    expect(result.current.filteredUsers.every((u) => u.role === 'admin')).toBe(true);
    expect(result.current.filteredUsers).toHaveLength(1);
  });

  it('should return all users when role filter is "all"', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setRoleFilter('student');
    });

    expect(result.current.filteredUsers.length).toBeLessThan(mockUsers.length);

    act(() => {
      result.current.setRoleFilter('all');
    });

    expect(result.current.filteredUsers).toHaveLength(mockUsers.length);
  });

  // ============================================================================
  // Grade Filter Tests
  // ============================================================================

  it('should filter users by grade', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setGradeFilter('Ceinture Noire');
    });

    expect(result.current.filteredUsers.every((u) => u.grade === 'Ceinture Noire')).toBe(true);
    expect(result.current.filteredUsers).toHaveLength(2);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should return all users when grade filter is "all"', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setGradeFilter('Ceinture Noire');
    });

    expect(result.current.filteredUsers.length).toBeLessThan(mockUsers.length);

    act(() => {
      result.current.setGradeFilter('all');
    });

    expect(result.current.filteredUsers).toHaveLength(mockUsers.length);
  });

  // ============================================================================
  // Combined Filters Tests
  // ============================================================================

  it('should apply multiple filters together', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
      result.current.setRoleFilter('student');
    });

    const filtered = result.current.filteredUsers;

    expect(filtered.every((u) => u.status === 'active')).toBe(true);
    expect(filtered.every((u) => u.role === 'student')).toBe(true);
    expect(filtered).toHaveLength(2); // Jean and Sophie
  });

  it('should apply status, role, and grade filters together', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
      result.current.setRoleFilter('student');
      result.current.setGradeFilter('Ceinture Noire');
    });

    const filtered = result.current.filteredUsers;

    expect(filtered.every((u) => u.status === 'active')).toBe(true);
    expect(filtered.every((u) => u.role === 'student')).toBe(true);
    expect(filtered.every((u) => u.grade === 'Ceinture Noire')).toBe(true);
    expect(filtered).toHaveLength(1); // Only Jean
  });

  it('should return empty array when no users match combined filters', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('inactive');
      result.current.setRoleFilter('admin');
    });

    expect(result.current.filteredUsers).toHaveLength(0);
  });

  // ============================================================================
  // Clear Filters Tests
  // ============================================================================

  it('should clear all filters', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
      result.current.setRoleFilter('student');
      result.current.setGradeFilter('Ceinture Noire');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.status).toBe('all');
    expect(result.current.filters.role).toBe('all');
    expect(result.current.filters.grade).toBe('all');
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filteredUsers).toHaveLength(mockUsers.length);
  });

  // ============================================================================
  // hasActiveFilters Tests
  // ============================================================================

  it('should set hasActiveFilters to true when any filter is active', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.setStatusFilter('active');
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should set hasActiveFilters to false when all filters are "all"', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
      result.current.setRoleFilter('student');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  // ============================================================================
  // Get Available Values Tests
  // ============================================================================

  it('should get available roles from users', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    const roles = result.current.getAvailableRoles();

    expect(roles).toContain('student');
    expect(roles).toContain('teacher');
    expect(roles).toContain('admin');
    expect(roles).toHaveLength(3);
  });

  it('should get available statuses from users', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    const statuses = result.current.getAvailableStatuses();

    expect(statuses).toContain('active');
    expect(statuses).toContain('inactive');
    expect(statuses).toContain('pending');
    expect(statuses).toHaveLength(3);
  });

  it('should get available grades from users', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    const grades = result.current.getAvailableGrades();

    expect(grades).toContain('Ceinture Noire');
    expect(grades).toContain('Ceinture Marron');
    expect(grades).toContain('Ceinture Verte');
    expect(grades).toContain('Ceinture Bleue');
    expect(grades).toContain('Ceinture Blanche');
    expect(grades).toHaveLength(5);
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle empty user array', () => {
    const { result } = renderHook(() => useUserFilter([]));

    expect(result.current.filteredUsers).toEqual([]);

    act(() => {
      result.current.setStatusFilter('active');
    });

    expect(result.current.filteredUsers).toEqual([]);
  });

  it('should handle users with missing optional fields', () => {
    const incompleteUsers: User[] = [
      {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        status: 'active',
        joinedDate: '2023-01-01',
      } as User,
    ];

    const { result } = renderHook(() => useUserFilter(incompleteUsers));

    act(() => {
      result.current.setStatusFilter('active');
    });

    expect(result.current.filteredUsers).toHaveLength(1);
  });

  it('should update filtered users when user array changes', () => {
    const { result, rerender } = renderHook(
      ({ users }) => useUserFilter(users),
      {
        initialProps: { users: mockUsers },
      }
    );

    expect(result.current.filteredUsers).toHaveLength(6);

    // Update with fewer users
    const newUsers = mockUsers.slice(0, 3);
    rerender({ users: newUsers });

    expect(result.current.filteredUsers).toHaveLength(3);
  });

  // ============================================================================
  // Performance / Memoization Tests
  // ============================================================================

  it('should memoize filtered users', () => {
    const { result, rerender } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
    });

    const firstFiltered = result.current.filteredUsers;

    // Re-render without changing filters
    rerender();

    const secondFiltered = result.current.filteredUsers;

    // Should return same reference (memoized)
    expect(firstFiltered).toBe(secondFiltered);
  });

  it('should update filtered users when filters change', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    const initial = result.current.filteredUsers;

    act(() => {
      result.current.setStatusFilter('active');
    });

    const updated = result.current.filteredUsers;

    // Should be different reference
    expect(initial).not.toBe(updated);
  });

  // ============================================================================
  // Real-World Scenarios Tests
  // ============================================================================

  it('should work with progressive filtering scenario', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    // Step 1: User selects status
    act(() => {
      result.current.setStatusFilter('active');
    });

    let filtered = result.current.filteredUsers;
    expect(filtered).toHaveLength(4);

    // Step 2: User adds role filter
    act(() => {
      result.current.setRoleFilter('student');
    });

    filtered = result.current.filteredUsers;
    expect(filtered).toHaveLength(2);

    // Step 3: User adds grade filter
    act(() => {
      result.current.setGradeFilter('Ceinture Noire');
    });

    filtered = result.current.filteredUsers;
    expect(filtered).toHaveLength(1);
    expect(filtered[0].firstName).toBe('Jean');

    // Step 4: User clears all
    act(() => {
      result.current.clearFilters();
    });

    filtered = result.current.filteredUsers;
    expect(filtered).toHaveLength(mockUsers.length);
  });

  it('should handle admin filtering active students', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setStatusFilter('active');
      result.current.setRoleFilter('student');
    });

    const filtered = result.current.filteredUsers;

    expect(filtered.every((u) => u.status === 'active' && u.role === 'student')).toBe(true);
    expect(filtered).toHaveLength(2);
  });

  it('should find all black belts', () => {
    const { result } = renderHook(() => useUserFilter(mockUsers));

    act(() => {
      result.current.setGradeFilter('Ceinture Noire');
    });

    const filtered = result.current.filteredUsers;

    expect(filtered).toHaveLength(2);
    expect(filtered.every((u) => u.grade === 'Ceinture Noire')).toBe(true);
  });
});
