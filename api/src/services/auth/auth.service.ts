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
} from "@clubmanager/types";

// Import depuis l'index core qui réexporte tout
import * as core from "./core/index.js";
import { prisma as defaultPrisma } from "../../infrastructure/database/prisma-client.js";
import bcrypt from "bcrypt";

/**
 * Service principal d'authentification
 * Délègue les opérations aux modules spécialisés
 */
export class AuthService {
  private prisma: typeof defaultPrisma;

  constructor(prismaClient?: typeof defaultPrisma) {
    this.prisma = prismaClient || defaultPrisma;
  }

  // Authentification
  async authentifier(email: string, password: string): Promise<AuthResult> {
    const result = await core.authentifierUtilisateur(
      email,
      password,
      this.prisma,
    );
    await core.enregistrerTentativeConnexion(
      email,
      result.success,
      this.prisma,
    );
    return result;
  }

  async creerCompte(input: CreateUserInput): Promise<AuthResult> {
    // Valider l'email
    if (!core.validerEmail(input.email)) {
      return {
        success: false,
        message: "Email invalide",
      };
    }

    // Valider le mot de passe
    const validation = core.validerMotDePasse(input.password);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(", "),
      };
    }

    return core.creerCompteUtilisateur(input, this.prisma);
  }

  async verifierEmail(email: string): Promise<EmailCheckResult> {
    const exists = await core.emailExiste(email, this.prisma);
    return { exists, email };
  }

  // Gestion des mots de passe
  async changerMotDePasse(input: ChangePasswordInput): Promise<AuthResult> {
    const validation = core.validerMotDePasse(input.newPassword);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(", "),
      };
    }

    // Si un currentPassword est fourni, le vérifier
    if (input.currentPassword) {
      const utilisateur = await this.prisma.utilisateurs.findFirst({
        where: { id: input.userId },
        select: { password: true },
      });

      if (!utilisateur) {
        return {
          success: false,
          message: "Utilisateur non trouvé",
        };
      }

      const passwordMatches = await bcrypt.compare(
        input.currentPassword,
        utilisateur.password,
      );

      if (!passwordMatches) {
        return {
          success: false,
          message: "Ancien mot de passe incorrect",
        };
      }

      // Vérifier si l'ancien et le nouveau sont identiques
      const samePassword = await bcrypt.compare(
        input.newPassword,
        utilisateur.password,
      );
      if (samePassword) {
        return {
          success: false,
          message: "Le nouveau mot de passe doit être différent de l'ancien",
        };
      }
    }

    return core.modifierMotDePasse(
      input.userId,
      input.newPassword,
      this.prisma,
    );
  }

  async validerMotDePasse(password: string): Promise<PasswordValidation> {
    return core.validerMotDePasse(password);
  }

  // Récupération de mot de passe
  async demanderRecuperationMotDePasse(email: string): Promise<AuthResult> {
    // Vérifier les tentatives récentes
    const tentatives = await core.verifierTentativesRecuperationRecentes(
      email,
      15,
    );
    if (tentatives >= 3) {
      return {
        success: false,
        message: "Trop de tentatives. Veuillez réessayer plus tard.",
      };
    }

    // Rechercher l'utilisateur
    const utilisateur = await core.rechercherUtilisateurParEmail(
      email,
      this.prisma,
    );
    if (!utilisateur) {
      // Ne pas révéler si l'email existe ou non
      await core.enregistrerTentativeRecuperation(email, true, this.prisma);
      return {
        success: true,
        message: "Si cet email existe, un lien de récupération a été envoyé",
      };
    }

    // Créer un token de récupération
    const tokenResult = await core.creerTokenRecuperation(
      utilisateur.id,
      1,
      this.prisma,
    );
    await core.enregistrerTentativeRecuperation(email, true, this.prisma);

    await core.enregistrerTentativeRecuperation(email, tokenResult.success);

    if (!tokenResult.success) {
      return {
        success: false,
        message: "Erreur lors de la création du token",
      };
    }

    return {
      success: true,
      message: "Email de récupération envoyé",
    };
  }

  async verifierTokenRecuperation(
    token: string,
  ): Promise<PasswordResetToken | null> {
    return core.verifierTokenRecuperation(token, this.prisma);
  }

  async reinitialiserMotDePasse(
    token: string,
    newPassword: string,
  ): Promise<AuthResult> {
    const validation = core.validerMotDePasse(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(", "),
      };
    }

    const passwordHash = await core.hasherMotDePasse(newPassword);
    return core.reinitialiserMotDePasseAvecToken(
      token,
      passwordHash,
      this.prisma,
    );
  }

  // Sécurité et audit
  async obtenirInformationsSecurite(
    userId: number,
  ): Promise<SecurityInfo | null> {
    return core.obtenirInformationsSecurite(userId, this.prisma);
  }

  async obtenirStatistiques(): Promise<AuthStats> {
    return core.obtenirStatistiquesAuth(this.prisma);
  }

  async creerDemandeRecuperationManuelle(
    userId: number,
    reason: string,
    verificationData: any,
  ): Promise<{ success: boolean; message: string }> {
    return core.creerDemandeRecuperationManuelle(
      userId,
      reason,
      verificationData,
      this.prisma,
    );
  }

  // Maintenance
  async nettoyerTokensExpires(): Promise<{ count: number }> {
    return core.nettoyerTokensExpires(this.prisma);
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
