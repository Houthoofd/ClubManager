/**
 * Service Inscription
 * Contient toute la logique métier pour l'inscription des utilisateurs
 *
 * ✅ Migré vers Prisma avec intégration Sentry
 *
 * @module inscription.service
 */

import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "../../../../shared/config/sentry.config.js";
import type { InscriptionData } from "@clubmanager/types/validators";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Résultat de la vérification d'email
 */
export interface EmailVerificationResult {
  exists: boolean;
  message?: string;
}

/**
 * Résultat de l'inscription
 */
export interface InscriptionResult {
  success: boolean;
  message: string;
  userId?: number;
  generatedUserId?: string;
}

/**
 * Service gérant la logique métier de l'inscription
 */
export class InscriptionService {
  /**
   * Vérifie si un email existe déjà dans la base de données
   * @param email - Email à vérifier
   * @returns Résultat de la vérification
   */
  async verifierEmail(email: string): Promise<EmailVerificationResult> {
    try {
      addSentryBreadcrumb(
        `Vérification email: ${email}`,
        "service.inscription",
        "info",
        { email },
      );

      console.log(`🔍 [InscriptionService] Vérification email: ${email}`);

      const user = await prisma.utilisateurs.findFirst({
        where: {
          email: email.toLowerCase().trim(),
        },
      });

      if (user) {
        console.log(`⚠️ [InscriptionService] Email déjà utilisé: ${email}`);
        return {
          exists: true,
          message: "Cet email est déjà utilisé",
        };
      }

      console.log(`✅ [InscriptionService] Email disponible: ${email}`);
      return {
        exists: false,
        message: "Email disponible",
      };
    } catch (error: any) {
      console.error(
        "❌ [InscriptionService] Erreur vérification email:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "inscription",
          operation: "verifierEmail",
        },
        extra: { email },
      });

      throw new Error(
        `Erreur lors de la vérification de l'email: ${error.message}`,
      );
    }
  }

  /**
   * Hash un mot de passe en utilisant bcrypt
   * @param password - Mot de passe en clair
   * @returns Mot de passe hashé
   */
  async hashPasswordInternal(password: string): Promise<string> {
    try {
      console.log(`🔐 [InscriptionService] Hashage du mot de passe`);
      const hashed = await bcrypt.hash(password, 10);
      return hashed;
    } catch (error: any) {
      console.error(
        "❌ [InscriptionService] Erreur hashage mot de passe:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "inscription",
          operation: "hashPasswordInternal",
        },
      });

      throw new Error(
        `Erreur lors du hashage du mot de passe: ${error.message}`,
      );
    }
  }

  /**
   * Valide l'âge de l'utilisateur
   * @param dateNaissance - Date de naissance au format YYYY-MM-DD
   * @returns true si l'âge est valide (entre 5 et 120 ans)
   */
  validerAge(dateNaissance: string): boolean {
    try {
      // Vérifier le format et parser la date
      const parts = dateNaissance.split("-");
      if (parts.length !== 3) return false;

      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      // Vérifier que la date est valide
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return false; // Date invalide (ex: 2019-02-29)
      }

      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();

      // Ajustement si l'anniversaire n'est pas encore passé cette année
      const adjustedAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? age - 1
          : age;

      return adjustedAge >= 5 && adjustedAge <= 120;
    } catch (error: any) {
      console.error("❌ [InscriptionService] Erreur validation âge:", error);
      return false;
    }
  }

  /**
   * Générer un userId unique
   */
  async genererUserIdUnique(nom: string, prenom: string): Promise<string> {
    const baseUserId =
      `${prenom.substring(0, 3)}${nom.substring(0, 3)}`.toLowerCase();
    let userId = baseUserId;
    let counter = 1;

    while (true) {
      const existing = await prisma.utilisateurs.findUnique({
        where: { userId: userId },
      });

      if (!existing) {
        return userId;
      }

      userId = `${baseUserId}${counter}`;
      counter++;
    }
  }

  /**
   * Inscrit un nouvel utilisateur
   * @param data - Données d'inscription validées
   * @returns Résultat de l'inscription
   */
  async inscrireUtilisateur(data: InscriptionData): Promise<InscriptionResult> {
    try {
      addSentryBreadcrumb(
        `Inscription nouvel utilisateur: ${data.email}`,
        "service.inscription",
        "info",
        { email: data.email },
      );

      console.log(
        `📝 [InscriptionService] Inscription utilisateur: ${data.prenom} ${data.nom}`,
      );

      // 1. Vérifier si l'email existe déjà
      const emailCheck = await this.verifierEmail(data.email);
      if (emailCheck.exists) {
        console.log(`❌ [InscriptionService] Email déjà utilisé`);
        return {
          success: false,
          message: "Un compte avec cet email existe déjà",
        };
      }

      // 2. Valider l'âge (sécurité supplémentaire même si déjà validé par Zod)
      if (!this.validerAge(data.date)) {
        console.log(`❌ [InscriptionService] Âge invalide`);
        return {
          success: false,
          message: "L'âge doit être entre 5 et 120 ans",
        };
      }

      // 3. Hasher le mot de passe
      const hashedPassword = await this.hashPasswordInternal(data.password);

      // 4. Générer un userId unique
      const generatedUserId = await this.genererUserIdUnique(
        data.nom,
        data.prenom,
      );

      // 5. Générer un nom d'utilisateur unique
      const nomUtilisateur = `${data.prenom.toLowerCase()}.${data.nom.toLowerCase()}`;

      // 6. Insérer l'utilisateur dans la base de données
      const newUser = await prisma.utilisateurs.create({
        data: {
          userId: generatedUserId,
          first_name: data.prenom,
          last_name: data.nom,
          nom_utilisateur: nomUtilisateur,
          email: data.email.toLowerCase().trim(),
          password: hashedPassword,
          date_of_birth: new Date(data.date),
          genre_id: data.genre || null,
          abonnement_id: data.abonnement || null,
          status_id: 1, // Statut par défaut: utilisateur
          grade_id: 1, // Grade par défaut: débutant
          active: true,
          email_verified: false,
        },
      });

      console.log(
        `✅ [InscriptionService] Utilisateur inscrit avec succès: ${newUser.id}`,
      );

      addSentryBreadcrumb(
        "Inscription réussie",
        "service.inscription",
        "info",
        { userId: newUser.id, generatedUserId },
      );

      // 7. Créer un token de validation d'email
      try {
        const validationToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 heures

        await prisma.email_validation_tokens.create({
          data: {
            utilisateur_id: newUser.id,
            token: validationToken,
            type: "email_confirmation",
            expires_at: expiresAt,
          },
        });

        console.log(
          `📧 [InscriptionService] Token de validation créé pour userId: ${newUser.id}`,
        );
      } catch (tokenError: any) {
        // Ne pas bloquer l'inscription si la création du token échoue
        console.error(
          "⚠️ [InscriptionService] Erreur création token validation:",
          tokenError,
        );

        captureException(tokenError, {
          level: "warning",
          tags: {
            service: "inscription",
            operation: "creerTokenValidation",
          },
          extra: { userId: newUser.id },
        });
      }

      return {
        success: true,
        message: "Inscription réussie",
        userId: newUser.id,
        generatedUserId: newUser.userId,
      };
    } catch (error: any) {
      console.error("❌ [InscriptionService] Erreur inscription:", error);

      captureException(error, {
        level: "error",
        tags: {
          service: "inscription",
          operation: "inscrireUtilisateur",
        },
        extra: { email: data.email },
      });

      // Ne pas exposer les détails de l'erreur au client
      return {
        success: false,
        message: "Une erreur est survenue lors de l'inscription",
      };
    }
  }

  /**
   * Valide la force d'un mot de passe
   * @param password - Mot de passe à valider
   * @returns Score de 0 à 4 (0 = très faible, 4 = très fort)
   */
  evaluerForceMotDePasse(password: string): number {
    let score = 0;

    // Longueur
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Complexité
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(score, 4);
  }

  /**
   * Nettoie les données sensibles d'un objet utilisateur
   * @param user - Objet utilisateur
   * @returns Objet utilisateur sans données sensibles
   */
  sanitizeUserData(user: any): any {
    if (!user || typeof user !== "object") {
      return {};
    }
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Vérifier si un utilisateur existe avec nom, prénom et date de naissance
   */
  async verifierExistenceUtilisateur(
    nom: string,
    prenom: string,
    dateNaissance: string,
  ): Promise<{
    exists: boolean;
    canRegister: boolean;
    userData?: any;
    message: string;
  }> {
    try {
      addSentryBreadcrumb(
        `Vérification existence utilisateur: ${prenom} ${nom}`,
        "service.inscription",
        "info",
        { nom, prenom, dateNaissance },
      );

      console.log(
        `🔍 [InscriptionService] Vérification existence: ${prenom} ${nom}`,
      );

      const user = await prisma.utilisateurs.findFirst({
        where: {
          first_name: prenom,
          last_name: nom,
          date_of_birth: new Date(dateNaissance),
        },
        include: {
          status: true,
        },
      });

      if (!user) {
        console.log(
          "✅ [InscriptionService] Aucun utilisateur trouvé - peut s'inscrire",
        );
        return {
          exists: false,
          canRegister: true,
          message: "Aucun utilisateur trouvé avec ces informations",
        };
      }

      console.log(
        "⚠️ [InscriptionService] Utilisateur existant trouvé:",
        user.id,
      );

      return {
        exists: true,
        canRegister: false,
        userData: {
          id: user.id,
          userId: user.userId,
          email: user.email,
          status: user.status?.nom,
          active: user.active,
        },
        message: "Un utilisateur avec ces informations existe déjà",
      };
    } catch (error: any) {
      console.error(
        "❌ [InscriptionService] Erreur vérification existence:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "inscription",
          operation: "verifierExistenceUtilisateur",
        },
        extra: { nom, prenom, dateNaissance },
      });

      throw new Error(
        `Erreur lors de la vérification de l'utilisateur: ${error.message}`,
      );
    }
  }
}

// Export d'une instance singleton pour réutilisation
export const inscriptionService = new InscriptionService();
