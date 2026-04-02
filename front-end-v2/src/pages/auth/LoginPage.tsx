/**
 * Login Page
 *
 * Page de connexion avec formulaire d'authentification.
 * Utilise la feature auth pour gérer la logique de connexion.
 *
 * @module pages/auth/LoginPage
 */

import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
import { LoginForm, useLogin } from '@features/auth';
import type { LoginCredentials } from '@features/auth';

// ============================================================================
// Component
// ============================================================================

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  // Redirect location after successful login
  const from = (location.state as { from?: string })?.from || '/dashboard';

  // Handle login submission
  const handleLogin = async (credentials: LoginCredentials) => {
    const result = await loginMutation.mutateAsync(credentials);

    if (result.isOk()) {
      // Redirect to the page they tried to access, or dashboard
      navigate(from, { replace: true });
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
                ClubManager
              </Text>
              <Text component="p" style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                Connectez-vous à votre compte
              </Text>
            </TextContent>
          </CardTitle>

          <CardBody>
            {/* Show error alert if login failed */}
            {loginMutation.isError && loginMutation.error && (
              <Alert
                variant="danger"
                title="Erreur de connexion"
                style={{ marginBottom: '1.5rem' }}
              >
                {loginMutation.error.message || 'Une erreur est survenue lors de la connexion'}
              </Alert>
            )}

            {/* Show info if redirected from protected route */}
            {location.state?.message && (
              <Alert
                variant="info"
                title="Authentification requise"
                style={{ marginBottom: '1.5rem' }}
              >
                {location.state.message}
              </Alert>
            )}

            {/* Login Form */}
            <LoginForm
              onSubmit={handleLogin}
              isLoading={loginMutation.isPending}
            />

            {/* Additional Links */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Text component="p" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                <Link
                  to="/auth/forgot-password"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Mot de passe oublié ?
                </Link>
              </Text>

              <Text
                component="p"
                style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '1rem' }}
              >
                Pas encore de compte ?{' '}
                <Link
                  to="/auth/register"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  S'inscrire
                </Link>
              </Text>
            </div>
          </CardBody>
        </Card>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            textAlign: 'center',
            color: 'white',
            fontSize: '0.85rem',
          }}
        >
          <Text component="p">
            ClubManager v2.0 - © 2024 - Tous droits réservés
          </Text>
        </div>
      </PageSection>
    </Page>
  );
};

export default LoginPage;
