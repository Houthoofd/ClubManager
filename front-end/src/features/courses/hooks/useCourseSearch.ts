/**
 * useCourseSearch Hook
 *
 * Custom hook for managing course search functionality.
 * Handles search input state and filtering logic.
 * Fully supports i18n and type-safe operations.
 */

import { useState, useMemo } from "react";
import type { CourseItem } from "../components/CourseList";
import { createCourseSearchableString, normalizeSearchTerm } from "../utils/course-formatters";

export interface UseCourseSearchOptions {
  /** Initial search value */
  initialValue?: string;
}

export interface UseCourseSearchReturn {
  /** Current search value */
  searchValue: string;

  /** Set search value */
  setSearchValue: (value: string) => void;

  /** Clear search */
  clearSearch: () => void;

  /** Filter courses based on search */
  filterCourses: (courses: CourseItem[]) => CourseItem[];

  /** Whether search is active */
  hasSearch: boolean;
}

/**
 * Hook for managing course search
 * @param options - Configuration options
 * @returns Search state and methods
 */
export const useCourseSearch = (
  options: UseCourseSearchOptions = {}
): UseCourseSearchReturn => {
  const { initialValue = "" } = options;

  const [searchValue, setSearchValue] = useState<string>(initialValue);

  const hasSearch = useMemo(() => {
    return searchValue.trim().length > 0;
  }, [searchValue]);

  const clearSearch = () => {
    setSearchValue("");
  };

  const filterCourses = useMemo(() => {
    return (courses: CourseItem[]): CourseItem[] => {
      if (!hasSearch) {
        return courses;
      }

      const searchTerm = normalizeSearchTerm(searchValue);

      return courses.filter((course) => {
        const searchableText = createCourseSearchableString({
          type_cours: course.type_cours,
          nom: course.nom,
          jour_semaine: course.jour_semaine,
          jour: course.jour,
        });

        return searchableText.includes(searchTerm);
      });
    };
  }, [searchValue, hasSearch]);

  return {
    searchValue,
    setSearchValue,
    clearSearch,
    filterCourses,
    hasSearch,
  };
};

export default useCourseSearch;
