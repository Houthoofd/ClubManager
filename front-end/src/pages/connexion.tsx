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

const LoginPage = ({ onSuccess }: { onSuccess?: (data: any) => void }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const connexion = useConnexion();

  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = await connexion.mutateAsync(formData);
      const { message, ...dataToStore } = data;
      localStorage.setItem('userData', JSON.stringify(dataToStore));

      if (onSuccess) {
        onSuccess(dataToStore);
      }

      navigate('/pages/dashboard');
    } catch (err: any) {
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
