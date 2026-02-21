/**
 * ====================================================================
 * SENTRY ERROR BOUNDARY
 * ====================================================================
 *
 * Error Boundary intégré avec Sentry pour capturer les erreurs React.
 *
 * Features:
 * - 🐛 Capture automatique des erreurs React
 * - 📊 Envoi automatique à Sentry
 * - 🎨 UI de fallback personnalisée
 * - 🔄 Possibilité de retry
 * - 📋 Informations détaillées pour le debug
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { Button, Alert, AlertActionCloseButton } from "@patternfly/react-core";

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  showDetails: boolean;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error Boundary avec intégration Sentry
 *
 * Usage:
 * <SentryErrorBoundary>
 *   <App />
 * </SentryErrorBoundary>
 */
class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("🚨 [ErrorBoundary] Uncaught error:", error, errorInfo);

    // Capture error in Sentry
    Sentry.withScope((scope) => {
      // Add error info as context
      scope.setContext("errorInfo", {
        componentStack: errorInfo.componentStack,
      });

      // Add extra data
      scope.setTag("error_boundary", "react");

      // Capture and get event ID
      const eventId = Sentry.captureException(error);

      this.setState({
        errorInfo,
        eventId,
      });
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showDetails: false,
    });

    // Reload the page to reset the app state
    window.location.reload();
  };

  handleReportFeedback = (): void => {
    if (this.state.eventId) {
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        lang: "fr",
        title: "Une erreur s'est produite",
        subtitle:
          "Notre équipe a été notifiée. Vous pouvez nous donner plus de détails ci-dessous.",
        subtitle2: "",
        labelName: "Nom",
        labelEmail: "Email",
        labelComments: "Que s'est-il passé ?",
        labelClose: "Fermer",
        labelSubmit: "Envoyer",
        errorGeneric: "Une erreur s'est produite lors de l'envoi. Veuillez réessayer.",
        errorFormEntry: "Certains champs sont invalides. Veuillez les corriger et réessayer.",
        successMessage: "Merci ! Votre rapport a été envoyé.",
      });
    }
  };

  toggleDetails = (): void => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            background: "var(--pf-v5-global--BackgroundColor--100)",
          }}
        >
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
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
                <h1 style={{ marginBottom: "1rem" }}>Une erreur s'est produite</h1>
                <div style={{ marginBottom: "1rem" }}>
                  Désolé, quelque chose s'est mal passé. L'erreur a été automatiquement rapportée à
                  notre équipe.
                </div>

                {this.state.error && (
                  <Alert
                    variant="danger"
                    title="Détails de l'erreur"
                    isInline
                    style={{ marginBottom: "1rem", textAlign: "left" }}
                    actionClose={
                      this.state.showDetails ? (
                        <AlertActionCloseButton onClose={this.toggleDetails} />
                      ) : undefined
                    }
                  >
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.showDetails && this.state.error.stack && (
                      <div style={{ marginTop: "1rem" }}>
                        <strong>Stack trace:</strong>
                        <pre
                          style={{
                            background: "#f5f5f5",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            overflow: "auto",
                            maxHeight: "200px",
                          }}
                        >
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {!this.state.showDetails && (
                      <Button
                        variant="link"
                        onClick={this.toggleDetails}
                        style={{ padding: 0, marginTop: "0.5rem" }}
                      >
                        Voir les détails techniques
                      </Button>
                    )}
                  </Alert>
                )}

                {this.state.eventId && (
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--pf-v5-global--Color--200)",
                      marginBottom: "1rem",
                    }}
                  >
                    ID de l'erreur: <code>{this.state.eventId}</code>
                  </div>
                )}
              </div>
              <div
                style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Button variant="primary" onClick={this.handleReset}>
                  Recharger l'application
                </Button>
                {this.props.showDialog && this.state.eventId && (
                  <Button variant="link" onClick={this.handleReportFeedback}>
                    Signaler un problème
                  </Button>
                )}
                <Button variant="link" onClick={() => window.history.back()}>
                  Retour
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SentryErrorBoundary;

/**
 * HOC pour wrapper un composant avec ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: P) => (
    <SentryErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </SentryErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
