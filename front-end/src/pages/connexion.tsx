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
import type { UserDataLogin } from '@clubmanager/types';


interface LoginPageProps {
  onSuccess?: (data: any) => void;
}

const LoginPage = ({ onSuccess }: LoginPageProps) => {
  const [formData, setFormData] = useState<UserDataLogin>({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (field: keyof UserDataLogin, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/utilisateurs/connexion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const { message, ...dataToStore } = data;
        localStorage.setItem('userData', JSON.stringify(dataToStore));

        if (onSuccess) {
          onSuccess(dataToStore);
        }

        navigate('/pages/dashboard');
      } else {
        setError(data.message || 'Identifiants incorrects');
      }
    } catch (err) {
      setError('Erreur lors de la tentative de connexion');
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
        <Alert
          variant={AlertVariant.danger}
          title="Erreur"
          isInline
        >
          {error}
        </Alert>
      )}

      <Button type="submit" variant="primary">
        Se connecter
      </Button>
    </Form>
  );
};

export default LoginPage;
