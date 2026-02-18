import { useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = "success" | "danger" | "warning" | "info";

export type ToastOptions = {
  title?: string;
  variant?: ToastVariant;
  timeout?: number;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for displaying toast notifications
 *
 * Provides utility functions to show different types of toast messages.
 * Currently logs to console in development mode.
 * TODO: Integrate with a real toast system (react-hot-toast, PatternFly alerts, etc.)
 *
 * @returns Object with toast display functions
 */
export const useToast = () => {
  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      options?: ToastOptions,
    ) => {
      // TODO: Integrate with real toast notification system
      // Currently using console for development purposes only
      if (process.env.NODE_ENV === "development") {
        const icons: Record<ToastVariant, string> = {
          success: "✅",
          danger: "❌",
          warning: "⚠️",
          info: "ℹ️",
        };

        const icon = icons[variant];
        const title = options?.title || variant.toUpperCase();
        const formattedMessage = `${icon} [${title}] ${message}`;

        // Use appropriate console method based on variant
        switch (variant) {
          case "danger":
            console.error(formattedMessage);
            break;
          case "warning":
            console.warn(formattedMessage);
            break;
          default:
            console.info(formattedMessage);
        }
      }
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, "success", options);
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, "danger", options);
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, "warning", options);
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, "info", options);
    },
    [showToast],
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default useToast;
