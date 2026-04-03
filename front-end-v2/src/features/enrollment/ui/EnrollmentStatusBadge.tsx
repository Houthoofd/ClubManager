/**
 * Enrollment Feature - EnrollmentStatusBadge Component
 *
 * Badge component to display enrollment status with appropriate colors.
 * Provides visual feedback for different enrollment states.
 */

import React from 'react';
import { EnrollmentStatus, getStatusLabel, getStatusColor } from '../model/types';

// ============================================================================
// Props
// ============================================================================

export interface EnrollmentStatusBadgeProps {
  /** The enrollment status to display */
  status: EnrollmentStatus;

  /** Badge size */
  size?: 'small' | 'medium' | 'large';

  /** Show icon with status */
  showIcon?: boolean;

  /** Custom className */
  className?: string;

  /** Show waitlist position if available */
  waitlistPosition?: number | null;
}

// ============================================================================
// EnrollmentStatusBadge Component
// ============================================================================

export const EnrollmentStatusBadge: React.FC<EnrollmentStatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
  className = '',
  waitlistPosition,
}) => {
  // ========================================
  // Get Status Information
  // ========================================

  const label = getStatusLabel(status);
  const colorScheme = getStatusColor(status);

  // ========================================
  // Color Classes
  // ========================================

  const colorClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  // ========================================
  // Size Classes
  // ========================================

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-sm',
    large: 'px-3 py-1.5 text-base',
  };

  // ========================================
  // Icon for Status
  // ========================================

  const getIcon = () => {
    if (!showIcon) return null;

    const iconSize = size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4';

    switch (status) {
      case EnrollmentStatus.CONFIRMED:
        return (
          <svg
            className={`${iconSize} mr-1`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );

      case EnrollmentStatus.PENDING:
        return (
          <svg
            className={`${iconSize} mr-1`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );

      case EnrollmentStatus.WAITLIST:
        return (
          <svg
            className={`${iconSize} mr-1`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );

      case EnrollmentStatus.CANCELLED:
        return (
          <svg
            className={`${iconSize} mr-1`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );

      case EnrollmentStatus.REJECTED:
        return (
          <svg
            className={`${iconSize} mr-1`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );

      default:
        return null;
    }
  };

  // ========================================
  // Badge Classes
  // ========================================

  const badgeClasses = `
    inline-flex items-center font-medium rounded-full border
    ${colorClasses[colorScheme]}
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // ========================================
  // Render
  // ========================================

  return (
    <span className={badgeClasses}>
      {getIcon()}
      <span>{label}</span>
      {status === EnrollmentStatus.WAITLIST && waitlistPosition != null && (
        <span className="ml-1 font-semibold">#{waitlistPosition}</span>
      )}
    </span>
  );
};

export default EnrollmentStatusBadge;
