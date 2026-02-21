/**
 * Course Formatters
 *
 * Utility functions for formatting course-related data.
 * Pure functions with single responsibility.
 * Supports i18n for day names and localized formatting.
 */

/**
 * Formats a time string to HH:MM format
 * @param timeString - Time string in various formats
 * @returns Formatted time string (HH:MM)
 */
export const formatTime = (timeString: string): string => {
  try {
    // If already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }

    // Handle HH:MM:SS format
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString.substring(0, 5);
    }

    // Handle ISO date format
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return timeString;
  } catch {
    return timeString;
  }
};

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
 * Formats time range for display
 * @param startTime - Start time string
 * @param endTime - End time string
 * @returns Formatted time range (e.g., "10:00 - 11:30")
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

/**
 * Formats course duration in minutes
 * @param startTime - Start time string
 * @param endTime - End time string
 * @returns Duration in minutes
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  try {
    const start = new Date(`1970-01-01T${formatTime(startTime)}:00`);
    const end = new Date(`1970-01-01T${formatTime(endTime)}:00`);
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / 60000);
  } catch {
    return 0;
  }
};

/**
 * Formats duration for display
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "1h30" or "45min")
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
};

/**
 * Normalizes day name to consistent format
 * @param day - Day name in various formats
 * @returns Normalized day name (lowercase, trimmed)
 */
export const normalizeDay = (day: string): string => {
  return day.toLowerCase().trim();
};

/**
 * Maps French day names to English
 */
const DAY_MAP: Record<string, string> = {
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
  dimanche: "sunday",
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
  sunday: "sunday",
};

/**
 * Converts day name to English key for consistent ordering
 * @param day - Day name in French or English
 * @returns English day name
 */
export const getDayKey = (day: string): string => {
  const normalized = normalizeDay(day);
  return DAY_MAP[normalized] || normalized;
};

/**
 * Day ordering for sorting (Monday = 0, Sunday = 6)
 */
const DAY_ORDER: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

/**
 * Gets numeric order for a day
 * @param day - Day name
 * @returns Numeric order (0-6)
 */
export const getDayOrder = (day: string): number => {
  const key = getDayKey(day);
  return DAY_ORDER[key] ?? 999;
};

/**
 * Sorts days in week order
 * @param days - Array of day names
 * @returns Sorted array of day names
 */
export const sortDays = (days: string[]): string[] => {
  return [...days].sort((a, b) => getDayOrder(a) - getDayOrder(b));
};

/**
 * Formats instructor names for display
 * @param instructors - Array of instructor objects
 * @returns Comma-separated instructor names
 */
export const formatInstructorNames = (
  instructors: Array<{ nom?: string; prenom?: string; first_name?: string; last_name?: string }>
): string => {
  if (!instructors || instructors.length === 0) {
    return "Non assigné";
  }

  return instructors
    .map((instructor) => {
      const firstName = instructor.prenom || instructor.first_name || "";
      const lastName = instructor.nom || instructor.last_name || "";
      return `${firstName} ${lastName}`.trim();
    })
    .filter(Boolean)
    .join(", ");
};

/**
 * Creates a searchable string from course data
 * @param course - Course object with searchable fields
 * @returns Concatenated searchable string
 */
export const createCourseSearchableString = (course: {
  type_cours?: string;
  nom?: string;
  jour_semaine?: string;
  jour?: string;
}): string => {
  const parts = [
    course.type_cours || "",
    course.nom || "",
    course.jour_semaine || "",
    course.jour || "",
  ];
  return parts.join(" ").toLowerCase();
};

/**
 * Normalizes search term for matching
 * @param searchValue - Raw search input
 * @returns Normalized lowercase trimmed search term
 */
export const normalizeSearchTerm = (searchValue: string): string => {
  return searchValue.toLowerCase().trim();
};

/**
 * Formats course type for display
 * @param type - Course type code
 * @returns Formatted course type
 */
export const formatCourseType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
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

/**
 * Groups courses by day
 * @param courses - Array of course objects
 * @returns Object with days as keys and course arrays as values
 */
export const groupCoursesByDay = <T extends { jour_semaine?: string; jour?: string }>(
  courses: T[]
): Record<string, T[]> => {
  return courses.reduce((grouped, course) => {
    const day = course.jour_semaine || course.jour || "unknown";
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(course);
    return grouped;
  }, {} as Record<string, T[]>);
};

/**
 * Sorts courses by time within a day
 * @param courses - Array of courses
 * @returns Sorted courses
 */
export const sortCoursesByTime = <T extends { heure_debut: string }>(courses: T[]): T[] => {
  return [...courses].sort((a, b) => {
    const timeA = formatTime(a.heure_debut);
    const timeB = formatTime(b.heure_debut);
    return timeA.localeCompare(timeB);
  });
};

/**
 * Formats search results message
 * @param count - Number of items found
 * @param total - Total number of items
 * @returns Formatted message string
 */
export const formatSearchResultsMessage = (count: number, total: number): string => {
  const plural = count > 1 ? "s" : "";
  const foundPlural = count > 1 ? "s" : "";
  return `${count} cours${plural} trouvé${foundPlural} sur ${total}`;
};
