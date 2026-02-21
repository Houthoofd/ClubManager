/**
 * ====================================================================
 * Alert Component
 * ====================================================================
 *
 * Alert/notification component wrapping PatternFly Alert.
 * Provides consistent messaging across the application.
 *
 * Usage:
 * ```tsx
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved.
 * </Alert>
 * ```
 */

import React from 'react';
import { Alert as PFAlert, AlertActionCloseButton } from '@patternfly/react-core';

/**
 * Alert variants
 */
export type AlertVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

/**
 * Alert component props
 */
export interface AlertProps {
  /**
   * Alert variant (color/style)
   * @default 'info'
   */
  variant?: AlertVariant;

  /**
   * Alert title
   */
  title: string;

  /**
   * Alert message/description
   */
  children?: React.ReactNode;

  /**
   * Show close button
   * @default false
   */
  dismissible?: boolean;

  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Inline display (compact)
   * @default false
   */
  inline?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Custom action buttons
   */
  actionLinks?: React.ReactNode;

  /**
   * Timeout in ms to auto-dismiss
   */
  timeout?: number;
}

/**
 * Alert component for messages and notifications
 *
 * @example
 * ```tsx
 * // Success alert
 * <Alert variant="success" title="Saved!">
 *   Your profile has been updated successfully.
 * </Alert>
 *
 * // Dismissible error
 * <Alert
 *   variant="danger"
 *   title="Error"
 *   dismissible
 *   onDismiss={() => console.log('dismissed')}
 * >
 *   Failed to save changes. Please try again.
 * </Alert>
 *
 * // Warning with action
 * <Alert
 *   variant="warning"
 *   title="Pending changes"
 *   actionLinks={
 *     <Button variant="link" onClick={handleSave}>
 *       Save now
 *     </Button>
 *   }
 * >
 *   You have unsaved changes.
 * </Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  inline = false,
  className = '',
  actionLinks,
  timeout,
}) => {
  const [visible, setVisible] = React.useState(true);

  // Auto-dismiss timeout
  React.useEffect(() => {
    if (timeout && timeout > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onDismiss]);

  if (!visible) {
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <PFAlert
      variant={variant}
      title={title}
      isInline={inline}
      className={className}
      actionClose={
        dismissible ? <AlertActionCloseButton onClose={handleDismiss} /> : undefined
      }
      actionLinks={actionLinks}
    >
      {children}
    </PFAlert>
  );
};

/**
 * Success alert (convenience wrapper)
 */
export const SuccessAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert {...props} variant="success" />
);

/**
 * Error/Danger alert (convenience wrapper)
 */
export const ErrorAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert {...props} variant="danger" />
);

/**
 * Warning alert (convenience wrapper)
 */
export const WarningAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert {...props} variant="warning" />
);

/**
 * Info alert (convenience wrapper)
 */
export const InfoAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert {...props} variant="info" />
);

export default Alert;
