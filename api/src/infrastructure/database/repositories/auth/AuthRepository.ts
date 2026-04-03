/**
 * Repository: AuthRepository
 * Implémentation Prisma du repository d'authentification
 *
 * Responsabilités:
 * - Gestion des utilisateurs (CRUD)
 * - Enregistrement des tentatives d'authentification
 * - Conversion entre les entités du domaine et les données de la DB
 */

import { PrismaClient } from "@prisma/client";
import { IAuthRepository } from "../../../../core/domain/interfaces/auth/IAuthRepository.js";
import {
  User,
  UserRole,
  UserStatus,
} from "../../../../core/domain/entities/User.js";
import { Email as AuthEmail } from "../../../../core/domain/value-objects/auth/Email.js";
import { Email } from "../../../../core/domain/value-objects/Email.js";
import { Password } from "../../../../core/domain/value-objects/auth/Password.js";
import { AuthAttempt } from "@clubmanager/types";

/**
 * Mapping entre les status_id de la DB et les rôles du domaine
 */
const STATUS_ID_TO_ROLE: Record<number, UserRole> = {
  1: UserRole.MEMBRE,
  2: UserRole.PROFESSEUR,
  3: UserRole.ADMIN,
  4: UserRole.INVITE,
};

/**
 * Mapping inverse pour la création d'utilisateurs
 */
const ROLE_TO_STATUS_ID: Record<UserRole, number> = {
  [UserRole.MEMBRE]: 1,
  [UserRole.PROFESSEUR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.INVITE]: 4,
};

/**
 * Implémentation Prisma du AuthRepository
 */
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Trouve un utilisateur par son email
   */
  async findUserByEmail(email: AuthEmail): Promise<User | null> {
    try {
      const dbUser = await this.prisma.utilisateurs.findFirst({
        where: {
          email: email.getValue(),
        },
        include: {
          status: true,
        },
      });

      if (!dbUser) {
        return null;
      }

      return this.mapToEntity(dbUser);
    } catch (error) {
      throw new Error(
        `Erreur lors de la recherche de l'utilisateur par email: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Trouve un utilisateur par son ID
   */
  async findUserById(id: number): Promise<User | null> {
    try {
      const dbUser = await this.prisma.utilisateurs.findUnique({
        where: {
          id,
        },
        include: {
          status: true,
        },
      });

      if (!dbUser) {
        return null;
      }

      return this.mapToEntity(dbUser);
    } catch (error) {
      throw new Error(
        `Erreur lors de la recherche de l'utilisateur par ID: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Crée un nouveau compte utilisateur
   */
  async createUser(data: {
    email: AuthEmail;
    password: Password;
    nom: string;
    prenom: string;
    telephone?: string;
    dateNaissance?: Date;
    adresse?: string;
    codePostal?: string;
    ville?: string;
  }): Promise<User> {
    try {
      // Générer un userId unique
      const userId = await this.generateUniqueUserId();

      const dbUser = await this.prisma.utilisateurs.create({
        data: {
          userId,
          email: data.email.getValue(),
          password: data.password.getHash(),
          first_name: data.prenom,
          last_name: data.nom,
          nom_utilisateur: `${data.prenom.toLowerCase()}.${data.nom.toLowerCase()}`,
          date_of_birth: data.dateNaissance || new Date("2000-01-01"),
          status_id: ROLE_TO_STATUS_ID[UserRole.MEMBRE], // Par défaut, nouveau membre
          active: true,
          email_verified: false,
          genre_id: null,
          grade_id: 1,
        },
        include: {
          status: true,
        },
      });

      return this.mapToEntity(dbUser);
    } catch (error) {
      throw new Error(
        `Erreur lors de la création de l'utilisateur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   */
  async updatePassword(userId: number, password: Password): Promise<void> {
    try {
      await this.prisma.utilisateurs.update({
        where: {
          id: userId,
        },
        data: {
          password: password.getHash(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la mise à jour du mot de passe: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Vérifie si un email existe déjà dans le système
   */
  async checkEmailExists(email: AuthEmail): Promise<boolean> {
    try {
      const count = await this.prisma.utilisateurs.count({
        where: {
          email: email.getValue(),
        },
      });

      return count > 0;
    } catch (error) {
      throw new Error(
        `Erreur lors de la vérification de l'existence de l'email: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Enregistre une tentative d'authentification pour l'audit
   */
  async recordAuthAttempt(attempt: AuthAttempt): Promise<void> {
    try {
      await this.prisma.auth_attempts.create({
        data: {
          email: attempt.email,
          success: attempt.success,
          attempted_at: attempt.attemptedAt,
          ip_address: null,
          user_agent: null,
        },
      });
    } catch (error) {
      // Log l'erreur mais ne la propage pas - l'audit ne doit pas bloquer l'authentification
      console.error(
        "[AuthRepository] Erreur lors de l'enregistrement de la tentative d'authentification:",
        error,
      );
    }
  }

  /**
   * Génère un userId unique
   */
  private async generateUniqueUserId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    const userId = `U${timestamp}${random}`.substring(0, 20);

    // Vérifier l'unicité
    const existing = await this.prisma.utilisateurs.findUnique({
      where: { userId },
    });

    if (existing) {
      // Récursif en cas de collision (très rare)
      return this.generateUniqueUserId();
    }

    return userId;
  }

  /**
   * Convertit une ligne de la base de données en entité User
   */
  private mapToEntity(dbUser: any): User {
    try {
      // Déterminer le rôle basé sur le status_id
      const role = STATUS_ID_TO_ROLE[dbUser.status_id || 1] || UserRole.MEMBRE;

      // Déterminer le statut basé sur active et email_verified
      let status: UserStatus;
      if (dbUser.active && dbUser.email_verified) {
        status = UserStatus.ACTIF;
      } else if (!dbUser.active) {
        status = UserStatus.INACTIF;
      } else if (!dbUser.email_verified) {
        status = UserStatus.EN_ATTENTE;
      } else {
        status = UserStatus.ACTIF;
      }

      // Créer l'Email Value Object
      const email = new Email(dbUser.email);

      // Reconstruire l'entité User depuis la persistence
      return User.fromPersistence({
        id: dbUser.id,
        email,
        nom: dbUser.last_name,
        prenom: dbUser.first_name,
        passwordHash: dbUser.password,
        telephone: undefined, // Non disponible dans le schéma actuel
        dateNaissance: dbUser.date_of_birth
          ? new Date(dbUser.date_of_birth)
          : undefined,
        adresse: undefined, // Non disponible dans le schéma actuel
        codePostal: undefined, // Non disponible dans le schéma actuel
        ville: undefined, // Non disponible dans le schéma actuel
        role,
        status,
        emailVerifie: dbUser.email_verified || false,
        dateInscription: new Date(dbUser.date_inscription),
        derniereConnexion: undefined, // Non disponible dans le schéma actuel
        photoUrl: undefined, // Non disponible dans le schéma actuel
        notes: undefined, // Non disponible dans le schéma actuel
        createdAt: new Date(dbUser.date_inscription),
        updatedAt: dbUser.updated_at
          ? new Date(dbUser.updated_at)
          : new Date(dbUser.date_inscription),
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la conversion de la ligne DB en entité User: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }
}
