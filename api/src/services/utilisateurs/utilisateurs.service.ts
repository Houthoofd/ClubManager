/**
 * Service des utilisateurs
 * Gère les utilisateurs, leur authentification et leurs statistiques
 */

import { prisma as defaultPrisma } from "../../infrastructure/database/prisma-client.js";
import type {
  UtilisateurAvecDetails,
  CreerUtilisateurInput,
  ModifierUtilisateurInput,
  DesactiverUtilisateurInput,
  ReactiverUtilisateurInput,
  StatistiquesUtilisateurs,
  StatistiquesUtilisateur,
  ConnexionInput,
  ConnexionParUserIdInput,
  ConnexionResult,
  UtilisateurRecherche,
  CreerUtilisateurResult,
  ModifierUtilisateurResult,
  ActivationResult,
  VerificationEmailResult,
  VerificationUtilisateurResult,
} from "@clubmanager/types";
import {
  UtilisateursError,
  UtilisateursErrorCode,
  ConnexionInputSchema,
  ConnexionParUserIdInputSchema,
} from "@clubmanager/types";
import bcrypt from "bcrypt";

// Import des modules core
import * as queries from "./core/queries/obtenirUtilisateurs.js";
import * as utilisateurQuery from "./core/queries/obtenirUtilisateurParId.js";
import * as emailQuery from "./core/queries/obtenirUtilisateurParEmail.js";
import * as rechercheQuery from "./core/queries/rechercherUtilisateursParEmail.js";

import * as creerMutation from "./core/mutations/creerUtilisateur.js";
import * as modifierMutation from "./core/mutations/modifierUtilisateur.js";
import * as activationMutation from "./core/mutations/activationUtilisateur.js";

import * as stats from "./core/statistiques/statistiquesUtilisateurs.js";

export class UtilisateursService {
  private prisma: typeof defaultPrisma;

  constructor(prisma: typeof defaultPrisma) {
    this.prisma = prisma;
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Récupère tous les utilisateurs avec pagination et filtres
   */
  async obtenirUtilisateurs(args?: queries.ObtenirUtilisateursArgs): Promise<{
    utilisateurs: UtilisateurAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return queries.obtenirUtilisateurs(this.prisma, args || {});
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async obtenirUtilisateurParId(
    id: number,
  ): Promise<UtilisateurAvecDetails | null> {
    return utilisateurQuery.obtenirUtilisateurParId(this.prisma, { id });
  }

  /**
   * Récupère un utilisateur par son email
   */
  async obtenirUtilisateurParEmail(
    email: string,
  ): Promise<UtilisateurAvecDetails | null> {
    return emailQuery.obtenirUtilisateurParEmail(this.prisma, { email });
  }

  /**
   * Recherche des utilisateurs par email (recherche partielle)
   */
  async rechercherUtilisateursParEmail(
    email: string,
    limit?: number,
  ): Promise<UtilisateurRecherche[]> {
    return rechercheQuery.rechercherUtilisateursParEmail(this.prisma, {
      email,
      limit,
    });
  }

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Crée un nouvel utilisateur
   */
  async creerUtilisateur(
    input: CreerUtilisateurInput,
  ): Promise<CreerUtilisateurResult> {
    return creerMutation.creerUtilisateur(this.prisma, input);
  }

  /**
   * Modifie un utilisateur existant
   */
  async modifierUtilisateur(
    input: ModifierUtilisateurInput,
  ): Promise<ModifierUtilisateurResult> {
    return modifierMutation.modifierUtilisateur(this.prisma, input);
  }

  /**
   * Désactive un utilisateur
   */
  async desactiverUtilisateur(
    input: DesactiverUtilisateurInput,
  ): Promise<ActivationResult> {
    return activationMutation.desactiverUtilisateur(this.prisma, input);
  }

  /**
   * Réactive un utilisateur
   */
  async reactiverUtilisateur(
    input: ReactiverUtilisateurInput,
  ): Promise<ActivationResult> {
    return activationMutation.reactiverUtilisateur(this.prisma, input);
  }

  // ============================================
  // AUTHENTIFICATION
  // ============================================

  /**
   * Valide la connexion d'un utilisateur par email et mot de passe
   */
  async validerConnexion(input: ConnexionInput): Promise<ConnexionResult> {
    try {
      // Valider les entrées avec Zod
      const validatedInput = ConnexionInputSchema.parse(input);
      const { email, password } = validatedInput;

      // Récupérer l'utilisateur avec son mot de passe
      const utilisateur = await this.prisma.utilisateurs.findFirst({
        where: {
          email: email.toLowerCase().trim(),
        },
        select: {
          id: true,
          userId: true,
          first_name: true,
          last_name: true,
          nom_utilisateur: true,
          email: true,
          password: true,
          date_of_birth: true,
          status_id: true,
          grade_id: true,
          abonnement_id: true,
          active: true,
        },
      });

      if (!utilisateur) {
        return {
          success: false,
          message: "Email ou mot de passe incorrect",
        };
      }

      // Vérifier si l'utilisateur est suspendu (prioritaire sur inactif)
      if (utilisateur.status_id === 3) {
        throw new UtilisateursError(
          "Ce compte a été suspendu",
          UtilisateursErrorCode.USER_SUSPENDED,
        );
      }

      // Vérifier si l'utilisateur est actif
      if (!utilisateur.active) {
        throw new UtilisateursError(
          "Ce compte a été désactivé",
          UtilisateursErrorCode.USER_INACTIVE,
        );
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, utilisateur.password);

      if (!isMatch) {
        return {
          success: false,
          message: "Email ou mot de passe incorrect",
        };
      }

      return {
        success: true,
        message: "Connexion réussie",
        utilisateur: {
          id: utilisateur.id,
          userId: utilisateur.userId || undefined,
          prenom: utilisateur.first_name,
          nom: utilisateur.last_name,
          nom_utilisateur: utilisateur.nom_utilisateur || undefined,
          email: utilisateur.email,
          date_naissance: utilisateur.date_of_birth,
          status_id: utilisateur.status_id,
          grade_id: utilisateur.grade_id,
          abonnement_id: utilisateur.abonnement_id,
        },
      };
    } catch (error) {
      if (error instanceof UtilisateursError) {
        throw error;
      }
      console.error("Erreur lors de la validation de la connexion:", error);
      throw new UtilisateursError(
        "Erreur lors de la connexion",
        UtilisateursErrorCode.OPERATION_FAILED,
      );
    }
  }

  /**
   * Valide la connexion d'un utilisateur par userId et mot de passe
   */
  async validerConnexionParUserId(
    input: ConnexionParUserIdInput,
  ): Promise<ConnexionResult> {
    try {
      // Valider les entrées avec Zod
      const validatedInput = ConnexionParUserIdInputSchema.parse(input);
      const { userId, password } = validatedInput;

      // Récupérer l'utilisateur avec son mot de passe
      const utilisateur = await this.prisma.utilisateurs.findFirst({
        where: {
          userId: userId.trim(),
        },
        select: {
          id: true,
          userId: true,
          first_name: true,
          last_name: true,
          nom_utilisateur: true,
          email: true,
          password: true,
          date_of_birth: true,
          status_id: true,
          grade_id: true,
          abonnement_id: true,
          active: true,
        },
      });

      if (!utilisateur) {
        return {
          success: false,
          message: "UserId ou mot de passe incorrect",
        };
      }

      // Vérifier si l'utilisateur est suspendu (prioritaire sur inactif)
      if (utilisateur.status_id === 3) {
        throw new UtilisateursError(
          "Ce compte a été suspendu",
          UtilisateursErrorCode.USER_SUSPENDED,
        );
      }

      // Vérifier si l'utilisateur est actif
      if (!utilisateur.active) {
        throw new UtilisateursError(
          "Ce compte a été désactivé",
          UtilisateursErrorCode.USER_INACTIVE,
        );
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, utilisateur.password);

      if (!isMatch) {
        return {
          success: false,
          message: "UserId ou mot de passe incorrect",
        };
      }

      return {
        success: true,
        message: "Connexion réussie",
        utilisateur: {
          id: utilisateur.id,
          userId: utilisateur.userId || undefined,
          prenom: utilisateur.first_name,
          nom: utilisateur.last_name,
          nom_utilisateur: utilisateur.nom_utilisateur || undefined,
          email: utilisateur.email,
          date_naissance: utilisateur.date_of_birth,
          status_id: utilisateur.status_id,
          grade_id: utilisateur.grade_id,
          abonnement_id: utilisateur.abonnement_id,
        },
      };
    } catch (error) {
      if (error instanceof UtilisateursError) {
        throw error;
      }
      console.error(
        "Erreur lors de la validation de la connexion par userId:",
        error,
      );
      throw new UtilisateursError(
        "Erreur lors de la connexion",
        UtilisateursErrorCode.OPERATION_FAILED,
      );
    }
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques générales des utilisateurs
   */
  async statistiquesGenerales(): Promise<StatistiquesUtilisateurs> {
    return stats.statistiquesGenerales(this.prisma);
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async statistiquesUtilisateur(
    utilisateurId: number,
  ): Promise<StatistiquesUtilisateur> {
    return stats.statistiquesUtilisateur(this.prisma, { utilisateurId });
  }

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  /**
   * Vérifie si un utilisateur existe par son ID
   */
  async utilisateurExiste(id: number): Promise<boolean> {
    const count = await this.prisma.utilisateurs.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Vérifie si un email existe déjà
   */
  async verifierEmailExiste(email: string): Promise<VerificationEmailResult> {
    const utilisateur = await this.prisma.utilisateurs.findFirst({
      where: {
        email: email.toLowerCase().trim(),
      },
      select: {
        id: true,
        active: true,
      },
    });

    if (!utilisateur) {
      return { existe: false };
    }

    return {
      existe: true,
      utilisateurId: utilisateur.id,
      actif: utilisateur.active,
    };
  }

  /**
   * Vérifie si un utilisateur existe et peut s'inscrire
   */
  async verifierUtilisateurExiste(
    email: string,
  ): Promise<VerificationUtilisateurResult> {
    const utilisateur = await this.prisma.utilisateurs.findFirst({
      where: {
        email: email.toLowerCase().trim(),
      },
      select: {
        id: true,
        userId: true,
        first_name: true,
        last_name: true,
        email: true,
        date_of_birth: true,
        active: true,
        status_id: true,
      },
    });

    if (!utilisateur) {
      return {
        existe: false,
        canRegister: true,
        message: "Aucun utilisateur trouvé avec cet email",
      };
    }

    if (!utilisateur.active) {
      return {
        existe: true,
        canRegister: false,
        message: "Un compte existe déjà avec cet email mais il est désactivé",
        utilisateur: {
          id: utilisateur.id,
          userId: utilisateur.userId || undefined,
          nom: utilisateur.last_name,
          prenom: utilisateur.first_name,
          email: utilisateur.email,
          date_naissance: utilisateur.date_of_birth,
        },
      };
    }

    return {
      existe: true,
      canRegister: false,
      message: "Un compte actif existe déjà avec cet email",
      utilisateur: {
        id: utilisateur.id,
        userId: utilisateur.userId || undefined,
        nom: utilisateur.last_name,
        prenom: utilisateur.first_name,
        email: utilisateur.email,
        date_naissance: utilisateur.date_of_birth,
      },
    };
  }

  /**
   * Obtient le nombre total d'utilisateurs
   */
  async compterUtilisateurs(): Promise<number> {
    return this.prisma.utilisateurs.count();
  }

  /**
   * Obtient le nombre d'utilisateurs actifs
   */
  async compterUtilisateursActifs(): Promise<number> {
    return this.prisma.utilisateurs.count({
      where: { active: true, status_id: 1 },
    });
  }

  /**
   * Obtient tous les utilisateurs (sans pagination)
   */
  async obtenirTousUtilisateurs(): Promise<UtilisateurAvecDetails[]> {
    const result = await this.obtenirUtilisateurs({ limit: 10000 });
    return result.utilisateurs;
  }

  /**
   * Recherche des utilisateurs par nom, prénom ou email
   */
  async rechercherUtilisateurs(
    recherche: string,
  ): Promise<UtilisateurAvecDetails[]> {
    const result = await this.obtenirUtilisateurs({ recherche, limit: 50 });
    return result.utilisateurs;
  }

  /**
   * Vérifie si un utilisateur est professeur
   */
  async estProfesseur(utilisateurId: number): Promise<boolean> {
    const utilisateur = await this.prisma.utilisateurs.findUnique({
      where: { id: utilisateurId },
      select: { status_id: true },
    });
    return utilisateur?.status_id === 5;
  }

  /**
   * Obtient les informations complètes d'un utilisateur avec toutes ses relations
   */
  async obtenirInformationsCompletes(
    utilisateurId: number,
  ): Promise<UtilisateurAvecDetails | null> {
    try {
      const utilisateur = await this.prisma.utilisateurs.findUnique({
        where: { id: utilisateurId },
        include: {
          genres: true,
          grades: true,
          abonnements: true,
          status: true,
        },
      });

      if (!utilisateur) {
        return null;
      }

      // Calcul de l'âge
      let age: number | undefined;
      if (utilisateur.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(utilisateur.date_of_birth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }

      const initiales = `${utilisateur.first_name.charAt(0).toUpperCase()}${utilisateur.last_name.charAt(0).toUpperCase()}`;

      return {
        id: utilisateur.id,
        userId: utilisateur.userId || undefined,
        first_name: utilisateur.first_name,
        last_name: utilisateur.last_name,
        nom_utilisateur: utilisateur.nom_utilisateur || undefined,
        email: utilisateur.email,
        genre_id: utilisateur.genre_id || undefined,
        date_of_birth: utilisateur.date_of_birth,
        grade_id: utilisateur.grade_id,
        abonnement_id: utilisateur.abonnement_id,
        status_id: utilisateur.status_id,
        active: utilisateur.active,
        date_inscription: utilisateur.date_inscription || undefined,
        created_at: utilisateur.created_at || undefined,
        updated_at: utilisateur.updated_at || undefined,
        genre: utilisateur.genres
          ? {
              id: utilisateur.genres.id,
              nom: utilisateur.genres.nom,
            }
          : undefined,
        grade: utilisateur.grades
          ? {
              id: utilisateur.grades.id,
              nom: utilisateur.grades.nom,
              niveau: utilisateur.grades.niveau || 0,
            }
          : undefined,
        abonnement: utilisateur.abonnements
          ? {
              id: utilisateur.abonnements.id,
              nom: utilisateur.abonnements.nom,
              type: utilisateur.abonnements.type || "standard",
            }
          : undefined,
        status: utilisateur.status
          ? {
              id: utilisateur.status.id,
              nom: utilisateur.status.nom,
            }
          : undefined,
        age,
        initiales,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations complètes:",
        error,
      );
      throw new UtilisateursError(
        "Erreur lors de la récupération des informations",
        UtilisateursErrorCode.OPERATION_FAILED,
      );
    }
  }
}

// Export d'une instance par défaut
let utilisateursServiceInstance: UtilisateursService | null = null;

export function initUtilisateursService(
  prisma: typeof defaultPrisma,
): UtilisateursService {
  utilisateursServiceInstance = new UtilisateursService(prisma);
  return utilisateursServiceInstance;
}

export function getUtilisateursService(): UtilisateursService {
  if (!utilisateursServiceInstance) {
    throw new Error("UtilisateursService n'a pas été initialisé");
  }
  return utilisateursServiceInstance;
}
