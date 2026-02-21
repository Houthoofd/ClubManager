import React, { Component, ComponentType, ErrorInfo } from "react";
import * as Sentry from "@sentry/react";
import { Button } from "@patternfly/react-core";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface WithErrorBoundaryOptions {
  /**
   * Fallback component à afficher en cas d'erreur
   */
  fallback?: ComponentType<{
    error: Error | null;
    errorInfo: ErrorInfo | null;
    resetError: () => void;
  }>;
  /**
   * Callback appelé quand une erreur est capturée
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Reporter l'erreur à Sentry
   */
  reportToSentry?: boolean;
  /**
   * Nom du composant pour le tracking
   */
  componentName?: string;
}

/**
 * Composant fallback par défaut
 */
const DefaultErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  componentName?: string;
}> = ({ error, resetError, componentName }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      textAlign: "center",
      minHeight: "300px",
    }}
  >
    <div
      style={{
        fontSize: "3rem",
        marginBottom: "1rem",
        color: "var(--pf-v5-global--danger-color--100)",
      }}
    >
      ⚠️
    </div>
    <h4 style={{ marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
      Une erreur s'est produite
    </h4>
    {componentName && <p style={{ marginBottom: "0.5rem" }}>Composant : {componentName}</p>}
    {error && (
      <>
        <p style={{ marginTop: "1rem", color: "var(--pf-v5-global--danger-color--100)" }}>
          {error.message}
        </p>
        {process.env.NODE_ENV === "development" && (
          <details style={{ marginTop: "1rem", textAlign: "left", maxWidth: "600px" }}>
            <summary>Stack trace</summary>
            <pre style={{ fontSize: "0.75rem", overflow: "auto", maxHeight: "200px" }}>
              {error.stack}
            </pre>
          </details>
        )}
      </>
    )}
    <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem" }}>
      <Button variant="primary" onClick={resetError}>
        Réessayer
      </Button>
      <Button variant="link" onClick={() => window.location.reload()}>
        Recharger la page
      </Button>
    </div>
  </div>
);

/**
 * HOC qui enveloppe un composant dans un Error Boundary
 * Capture les erreurs React et affiche un fallback UI
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   componentName: 'MyComponent',
 *   reportToSentry: true,
 *   onError: (error) => console.error(error)
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithErrorBoundaryOptions = {},
) {
  const {
    fallback: FallbackComponent = DefaultErrorFallback,
    onError,
    reportToSentry = true,
    componentName = WrappedComponent.displayName || WrappedComponent.name || "Component",
  } = options;

  return class WithErrorBoundary extends Component<P, ErrorBoundaryState> {
    static displayName = `withErrorBoundary(${componentName})`;

    constructor(props: P) {
      super(props);
      this.state = {
        hasError: false,
        error: null,
        errorInfo: null,
      };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
      return {
        hasError: true,
        error,
      };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
      this.setState({
        error,
        errorInfo,
      });

      // Logger l'erreur
      console.error(`Error caught by ErrorBoundary in ${componentName}:`, error, errorInfo);

      // Reporter à Sentry si activé
      if (reportToSentry) {
        Sentry.withScope((scope) => {
          scope.setTag("component", componentName);
          scope.setContext("componentStack", {
            stack: errorInfo.componentStack,
          });
          scope.setLevel("error");
          Sentry.captureException(error);
        });
      }

      // Callback custom
      if (onError) {
        onError(error, errorInfo);
      }
    }

    resetError = (): void => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    };

    render() {
      if (this.state.hasError) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            {...(FallbackComponent === DefaultErrorFallback && { componentName })}
          />
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
}

/**
 * Composant ErrorBoundary réutilisable
 * Alternative au HOC pour une utilisation directe
 *
 * @example
 * ```tsx
 * <ErrorBoundary componentName="MyFeature">
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  {
    children: React.ReactNode;
    fallback?: ComponentType<{
      error: Error | null;
      errorInfo: ErrorInfo | null;
      resetError: () => void;
    }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    reportToSentry?: boolean;
    componentName?: string;
  },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundary["props"]) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    const { reportToSentry = true, onError, componentName = "Unknown" } = this.props;

    console.error(`Error caught by ErrorBoundary in ${componentName}:`, error, errorInfo);

    if (reportToSentry) {
      Sentry.withScope((scope) => {
        scope.setTag("component", componentName);
        scope.setContext("componentStack", {
          stack: errorInfo.componentStack,
        });
        scope.setLevel("error");
        Sentry.captureException(error);
      });
    }

    if (onError) {
      onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback: FallbackComponent = DefaultErrorFallback,
      componentName,
    } = this.props;

    if (hasError) {
      return (
        <FallbackComponent
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          {...(FallbackComponent === DefaultErrorFallback && { componentName })}
        />
      );
    }

    return children;
  }
}

export default withErrorBoundary;
