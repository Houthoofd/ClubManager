/**
 * Enrollment Feature - EnrollButton Component
 *
 * Button component for enrolling in a course.
 * Handles loading states, capacity checks, and waitlist notifications.
 * Refactored to use PatternFly components.
 */

import React from "react";
import { Button } from "@patternfly/react-core";
import {
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@patternfly/react-icons";
import {
  useEnroll,
  useCheckEnrollment,
  useCourseCapacity,
} from "../model/useEnrollment";
import { EnrollmentStatus } from "../model/types";

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
  variant?: "primary" | "secondary" | "outline";

  /** Button size */
  size?: "small" | "medium" | "large";

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
  buttonText = "S'inscrire",
  loadingText = "Inscription...",
  enrolledText = "Déjà inscrit",
  waitlistText = "Sur liste d'attente",
  variant = "primary",
  size = "medium",
  fullWidth = false,
  className = "",
  onSuccess,
  onError,
  disabled = false,
  showCapacity = false,
}) => {
  // ========================================
  // Hooks
  // ========================================

  const { mutate: enroll, isPending: isEnrolling } = useEnroll();
  const { data: enrollmentCheck, isLoading: isCheckingEnrollment } =
    useCheckEnrollment(courseId);
  const { data: capacity, isLoading: isLoadingCapacity } = useCourseCapacity(
    courseId,
    { enabled: showCapacity },
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
              `Vous avez été ajouté à la liste d'attente.\nPosition: ${result.waitlistPosition}`,
            );
          } else if (result.enrollment.status === EnrollmentStatus.PENDING) {
            alert("Votre inscription est en attente d'approbation.");
          } else {
            alert("Inscription réussie !");
          }

          onSuccess?.(result);
        },
        onError: (error) => {
          alert(`Erreur lors de l'inscription: ${error.message}`);
          onError?.(error);
        },
      },
    );
  };

  // ========================================
  // Button Text & State
  // ========================================

  const getButtonText = () => {
    if (isEnrolling) return loadingText;
    if (isWaitlisted) return waitlistText;
    if (isPending) return "En attente d'approbation";
    if (isConfirmed) return enrolledText;
    if (capacity?.isFull) return "Rejoindre la liste d'attente";
    return buttonText;
  };

  const getButtonVariant = ():
    | "primary"
    | "secondary"
    | "tertiary"
    | "danger"
    | "warning"
    | "link" => {
    if (isEnrolled) return "secondary";
    if (capacity?.isFull) return "tertiary";
    // Map custom variant to PatternFly variants
    if (variant === "outline") return "tertiary";
    return variant as "primary" | "secondary";
  };

  const getButtonIcon = () => {
    if (isWaitlisted) return <ClockIcon />;
    if (isConfirmed) return <CheckCircleIcon />;
    if (isPending) return <ClockIcon />;
    return <PlusCircleIcon />;
  };

  const isButtonDisabled =
    disabled || isLoading || (isEnrolled && !isWaitlisted);

  // Map size prop to PatternFly size
  const getPatternFlySize = (): "sm" | "md" | "lg" | undefined => {
    const sizeMap: Record<string, "sm" | "lg" | undefined> = {
      small: "sm" as const,
      medium: undefined, // default size
      large: "lg" as const,
    };
    return sizeMap[size];
  };

  // ========================================
  // Render
  // ========================================

  return (
    <div style={{ width: fullWidth ? "100%" : "auto" }}>
      <Button
        variant={getButtonVariant()}
        isLoading={isEnrolling}
        isDisabled={isButtonDisabled}
        icon={!isEnrolling ? getButtonIcon() : undefined}
        onClick={handleEnroll}
        size={getPatternFlySize()}
        isBlock={fullWidth}
        className={className}
      >
        {getButtonText()}
      </Button>

      {/* Capacity Info */}
      {showCapacity && capacity && !isCheckingEnrollment && (
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "#6a6e73",
          }}
        >
          {capacity.isFull ? (
            <span style={{ color: "#f0ab00", fontWeight: 500 }}>
              Cours complet - {capacity.waitlistCount} sur liste d'attente
            </span>
          ) : (
            <span>
              {capacity.availableSpots} place
              {capacity.availableSpots > 1 ? "s" : ""} disponible
              {capacity.availableSpots > 1 ? "s" : ""} sur{" "}
              {capacity.maxCapacity}
            </span>
          )}
        </div>
      )}

      {/* Waitlist Position */}
      {isWaitlisted && enrollment?.waitlistPosition && (
        <div
          style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#06c" }}
        >
          Position dans la liste d'attente: {enrollment.waitlistPosition}
        </div>
      )}
    </div>
  );
};

export default EnrollButton;
