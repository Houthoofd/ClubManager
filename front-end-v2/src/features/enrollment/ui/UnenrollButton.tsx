/**
 * Enrollment Feature - UnenrollButton Component
 *
 * Button component for unenrolling from a course.
 * Includes confirmation dialog to prevent accidental unenrollment.
 */

import React, { useState } from 'react';
import { useUnenroll } from '../model/useEnrollment';

// ============================================================================
// Props
// ============================================================================

export interface UnenrollButtonProps {
  /** ID of the enrollment to cancel */
  enrollmentId: number;

  /** ID of the course (for cache invalidation) */
  courseId: number;

  /** Custom button text */
  buttonText?: string;

  /** Custom button text when loading */
  loadingText?: string;

  /** Button variant/style */
  variant?: 'danger' | 'outline' | 'text';

  /** Button size */
  size?: 'small' | 'medium' | 'large';

  /** Full width button */
  fullWidth?: boolean;

  /** Custom className */
  className?: string;

  /** Callback when unenrollment succeeds */
  onSuccess?: () => void;

  /** Callback when unenrollment fails */
  onError?: (error: Error) => void;

  /** Disable the button */
  disabled?: boolean;

  /** Show confirmation dialog */
  confirmationRequired?: boolean;

  /** Custom confirmation message */
  confirmationMessage?: string;

  /** Custom confirmation title */
  confirmationTitle?: string;
}

// ============================================================================
// UnenrollButton Component
// ============================================================================

export const UnenrollButton: React.FC<UnenrollButtonProps> = ({
  enrollmentId,
  courseId,
  buttonText = 'Se désinscrire',
  loadingText = 'Désinscription...',
  variant = 'danger',
  size = 'medium',
  fullWidth = false,
  className = '',
  onSuccess,
  onError,
  disabled = false,
  confirmationRequired = true,
  confirmationMessage = 'Êtes-vous sûr de vouloir vous désinscrire de ce cours ?',
  confirmationTitle = 'Confirmer la désinscription',
}) => {
  // ========================================
  // State
  // ========================================

  const [showConfirmation, setShowConfirmation] = useState(false);

  // ========================================
  // Hooks
  // ========================================

  const { mutate: unenroll, isPending: isUnenrolling } = useUnenroll();

  // ========================================
  // Handlers
  // ========================================

  const handleClick = () => {
    if (disabled) return;

    if (confirmationRequired) {
      setShowConfirmation(true);
    } else {
      handleUnenroll();
    }
  };

  const handleUnenroll = () => {
    unenroll(
      { enrollmentId, courseId },
      {
        onSuccess: () => {
          setShowConfirmation(false);
          alert('Désinscription réussie !');
          onSuccess?.();
        },
        onError: (error) => {
          setShowConfirmation(false);
          alert(`Erreur lors de la désinscription: ${error.message}`);
          onError?.(error);
        },
      }
    );
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  // ========================================
  // CSS Classes
  // ========================================

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border-2 border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
    text: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const disabledClasses = (disabled || isUnenrolling)
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  const widthClasses = fullWidth ? 'w-full' : '';

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${widthClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // ========================================
  // Render
  // ========================================

  return (
    <>
      {/* Main Button */}
      <button
        onClick={handleClick}
        disabled={disabled || isUnenrolling}
        className={buttonClasses}
        type="button"
      >
        {isUnenrolling && (
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
        {isUnenrolling ? loadingText : buttonText}
      </button>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmationTitle}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                disabled={isUnenrolling}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-600">{confirmationMessage}</p>
              <p className="mt-2 text-sm text-gray-500">
                Cette action ne peut pas être annulée.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={isUnenrolling}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUnenroll}
                disabled={isUnenrolling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isUnenrolling ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                    Désinscription...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnenrollButton;
