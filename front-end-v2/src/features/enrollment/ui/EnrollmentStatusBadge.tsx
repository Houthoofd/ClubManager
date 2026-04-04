/**
 * Enrollment Feature - EnrollmentStatusBadge Component
 *
 * Badge component to display enrollment status with appropriate colors.
 * Provides visual feedback for different enrollment states.
 * Refactored to use PatternFly Label component.
 */

import React from "react";
import { Label } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ClockIcon,
  BanIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";
import { EnrollmentStatus, getStatusLabel } from "../model/types";

// ============================================================================
// Props
// ============================================================================

export interface EnrollmentStatusBadgeProps {
  /** The enrollment status to display */
  status: EnrollmentStatus;

  /** Badge size - Note: PatternFly Label doesn't have size variants, kept for API compatibility */
  size?: "small" | "medium" | "large";

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
  size = "medium",
  showIcon = true,
  className = "",
  waitlistPosition,
}) => {
  // ========================================
  // Get Status Information
  // ========================================

  const label = getStatusLabel(status);

  // ========================================
  // Get PatternFly Color for Status
  // ========================================

  const getStatusColor = (): "green" | "orange" | "blue" | "grey" | "red" => {
    switch (status) {
      case EnrollmentStatus.CONFIRMED:
        return "green";
      case EnrollmentStatus.PENDING:
        return "orange";
      case EnrollmentStatus.WAITLIST:
        return "blue";
      case EnrollmentStatus.CANCELLED:
        return "grey";
      case EnrollmentStatus.REJECTED:
        return "red";
      default:
        return "grey";
    }
  };

  // ========================================
  // Get Icon for Status
  // ========================================

  const getIcon = (): React.ReactElement | undefined => {
    if (!showIcon) return undefined;

    switch (status) {
      case EnrollmentStatus.CONFIRMED:
        return <CheckCircleIcon />;
      case EnrollmentStatus.PENDING:
        return <ClockIcon />;
      case EnrollmentStatus.WAITLIST:
        return <ExclamationCircleIcon />;
      case EnrollmentStatus.CANCELLED:
        return <BanIcon />;
      case EnrollmentStatus.REJECTED:
        return <BanIcon />;
      default:
        return undefined;
    }
  };

  // ========================================
  // Build Label Text
  // ========================================

  const labelText =
    status === EnrollmentStatus.WAITLIST && waitlistPosition != null
      ? `${label} #${waitlistPosition}`
      : label;

  // ========================================
  // Render
  // ========================================

  return (
    <Label color={getStatusColor()} icon={getIcon()} className={className}>
      {labelText}
    </Label>
  );
};

export default EnrollmentStatusBadge;
