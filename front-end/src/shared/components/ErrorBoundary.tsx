/**
 * ============================================================================
 * ERROR BOUNDARY COMPONENT
 * ============================================================================
 *
 * Catches React errors and displays a fallback UI.
 * Prevents entire app crashes when component errors occur.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */

import { Component, ErrorInfo, ReactNode } from "react";
import {
  Alert,
  AlertActionCloseButton,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
} from "@patternfly/react-core";
import { ExclamationTriangleIcon } from '@/shared/icons';
import { isDev, isProd } from "@/core/config/env";

// ============================================================================
// Types
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (isDev) {
      console.error("❌ [ErrorBoundary] Caught error:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (isProd) {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset error boundary when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasChangedResetKeys = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index],
      );

      if (hasChangedResetKeys) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}

// ============================================================================
// Default Fallback UI
// ============================================================================

interface FallbackProps {
  error: Error | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: FallbackProps) {
  return (
    <div style={{ padding: "2rem" }}>
      <EmptyState>
        <EmptyStateIcon
          icon={ExclamationTriangleIcon}
          color="var(--pf-v5-global--danger-color--100)"
        />
        <Title headingLevel="h1" size="lg">
          Oups ! Une erreur s'est produite
        </Title>
        <EmptyStateBody>
          <p>Nous sommes désolés, quelque chose s'est mal passé.</p>
          {isDev && error && (
            <Alert
              variant="danger"
              title="Détails de l'erreur (mode développement)"
              style={{ marginTop: "1rem", textAlign: "left" }}
            >
              <strong>{error.name}:</strong> {error.message}
              {error.stack && (
                <pre style={{ fontSize: "0.875rem", marginTop: "0.5rem", overflow: "auto" }}>
                  {error.stack}
                </pre>
              )}
            </Alert>
          )}
        </EmptyStateBody>
        <Button onClick={onReset} variant="primary">
          Réessayer
        </Button>
        <Button onClick={() => (window.location.href = "/")} variant="link">
          Retour à l'accueil
        </Button>
      </EmptyState>
    </div>
  );
}

// ============================================================================
// Utility Hook - useErrorHandler
// ============================================================================

/**
 * Hook to manually trigger error boundary
 *
 * Usage:
 * ```tsx
 * const throwError = useErrorHandler();
 *
 * try {
 *   // risky operation
 * } catch (error) {
 *   throwError(error);
 * }
 * ```
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setState] = Component.prototype.setState.bind({ setState: () => {} });

  return (error: Error) => {
    setState(() => {
      throw error;
    });
  };
}

// ============================================================================
// Export
// ============================================================================

export default ErrorBoundary;
