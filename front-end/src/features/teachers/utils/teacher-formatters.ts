/**
 * Teacher Formatters
 *
 * Utility functions for formatting teacher-related data.
 * Pure functions with single responsibility.
 */

/**
 * Formats a date string to French locale format
 * @param dateString - ISO date string or date-compatible string
 * @returns Formatted date string (dd/mm/yyyy)
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("fr-FR");
  } catch {
    return dateString;
  }
};

/**
 * Formats teacher's full name
 * @param firstName - Teacher's first name
 * @param lastName - Teacher's last name
 * @returns Full name formatted as "FirstName LastName"
 */
export const formatTeacherName = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Formats teacher's status label
 * @param active - Whether teacher is active
 * @returns Localized status label
 */
export const formatTeacherStatus = (active: boolean): string => {
  return active ? "Actif" : "Inactif";
};

/**
 * Formats teacher search terms for matching
 * @param searchValue - Raw search input
 * @returns Normalized lowercase trimmed search term
 */
export const normalizeSearchTerm = (searchValue: string): string => {
  return searchValue.toLowerCase().trim();
};

/**
 * Creates a searchable string from teacher data
 * @param teacher - Teacher object with searchable fields
 * @returns Concatenated searchable string
 */
export const createSearchableString = (teacher: {
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
}): string => {
  const parts = [
    teacher.firstName,
    teacher.lastName,
    teacher.email,
    teacher.specialization || "",
  ];
  return parts.join(" ").toLowerCase();
};

/**
 * Formats a count message for search results
 * @param count - Number of items found
 * @param total - Total number of items
 * @returns Formatted message string
 */
export const formatSearchResultsMessage = (
  count: number,
  total: number
): string => {
  const plural = count > 1 ? "s" : "";
  const foundPlural = count > 1 ? "s" : "";
  return `${count} professeur${plural} trouvé${foundPlural} sur ${total}`;
};

/**
 * Truncates text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};
