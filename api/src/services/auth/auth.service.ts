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

// Import depuis l'index core qui réexporte tout
import * as core from './core/index.js';

/**
 * Service principal d'authentification
 * Délègue les opérations aux modules spécialisés
 */
export class AuthService {
  // Authentification
  async authentifier(email: string, password: string): Promise<AuthResult> {
    const result = await core.authentifierUtilisateur(email, password);
    await core.enregistrerTentativeConnexion(email, result.success);
    return result;
  }

  async creerCompte(input: CreateUserInput): Promise<AuthResult> {
    // Valider l'email
    if (!core.validerEmail(input.email)) {
      return {
        success: false,
        message: 'Email invalide',
      };
    }

    // Valider le mot de passe
    const validation = core.validerMotDePasse(input.password);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      };
    }

    return core.creerCompteUtilisateur(input);
  }

  async verifierEmail(email: string): Promise<EmailCheckResult> {
    const exists = await core.emailExiste(email);
    return { exists, email };
  }

  // Gestion des mots de passe
  async changerMotDePasse(input: ChangePasswordInput): Promise<AuthResult> {
    const validation = core.validerMotDePasse(input.newPassword);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      };
    }

    return core.modifierMotDePasse(input.userId, input.newPassword);
  }

  async validerMotDePasse(password: string): Promise<PasswordValidation> {
    return core.validerMotDePasse(password);
  }

  // Récupération de mot de passe
  async demanderRecuperationMotDePasse(email: string): Promise<AuthResult> {
    // Vérifier les tentatives récentes
    const tentatives = await core.verifierTentativesRecuperationRecentes(email, 15);
    if (tentatives >= 3) {
      return {
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.',
      };
    }

    // Rechercher l'utilisateur
    const user = await core.rechercherUtilisateurParEmail(email);
    if (!user) {
      // Ne pas révéler si l'email existe ou non
      await core.enregistrerTentativeRecuperation(email, false);
      return {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé',
      };
    }

    // Créer le token
    const tokenResult = await core.creerTokenRecuperation(user.id, 1); // 1 heure

    await core.enregistrerTentativeRecuperation(email, tokenResult.success);

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
    return core.verifierTokenRecuperation(token);
  }

  async reinitialiserMotDePasse(token: string, newPassword: string): Promise<AuthResult> {
    const validation = core.validerMotDePasse(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      };
    }

    const passwordHash = await core.hasherMotDePasse(newPassword);
    return core.reinitialiserMotDePasseAvecToken(token, passwordHash);
  }

  // Sécurité et audit
  async obtenirInformationsSecurite(userId: number): Promise<SecurityInfo | null> {
    return core.obtenirInformationsSecurite(userId);
  }

  async obtenirStatistiques(): Promise<AuthStats> {
    return core.obtenirStatistiquesAuth();
  }

  async creerDemandeRecuperationManuelle(
    userId: number,
    reason: string,
    verificationData: any
  ): Promise<{ success: boolean; message: string }> {
    return core.creerDemandeRecuperationManuelle(userId, reason, verificationData);
  }

  // Maintenance
  async nettoyerTokensExpires(): Promise<{ count: number }> {
    return core.nettoyerTokensExpires();
  }

  // Helpers statiques
  static genererToken = core.genererTokenSecurise;
  static hasherMotDePasse = core.hasherMotDePasse;
  static verifierMotDePasse = core.verifierMotDePasse;
  static validerEmail = core.validerEmail;
  static validerMotDePasse = core.validerMotDePasse;
}

// Instance singleton
export const authService = new AuthService();
