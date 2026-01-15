import { ValidatedOptions } from '@patternfly/react-core';

export interface ValidationState {
  [key: string]: {
    isValid: boolean;
    message: string;
    validated: ValidatedOptions;
  };
}

export interface InformationModalData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  details?: any;
}

export interface FormData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  confirmPassword: string;
  date_naissance: string;
  abonnement: string;
  genre: string;
  nom_utilisateur: string;
}
