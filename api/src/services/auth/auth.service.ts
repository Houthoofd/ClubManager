/**
 * Service Auth - Orchestrateur principal
 * Gestion de l'authentification et des comptes utilisateurs
 */

import type {
  AuthResult,
  CreateUserInput,
  ChangePasswordInput,
  PasswordValidation,
  PasswordResetToken,
  SecurityInfo,
  AuthStats,
  EmailCheckResult,
} from '@clubmanager/types';

// Import des modules spécialisés
import {
  authentifierUtilisateur,
  creerCompteUtilisateur,
  emailExiste,
  enregistrerTentativeConnexion,
  obtenirTentativesConnexionRecentes,
} from './core/authentication.js';

import {
  modifierMotDePasse,
  validerMotDePasse,
  validerEmail,
  hasherMotDePasse,
  verifierMotDePasse,
} from './core/password.js';

import {
  creerTokenRecuperation,
  verifierTokenRecuperation,
  marquerTokenUtilise,
  reinitialiserMotDePasseAvecToken,
  nettoyerTokensExpires,
  enregistrerTentativeRecuperation,
  verifierTentativesRecuperationRecentes,
  genererTokenSecurise,
} from './core/tokens.js';

import {
  rechercherUtilisateurParEmail,
  obtenirInformationsSecurite,
  obtenirStatistiquesAuth,
  creerDemandeRecuperationManuelle,
} from './core/security.js';

/**
 * Service principal d'authentification
 * Délègue les opérations aux modules spécialisés
 */
export class AuthService {
  // Authentification
  async authentifier(email: string, password: string): Promise<AuthResult> {
    const result = await authentifierUtilisateur(email, password);
    await enregistrerTentativeConnexion(email, result.success);
    return result;
  }

  async creerCompte(input: CreateUserInput): Promise<AuthResult> {
    // Valider l'email
    if (!validerEmail(input.email)) {
      return {
        success: false,
        message: 'Email invalide',
      };
    }

    // Valider le mot de passe
    const validation = validerMotDePasse(input.password);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      };
    }

    return creerCompteUtilisateur(input);
  }

  async verifierEmail(email: string): Promise<EmailCheckResult> {
    const exists = await emailExiste(email);
    return { exists, email };
  }

  // Gestion des mots de passe
  async changerMotDePasse(input: ChangePasswordInput): Promise<AuthResult> {
    const validation = validerMotDePasse(input.newPassword);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      };
    }

    return modifierMotDePasse(input.userId, input.newPassword);
  }

  async validerMotDePasse(password: string): Promise<PasswordValidation> {
    return validerMotDePasse(password);
  }

  // Récupération de mot de passe
  async demanderRecuperationMotDePasse(email: string): Promise<AuthResult> {
    // Vérifier les tentatives récentes
    const tentatives = await verifierTentativesRecuperationRecentes(email, 15);
    if (tentatives >= 3) {
      return {
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.',
      };
    }

    // Rechercher l'utilisateur
    const user = await rechercherUtilisateurParEmail(email);
    if (!user) {
      // Ne pas révéler si l'email existe ou non
      await enregistrerTentativeRecuperation(email, false);
      return {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé',
      };
    }

    // Créer le token
    const tokenResult = await creerTokenRecuperation(user.id, 1); // 1 heure

    await enregistrerTentativeRecuperation(email, tokenResult.success);

    if (!tokenResult.success) {
      return {
        success: false,
        message: 'Erreur lors de la création du token',
      };
    }

    return {
      success: true,
      message: 'Email de récupération envoyé',
    };
  }

  async verifierTokenRecuperation(token: string): Promise<PasswordResetToken | null> {
    return verifierTokenRecuperation(token);
  }

  async reinitialiserMotDePasse(token: string, newPassword: string): Promise<AuthResult> {
    const validation = validerMotDePasse(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      };
    }

    const passwordHash = await hasherMotDePasse(newPassword);
    return reinitialiserMotDePasseAvecToken(token, passwordHash);
  }

  // Sécurité et audit
  async obtenirInformationsSecurite(userId: number): Promise<SecurityInfo | null> {
    return obtenirInformationsSecurite(userId);
  }

  async obtenirStatistiques(): Promise<AuthStats> {
    return obtenirStatistiquesAuth();
  }

  async creerDemandeRecuperationManuelle(
    userId: number,
    reason: string,
    verificationData: any
  ): Promise<{ success: boolean; message: string }> {
    return creerDemandeRecuperationManuelle(userId, reason, verificationData);
  }

  // Maintenance
  async nettoyerTokensExpires(): Promise<{ count: number }> {
    return nettoyerTokensExpires();
  }

  // Helpers statiques
  static genererToken = genererTokenSecurise;
  static hasherMotDePasse = hasherMotDePasse;
  static verifierMotDePasse = verifierMotDePasse;
  static validerEmail = validerEmail;
  static validerMotDePasse = validerMotDePasse;
}

// Instance singleton
export const authService = new AuthService();
