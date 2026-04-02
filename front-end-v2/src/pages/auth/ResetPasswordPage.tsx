/**
 * Reset Password Page
 *
 * Page pour réinitialiser le mot de passe avec un token reçu par email.
 *
 * @module pages/auth/ResetPasswordPage
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { ResetPasswordForm, useResetPassword } from '@features/auth';
import type { ResetPasswordData } from '@features/auth';

// ============================================================================
// Component
// ============================================================================

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetPasswordMutation = useResetPassword();

  // Get token from URL
  const token = searchParams.get('token');

  // Handle reset password submission
  const handleResetPassword = async (data: Omit<ResetPasswordData, 'token'>) => {
    if (!token) {
      return;
    }

    const result = await resetPasswordMutation.mutateAsync({
      ...data,
      token,
    });

    if (result.isOk()) {
      // Redirect to login page on success
      navigate('/auth/login', {
        state: {
          message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        },
      });
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
              <Text component="h1" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                Réinitialiser le mot de passe
              </Text>
              <Text component="p" style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                Choisissez un nouveau mot de passe pour votre compte
              </Text>
            </TextContent>
          </CardTitle>

          <CardBody>
            {/* Show error alert if token is missing */}
            {!token && (
              <Alert
                variant="danger"
                title="Token manquant"
                style={{ marginBottom: '1.5rem' }}
              >
                Le lien de réinitialisation est invalide. Veuillez demander un nouveau lien.
              </Alert>
            )}

            {/* Show error alert if reset failed */}
            {resetPasswordMutation.isError && resetPasswordMutation.error && (
              <Alert
                variant="danger"
                title="Erreur"
                style={{ marginBottom: '1.5rem' }}
              >
                {resetPasswordMutation.error.message || 'Une erreur est survenue'}
              </Alert>
            )}

            {/* Reset Password Form */}
            {token && (
              <ResetPasswordForm
                onSubmit={handleResetPassword}
                isLoading={resetPasswordMutation.isPending}
              />
            )}

            {/* Back to login link */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Text component="p" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                <a
                  href="/auth/login"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  ← Retour à la connexion
                </a>
              </Text>
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

export default ResetPasswordPage;
