import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  PageSection,
  Bullseye,
  Spinner,
  ProgressStep,
  ProgressStepper,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { PageHeader } from '../../components/common/PageHeader';
import { apiUrl } from '../apiUrl';
import '../../styles/connexion.css'; // Réutiliser le même CSS que la page de connexion

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; userName: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token manquant dans l\'URL');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [ResetPassword] Vérification du token:', token.substring(0, 10) + '...');
        
        const response = await fetch(apiUrl(`auth/verify-token/${token}`));
        const data = await response.json();

        console.log('🔍 [ResetPassword] Réponse vérification:', { status: response.status, data });

        if (response.ok && data.valid) {
          setTokenValid(true);
          setUserInfo({ email: data.email, userName: data.userName });
          console.log('✅ [ResetPassword] Token valide pour:', data.userName);
        } else {
          console.error('❌ [ResetPassword] Token invalide:', data);
          setError(data.error || 'Token invalide ou expiré');
        }
      } catch (err) {
        console.error('❌ [ResetPassword] Erreur vérification token:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // CORRIGÉ: URL avec le bon préfixe d'API
      const response = await fetch(apiUrl('auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/pages/connexion?reset=success');
        }, 3000);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      console.error('Erreur réinitialisation:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setSubmitting(false);
    }
  };

  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isPasswordValid && passwordsMatch && password;

  // État de chargement
  if (loading) {
    return (
      <div className="login-page">
        <div className="login-background-decoration" />
        
        <PageHeader
          title="Vérification en cours..."
          subtitle="Vérification du lien de récupération"
          variant="login"
        />

        <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
          <Bullseye style={{ width: '100%' }}>
            <div className="login-container" style={{ textAlign: 'center' }}>
              <Spinner size="xl" />
              <div style={{ marginTop: '1rem', color: '#6c757d' }}>
                Vérification du lien de récupération...
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </div>
    );
  }

  // Token invalide
  if (!tokenValid) {
    return (
      <div className="login-page">
        <div className="login-background-decoration" />
        
        <PageHeader
          title="Lien invalide"
          subtitle="Ce lien de récupération est invalide ou a expiré"
          variant="login"
        />

        <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
          <Bullseye style={{ width: '100%' }}>
            <div className="login-container">
              <div className="login-form" style={{ textAlign: 'center' }}>
                <Alert variant="danger" title="Lien invalide" style={{ marginBottom: '1rem' }}>
                  {error}
                </Alert>
                <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
                  Ce lien de récupération est invalide ou a expiré.
                </p>
                <div className="login-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/pages/forgot-password')}
                    className="login-button"
                  >
                    Demander un nouveau lien
                  </Button>
                </div>
              </div>
              
              <div className="login-footer">
                <p>
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
  }

  // Succès
  if (success) {
    return (
      <div className="login-page">
        <div className="login-background-decoration" />
        
        <PageHeader
          title="Mot de passe réinitialisé !"
          subtitle="Votre mot de passe a été mis à jour avec succès"
          variant="login"
        />

        <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
          <Bullseye style={{ width: '100%' }}>
            <div className="login-container">
              <div className="login-form" style={{ textAlign: 'center' }}>
                <CheckCircleIcon size="xl" style={{ color: '#28a745', marginBottom: '2rem' }} />
                
                <Alert variant="success" title="Succès" style={{ marginBottom: '1rem' }}>
                  Votre mot de passe a été réinitialisé avec succès.
                </Alert>
                
                <p style={{ marginBottom: '2rem', color: '#6c757d' }}>
                  Redirection vers la page de connexion dans quelques secondes...
                </p>
                
                <div className="login-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/pages/connexion')}
                    className="login-button"
                  >
                    Se connecter maintenant
                  </Button>
                </div>
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-background-decoration" />

      <PageHeader
        title="Nouveau mot de passe"
        subtitle={`Bonjour ${userInfo?.userName}, définissez votre nouveau mot de passe`}
        variant="login"
      />

      <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
        <Bullseye style={{ width: '100%' }}>
          <div className="login-container">
            
            <ProgressStepper style={{ marginBottom: '2rem' }}>
              <ProgressStep variant="success" id="step1">
                Email vérifié
              </ProgressStep>
              <ProgressStep variant="pending" id="step2" isCurrent>
                Nouveau mot de passe
              </ProgressStep>
              <ProgressStep variant="pending" id="step3">
                Terminé
              </ProgressStep>
            </ProgressStepper>

            <Form onSubmit={handleSubmit} className="login-form">
              <FormGroup
                label="Nouveau mot de passe"
                isRequired
                fieldId="password"
                validated={password && !isPasswordValid ? 'error' : 'default'}
                helperText="Au moins 8 caractères"
                helperTextInvalid="Le mot de passe doit contenir au moins 8 caractères"
                className="login-form-group"
              >
                <TextInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(_event, value) => setPassword(value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  isRequired
                  validated={password && !isPasswordValid ? 'error' : 'default'}
                  className="login-input"
                />
              </FormGroup>

              <FormGroup
                label="Confirmer le mot de passe"
                isRequired
                fieldId="confirmPassword"
                validated={confirmPassword && !passwordsMatch ? 'error' : 'default'}
                helperTextInvalid="Les mots de passe ne correspondent pas"
                className="login-form-group"
              >
                <TextInput
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(_event, value) => setConfirmPassword(value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  isRequired
                  validated={confirmPassword && !passwordsMatch ? 'error' : 'default'}
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
                  isLoading={submitting}
                  isDisabled={!canSubmit}
                  className="login-button"
                >
                  {submitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </Button>
              </div>
            </Form>

            <div className="login-footer">
              <p>
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

export default ResetPasswordPage;
