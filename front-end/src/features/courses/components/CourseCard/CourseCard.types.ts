/**
 * CourseCard Component Types
 *
 * Type definitions for the CourseCard component
 */

export interface Instructor {
  /** Instructor ID */
  id?: number | string;

  /** Last name (French convention) */
  nom?: string;

  /** First name (French convention) */
  prenom?: string;

  /** First name (English convention) */
  first_name?: string;

  /** Last name (English convention) */
  last_name?: string;
}

export interface CourseCardProps {
  /** Unique course identifier */
  id: string | number;

  /** Course type (e.g., "Yoga", "Pilates") */
  type: string;

  /** Optional course name (if different from type) */
  name?: string;

  /** Day of the week */
  day?: string;

  /** Start time (HH:MM or ISO format) */
  startTime: string;

  /** End time (HH:MM or ISO format) */
  endTime: string;

  /** Array of instructors teaching this course */
  instructors?: Instructor[];

  /** Optional click handler */
  onClick?: (courseId: string | number) => void;

  /** Optional actions menu (kebab, buttons, etc.) */
  actions?: React.ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Whether to show the day information */
  showDay?: boolean;
}

export interface CourseCardHeaderProps {
  type: string;
  name?: string;
  actions?: React.ReactNode;
}

export interface CourseCardInfoProps {
  day?: string;
  startTime: string;
  endTime: string;
  instructors: Instructor[];
  showDay?: boolean;
}
