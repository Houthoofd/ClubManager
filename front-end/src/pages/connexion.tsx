import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  AlertVariant,
  PageSection,
  Bullseye,
} from '@patternfly/react-core';
import ResultModal from '../components/common/modal/ResultModal';
import { useConnexion } from '../hooks/useConnexion';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';
import { PageHeader } from '../components/common/PageHeader';
import { apiUrl } from './apiUrl';
import '../styles/connexion.css'; // Import du fichier CSS

const LoginPage = ({ onSuccess }: { onSuccess?: (data: any) => void }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState('');
  const [countdown, setCountdown] = useState(5); // Changement de 3 à 5 secondes
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const connexion = useConnexion();

  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = await connexion.mutateAsync(formData);

      console.log('Réponse de l\'API:', data);

      if (!data || !data.user) {
        throw new Error('Données utilisateur manquantes dans la réponse.');
      }

      const { user, token } = data;

      // Enregistrer le token dans le localStorage
      localStorage.setItem('authToken', token);

      localStorage.setItem('userData', JSON.stringify({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        nom_utilisateur: user.nom_utilisateur || '',
        email: user.email,
        status: user.status,
        genres: user.genres,
        grades: user.grades,
        abonnement: user.abonnement,
        date_of_birth: user.date_of_birth,
        token,
      }));

      dispatch(loginSuccess(user));

      if (onSuccess) {
        onSuccess(data);
      }

      // Afficher la ResultModal de succès
      setResultModalMessage(`Bienvenue ${user.first_name} ${user.last_name} ! Connexion réussie.`);
      setIsResultModalOpen(true);
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.message || 'Erreur lors de la tentative de connexion');
    }
  };

  // Fonction pour gérer la fermeture de la modal et redirection
  const handleResultModalClose = () => {
    setIsResultModalOpen(false);
    window.location.href = `${window.location.origin}/pages/dashboard`;
  };

  // Effet pour redirection automatique avec timer
  useEffect(() => {
    if (isResultModalOpen && resultModalMessage.includes('Bienvenue')) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.href = `${window.location.origin}/pages/dashboard`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Nettoyer l'interval si l'utilisateur ferme la modal manuellement
      return () => clearInterval(interval);
    }
  }, [isResultModalOpen, resultModalMessage]);

  // Réinitialiser le countdown quand la modal s'ouvre
  useEffect(() => {
    if (isResultModalOpen) {
      setCountdown(5); // Changement de 3 à 5 secondes
    }
  }, [isResultModalOpen]);

  return (
    <div className="login-page">
      {/* Background decorative elements */}
      <div className="login-background-decoration" />

      <PageHeader
        title="Club Manager"
        subtitle="Connectez-vous à votre espace membre"
        variant="login"
      />

      <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
        <Bullseye style={{ width: '100%' }}>
          <div className="login-container">
            {/* Logo/Icon section */}
            <div className="login-header">
              <div className="login-logo">🥋</div>
              <h1 className="login-title">Bienvenue</h1>
              <p className="login-subtitle">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>

            <Form onSubmit={handleSubmit} className="login-form">
              {error && (
                <Alert
                  variant={AlertVariant.danger}
                  title="Erreur de connexion"
                  isInline
                  className="login-error"
                >
                  {error}
                </Alert>
              )}

              <FormGroup label="Email" isRequired fieldId="email" className="login-form-group">
                <TextInput
                  isRequired
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(_event, value) => handleChange('email', value)}
                  placeholder="Entrez votre email"
                  className="login-input"
                />
              </FormGroup>

              <FormGroup label="Mot de passe" isRequired fieldId="password" className="login-form-group">
                <TextInput
                  isRequired
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(_event, value) => handleChange('password', value)}
                  placeholder="Entrez votre mot de passe"
                  className="login-input"
                />
              </FormGroup>

              <div className="login-actions">
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={connexion.isPending}
                  isDisabled={connexion.isPending}
                  className="login-button"
                >
                  {connexion.isPending ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </div>

              <div className="login-footer">
                <p>
                  Pas encore de compte ?{' '}
                  <Link to="/pages/inscription" className="register-link">
                    Inscrivez-vous ici
                  </Link>
                </p>
              </div>
            </Form>
          </div>
        </Bullseye>
      </PageSection>

      {/* ResultModal avec timer dans le footer */}
      <ResultModal
        isOpen={isResultModalOpen}
        onClose={handleResultModalClose}
        title="Connexion réussie"
        message={resultModalMessage}
        isSuccess={true}
        showTimer={true}
        countdown={countdown}
      />
    </div>
  );
};

export default LoginPage;


