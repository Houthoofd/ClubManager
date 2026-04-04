/**
 * Enrollment Feature - UnenrollButton Component
 *
 * Button component for unenrolling from a course.
 * Includes confirmation dialog to prevent accidental unenrollment.
 */

import React, { useState } from "react";
import { Button } from "@patternfly/react-core";
import { Modal, ModalVariant } from "@patternfly/react-core";
import { MinusCircleIcon } from "@patternfly/react-icons";
import { useUnenroll } from "../model/useEnrollment";

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
  variant?: "danger" | "outline" | "text";

  /** Button size */
  size?: "small" | "medium" | "large";

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
  buttonText = "Se désinscrire",
  loadingText = "Désinscription...",
  variant = "danger",
  size = "medium",
  fullWidth = false,
  className = "",
  onSuccess,
  onError,
  disabled = false,
  confirmationRequired = true,
  confirmationMessage = "Êtes-vous sûr de vouloir vous désinscrire de ce cours ?",
  confirmationTitle = "Confirmer la désinscription",
}) => {
  // ========================================
  // State
  // ========================================

  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setIsModalOpen(true);
    } else {
      handleUnenroll();
    }
  };

  const handleUnenroll = () => {
    unenroll(
      { enrollmentId, courseId },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          alert("Désinscription réussie !");
          onSuccess?.();
        },
        onError: (error) => {
          setIsModalOpen(false);
          alert(`Erreur lors de la désinscription: ${error.message}`);
          onError?.(error);
        },
      },
    );
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // ========================================
  // Map variants to PatternFly variants
  // ========================================

  const getButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "danger";
      case "outline":
        return "secondary";
      case "text":
        return "link";
      default:
        return "danger";
    }
  };

  // ========================================
  // Render
  // ========================================

  return (
    <>
      {/* Main Button */}
      <Button
        variant={getButtonVariant()}
        onClick={handleClick}
        isDisabled={disabled || isUnenrolling}
        isLoading={isUnenrolling}
        icon={<MinusCircleIcon />}
        isBlock={fullWidth}
        className={className}
      >
        {isUnenrolling ? loadingText : buttonText}
      </Button>

      {/* Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title={confirmationTitle}
        isOpen={isModalOpen}
        onClose={handleCancel}
        actions={[
          <Button
            key="confirm"
            variant="danger"
            onClick={handleUnenroll}
            isDisabled={isUnenrolling}
            isLoading={isUnenrolling}
          >
            {isUnenrolling ? "Désinscription..." : "Confirmer"}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={handleCancel}
            isDisabled={isUnenrolling}
          >
            Annuler
          </Button>,
        ]}
      >
        <p>{confirmationMessage}</p>
        <p
          style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6a6e73" }}
        >
          Cette action ne peut pas être annulée.
        </p>
      </Modal>
    </>
  );
};

export default UnenrollButton;
