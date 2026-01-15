import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateActions,
  Button,
  Title
} from '@patternfly/react-core';
import { ExclamationTriangleIcon, HomeIcon } from '@patternfly/react-icons';

// Composant pour les erreurs de route (404, etc.)
export function RouterErrorBoundary() {
  const error = useRouteError();
  
  console.error('🚨 [Router] Erreur de route:', error);
  
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          padding: '2rem'
        }}>
          <EmptyState>
            <EmptyStateHeader 
              titleText="Page non trouvée" 
              icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />} 
              headingLevel="h1" 
            />
            <EmptyStateBody>
              La page que vous recherchez n'existe pas ou a été déplacée.
              <br />
              <strong>URL:</strong> {error.data || 'Non disponible'}
              <br />
              <strong>Statut:</strong> {error.status} - {error.statusText}
            </EmptyStateBody>
            <EmptyStateActions>
              <Button 
                variant="primary" 
                icon={<HomeIcon />}
                onClick={() => window.location.href = '/'}
              >
                Retourner à l'accueil
              </Button>
              <Button 
                variant="link" 
                onClick={() => window.history.back()}
              >
                Retour page précédente
              </Button>
            </EmptyStateActions>
          </EmptyState>
        </div>
      );
    }
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        padding: '2rem'
      }}>
        <EmptyState>
          <EmptyStateHeader 
            titleText={`Erreur ${error.status}`}
            icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />} 
            headingLevel="h1" 
          />
          <EmptyStateBody>
            Une erreur s'est produite lors du chargement de cette page.
            <br />
            <strong>Message:</strong> {error.statusText || 'Erreur inconnue'}
            <br />
            <strong>Détails:</strong> {error.data || 'Aucun détail disponible'}
          </EmptyStateBody>
          <EmptyStateActions>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
            >
              Recharger la page
            </Button>
            <Button 
              variant="link" 
              onClick={() => window.location.href = '/'}
            >
              Retourner à l'accueil
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh',
      padding: '2rem'
    }}>
      <EmptyState>
        <EmptyStateHeader 
          titleText="Erreur inattendue"
          icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />} 
          headingLevel="h1" 
        />
        <EmptyStateBody>
          Une erreur inattendue s'est produite.
          <br />
          <strong>Message:</strong> {error?.toString() || 'Erreur inconnue'}
        </EmptyStateBody>
        <EmptyStateActions>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Recharger la page
          </Button>
          <Button 
            variant="link" 
            onClick={() => window.location.href = '/'}
          >
            Retourner à l'accueil
          </Button>
        </EmptyStateActions>
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
    console.error('🚨 [ErrorBoundary] Erreur React:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          padding: '2rem'
        }}>
          <EmptyState>
            <EmptyStateHeader 
              titleText="Erreur de l'application"
              icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />} 
              headingLevel="h1" 
            />
            <EmptyStateBody>
              Une erreur s'est produite dans l'application.
              <br />
              <strong>Message:</strong> {this.state.error?.message || 'Erreur inconnue'}
              <br />
              <strong>Stack:</strong> 
              <pre style={{ 
                fontSize: '0.8rem', 
                maxHeight: '200px', 
                overflow: 'auto',
                background: '#f5f5f5',
                padding: '0.5rem',
                marginTop: '0.5rem',
                borderRadius: '4px'
              }}>
                {this.state.error?.stack || 'Stack trace non disponible'}
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
              <Button 
                variant="link" 
                onClick={() => window.location.href = '/'}
              >
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
