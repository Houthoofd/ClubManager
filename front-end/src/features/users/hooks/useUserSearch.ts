/**
 * useUserSearch Hook
 *
 * Business logic hook for searching and filtering users
 * Provides real-time search across user fields
 */

import { useState, useMemo, useCallback } from 'react';
import { User } from '../components/UserCard/UserCard.types';

/**
 * Search configuration
 */
export interface UserSearchConfig {
  /**
   * Fields to search in
   * @default ['firstName', 'lastName', 'email']
   */
  searchFields?: Array<'firstName' | 'lastName' | 'email' | 'phone' | 'grade'>;

  /**
   * Case sensitive search
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Minimum search length to trigger search
   * @default 0
   */
  minSearchLength?: number;
}

/**
 * Return type for useUserSearch hook
 */
export interface UseUserSearchReturn {
  /**
   * Current search query
   */
  searchQuery: string;

  /**
   * Set search query
   */
  setSearchQuery: (query: string) => void;

  /**
   * Filtered users based on search
   */
  filteredUsers: User[];

  /**
   * Clear search query
   */
  clearSearch: () => void;

  /**
   * Whether search is active
   */
  isSearching: boolean;

  /**
   * Number of results found
   */
  resultCount: number;
}

/**
 * useUserSearch hook
 *
 * @param users - Array of users to search
 * @param config - Search configuration
 * @returns Search state and filtered users
 *
 * @example
 * ```tsx
 * const { searchQuery, setSearchQuery, filteredUsers, clearSearch } = useUserSearch(users);
 *
 * return (
 *   <>
 *     <UserSearch value={searchQuery} onChange={setSearchQuery} />
 *     <UserList users={filteredUsers} />
 *   </>
 * );
 * ```
 */
export const useUserSearch = (
  users: User[],
  config: UserSearchConfig = {}
): UseUserSearchReturn => {
  const {
    searchFields = ['firstName', 'lastName', 'email'],
    caseSensitive = false,
    minSearchLength = 0,
  } = config;

  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filter users based on search query
   */
  const filteredUsers = useMemo(() => {
    // No search query or too short
    if (!searchQuery || searchQuery.length < minSearchLength) {
      return users;
    }

    const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();

    return users.filter((user) => {
      // Search in first name
      if (searchFields.includes('firstName')) {
        const firstName = caseSensitive
          ? user.firstName
          : user.firstName.toLowerCase();
        if (firstName.includes(query)) return true;
      }

      // Search in last name
      if (searchFields.includes('lastName')) {
        const lastName = caseSensitive
          ? user.lastName
          : user.lastName.toLowerCase();
        if (lastName.includes(query)) return true;
      }

      // Search in full name (combined)
      if (searchFields.includes('firstName') && searchFields.includes('lastName')) {
        const fullName = caseSensitive
          ? `${user.firstName} ${user.lastName}`
          : `${user.firstName} ${user.lastName}`.toLowerCase();
        if (fullName.includes(query)) return true;
      }

      // Search in email
      if (searchFields.includes('email')) {
        const email = caseSensitive
          ? user.email
          : user.email.toLowerCase();
        if (email.includes(query)) return true;
      }

      // Search in phone
      if (searchFields.includes('phone') && user.phone) {
        const phone = caseSensitive
          ? user.phone
          : user.phone.toLowerCase();
        if (phone.includes(query)) return true;
      }

      // Search in grade
      if (searchFields.includes('grade') && user.grade) {
        const grade = caseSensitive
          ? user.grade
          : user.grade.toLowerCase();
        if (grade.includes(query)) return true;
      }

      return false;
    });
  }, [users, searchQuery, searchFields, caseSensitive, minSearchLength]);

  /**
   * Clear search query
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  /**
   * Check if search is active
   */
  const isSearching = searchQuery.length >= minSearchLength && searchQuery.length > 0;

  return {
    searchQuery,
    setSearchQuery,
    filteredUsers,
    clearSearch,
    isSearching,
    resultCount: filteredUsers.length,
  };
};

export default useUserSearch;
