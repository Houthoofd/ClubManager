/**
 * Service Auth
 * Contient toute la logique métier pour l'authentification
 */

import { Auth } from '../../../../db/clients/auth/auth.js';
import { generateToken } from '../../../../middleware/auth.js';

/**
 * Interface pour les données utilisateur
 */
export interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number;
  status: string;
}

/**
 * Interface pour le résultat d'authentification
 */
export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserData;
  token?: string;
}

/**
 * Interface pour les données de token de reset
 */
export interface TokenData {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  expires_at: Date;
}

/**
 * Authentifier un utilisateur avec email et mot de passe
 */
export async function authentifierUtilisateur(
  email: string,
  password: string,
  authClient?: Auth
): Promise<AuthResult> {
  try {
    const client = authClient || new Auth();
    const result = await client.authentifierUtilisateur(email, password);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Email ou mot de passe incorrect',
      };
    }

    if (!result.user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
      };
    }

    // Générer le token JWT
    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      first_name: result.user.first_name,
      last_name: result.user.last_name,
      status_id: result.user.status_id,
      role: result.user.status,
      status: result.user.status,
    });

    return {
      success: true,
      message: 'Connexion réussie',
      user: result.user,
      token,
    };
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur authentification:', error);
    throw error;
  }
}

/**
 * Vérifier un token de réinitialisation de mot de passe
 */
export async function verifierTokenReset(
  token: string,
  authClient?: Auth
): Promise<TokenData | null> {
  try {
    const client = authClient || new Auth();
    const tokenData = await client.verifierTokenRecuperation(token);
    return tokenData;
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur vérification token:', error);
    throw error;
  }
}

/**
 * Demander une réinitialisation de mot de passe
 */
export async function demanderResetMotDePasse(
  email: string,
  authClient?: Auth
): Promise<{ success: boolean; message: string; token?: string }> {
  try {
    const client = authClient || new Auth();

    // Vérifier si l'utilisateur existe
    const userExists = await client.emailExiste(email);

    if (!userExists) {
      // Ne pas révéler que l'email n'existe pas pour des raisons de sécurité
      return {
        success: true,
        message:
          "Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.",
      };
    }

    // Rechercher l'utilisateur
    const user = await client.rechercherUtilisateurParEmail(email);

    if (!user) {
      return {
        success: true,
        message:
          "Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.",
      };
    }

    // Générer et créer le token de récupération
    const resetToken = Auth.genererTokenSecurise();
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure
    const tokenResult = await client.creerTokenRecuperation(
      user.id,
      resetToken,
      expiresAt
    );

    if (!tokenResult.isConfirm) {
      console.error('❌ [Auth Service] Erreur création token:', tokenResult.message);
      throw new Error('Erreur lors de la création du token de réinitialisation');
    }

    console.log('✅ [Auth Service] Token de réinitialisation créé');

    return {
      success: true,
      message:
        "Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.",
      token: resetToken,
    };
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur demande reset:', error);
    throw error;
  }
}

/**
 * Envoyer l'email de réinitialisation de mot de passe
 */
export async function envoyerEmailResetMotDePasse(
  email: string,
  prenom: string,
  token: string
): Promise<void> {
  try {
    const { EmailClient } = await import(
      '../../../../db/clients/messagerie/emailClient.js'
    );
    const emailClient = EmailClient.getInstance();

    await emailClient.envoyerResetPassword(email, prenom, token);

    console.log('✅ [Auth Service] Email de réinitialisation envoyé à:', email);
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur envoi email:', error);
    // Ne pas propager l'erreur pour ne pas révéler que l'email existe
  }
}

/**
 * Réinitialiser le mot de passe avec un token
 */
export async function reinitialiserMotDePasse(
  token: string,
  newPassword: string,
  authClient?: Auth
): Promise<{ success: boolean; message?: string; errors?: string[] }> {
  try {
    const client = authClient || new Auth();

    // Vérifier que le token est valide
    const tokenData = await client.verifierTokenRecuperation(token);

    if (!tokenData) {
      return {
        success: false,
        message: 'Token invalide ou expiré',
      };
    }

    // Valider le nouveau mot de passe
    const validation = Auth.validerMotDePasse(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        message: 'Mot de passe invalide',
        errors: validation.errors,
      };
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await Auth.hasherMotDePasse(newPassword);

    // Réinitialiser le mot de passe avec le token
    const result = await client.reinitialiserMotDePasseAvecToken(
      token,
      hashedPassword
    );

    if (!result.isConfirm) {
      return {
        success: false,
        message: result.message || 'Erreur lors de la réinitialisation',
      };
    }

    console.log(
      '✅ [Auth Service] Mot de passe réinitialisé pour l\'utilisateur ID:',
      tokenData.user_id
    );

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    };
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur réinitialisation:', error);
    throw error;
  }
}

/**
 * Vérifier un token de validation d'email
 */
export async function verifierTokenValidation(
  token: string,
  userId: number,
  authClient?: Auth
): Promise<boolean> {
  try {
    const client = authClient || new Auth();
    const isValid = await client.verifierTokenValidation(token, userId);
    return isValid;
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur vérification token validation:', error);
    throw error;
  }
}

/**
 * Confirmer l'email d'un utilisateur
 */
export async function confirmerEmail(
  userId: number,
  authClient?: Auth
): Promise<{ success: boolean; message: string }> {
  try {
    const client = authClient || new Auth();
    const result = await client.confirmerEmail(userId);
    return result;
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur confirmation email:', error);
    throw error;
  }
}

/**
 * Vérifier si un email existe
 */
export async function emailExiste(
  email: string,
  authClient?: Auth
): Promise<boolean> {
  try {
    const client = authClient || new Auth();
    const exists = await client.emailExiste(email);
    return exists;
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur vérification email:', error);
    throw error;
  }
}

/**
 * Rechercher un utilisateur par email
 */
export async function rechercherUtilisateurParEmail(
  email: string,
  authClient?: Auth
): Promise<UserData | null> {
  try {
    const client = authClient || new Auth();
    const user = await client.rechercherUtilisateurParEmail(email);
    return user;
  } catch (error: any) {
    console.error('❌ [Auth Service] Erreur recherche utilisateur:', error);
    throw error;
  }
}

/**
 * Générer un nouveau token JWT pour un utilisateur
 */
export function genererToken(userData: {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number;
  role: string;
  status: string;
}): string {
  return generateToken(userData);
}
