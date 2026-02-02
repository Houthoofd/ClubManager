import { ValidatedOptions } from '@patternfly/react-core';
import { EMAIL_REGEX, PASSWORD_REGEX, NAME_REGEX, TEMPORARY_EMAIL_DOMAINS, WEAK_PASSWORDS } from '../constants/validationConstants';

export const validatePrenom = (value: string) => {
  const trimmedValue = value.trim();
  
  if (!trimmedValue) {
    return {
      isValid: false,
      message: 'Le prénom est obligatoire',
      validated: ValidatedOptions.error
    };
  }
  
  if (trimmedValue.length < 2) {
    return {
      isValid: false,
      message: 'Le prénom doit contenir au moins 2 caractères',
      validated: ValidatedOptions.error
    };
  }
  
  if (trimmedValue.length > 30) {
    return {
      isValid: false,
      message: 'Le prénom ne peut pas dépasser 30 caractères',
      validated: ValidatedOptions.error
    };
  }
  
  if (!NAME_REGEX.test(trimmedValue)) {
    return {
      isValid: false,
      message: 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets',
      validated: ValidatedOptions.error
    };
  }
  
  if (/^\s|\s$/.test(value)) {
    return {
      isValid: false,
      message: 'Le prénom ne peut pas commencer ou finir par un espace',
      validated: ValidatedOptions.error
    };
  }
  
  return {
    isValid: true,
    message: 'Prénom valide',
    validated: ValidatedOptions.success
  };
};

export const validateNom = (value: string) => {
  const trimmedValue = value.trim();
  
  if (!trimmedValue) {
    return {
      isValid: false,
      message: 'Le nom est obligatoire',
      validated: ValidatedOptions.error
    };
  }
  
  if (trimmedValue.length < 2) {
    return {
      isValid: false,
      message: 'Le nom doit contenir au moins 2 caractères',
      validated: ValidatedOptions.error
    };
  }
  
  if (trimmedValue.length > 30) {
    return {
      isValid: false,
      message: 'Le nom ne peut pas dépasser 30 caractères',
      validated: ValidatedOptions.error
    };
  }
  
  if (!NAME_REGEX.test(trimmedValue)) {
    return {
      isValid: false,
      message: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets',
      validated: ValidatedOptions.error
    };
  }
  
  return {
    isValid: true,
    message: 'Nom valide',
    validated: ValidatedOptions.success
  };
};

export const validateEmail = (value: string) => {
  const trimmedValue = value.trim().toLowerCase();
  
  if (!trimmedValue) {
    return {
      isValid: false,
      message: 'L\'email est obligatoire',
      validated: ValidatedOptions.error
    };
  }
  
  if (!EMAIL_REGEX.test(trimmedValue)) {
    return {
      isValid: false,
      message: 'Format d\'email invalide',
      validated: ValidatedOptions.error
    };
  }
  
  const domain = trimmedValue.split('@')[1];
  if (TEMPORARY_EMAIL_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      message: 'Les adresses email temporaires ne sont pas autorisées',
      validated: ValidatedOptions.error
    };
  }
  
  if (trimmedValue.length > 100) {
    return {
      isValid: false,
      message: 'L\'email ne peut pas dépasser 100 caractères',
      validated: ValidatedOptions.error
    };
  }
  
  return {
    isValid: true,
    message: 'Email valide',
    validated: ValidatedOptions.success
  };
};

export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[@$!%*?&]/.test(password)) strength += 1;
  if (!/(.)\1{2,}/.test(password)) strength += 1;
  if (!/123|abc|qwe/i.test(password)) strength += 1;
  
  return Math.min(strength, 8);
};

export const validatePassword = (value: string, setPasswordStrength: (strength: number) => void) => {
  if (!value) {
    return {
      isValid: false,
      message: 'Le mot de passe est obligatoire',
      validated: ValidatedOptions.error
    };
  }
  
  if (value.length < 8) {
    return {
      isValid: false,
      message: 'Le mot de passe doit contenir au moins 8 caractères',
      validated: ValidatedOptions.error
    };
  }
  
  if (value.length > 128) {
    return {
      isValid: false,
      message: 'Le mot de passe ne peut pas dépasser 128 caractères',
      validated: ValidatedOptions.error
    };
  }
  
  if (WEAK_PASSWORDS.includes(value.toLowerCase())) {
    return {
      isValid: false,
      message: 'Ce mot de passe est trop commun, choisissez-en un autre',
      validated: ValidatedOptions.error
    };
  }
  
  const strength = calculatePasswordStrength(value);
  setPasswordStrength(strength);
  
  if (strength < 4) {
    return {
      isValid: false,
      message: 'Mot de passe trop faible',
      validated: ValidatedOptions.warning
    };
  }
  
  if (!PASSWORD_REGEX.test(value)) {
    return {
      isValid: false,
      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      validated: ValidatedOptions.error
    };
  }
  
  return {
    isValid: true,
    message: 'Mot de passe fort',
    validated: ValidatedOptions.success
  };
};

export const validateConfirmPassword = (value: string, password: string) => {
  if (!value) {
    return {
      isValid: false,
      message: 'La confirmation du mot de passe est obligatoire',
      validated: ValidatedOptions.error
    };
  }
  
  if (value !== password) {
    return {
      isValid: false,
      message: 'Les mots de passe ne correspondent pas',
      validated: ValidatedOptions.error
    };
  }
  
  return {
    isValid: true,
    message: 'Confirmation correcte',
    validated: ValidatedOptions.success
  };
};

export const validateDateNaissance = (value: string) => {
  if (!value) {
    return {
      isValid: false,
      message: 'La date de naissance est obligatoire',
      validated: ValidatedOptions.error
    };
  }
  
  const birthDate = new Date(value);
  const today = new Date();
  
  today.setHours(23, 59, 59, 999);
  birthDate.setHours(0, 0, 0, 0);
  
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      message: 'Date invalide',
      validated: ValidatedOptions.error
    };
  }
  
  if (birthDate > today) {
    return {
      isValid: false,
      message: 'La date de naissance ne peut pas être dans le futur',
      validated: ValidatedOptions.error
    };
  }
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (birthDate.getTime() === todayStart.getTime()) {
    return {
      isValid: false,
      message: 'La date de naissance ne peut pas être aujourd\'hui',
      validated: ValidatedOptions.error
    };
  }
  
  const cinqAnsAujourdHui = new Date();
  cinqAnsAujourdHui.setFullYear(today.getFullYear() - 5);
  cinqAnsAujourdHui.setHours(23, 59, 59, 999);
  
  if (birthDate > cinqAnsAujourdHui) {
    const diffTime = today.getTime() - birthDate.getTime();
    const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const ageInYears = Math.floor(ageInDays / 365.25);
    
    return {
      isValid: false,
      message: `Âge insuffisant: vous avez ${ageInYears} an(s). Minimum requis: 5 ans révolus`,
      validated: ValidatedOptions.error
    };
  }
  
  const maxAgeDate = new Date();
  maxAgeDate.setFullYear(today.getFullYear() - 100);
  
  if (birthDate < maxAgeDate) {
    return {
      isValid: false,
      message: 'Date de naissance trop ancienne (maximum 100 ans)',
      validated: ValidatedOptions.error
    };
  }
  
  if (birthDate.getFullYear() < 1900) {
    return {
      isValid: false,
      message: 'Date de naissance non valide (minimum année 1900)',
      validated: ValidatedOptions.error
    };
  }
  
  const ageInYears = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  
  return {
    isValid: true,
    message: `Date de naissance valide (âge: ${ageInYears} ans)`,
    validated: ValidatedOptions.success
  };
};
