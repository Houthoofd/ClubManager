/**
 * Service pour la récupération de mot de passe
 * Responsabilité : Gestion des tokens et réinitialisation de mot de passe
 */

import { ConfirmationResult } from "@clubmanager/types";
import MysqlConnector from "../../db/connector/mysqlconnector.js";
import * as queries from "../../db/clients/auth/queries.js";
import { AuthUtils } from "../../db/clients/auth/utils.js";
import type { TokenRecuperation } from "../../db/clients/auth/types.js";

export class PasswordRecoveryService {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  /**
   * Crée un token de récupération de mot de passe
   * @param userId - ID de l'utilisateur
   * @param token - Token de récupération
   * @param expiresAt - Date d'expiration
   * @returns Confirmation de la création
   */
  async creerTokenRecuperation(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      // D'abord supprimer les anciens tokens
      this.mysqlConnector.query(
        queries.DELETE_USER_RESET_TOKENS,
        [userId],
        (deleteError) => {
          if (deleteError) {
            console.error(
              "Erreur lors de la suppression des anciens tokens:",
              deleteError
            );
            reject(deleteError);
            return;
          }

          // Créer le nouveau token
          this.mysqlConnector.query(
            queries.CREATE_RESET_TOKEN,
            [userId, token, expiresAt, new Date()],
            (insertError) => {
              if (insertError) {
                console.error(
                  "Erreur lors de la création du token:",
                  insertError
                );
                reject(insertError);
              } else {
                resolve({
                  isConfirm: true,
                  message: "Token de récupération créé avec succès",
                });
              }
            }
          );
        }
      );
    });
  }

  /**
   * Marque un token comme utilisé (le supprime)
   * @param token - Token à marquer comme utilisé
   * @returns Confirmation
   */
  async marquerTokenUtilise(token: string): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_TOKEN,
        [token],
        (error: any, results: any) => {
          if (error) {
            console.error("Erreur lors de la suppression du token:", error);
            reject(error);
          } else if (results.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: "Token non trouvé",
            });
          } else {
            resolve({
              isConfirm: true,
              message: "Token supprimé (marqué comme utilisé)",
            });
          }
        }
      );
    });
  }

  /**
   * Réinitialise le mot de passe avec un token de récupération
   * @param token - Token de récupération
   * @param newPasswordHash - Nouveau hash du mot de passe
   * @returns Confirmation de la réinitialisation
   */
  async reinitialiserMotDePasseAvecToken(
    token: string,
    newPasswordHash: string
  ): Promise<ConfirmationResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Vérifier le token
        const tokenData = await this.verifierToken(token);
        if (!tokenData) {
          resolve({
            isConfirm: false,
            message: "Token invalide ou expiré",
          });
          return;
        }

        // Mettre à jour le mot de passe
        this.mysqlConnector.query(
          queries.UPDATE_PASSWORD_BY_ID,
          [newPasswordHash, tokenData.user_id],
          (updateError: any, updateResults: any) => {
            if (updateError) {
              console.error(
                "Erreur lors de la mise à jour du mot de passe:",
                updateError
              );
              reject(updateError);
              return;
            }

            if (updateResults.affectedRows === 0) {
              resolve({
                isConfirm: false,
                message: "Utilisateur non trouvé",
              });
              return;
            }

            // Supprimer tous les tokens de l'utilisateur
            this.mysqlConnector.query(
              queries.DELETE_ALL_USER_TOKENS,
              [tokenData.user_id],
              (deleteError) => {
                if (deleteError) {
                  console.warn(
                    "Erreur lors de la suppression des tokens:",
                    deleteError
                  );
                }

                resolve({
                  isConfirm: true,
                  message: "Mot de passe réinitialisé avec succès",
                });
              }
            );
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Nettoie les tokens expirés
   * @returns Confirmation avec nombre de tokens supprimés
   */
  async nettoyerTokensExpires(): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const now = new Date();

      this.mysqlConnector.query(
        queries.DELETE_EXPIRED_TOKENS,
        [now],
        (error: any, results: any) => {
          if (error) {
            console.error("Erreur lors du nettoyage des tokens:", error);
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: `${results.affectedRows} token(s) expiré(s) supprimé(s)`,
            });
          }
        }
      );
    });
  }

  /**
   * Crée une demande de récupération manuelle
   * @param userId - ID de l'utilisateur
   * @param raison - Raison de la demande
   * @param informationsVerification - Informations de vérification
   * @returns Confirmation de la création
   */
  async creerDemandeRecuperationManuelle(
    userId: number,
    raison: string,
    informationsVerification: any
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const expiresAt = AuthUtils.genererDateExpirationJours(7); // 7 jours
      const verificationJson = JSON.stringify({
        ...informationsVerification,
        timestamp: new Date().toISOString(),
      });

      this.mysqlConnector.query(
        queries.CREATE_MANUAL_RECOVERY_REQUEST,
        [userId, raison, verificationJson, new Date(), expiresAt],
        (error, results) => {
          if (error) {
            console.error(
              "Erreur lors de la création de la demande manuelle:",
              error
            );
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Demande de récupération manuelle créée avec succès",
            });
          }
        }
      );
    });
  }

  /**
   * Vérifie un token de récupération (méthode privée helper)
   * @param token - Token à vérifier
   * @returns Données du token ou null
   */
  private async verifierToken(
    token: string
  ): Promise<TokenRecuperation | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_VALID_TOKEN,
        [token, new Date()],
        (error: any, results: any) => {
          if (error) {
            console.error("Erreur lors de la vérification du token:", error);
            reject(error);
          } else {
            resolve(results.length > 0 ? results[0] : null);
          }
        }
      );
    });
  }
}
