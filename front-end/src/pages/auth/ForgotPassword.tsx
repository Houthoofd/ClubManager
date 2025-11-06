import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  PageSection,
  Bullseye,
} from '@patternfly/react-core';
import { PageHeader } from '../../components/common/PageHeader';
import '../../styles/connexion.css'; // Réutiliser le même CSS que la page de connexion
import { apiUrl } from '../apiUrl';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(apiUrl('auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmailSent(true);
      } else {
        setError(data.error || 'Erreur lors de la demande');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="login-page">
      <div className="login-background-decoration" />

      <PageHeader
        title="Récupération de mot de passe"
        subtitle="Entrez votre adresse email pour recevoir un lien de récupération"
        variant="login"
      />

      <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
        <Bullseye style={{ width: '100%' }}>
          <div className="login-container">
            {!emailSent ? (
              <Form onSubmit={handleSubmit} className="login-form">
                <FormGroup
                  label="Adresse email"
                  isRequired
                  fieldId="email"
                  validated={email && !isEmailValid(email) ? 'error' : 'default'}
                  helperTextInvalid="Veuillez entrer une adresse email valide"
                  className="login-form-group"
                >
                  <TextInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(_event, value) => setEmail(value)}
                    placeholder="votre.email@exemple.com"
                    isRequired
                    validated={email && !isEmailValid(email) ? 'error' : 'default'}
                    className="login-input"
                  />
                </FormGroup>

                {error && (
                  <Alert variant="danger" title="Erreur" style={{ marginBottom: '1rem' }}>
                    {error}
                  </Alert>
                )}

                <div className="login-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    isDisabled={!email || !isEmailValid(email)}
                    className="login-button"
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien de récupération'}
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="login-form" style={{ textAlign: 'center' }}>
                <Alert variant="success" title="Email envoyé" style={{ marginBottom: '1rem' }}>
                  {message}
                </Alert>
                <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
                  Vérifiez votre boîte email et cliquez sur le lien pour réinitialiser votre mot de passe.
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1rem' }}>
                  Le lien expire dans 1 heure.
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                  ⚠️ Pensez à vérifier vos spams si vous ne recevez pas l'email
                </p>
              </div>
            )}

            <div className="login-footer">
              <p>
                Vous vous souvenez de votre mot de passe ?{' '}
                <Button
                  variant="link"
                  onClick={() => navigate('/pages/connexion')}
                  style={{ padding: 0, fontSize: 'inherit' }}
                >
                  Retour à la connexion
                </Button>
              </p>
            </div>
          </div>
        </Bullseye>
      </PageSection>
    </div>
  );
};

export default ForgotPasswordPage;
