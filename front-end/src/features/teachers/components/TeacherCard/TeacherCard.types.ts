/**
 * TeacherCard Component Types
 *
 * Type definitions for the TeacherCard component
 */

export interface TeacherCardProps {
  /** Unique teacher identifier */
  id: string;

  /** User ID reference */
  userId: string;

  /** Teacher's first name */
  firstName: string;

  /** Teacher's last name */
  lastName: string;

  /** Teacher's email address */
  email: string;

  /** Teacher's specialization/subject area */
  specialization?: string;

  /** Teacher's biography */
  bio?: string;

  /** Teacher's certifications */
  certifications?: string;

  /** Whether the teacher is currently active */
  active?: boolean;

  /** Date when teacher was hired */
  hireDate?: string;

  /** Optional click handler */
  onClick?: (teacherId: string) => void;

  /** Optional actions menu */
  actions?: React.ReactNode;

  /** Additional CSS classes */
  className?: string;
}

export interface TeacherCardInfoRowProps {
  label: string;
  value: string | number | null | undefined;
}
