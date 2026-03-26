/**
 * DTOs Auth pour authentification
 * Utilisés pour login, register, token validation
 */

/**
 * DTO pour connexion par email
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * DTO pour connexion par userId
 */
export interface LoginByUserIdDto {
  userId: string;
  password: string;
}

/**
 * DTO pour inscription
 */
export interface RegisterDto {
  first_name: string;
  last_name: string;
  nom_utilisateur?: string;
  email: string;
  password: string;
  date_of_birth: string; // YYYY-MM-DD
  genre_id: number;
  abonnement_id?: number;
}

/**
 * DTO pour réponse de connexion
 */
export interface LoginResponseDto {
  success: true;
  message: string;
  data: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    nom_utilisateur: string;
    email: string;
    status_id: number;
    grade_id?: number;
    abonnement_id?: number;
    token?: string; // JWT token
  };
}

/**
 * DTO pour validation de token email
 */
export interface ValidateEmailTokenDto {
  token: string;
  userId: string;
}

/**
 * DTO pour demande de reset password
 */
export interface PasswordResetRequestDto {
  email: string;
}

/**
 * DTO pour reset password
 */
export interface PasswordResetDto {
  token: string;
  newPassword: string;
}

/**
 * DTO pour recherche utilisateur par email
 */
export interface SearchUserByEmailDto {
  email: string;
}

/**
 * DTO pour vérification existence utilisateur
 */
export interface VerifyUserExistsDto {
  nom: string;
  prenom: string;
  date_naissance: string; // YYYY-MM-DD
}
