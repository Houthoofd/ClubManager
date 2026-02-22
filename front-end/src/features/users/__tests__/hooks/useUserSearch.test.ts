/**
 * ====================================================================
 * useUserSearch Hook - Unit Tests
 * ====================================================================
 *
 * Tests for the useUserSearch hook that handles user search functionality
 *
 * @see src/features/users/hooks/useUserSearch.ts
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserSearch } from '../../hooks/useUserSearch';
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
    joinedDate: '2023-04-05',
  },
];

describe('useUserSearch', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with empty search query', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    expect(result?.current?.searchQuery).toBe('');
    expect(result?.current?.isSearching).toBe(false);
    expect(result?.current?.filteredUsers).toEqual(mockUsers);
    expect(result?.current?.resultCount).toBe(mockUsers.length);
  });

  // ============================================================================
  // Search Functionality Tests
  // ============================================================================

  it('should filter users by first name', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('Jean');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].firstName).toBe('Jean');
    expect(result?.current?.isSearching).toBe(true);
    expect(result?.current?.resultCount).toBe(1);
  });

  it('should filter users by last name', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('Martin');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].lastName).toBe('Martin');
  });

  it('should filter users by email', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('pierre.dubois');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].email).toBe('pierre.dubois@example.com');
  });

  it('should search case-insensitively by default', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('MARIE');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].firstName).toBe('Marie');
  });

  it('should search in full name (first + last)', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('Sophie Bernard');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].id).toBe(4);
  });

  it('should return empty array when no matches found', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('NonExistentUser');
    });

    expect(result?.current?.filteredUsers).toHaveLength(0);
    expect(result?.current?.resultCount).toBe(0);
  });

  it('should return all users when search query is cleared', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    // First set a search query
    act(() => {
      result.current.setSearchQuery('Jean');
    });
    expect(result?.current?.filteredUsers).toHaveLength(1);

    // Then clear it
    act(() => {
      result.current.clearSearch();
    });

    expect(result?.current?.searchQuery).toBe('');
    expect(result?.current?.filteredUsers).toHaveLength(mockUsers.length);
    expect(result?.current?.isSearching).toBe(false);
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  it('should respect case-sensitive search when configured', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useUserSearch(mockUsers, { caseSensitive: true })
    );

    act(() => {
      result.current.setSearchQuery('MARIE');
    });

    expect(result?.current?.filteredUsers).toHaveLength(0);

    act(() => {
      result.current.setSearchQuery('Marie');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
  });

  it('should respect minimum search length', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useUserSearch(mockUsers, { minSearchLength: 3 })
    );

    // Query too short
    act(() => {
      result.current.setSearchQuery('Je');
    });

    expect(result?.current?.filteredUsers).toEqual(mockUsers);
    expect(result?.current?.isSearching).toBe(false);

    // Query long enough
    act(() => {
      result.current.setSearchQuery('Jean');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result?.current?.isSearching).toBe(true);
  });

  it('should search only in specified fields', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useUserSearch(mockUsers, {
        searchFields: ['email'], // Only search in email
      })
    );

    // Should NOT find by first name
    act(() => {
      result.current.setSearchQuery('Jean');
    });
    expect(result?.current?.filteredUsers).toHaveLength(0);

    // Should find by email
    act(() => {
      result.current.setSearchQuery('jean.dupont');
    });
    expect(result?.current?.filteredUsers).toHaveLength(1);
  });

  it('should search in phone field when included', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useUserSearch(mockUsers, {
        searchFields: ['firstName', 'lastName', 'email', 'phone'],
      })
    );

    act(() => {
      result.current.setSearchQuery('123 456');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].phone).toBe('+32 123 456 789');
  });

  it('should search in grade field when included', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useUserSearch(mockUsers, {
        searchFields: ['firstName', 'lastName', 'email', 'grade'],
      })
    );

    act(() => {
      result.current.setSearchQuery('Ceinture Noire');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].grade).toBe('Ceinture Noire');
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle empty user array', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch([]));

    act(() => {
      result.current.setSearchQuery('test');
    });

    expect(result?.current?.filteredUsers).toEqual([]);
    expect(result?.current?.resultCount).toBe(0);
  });

  it('should handle users with missing optional fields', () => {
    const usersWithMissingFields: User[] = [
      {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        status: 'active',
        joinedDate: '2023-01-01',
      },
    ];

    let result: any;
      try {
        const hookResult = renderHook(() =>
      useUserSearch(usersWithMissingFields, {
        searchFields: ['firstName', 'lastName', 'email', 'phone', 'grade'],
      })
    );

    act(() => {
      result.current.setSearchQuery('Test');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
  });

  it('should handle special characters in search query', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('jean.dupont@example.com');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].email).toBe('jean.dupont@example.com');
  });

  it('should update results when user array changes', () => {
    const { result, rerender } = renderHook(
      ({ users }) => useUserSearch(users),
      {
        initialProps: { users: mockUsers },
      }
    );

    act(() => {
      result.current.setSearchQuery('Jean');
    });
    expect(result?.current?.filteredUsers).toHaveLength(1);

    // Update with new users array
    const newUsers = [...mockUsers, {
      id: 5,
      firstName: 'Jean',
      lastName: 'Nouveau',
      email: 'jean.nouveau@example.com',
      status: 'active',
      joinedDate: '2023-05-01',
    }];

    rerender({ users: newUsers });

    expect(result?.current?.filteredUsers).toHaveLength(2);
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  it('should memoize filtered results', () => {
    const { result, rerender } = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('Jean');
    });

    const firstResult = result.current.filteredUsers;

    // Re-render without changing search query
    rerender();

    const secondResult = result.current.filteredUsers;

    // Should return same reference (memoized)
    expect(firstResult).toBe(secondResult);
  });

  it('should handle multiple rapid search updates', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchQuery('J');
    });
    act(() => {
      result.current.setSearchQuery('Je');
    });
    act(() => {
      result.current.setSearchQuery('Jea');
    });
    act(() => {
      result.current.setSearchQuery('Jean');
    });

    expect(result?.current?.filteredUsers).toHaveLength(1);
    expect(result?.current?.searchQuery).toBe('Jean');
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  it('should work with complex multi-field search', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useUserSearch(mockUsers));

    // Search partial match across multiple users
    act(() => {
      result.current.setSearchQuery('mar'); // Matches "Marie" and "Martin"
    });

    expect(result.current.filteredUsers.length).toBeGreaterThan(0);
    expect(
      result.current.filteredUsers.some(
        (u) => u.firstName === 'Marie' || u.lastName === 'Martin'
      )
    ).toBe(true);
  });
});
