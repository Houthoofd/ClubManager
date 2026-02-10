/**
 * Service Inscription
 * Contient toute la logique métier pour l'inscription des utilisateurs
 */

import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import type { InscriptionData } from "@clubmanager/types/validators";
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} from "../../../../shared/utils/password.helpers.js";

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
}

/**
 * Service gérant la logique métier de l'inscription
 */
export class InscriptionService {
  private utilisateursClient: Utilisateurs;

  constructor(utilisateursClient?: Utilisateurs) {
    this.utilisateursClient = utilisateursClient || new Utilisateurs();
  }

  /**
   * Vérifie si un email existe déjà dans la base de données
   * @param email - Email à vérifier
   * @returns Résultat de la vérification
   */
  async verifierEmail(email: string): Promise<EmailVerificationResult> {
    try {
      const result =
        await this.utilisateursClient.checkUtilisateurByEmail(email);

      if (result.isFind) {
        return {
          exists: true,
          message: "Cet email est déjà utilisé",
        };
      }

      return {
        exists: false,
        message: "Email disponible",
      };
    } catch (error) {
      console.error(
        "[InscriptionService] Erreur lors de la vérification d'email:",
        error,
      );
      throw new Error("Erreur lors de la vérification de l'email");
    }
  }

  /**
   * Hash un mot de passe en utilisant les helpers partagés
   * @param password - Mot de passe en clair
   * @returns Mot de passe hashé
   */
  async hashPasswordInternal(password: string): Promise<string> {
    try {
      return await hashPassword(password);
    } catch (error) {
      console.error(
        "[InscriptionService] Erreur lors du hashage du mot de passe:",
        error,
      );
      throw new Error("Erreur lors du hashage du mot de passe");
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

      // Vérifier que la date est valide (par exemple, rejeter 29 février sur année non bissextile)
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
    } catch (error) {
      console.error(
        "[InscriptionService] Erreur lors de la validation de l'âge:",
        error,
      );
      return false;
    }
  }

  /**
   * Inscrit un nouvel utilisateur
   * @param data - Données d'inscription validées
   * @returns Résultat de l'inscription
   */
  async inscrireUtilisateur(data: InscriptionData): Promise<InscriptionResult> {
    try {
      // 1. Vérifier si l'email existe déjà
      const emailCheck = await this.verifierEmail(data.email);
      if (emailCheck.exists) {
        return {
          success: false,
          message: "Un compte avec cet email existe déjà",
        };
      }

      // 2. Valider l'âge (sécurité supplémentaire même si déjà validé par Zod)
      if (!this.validerAge(data.date)) {
        return {
          success: false,
          message: "L'âge doit être entre 5 et 120 ans",
        };
      }

      // 2. Hasher le mot de passe
      const hashedPassword = await this.hashPasswordInternal(data.password);

      // 4. Préparer les données pour l'insertion
      const userData = {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        password: hashedPassword,
        date: data.date,
        abonnement: data.abonnement,
        genre: data.genre,
      };

      // 5. Insérer l'utilisateur dans la base de données
      const result =
        await this.utilisateursClient.inscriptionUtilisateurSimple(userData);

      if (result.isConfirm) {
        console.log(
          `✅ [InscriptionService] Utilisateur inscrit avec succès: ${data.email}`,
        );
        return {
          success: true,
          message: result.message || "Inscription réussie",
          userId: result.userId,
        };
      } else {
        console.warn(
          `⚠️ [InscriptionService] Échec de l'inscription: ${data.email}`,
        );
        return {
          success: false,
          message: result.message || "Erreur lors de l'inscription",
        };
      }
    } catch (error) {
      console.error(
        "[InscriptionService] Erreur lors de l'inscription:",
        error,
      );

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
}

// Export d'une instance singleton pour réutilisation
export const inscriptionService = new InscriptionService();
