/**
 * Forgot Password Page
 *
 * Page permettant à l'utilisateur de demander une réinitialisation de mot de passe.
 *
 * @module pages/auth/ForgotPasswordPage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Page,
  PageSection,
  Card,
  CardBody,
  CardTitle,
  Text,
  TextContent,
  Alert,
} from '@patternfly/react-core';
import { ForgotPasswordForm, useForgotPassword } from '@features/auth';
import type { ForgotPasswordData } from '@features/auth';

// ============================================================================
// Component
// ============================================================================

export const ForgotPasswordPage: React.FC = () => {
  const forgotPasswordMutation = useForgotPassword();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Handle forgot password submission
  const handleSubmit = async (data: ForgotPasswordData) => {
    const result = await forgotPasswordMutation.mutateAsync(data);

    if (result.isOk()) {
      setSuccessMessage(
        'Un email de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.'
      );
    }
  };

  return (
    <Page>
      <PageSection
        variant="light"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Card
          style={{
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}
        >
          <CardTitle style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <TextContent>
              <Text component="h1" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                Mot de passe oublié
              </Text>
              <Text component="p" style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                Entrez votre email pour réinitialiser votre mot de passe
              </Text>
            </TextContent>
          </CardTitle>

          <CardBody>
            {/* Success message */}
            {successMessage && (
              <Alert
                variant="success"
                title="Email envoyé"
                style={{ marginBottom: '1.5rem' }}
              >
                {successMessage}
              </Alert>
            )}

            {/* Error message */}
            {forgotPasswordMutation.isError && forgotPasswordMutation.error && (
              <Alert
                variant="danger"
                title="Erreur"
                style={{ marginBottom: '1.5rem' }}
              >
                {forgotPasswordMutation.error.message || 'Une erreur est survenue'}
              </Alert>
            )}

            {/* Forgot Password Form */}
            {!successMessage && (
              <ForgotPasswordForm
                onSubmit={handleSubmit}
                isLoading={forgotPasswordMutation.isPending}
              />
            )}

            {/* Back to login link */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Text component="p" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                <Link
                  to="/auth/login"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  ← Retour à la connexion
                </Link>
              </Text>
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

export default ForgotPasswordPage;
