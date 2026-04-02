/**
 * Error Boundary Component
 *
 * Composant React Error Boundary pour capturer et gérer les erreurs
 * qui se produisent dans l'arbre de composants enfants.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={(error) => <div>Erreur: {error.message}</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateActions,
  Button,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  /**
   * Composants enfants à surveiller
   */
  children: ReactNode;

  /**
   * Composant de fallback personnalisé
   */
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;

  /**
   * Callback appelé quand une erreur est capturée
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Permet de réinitialiser l'erreur
   */
  resetKeys?: Array<string | number>;

  /**
   * Callback appelé lors de la réinitialisation
   */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Component
// ============================================================================

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
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
    // Log l'erreur
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Mettre à jour le state
    this.setState({
      error,
      errorInfo,
    });

    // Appeler le callback onError si fourni
    this.props.onError?.(error, errorInfo);

    // En production, envoyer à un service de monitoring (Sentry, etc.)
    if (import.meta.env.PROD) {
      // TODO: Intégrer avec Sentry
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Réinitialiser si les resetKeys changent
    if (
      hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      resetKeys.length > 0 &&
      resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.reset();
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Utiliser le fallback personnalisé si fourni
      if (fallback && errorInfo) {
        return fallback(error, errorInfo);
      }

      // Fallback par défaut
      return (
        <div style={{ padding: '2rem' }}>
          <EmptyState>
            <EmptyStateHeader
              titleText="Une erreur s'est produite"
              icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />}
              headingLevel="h1"
            />
            <EmptyStateBody>
              <p style={{ marginBottom: '1rem' }}>
                Désolé, une erreur inattendue s'est produite.
              </p>
              {import.meta.env.DEV && (
                <details
                  style={{
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left',
                    background: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginTop: '1rem',
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    Détails de l'erreur (développement)
                  </summary>
                  <p style={{ marginTop: '0.5rem' }}>
                    <strong>Message:</strong> {error.message}
                  </p>
                  <p style={{ marginTop: '0.5rem' }}>
                    <strong>Stack:</strong>
                  </p>
                  <pre style={{ fontSize: '0.85rem' }}>{error.stack}</pre>
                  {errorInfo?.componentStack && (
                    <>
                      <p style={{ marginTop: '0.5rem' }}>
                        <strong>Component Stack:</strong>
                      </p>
                      <pre style={{ fontSize: '0.85rem' }}>
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </details>
              )}
            </EmptyStateBody>
            <EmptyStateActions>
              <Button variant="primary" onClick={this.reset}>
                Réessayer
              </Button>
              <Button
                variant="link"
                onClick={() => window.location.reload()}
              >
                Recharger la page
              </Button>
            </EmptyStateActions>
          </EmptyState>
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// Hook Alternative (React 18+)
// ============================================================================

/**
 * Hook pour gérer les erreurs de manière déclarative
 *
 * @example
 * ```tsx
 * const { error, showError, clearError } = useErrorHandler();
 *
 * if (error) {
 *   return <ErrorFallback error={error} onReset={clearError} />;
 * }
 * ```
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const showError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Error caught by useErrorHandler:', error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, showError, clearError };
};

// ============================================================================
// Exports
// ============================================================================

export default ErrorBoundary;
