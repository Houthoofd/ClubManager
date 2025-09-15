import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { useConnexion } from '../hooks/useConnexion';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';

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

      console.log('Réponse de l\'API:', data); // Ajoutez cette ligne pour inspecter la réponse

      if (!data || !data.user) {
        throw new Error('Données utilisateur manquantes dans la réponse.');
      }

      const { user, token } = data; // Extraire directement `user` et `token` après la correction du hook

      // Enregistrer les données utilisateur dans le localStorage dans le format spécifié
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

      navigate('/pages/dashboard');
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err); // Ajoutez cette ligne pour inspecter l'erreur
      setError(err.message || 'Erreur lors de la tentative de connexion');
    }
  };

  return (
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

      <Button type="submit" variant="primary" isLoading={connexion.isLoading}>
        Se connecter
      </Button>
    </Form>
  );
};

export default LoginPage;
