/**
 * UserCard Types
 *
 * Type definitions for the UserCard component
 */

import { UserRole, UserStatus } from '../../utils/user-formatters';

/**
 * User type
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  birthDate?: string | Date;
  createdAt: string | Date;
  lastLogin?: string | Date;
  grade?: string;
  subscription?: string;
  bio?: string;
}

/**
 * Props for UserCard component
 */
export interface UserCardProps {
  /**
   * User data
   */
  user: User;

  /**
   * Click handler for viewing user details
   */
  onView?: (user: User) => void;

  /**
   * Click handler for editing user
   */
  onEdit?: (user: User) => void;

  /**
   * Click handler for deleting user
   */
  onDelete?: (user: User) => void;

  /**
   * Click handler for activating user
   */
  onActivate?: (user: User) => void;

  /**
   * Click handler for deactivating user
   */
  onDeactivate?: (user: User) => void;

  /**
   * Show actions buttons
   * @default true
   */
  showActions?: boolean;

  /**
   * Show contact information
   * @default true
   */
  showContact?: boolean;

  /**
   * Show avatar
   * @default true
   */
  showAvatar?: boolean;

  /**
   * Show last login
   * @default false
   */
  showLastLogin?: boolean;

  /**
   * Compact mode (reduced padding and info)
   * @default false
   */
  isCompact?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Selectable mode (shows checkbox)
   * @default false
   */
  isSelectable?: boolean;

  /**
   * Selected state (for selectable mode)
   */
  isSelected?: boolean;

  /**
   * Selection change handler
   */
  onSelect?: (user: User, selected: boolean) => void;
}
