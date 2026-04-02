/**
 * 404 Not Found Page
 *
 * Page affichée lorsque l'utilisateur tente d'accéder à une route inexistante.
 *
 * @module app/router/NotFoundPage
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  PageSection,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateActions,
  Button,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

/**
 * 404 Not Found Page Component
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <PageSection
        variant="light"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EmptyState>
          <EmptyStateHeader
            titleText="Page introuvable"
            icon={<EmptyStateIcon icon={SearchIcon} />}
            headingLevel="h1"
          />
          <EmptyStateBody>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              Désolé, la page que vous recherchez n'existe pas.
            </p>
            <p style={{ color: '#6c757d' }}>
              Il se peut que le lien soit cassé ou que la page ait été déplacée.
            </p>
          </EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Retour au tableau de bord
            </Button>
            <Button variant="link" onClick={() => navigate(-1)}>
              Retour à la page précédente
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </PageSection>
    </Page>
  );
};

export default NotFoundPage;
