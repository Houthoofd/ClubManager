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
 *
 * NOTE: This is a temporary implementation. For production, consider:
 * - PatternFly Alert/AlertGroup for inline notifications
 * - PatternFly Toast for temporary notifications
 * - react-hot-toast for a lightweight alternative
 *
 * Implementation guide:
 * 1. Install: npm install react-hot-toast
 * 2. Add <Toaster /> component to App.tsx
 * 3. Replace console logs with toast() calls
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
      // Development fallback - logs to console
      // Production implementation should use PatternFly Alert or react-hot-toast
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
