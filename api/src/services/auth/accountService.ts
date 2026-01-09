/**
 * Service pour la gestion des comptes utilisateurs
 * Responsabilité : Création et modification de comptes
 */

import { ConfirmationResult } from "@clubmanager/types";
import MysqlConnector from "../../db/connector/mysqlconnector.js";
import * as queries from "../../db/clients/auth/queries.js";
import { AuthUtils } from "../../db/clients/auth/utils.js";
import type { CreerCompteParams } from "../../db/clients/auth/types.js";

export class AccountService {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  /**
   * Crée un nouveau compte utilisateur
   * @param userData - Données de l'utilisateur (first_name, last_name, email, password_hash)
   * @returns Confirmation de la création
   */
  async creerCompteUtilisateur(
    userData: CreerCompteParams
  ): Promise<ConfirmationResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Valider l'email
        if (!AuthUtils.validerEmail(userData.email)) {
          resolve({
            isConfirm: false,
            message: "Format d'email invalide",
          });
          return;
        }

        // Vérifier si l'email existe déjà
        const emailExists = await this.emailExiste(userData.email);
        if (emailExists) {
          resolve({
            isConfirm: false,
            message: "Un compte existe déjà avec cet email",
          });
          return;
        }

        // Créer le compte
        this.mysqlConnector.query(
          queries.CREATE_USER_ACCOUNT,
          [
            userData.first_name,
            userData.last_name,
            userData.email,
            userData.password_hash,
          ],
          (error, results) => {
            if (error) {
              console.error("Erreur lors de la création du compte:", error);
              reject(error);
            } else {
              resolve({
                isConfirm: true,
                message: "Compte créé avec succès",
              });
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Modifie le mot de passe d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param newPasswordHash - Nouveau hash du mot de passe
   * @returns Confirmation de la modification
   */
  async modifierMotDePasse(
    userId: number,
    newPasswordHash: string
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_PASSWORD,
        [newPasswordHash, userId],
        (error: any, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la modification du mot de passe:",
              error
            );
            reject(error);
          } else if (results.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: "Utilisateur non trouvé",
            });
          } else {
            resolve({
              isConfirm: true,
              message: "Mot de passe modifié avec succès",
            });
          }
        }
      );
    });
  }

  /**
   * Valide un mot de passe et le hash si valide
   * @param password - Mot de passe en clair
   * @returns Hash du mot de passe ou null si invalide
   */
  async validerEtHasherMotDePasse(
    password: string
  ): Promise<{ success: boolean; hash?: string; errors?: string[] }> {
    // Valider le mot de passe
    const validation = AuthUtils.validerMotDePasseSimple(password);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Hasher le mot de passe
    try {
      const hash = await AuthUtils.hasherMotDePasse(password);
      return {
        success: true,
        hash,
      };
    } catch (error) {
      console.error("Erreur lors du hashage du mot de passe:", error);
      return {
        success: false,
        errors: ["Erreur lors du traitement du mot de passe"],
      };
    }
  }

  /**
   * Vérifie si un email existe en base (méthode privée helper)
   * @param email - Email à vérifier
   * @returns true si l'email existe
   */
  private async emailExiste(email: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_EXISTS,
        [email],
        (error: any, results: any) => {
          if (error) {
            console.error("Erreur lors de la vérification de l'email:", error);
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }
}
