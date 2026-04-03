/**
 * Enrollment Feature - EnrollButton Component
 *
 * Button component for enrolling in a course.
 * Handles loading states, capacity checks, and waitlist notifications.
 */

import React from 'react';
import { useEnroll, useCheckEnrollment, useCourseCapacity } from '../model/useEnrollment';
import { EnrollmentStatus } from '../model/types';

// ============================================================================
// Props
// ============================================================================

export interface EnrollButtonProps {
  /** ID of the course to enroll in */
  courseId: number;

  /** Optional notes to include with enrollment */
  notes?: string;

  /** Custom button text */
  buttonText?: string;

  /** Custom button text when loading */
  loadingText?: string;

  /** Custom button text when enrolled */
  enrolledText?: string;

  /** Custom button text when waitlisted */
  waitlistText?: string;

  /** Button variant/style */
  variant?: 'primary' | 'secondary' | 'outline';

  /** Button size */
  size?: 'small' | 'medium' | 'large';

  /** Full width button */
  fullWidth?: boolean;

  /** Custom className */
  className?: string;

  /** Callback when enrollment succeeds */
  onSuccess?: (result: any) => void;

  /** Callback when enrollment fails */
  onError?: (error: Error) => void;

  /** Disable the button */
  disabled?: boolean;

  /** Show capacity information */
  showCapacity?: boolean;
}

// ============================================================================
// EnrollButton Component
// ============================================================================

export const EnrollButton: React.FC<EnrollButtonProps> = ({
  courseId,
  notes,
  buttonText = 'S\'inscrire',
  loadingText = 'Inscription...',
  enrolledText = 'Déjà inscrit',
  waitlistText = 'Sur liste d\'attente',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  onSuccess,
  onError,
  disabled = false,
  showCapacity = false,
}) => {
  // ========================================
  // Hooks
  // ========================================

  const { mutate: enroll, isPending: isEnrolling } = useEnroll();
  const { data: enrollmentCheck, isLoading: isCheckingEnrollment } = useCheckEnrollment(courseId);
  const { data: capacity, isLoading: isLoadingCapacity } = useCourseCapacity(
    courseId,
    { enabled: showCapacity }
  );

  // ========================================
  // State & Computed Values
  // ========================================

  const isEnrolled = enrollmentCheck?.isEnrolled ?? false;
  const enrollment = enrollmentCheck?.enrollment;
  const isWaitlisted = enrollment?.status === EnrollmentStatus.WAITLIST;
  const isPending = enrollment?.status === EnrollmentStatus.PENDING;
  const isConfirmed = enrollment?.status === EnrollmentStatus.CONFIRMED;

  const isLoading = isEnrolling || isCheckingEnrollment || isLoadingCapacity;

  // ========================================
  // Handlers
  // ========================================

  const handleEnroll = () => {
    if (isEnrolled || disabled) {
      return;
    }

    enroll(
      { courseId, notes },
      {
        onSuccess: (result) => {
          // Show appropriate message
          if (result.isWaitlisted) {
            alert(
              `Vous avez été ajouté à la liste d'attente.\nPosition: ${result.waitlistPosition}`
            );
          } else if (result.enrollment.status === EnrollmentStatus.PENDING) {
            alert('Votre inscription est en attente d\'approbation.');
          } else {
            alert('Inscription réussie !');
          }

          onSuccess?.(result);
        },
        onError: (error) => {
          alert(`Erreur lors de l'inscription: ${error.message}`);
          onError?.(error);
        },
      }
    );
  };

  // ========================================
  // Button Text & State
  // ========================================

  const getButtonText = () => {
    if (isEnrolling) return loadingText;
    if (isWaitlisted) return waitlistText;
    if (isPending) return 'En attente d\'approbation';
    if (isConfirmed) return enrolledText;
    if (capacity?.isFull) return 'Rejoindre la liste d\'attente';
    return buttonText;
  };

  const getButtonVariant = () => {
    if (isEnrolled) return 'secondary';
    if (capacity?.isFull) return 'outline';
    return variant;
  };

  const isButtonDisabled = disabled || isLoading || (isEnrolled && !isWaitlisted);

  // ========================================
  // CSS Classes
  // ========================================

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const disabledClasses = isButtonDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  const widthClasses = fullWidth ? 'w-full' : '';

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[getButtonVariant()]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${widthClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // ========================================
  // Render
  // ========================================

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <button
        onClick={handleEnroll}
        disabled={isButtonDisabled}
        className={buttonClasses}
        type="button"
      >
        {isEnrolling && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {getButtonText()}
      </button>

      {/* Capacity Info */}
      {showCapacity && capacity && !isCheckingEnrollment && (
        <div className="mt-2 text-sm text-gray-600">
          {capacity.isFull ? (
            <span className="text-orange-600 font-medium">
              Cours complet - {capacity.waitlistCount} sur liste d'attente
            </span>
          ) : (
            <span>
              {capacity.availableSpots} place{capacity.availableSpots > 1 ? 's' : ''} disponible
              {capacity.availableSpots > 1 ? 's' : ''} sur {capacity.maxCapacity}
            </span>
          )}
        </div>
      )}

      {/* Waitlist Position */}
      {isWaitlisted && enrollment?.waitlistPosition && (
        <div className="mt-2 text-sm text-blue-600">
          Position dans la liste d'attente: {enrollment.waitlistPosition}
        </div>
      )}
    </div>
  );
};

export default EnrollButton;
