import React from "react";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { EmptyState, Button, Title } from "@patternfly/react-core";
import { ExclamationTriangleIcon, HomeIcon } from "@patternfly/react-icons";

// Composant pour les erreurs de route (404, etc.)
export function RouterErrorBoundary() {
  const error = useRouteError();

  console.error("🚨 [Router] Erreur de route:", error);

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
            padding: "2rem",
          }}
        >
          <EmptyState>
            <ExclamationTriangleIcon
              size="xl"
              style={{ marginBottom: "16px", fontSize: "48px", color: "#f0ab00" }}
            />
            <Title headingLevel="h1" size="lg">
              Page non trouvée
            </Title>
            <div style={{ marginTop: "16px", marginBottom: "24px" }}>
              La page que vous recherchez n'existe pas ou a été déplacée.
              <br />
              <strong>URL:</strong> {error.data || "Non disponible"}
              <br />
              <strong>Statut:</strong> {error.status} - {error.statusText}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <Button
                variant="primary"
                icon={<HomeIcon />}
                onClick={() => (window.location.href = "/")}
              >
                Retourner à l'accueil
              </Button>
              <Button variant="link" onClick={() => window.history.back()}>
                Retour page précédente
              </Button>
            </div>
          </EmptyState>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
          padding: "2rem",
        }}
      >
        <EmptyState>
          <ExclamationTriangleIcon
            size="xl"
            style={{ marginBottom: "16px", fontSize: "48px", color: "#c9190b" }}
          />
          <Title headingLevel="h1" size="lg">
            Erreur {error.status}
          </Title>
          <div style={{ marginTop: "16px", marginBottom: "24px" }}>
            Une erreur s'est produite lors du chargement de cette page.
            <br />
            <strong>Message:</strong> {error.statusText || "Erreur inconnue"}
            {error.data && (
              <>
                <br />
                <strong>Détails:</strong> {JSON.stringify(error.data)}
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
            <Button variant="link" onClick={() => (window.location.href = "/")}>
              Retourner à l'accueil
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",
        padding: "2rem",
      }}
    >
      <EmptyState>
        <ExclamationTriangleIcon
          size="xl"
          style={{ marginBottom: "16px", fontSize: "48px", color: "#c9190b" }}
        />
        <Title headingLevel="h1" size="lg">
          Erreur inattendue
        </Title>
        <div style={{ marginTop: "16px", marginBottom: "24px" }}>
          Une erreur inattendue s'est produite.
          <br />
          <strong>Message:</strong> {(error as Error)?.message || "Erreur inconnue"}
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
          <Button variant="link" onClick={() => (window.location.href = "/")}>
            Retourner à l'accueil
          </Button>
        </div>
      </EmptyState>
    </div>
  );
}

// Composant ErrorBoundary traditionnel pour les erreurs React
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 [ErrorBoundary] Erreur React:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
            padding: "2rem",
          }}
        >
          <EmptyState>
            <EmptyStateHeader
              titleText="Erreur de l'application"
              icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />}
              headingLevel="h1"
            />
            <EmptyStateBody>
              Une erreur s'est produite dans l'application.
              <br />
              <strong>Message:</strong> {this.state.error?.message || "Erreur inconnue"}
              <br />
              <strong>Stack:</strong>
              <pre
                style={{
                  fontSize: "0.8rem",
                  maxHeight: "200px",
                  overflow: "auto",
                  background: "#f5f5f5",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                  borderRadius: "4px",
                }}
              >
                {this.state.error?.stack || "Stack trace non disponible"}
              </pre>
            </EmptyStateBody>
            <EmptyStateActions>
              <Button
                variant="primary"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
              >
                Recharger l'application
              </Button>
              <Button variant="link" onClick={() => (window.location.href = "/")}>
                Retourner à l'accueil
              </Button>
            </EmptyStateActions>
          </EmptyState>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
