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
  Progress,
  List,
  ListItem,
} from '@patternfly/react-core';
import { CheckCircleIcon, CheckIcon, TimesIcon } from '@patternfly/react-icons';
import { PageHeader } from '../../components/common/PageHeader';
import { apiUrl } from '../apiUrl';
import '../../styles/connexion.css'; // Réutiliser le même CSS que la page de connexion

// AJOUTÉ: Fonction pour analyser la force du mot de passe
const analyzePasswordStrength = (password: string) => {
  const criteria = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommon: !['password', '123456', 'qwerty', 'abc123', 'password123'].includes(password.toLowerCase())
  };

  const score = Object.values(criteria).filter(Boolean).length;
  
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  let color: 'red' | 'orange' | 'blue' | 'green';
  let percentage: number;

  if (score <= 2) {
    strength = 'weak';
    color = 'red';
    percentage = 25;
  } else if (score <= 3) {
    strength = 'fair';
    color = 'orange';
    percentage = 50;
  } else if (score <= 4) {
    strength = 'good';
    color = 'blue';
    percentage = 75;
  } else {
    strength = 'strong';
    color = 'green';
    percentage = 100;
  }

  return {
    criteria,
    score,
    strength,
    color,
    percentage,
    isValid: score >= 3 && criteria.length // Au moins 3 critères + longueur minimale
  };
};

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
  
  // AJOUTÉ: État pour la force du mot de passe
  const [passwordStrength, setPasswordStrength] = useState(analyzePasswordStrength(''));
  const [showStrengthDetails, setShowStrengthDetails] = useState(false);

  // AJOUTÉ: Mettre à jour la force du mot de passe quand il change
  useEffect(() => {
    setPasswordStrength(analyzePasswordStrength(password));
    setShowStrengthDetails(password.length > 0);
  }, [password]);

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
        
        // CORRIGÉ: Utiliser la bonne route API
        const response = await fetch(apiUrl(`auth/verify-token/${token}`));
        const data = await response.json();

        console.log('🔍 [ResetPassword] Réponse vérification:', { status: response.status, data });

        if (response.ok && data.valid) {
          setTokenValid(true);
          setUserInfo({ 
            email: data.email, 
            userName: data.userName 
          });
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
    
    // MODIFIÉ: Vérifier la force du mot de passe avant soumission
    if (!passwordStrength.isValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité requis');
      return;
    }

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
        // CORRIGÉ: Utiliser window.location.href au lieu de navigate
        setTimeout(() => {
          window.location.href = `${window.location.origin}/pages/connexion?reset=success`;
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

  // MODIFIÉ: Critères de validation plus stricts
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordStrength.isValid && passwordsMatch && password && confirmPassword;

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
                    // CORRIGÉ: Utiliser window.location.href au lieu de navigate
                    onClick={() => window.location.href = `${window.location.origin}/pages/auth/forgot-password`}
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
                    // CORRIGÉ: Utiliser window.location.href au lieu de navigate
                    onClick={() => window.location.href = `${window.location.origin}/pages/connexion`}
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
                    onClick={() => window.location.href = `${window.location.origin}/pages/connexion`}
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
        subtitle={`Bonjour ${userInfo?.userName}, définissez votre nouveau mot de passe sécurisé`}
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
                validated={password && !passwordStrength.isValid ? 'error' : 'default'}
                helperText="Choisissez un mot de passe fort pour sécuriser votre compte"
                helperTextInvalid="Le mot de passe ne respecte pas les critères de sécurité"
                className="login-form-group"
              >
                <TextInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(_event, value) => setPassword(value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  isRequired
                  validated={password && !passwordStrength.isValid ? 'error' : 'default'}
                  className="login-input"
                />

                {/* AJOUTÉ: Jauge de force du mot de passe */}
                {showStrengthDetails && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                        Force du mot de passe
                      </span>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '600',
                        color: passwordStrength.color === 'green' ? '#28a745' : 
                               passwordStrength.color === 'blue' ? '#007bff' :
                               passwordStrength.color === 'orange' ? '#fd7e14' : '#dc3545'
                      }}>
                        {passwordStrength.strength === 'weak' && '🔴 Faible'}
                        {passwordStrength.strength === 'fair' && '🟠 Moyenne'}
                        {passwordStrength.strength === 'good' && '🔵 Bonne'}
                        {passwordStrength.strength === 'strong' && '🟢 Forte'}
                      </span>
                    </div>
                    
                    <Progress
                      value={passwordStrength.percentage}
                      variant={
                        passwordStrength.color === 'red' ? 'danger' :
                        passwordStrength.color === 'orange' ? 'warning' :
                        passwordStrength.color === 'blue' ? 'info' : 'success'
                      }
                      size="sm"
                      style={{ marginBottom: '1rem' }}
                    />

                    {/* AJOUTÉ: Liste des critères */}
                    <div style={{ 
                      background: '#f8f9fa', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '6px', 
                      padding: '1rem',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '0.75rem',
                        color: '#495057'
                      }}>
                        Critères de sécurité :
                      </div>
                      
                      <List isPlain>
                        <ListItem style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '0.5rem',
                          color: passwordStrength.criteria.length ? '#28a745' : '#6c757d'
                        }}>
                          {passwordStrength.criteria.length ? 
                            <CheckIcon style={{ color: '#28a745', marginRight: '0.5rem' }} /> : 
                            <TimesIcon style={{ color: '#dc3545', marginRight: '0.5rem' }} />
                          }
                          Au moins 8 caractères
                        </ListItem>
                        
                        <ListItem style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '0.5rem',
                          color: passwordStrength.criteria.lowercase ? '#28a745' : '#6c757d'
                        }}>
                          {passwordStrength.criteria.lowercase ? 
                            <CheckIcon style={{ color: '#28a745', marginRight: '0.5rem' }} /> : 
                            <TimesIcon style={{ color: '#dc3545', marginRight: '0.5rem' }} />
                          }
                          Au moins une minuscule (a-z)
                        </ListItem>
                        
                        <ListItem style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '0.5rem',
                          color: passwordStrength.criteria.uppercase ? '#28a745' : '#6c757d'
                        }}>
                          {passwordStrength.criteria.uppercase ? 
                            <CheckIcon style={{ color: '#28a745', marginRight: '0.5rem' }} /> : 
                            <TimesIcon style={{ color: '#dc3545', marginRight: '0.5rem' }} />
                          }
                          Au moins une majuscule (A-Z)
                        </ListItem>
                        
                        <ListItem style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '0.5rem',
                          color: passwordStrength.criteria.numbers ? '#28a745' : '#6c757d'
                        }}>
                          {passwordStrength.criteria.numbers ? 
                            <CheckIcon style={{ color: '#28a745', marginRight: '0.5rem' }} /> : 
                            <TimesIcon style={{ color: '#dc3545', marginRight: '0.5rem' }} />
                          }
                          Au moins un chiffre (0-9)
                        </ListItem>
                        
                        <ListItem style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '0.5rem',
                          color: passwordStrength.criteria.symbols ? '#28a745' : '#6c757d'
                        }}>
                          {passwordStrength.criteria.symbols ? 
                            <CheckIcon style={{ color: '#28a745', marginRight: '0.5rem' }} /> : 
                            <TimesIcon style={{ color: '#dc3545', marginRight: '0.5rem' }} />
                          }
                          Au moins un caractère spécial (!@#$...)
                        </ListItem>
                        
                        <ListItem style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: passwordStrength.criteria.noCommon ? '#28a745' : '#6c757d'
                        }}>
                          {passwordStrength.criteria.noCommon ? 
                            <CheckIcon style={{ color: '#28a745', marginRight: '0.5rem' }} /> : 
                            <TimesIcon style={{ color: '#dc3545', marginRight: '0.5rem' }} />
                          }
                          Ne pas utiliser de mots de passe courants
                        </ListItem>
                      </List>
                    </div>
                  </div>
                )}
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

                {/* AJOUTÉ: Indicateur de correspondance */}
                {confirmPassword && (
                  <div style={{ 
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.85rem'
                  }}>
                    {passwordsMatch ? (
                      <>
                        <CheckIcon style={{ color: '#28a745', marginRight: '0.5rem' }} />
                        <span style={{ color: '#28a745' }}>Les mots de passe correspondent</span>
                      </>
                    ) : (
                      <>
                        <TimesIcon style={{ color: '#dc3545', marginRight: '0.5rem' }} />
                        <span style={{ color: '#dc3545' }}>Les mots de passe ne correspondent pas</span>
                      </>
                    )}
                  </div>
                )}
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
                  // CORRIGÉ: Utiliser window.location.href au lieu de navigate
                  onClick={() => window.location.href = `${window.location.origin}/pages/connexion`}
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
