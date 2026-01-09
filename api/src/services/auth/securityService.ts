/**
 * Service pour la sécurité et l'audit des authentifications
 * Responsabilité : Gestion des tentatives, audit, et sécurité
 */

import { ConfirmationResult } from "@clubmanager/types";
import MysqlConnector from "../../db/connector/mysqlconnector.js";
import * as queries from "../../db/clients/auth/queries.js";
import { AuthUtils } from "../../db/clients/auth/utils.js";
import type { ResultatAuthentification } from "../../db/clients/auth/types.js";

export class SecurityService {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  /**
   * Authentifie un utilisateur avec email et mot de passe
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe en clair
   * @returns Résultat de l'authentification avec données utilisateur si succès
   */
  async authentifierUtilisateur(
    email: string,
    password: string
  ): Promise<ResultatAuthentification> {
    return new Promise(async (resolve, reject) => {
      try {
        // Valider l'email
        if (!AuthUtils.validerEmail(email)) {
          resolve({ success: false, message: "Format d'email invalide" });
          return;
        }

        // Rechercher l'utilisateur
        this.mysqlConnector.query(
          queries.GET_USER_BY_EMAIL,
          [email],
          async (error: any, results: any) => {
            if (error) {
              console.error("Erreur lors de l'authentification:", error);
              reject(error);
              return;
            }

            if (results.length === 0) {
              // Enregistrer la tentative échouée
              await this.enregistrerTentativeConnexion(email, false);
              resolve({ success: false, message: "Utilisateur non trouvé" });
              return;
            }

            const user = results[0];

            try {
              // Vérifier le mot de passe
              const isValidPassword = await AuthUtils.verifierMotDePasse(
                password,
                user.password_hash
              );

              if (isValidPassword) {
                // Enregistrer la tentative réussie
                await this.enregistrerTentativeConnexion(email, true);

                resolve({
                  success: true,
                  user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                  },
                });
              } else {
                // Enregistrer la tentative échouée
                await this.enregistrerTentativeConnexion(email, false);
                resolve({ success: false, message: "Mot de passe incorrect" });
              }
            } catch (bcryptError) {
              console.error("Erreur bcrypt:", bcryptError);
              reject(bcryptError);
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Enregistre une tentative de récupération de mot de passe
   * @param email - Email de l'utilisateur
   * @param success - Succès ou échec de la tentative
   */
  async enregistrerTentativeRecuperation(
    email: string,
    success: boolean
  ): Promise<void> {
    return new Promise((resolve) => {
      this.mysqlConnector.query(
        queries.INSERT_RECOVERY_ATTEMPT,
        [email, success, new Date()],
        (error) => {
          if (error) {
            console.error(
              "Erreur lors de l'enregistrement de la tentative:",
              error
            );
          }
          resolve();
        }
      );
    });
  }

  /**
   * Enregistre une tentative de connexion
   * @param email - Email de l'utilisateur
   * @param success - Succès ou échec de la tentative
   */
  async enregistrerTentativeConnexion(
    email: string,
    success: boolean
  ): Promise<void> {
    return new Promise((resolve) => {
      this.mysqlConnector.query(
        queries.INSERT_AUTH_ATTEMPT,
        [email, success, new Date()],
        (error) => {
          if (error) {
            console.error(
              "Erreur lors de l'enregistrement de la tentative:",
              error
            );
          }
          resolve();
        }
      );
    });
  }

  /**
   * Vérifie si un email a trop de tentatives récentes
   * @param email - Email à vérifier
   * @param type - Type de tentative ('login' ou 'recovery')
   * @param minutes - Fenêtre de temps en minutes
   * @param maxAttempts - Nombre maximum de tentatives
   * @returns true si bloqué
   */
  async verifierBlocage(
    email: string,
    type: "login" | "recovery",
    minutes: number = 15,
    maxAttempts: number = 5
  ): Promise<boolean> {
    const query =
      type === "login"
        ? queries.COUNT_RECENT_LOGIN_ATTEMPTS
        : queries.COUNT_RECENT_RECOVERY_ATTEMPTS;

    return new Promise((resolve, reject) => {
      const timeAgo = AuthUtils.calculerDatePassee(minutes);

      this.mysqlConnector.query(query, [email, timeAgo], (error: any, results: any) => {
        if (error) {
          console.error("Erreur lors de la vérification du blocage:", error);
          resolve(false); // En cas d'erreur, ne pas bloquer
        } else {
          resolve(results[0].count >= maxAttempts);
        }
      });
    });
  }

  /**
   * Obtient le nombre de tentatives récentes
   * @param email - Email de l'utilisateur
   * @param type - Type de tentative
   * @param minutes - Fenêtre de temps en minutes
   * @returns Nombre de tentatives
   */
  async obtenirNombreTentatives(
    email: string,
    type: "login" | "recovery",
    minutes: number = 15
  ): Promise<number> {
    const query =
      type === "login"
        ? queries.COUNT_RECENT_LOGIN_ATTEMPTS
        : queries.COUNT_RECENT_RECOVERY_ATTEMPTS;

    return new Promise((resolve, reject) => {
      const timeAgo = AuthUtils.calculerDatePassee(minutes);

      this.mysqlConnector.query(query, [email, timeAgo], (error: any, results: any) => {
        if (error) {
          console.error("Erreur lors du comptage des tentatives:", error);
          resolve(0);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }

  /**
   * Nettoie les anciennes tentatives (audit cleanup)
   * @param days - Nombre de jours à conserver
   * @returns Confirmation
   */
  async nettoyerAnciennesTentatives(days: number = 30): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const deleteAuthAttempts = `
        DELETE FROM auth_attempts
        WHERE attempted_at < ?
      `;

      this.mysqlConnector.query(
        deleteAuthAttempts,
        [dateLimit],
        (error: any, results: any) => {
          if (error) {
            console.error("Erreur lors du nettoyage des tentatives:", error);
            reject(error);
          } else {
            const authCount = results.affectedRows;

            // Nettoyer aussi les tentatives de récupération
            const deleteRecoveryAttempts = `
              DELETE FROM password_reset_attempts
              WHERE attempted_at < ?
            `;

            this.mysqlConnector.query(
              deleteRecoveryAttempts,
              [dateLimit],
              (error2: any, results2: any) => {
                if (error2) {
                  console.error(
                    "Erreur lors du nettoyage des tentatives de récupération:",
                    error2
                  );
                }

                const recoveryCount = results2?.affectedRows || 0;

                resolve({
                  isConfirm: true,
                  message: `${authCount + recoveryCount} tentative(s) supprimée(s)`,
                });
              }
            );
          }
        }
      );
    });
  }
}
