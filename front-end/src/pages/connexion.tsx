import { useState } from 'react';
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
  Title,
} from '@patternfly/react-core';
import { useConnexion } from '../hooks/useConnexion';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';
import { PageHeader } from '../components/common/PageHeader';

const LoginPage = ({ onSuccess }: { onSuccess?: (data: any) => void }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
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
      }));

      dispatch(loginSuccess(user)); // Mettre à jour le store Redux avec les données utilisateur

      if (onSuccess) {
        onSuccess(data);
      }

      // Redirigez l'utilisateur vers la page dashboard
      navigate('/pages/dashboard');
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.message || 'Erreur lors de la tentative de connexion');
    }
  };

  const breadcrumbItems = [
    { title: 'Accueil', to: '/' },
    { title: 'Connexion', isActive: true },
  ];

  return (
    <PageSection style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <PageHeader
        title="Connexion"
        subtitle="Accédez à votre compte"
        breadcrumbItems={breadcrumbItems}
      />
      <Bullseye>
        <div style={{ maxWidth: '800px', width: '100%', padding: '3rem', boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)', borderRadius: '12px', backgroundColor: '#fff' }}>
          <Form onSubmit={handleSubmit}>
            <FormGroup label="Email" isRequired fieldId="email">
              <TextInput
                id="email"
                value={formData.email}
                onChange={(_, value) => handleChange('email', value)}
                type="email"
                isRequired
              />
            </FormGroup>
            <FormGroup label="Mot de passe" isRequired fieldId="password">
              <TextInput
                id="password"
                value={formData.password}
                onChange={(_, value) => handleChange('password', value)}
                type="password"
                isRequired
              />
            </FormGroup>

            {error && (
              <Alert variant={AlertVariant.danger} title="Erreur" isInline>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={connexion.isLoading}
              style={{ width: '100%', marginTop: '2rem' }}
            >
              Se connecter
            </Button>
          </Form>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p>
              Pas encore inscrit ?{' '}
              <Link to="/pages/inscription" style={{ color: '#007bff', textDecoration: 'none' }}>
                Créez un compte
              </Link>
            </p>
          </div>
        </div>
      </Bullseye>
    </PageSection>
  );
};

export default LoginPage;
