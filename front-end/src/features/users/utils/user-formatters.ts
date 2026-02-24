/**
 * User Formatters
 *
 * Pure utility functions for formatting user data
 * Used across User components for consistent display
 */

import { format, parseISO, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * User role type
 */
export type UserRole = "admin" | "teacher" | "student" | "member" | "guest";

/**
 * User status type
 */
export type UserStatus = "active" | "inactive" | "pending" | "suspended" | "banned";

/**
 * Format user full name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Formatted full name
 */
export const formatUserFullName = (firstName: string, lastName: string): string => {
  if (!firstName && !lastName) return "N/A";
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  // Replace multiple spaces with single space
  return fullName.replace(/\s+/g, " ");
};

/**
 * Format user initials
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns User initials (ex: "JD")
 */
export const formatUserInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return `${first}${last}`.trim() || "?";
};

/**
 * Format user display name with preferred name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param preferredName - User's preferred name (optional)
 * @returns Display name
 */
export const formatUserDisplayName = (
  firstName: string,
  lastName: string,
  preferredName?: string,
): string => {
  if (preferredName) return preferredName;
  return formatUserFullName(firstName, lastName);
};

/**
 * Get user role label (i18n key)
 * @param role - User role
 * @returns i18n translation key
 */
export const getUserRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: "auth.roles.admin",
    teacher: "auth.roles.teacher",
    student: "auth.roles.student",
    member: "auth.roles.member",
    guest: "auth.roles.guest",
  };
  return labels[role] || role;
};

/**
 * Get user role color (PatternFly)
 * @param role - User role
 * @returns PatternFly color variant
 */
export const getUserRoleColor = (
  role: UserRole,
): "blue" | "green" | "orange" | "purple" | "default" => {
  const colors: Record<UserRole, "blue" | "green" | "orange" | "purple" | "default"> = {
    admin: "purple",
    teacher: "blue",
    student: "green",
    member: "orange",
    guest: "default",
  };
  return colors[role] || "default";
};

/**
 * Get user status label (i18n key)
 * @param status - User status
 * @returns i18n translation key
 */
export const getUserStatusLabel = (status: UserStatus): string => {
  const labels: Record<UserStatus, string> = {
    active: "common.status.active",
    inactive: "common.status.inactive",
    pending: "common.status.pending",
    suspended: "users.status.suspended",
    banned: "users.status.banned",
  };
  return labels[status] || status;
};

/**
 * Get user status color (PatternFly)
 * @param status - User status
 * @returns PatternFly color variant
 */
export const getUserStatusColor = (
  status: UserStatus,
): "success" | "info" | "warning" | "danger" | "default" => {
  const colors: Record<UserStatus, "success" | "info" | "warning" | "danger" | "default"> = {
    active: "success",
    inactive: "default",
    pending: "info",
    suspended: "warning",
    banned: "danger",
  };
  return colors[status] || "default";
};

/**
 * Format user email (mask for privacy)
 * @param email - User email
 * @param mask - Whether to mask email (default: false)
 * @returns Formatted or masked email
 */
export const formatUserEmail = (email: string, mask: boolean = false): string => {
  if (!mask) return email;

  const [username, domain] = email.split("@");
  if (!username || !domain) return email;

  // Show at least 1 char, up to half the username length (max 3)
  const visibleChars = Math.max(1, Math.min(3, Math.floor(username.length / 2)));
  const maskedUsername = username.substring(0, visibleChars) + "***";
  return `${maskedUsername}@${domain}`;
};

/**
 * Format user phone number
 * @param phone - Phone number
 * @param format - Format style (default: 'international')
 * @returns Formatted phone number
 */
export const formatUserPhone = (
  phone: string,
  format: "international" | "local" = "international",
): string => {
  if (!phone) return "N/A";

  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  if (format === "international" && digits.length >= 10) {
    // Format: +32 123 45 67 89
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }

  if (format === "local" && digits.length >= 9) {
    // Format: 0123 45 67 89
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }

  return phone;
};

/**
 * Format user join date
 * @param date - Join date (ISO string or Date)
 * @param formatStr - Date format (default: 'dd/MM/yyyy')
 * @returns Formatted date
 */
export const formatUserJoinDate = (
  date: string | Date,
  formatStr: string = "dd/MM/yyyy",
): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    console.error("Invalid date:", date);
    return "N/A";
  }
};

/**
 * Format user last login (relative)
 * @param date - Last login date (ISO string or Date)
 * @returns Relative time string
 */
export const formatUserLastLogin = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return "Jamais";
    }

    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Il y a ${months} mois`;
    }
    const years = Math.floor(diffInDays / 365);
    return `Il y a ${years} an${years > 1 ? "s" : ""}`;
  } catch (error) {
    console.error("Invalid date:", date);
    return "Jamais";
  }
};

/**
 * Calculate user age from birth date
 * @param birthDate - Birth date (ISO string or Date)
 * @returns Age in years
 */
export const calculateUserAge = (birthDate: string | Date): number => {
  try {
    const dateObj = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;

    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return 0;
    }

    const age = differenceInYears(new Date(), dateObj);

    // Check if age calculation resulted in NaN
    if (isNaN(age)) {
      return 0;
    }

    return age;
  } catch (error) {
    console.error("Invalid birth date:", birthDate);
    return 0;
  }
};

/**
 * Format user age with years text
 * @param birthDate - Birth date (ISO string or Date)
 * @returns Formatted age string (ex: "25 ans")
 */
export const formatUserAge = (birthDate: string | Date): string => {
  const age = calculateUserAge(birthDate);
  if (age === 0 || isNaN(age)) return "N/A";
  return `${age} an${age > 1 ? "s" : ""}`;
};

/**
 * Check if user is active
 * @param status - User status
 * @returns True if user is active
 */
export const isUserActive = (status: UserStatus): boolean => {
  return status === "active";
};

/**
 * Check if user can be edited
 * @param status - User status
 * @returns True if user can be edited
 */
export const canEditUser = (status: UserStatus): boolean => {
  return status !== "banned";
};

/**
 * Check if user can be deleted
 * @param role - User role
 * @returns True if user can be deleted
 */
export const canDeleteUser = (role: UserRole): boolean => {
  return role !== "admin"; // Cannot delete admins
};

/**
 * Sort users by name
 * @param users - Array of users
 * @returns Sorted users array
 */
export const sortUsersByName = <T extends { firstName: string; lastName: string }>(
  users: T[],
): T[] => {
  return [...users].sort((a, b) => {
    const nameA = formatUserFullName(a.firstName, a.lastName).toLowerCase();
    const nameB = formatUserFullName(b.firstName, b.lastName).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

/**
 * Sort users by join date (newest first)
 * @param users - Array of users
 * @returns Sorted users array
 */
export const sortUsersByJoinDate = <T extends { createdAt: string | Date }>(users: T[]): T[] => {
  return [...users].sort((a, b) => {
    const dateA = typeof a.createdAt === "string" ? parseISO(a.createdAt) : a.createdAt;
    const dateB = typeof b.createdAt === "string" ? parseISO(b.createdAt) : b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });
};

/**
 * Filter users by role
 * @param users - Array of users
 * @param role - Role to filter by
 * @returns Filtered users array
 */
export const filterUsersByRole = <T extends { role: UserRole }>(
  users: T[],
  role: UserRole | "all",
): T[] => {
  if (role === "all") return users;
  return users.filter((user) => user.role === role);
};

/**
 * Filter users by status
 * @param users - Array of users
 * @param status - Status to filter by
 * @returns Filtered users array
 */
export const filterUsersByStatus = <T extends { status: UserStatus }>(
  users: T[],
  status: UserStatus | "all",
): T[] => {
  if (status === "all") return users;
  return users.filter((user) => user.status === status);
};

/**
 * Get user avatar URL or generate initials
 * @param avatarUrl - Avatar URL (optional)
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Avatar URL or data URI with initials
 */
export const getUserAvatarOrInitials = (
  avatarUrl: string | undefined,
  firstName: string,
  lastName: string,
): string => {
  if (avatarUrl) return avatarUrl;

  // Generate simple initials placeholder
  const initials = formatUserInitials(firstName, lastName);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=128`;
};

/**
 * Validate user email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export const isValidUserEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize user input (remove dangerous characters)
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .trim();
};
