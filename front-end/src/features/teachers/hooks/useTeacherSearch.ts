/**
 * useTeacherSearch Hook
 *
 * Custom hook for managing teacher search functionality.
 * Handles search input state and filtering logic.
 */

import { useState, useMemo } from "react";
import type { TeacherListItem } from "@clubmanager/types";
import { createSearchableString, normalizeSearchTerm } from "../utils/teacher-formatters";

export interface UseTeacherSearchOptions {
  /** Initial search value */
  initialValue?: string;
}

export interface UseTeacherSearchReturn {
  /** Current search value */
  searchValue: string;

  /** Set search value */
  setSearchValue: (value: string) => void;

  /** Clear search */
  clearSearch: () => void;

  /** Filter teachers based on search */
  filterTeachers: (teachers: TeacherListItem[]) => TeacherListItem[];

  /** Whether search is active */
  hasSearch: boolean;
}

/**
 * Hook for managing teacher search
 * @param options - Configuration options
 * @returns Search state and methods
 */
export const useTeacherSearch = (options: UseTeacherSearchOptions = {}): UseTeacherSearchReturn => {
  const { initialValue = "" } = options;

  const [searchValue, setSearchValue] = useState<string>(initialValue);

  const hasSearch = useMemo(() => {
    return searchValue.trim().length > 0;
  }, [searchValue]);

  const clearSearch = () => {
    setSearchValue("");
  };

  const filterTeachers = useMemo(() => {
    return (teachers: TeacherListItem[]): TeacherListItem[] => {
      if (!hasSearch) {
        return teachers;
      }

      const searchTerm = normalizeSearchTerm(searchValue);

      return teachers.filter((teacher) => {
        const searchableText = createSearchableString({
          firstName: teacher.first_name,
          lastName: teacher.last_name,
          email: teacher.email,
          specialization: teacher.specialization,
        });

        return searchableText.includes(searchTerm);
      });
    };
  }, [searchValue, hasSearch]);

  return {
    searchValue,
    setSearchValue,
    clearSearch,
    filterTeachers,
    hasSearch,
  };
};

export default useTeacherSearch;
