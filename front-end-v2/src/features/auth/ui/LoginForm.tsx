/**
 * Auth Feature - LoginForm Component
 *
 * Formulaire de connexion avec validation, gestion d'erreurs et états de chargement.
 * Utilise le hook useAuth et le pattern Result pour une gestion d'erreurs type-safe.
 *
 * @example
 * ```tsx
 * <LoginForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onForgotPassword={() => navigate('/forgot-password')}
 * />
 * ```
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  Alert,
  AlertActionCloseButton,
  InputGroup,
  InputGroupItem,
} from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '../model/useAuth';
import type { LoginCredentials, ValidationErrors } from '../model/types';

// ============================================================================
// Types
// ============================================================================

interface LoginFormProps {
  /**
   * Callback appelé après une connexion réussie
   */
  onSuccess?: () => void;

  /**
   * Callback appelé lors du clic sur "Mot de passe oublié"
   */
  onForgotPassword?: () => void;

  /**
   * Callback appelé lors du clic sur "Créer un compte"
   */
  onRegister?: () => void;

  /**
   * Redirection par défaut après connexion
   */
  defaultRedirect?: string;

  /**
   * Afficher le lien "Créer un compte"
   */
  showRegisterLink?: boolean;

  /**
   * Afficher la case "Se souvenir de moi"
   */
  showRememberMe?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  onRegister,
  defaultRedirect = '/pages/dashboard',
  showRegisterLink = true,
  showRememberMe = true,
}) => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  // ========================================
  // State
  // ========================================

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========================================
  // Validation
  // ========================================

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Email
    if (!credentials.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      newErrors.email = 'Email invalide';
    }

    // Password
    if (!credentials.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========================================
  // Handlers
  // ========================================

  const handleInputChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Effacer l'erreur du champ modifié
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Effacer le message d'erreur général
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Effacer les erreurs précédentes
    setErrorMessage(null);

    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    // Tenter la connexion
    login.mutate(credentials, {
      onSuccess: () => {
        // Appeler le callback ou rediriger
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(defaultRedirect);
        }
      },
      onError: (error: Error) => {
        // Afficher l'erreur
        setErrorMessage(error.message || 'Erreur lors de la connexion');
      },
    });
  };

  const handleForgotPasswordClick = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      navigate('/pages/auth/forgot-password');
    }
  };

  const handleRegisterClick = () => {
    if (onRegister) {
      onRegister();
    } else {
      navigate('/pages/inscription');
    }
  };

  // ========================================
  // Render
  // ========================================

  return (
    <Form onSubmit={handleSubmit} className="login-form">
      {/* Alerte d'erreur générale */}
      {errorMessage && (
        <Alert
          variant="danger"
          title="Erreur de connexion"
          actionClose={<AlertActionCloseButton onClose={() => setErrorMessage(null)} />}
          style={{ marginBottom: '1rem' }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Champ Email */}
      <FormGroup
        label="Email"
        isRequired
        fieldId="login-email"
        validated={errors.email ? 'error' : 'default'}
        helperTextInvalid={errors.email}
      >
        <TextInput
          id="login-email"
          type="email"
          value={credentials.email}
          onChange={(_, value) => handleInputChange('email', value)}
          validated={errors.email ? 'error' : 'default'}
          isRequired
          placeholder="votre.email@exemple.com"
          autoComplete="email"
          isDisabled={isLoading}
        />
      </FormGroup>

      {/* Champ Mot de passe */}
      <FormGroup
        label="Mot de passe"
        isRequired
        fieldId="login-password"
        validated={errors.password ? 'error' : 'default'}
        helperTextInvalid={errors.password}
      >
        <InputGroup>
          <InputGroupItem isFill>
            <TextInput
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={(_, value) => handleInputChange('password', value)}
              validated={errors.password ? 'error' : 'default'}
              isRequired
              placeholder="••••••••"
              autoComplete="current-password"
              isDisabled={isLoading}
            />
          </InputGroupItem>
          <InputGroupItem>
            <Button
              variant="control"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              isDisabled={isLoading}
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </Button>
          </InputGroupItem>
        </InputGroup>
      </FormGroup>

      {/* Options */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        {showRememberMe && (
          <Checkbox
            id="remember-me"
            label="Se souvenir de moi"
            isChecked={credentials.rememberMe}
            onChange={(_, checked) => handleInputChange('rememberMe', checked)}
            isDisabled={isLoading}
          />
        )}
        <Button
          variant="link"
          onClick={handleForgotPasswordClick}
          isDisabled={isLoading}
          style={{ padding: 0 }}
        >
          Mot de passe oublié ?
        </Button>
      </div>

      {/* Bouton de soumission */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
        loadingText="Connexion en cours..."
      >
        Se connecter
      </Button>

      {/* Lien d'inscription */}
      {showRegisterLink && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <span style={{ color: '#6a6e73' }}>Pas encore de compte ? </span>
          <Button
            variant="link"
            onClick={handleRegisterClick}
            isDisabled={isLoading}
            style={{ padding: 0 }}
          >
            Créer un compte
          </Button>
        </div>
      )}
    </Form>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default LoginForm;
