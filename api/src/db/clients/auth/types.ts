/**
 * Types et interfaces pour le module Auth
 */

export interface UtilisateurAuth {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash?: string;
  status_id: number;
}

export interface ResultatAuthentification {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreerCompteParams {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
}

export interface TokenRecuperation {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  email?: string;
  last_name?: string;
  first_name?: string;
}

export interface InformationsSecurite {
  id: number;
  email: string;
  last_name: string;
  first_name: string;
  date_of_birth?: Date;
  date_inscription?: Date;
  nb_paiements: number;
  nb_inscriptions: number;
  dernier_paiement?: Date;
}

export interface DemandeRecuperationManuelle {
  user_id: number;
  reason: string;
  verification_data: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  expires_at: Date;
}

export interface ResultatValidationMotDePasse {
  valid: boolean;
  errors: string[];
}

export interface TentativeAuth {
  email: string;
  success: boolean;
  attempted_at: Date;
  ip_address?: string;
}
