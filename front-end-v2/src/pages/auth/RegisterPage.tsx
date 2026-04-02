/**
 * Register Page
 *
 * Page d'inscription avec formulaire de création de compte.
 * Utilise la feature auth pour gérer la logique d'inscription.
 *
 * @module pages/auth/RegisterPage
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { RegisterForm, useRegister } from '@features/auth';
import type { RegisterData } from '@features/auth';

// ============================================================================
// Component
// ============================================================================

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  // Handle registration submission
  const handleRegister = async (data: RegisterData) => {
    const result = await registerMutation.mutateAsync(data);

    if (result.isOk()) {
      // Redirect to login with success message
      navigate('/auth/login', {
        state: {
          message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
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
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}
        >
          <CardTitle style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <TextContent>
              <Text component="h1" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                Créer un compte
              </Text>
              <Text component="p" style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                Rejoignez ClubManager aujourd'hui
              </Text>
            </TextContent>
          </CardTitle>

          <CardBody>
            {/* Show error alert if registration failed */}
            {registerMutation.isError && registerMutation.error && (
              <Alert
                variant="danger"
                title="Erreur d'inscription"
                style={{ marginBottom: '1.5rem' }}
              >
                {registerMutation.error.message || 'Une erreur est survenue lors de l\'inscription'}
              </Alert>
            )}

            {/* Registration Form */}
            <RegisterForm
              onSubmit={handleRegister}
              isLoading={registerMutation.isPending}
            />

            {/* Additional Links */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Text
                component="p"
                style={{ fontSize: '0.9rem', color: '#6c757d' }}
              >
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/auth/login"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Se connecter
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

export default RegisterPage;
