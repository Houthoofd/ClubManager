/**
 * Service pour les opérations métier liées aux Alertes
 * Responsabilité : Logique métier (détection, résolution, ignorement)
 */

import { ConfirmationResult } from "@clubmanager/types";
import MysqlConnector from "../db/connector/mysqlconnector.js";
import * as queries from "../db/clients/alertes/queries.js";
import type {
  ResoudreAlerteParams,
  IgnorerAlerteParams,
} from "../db/clients/alertes/types.js";

export class AlertesService {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  /**
   * Déclenche la détection automatique des alertes pour tous les utilisateurs
   * Utilise la stored procedure qui analyse les conditions et crée les alertes nécessaires
   */
  async detecterAlertes(): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CALL_DETECTER_ALERTES,
        [],
        (error: any, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la détection des alertes:",
              error.message,
            );
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Détection des alertes effectuée avec succès",
            });
          }
        },
      );
    });
  }

  /**
   * Résout une alerte spécifique
   * @param params - Paramètres de résolution (alerteId, notes, effectuePar)
   */
  async resoudreAlerte(
    params: ResoudreAlerteParams,
  ): Promise<ConfirmationResult> {
    const { alerteId, notes, effectuePar } = params;

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CALL_RESOUDRE_ALERTE,
        [alerteId, notes, effectuePar],
        (error: any, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la résolution de l'alerte:",
              error.message,
            );
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Alerte résolue avec succès",
            });
          }
        },
      );
    });
  }

  /**
   * Ignore une alerte (la marque comme non pertinente sans la résoudre)
   * @param params - Paramètres d'ignorement (alerteId, notes)
   */
  async ignorerAlerte(
    params: IgnorerAlerteParams,
  ): Promise<ConfirmationResult> {
    const { alerteId, notes } = params;

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.IGNORER_ALERTE,
        [notes, alerteId],
        (error: any, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de l'ignorement de l'alerte:",
              error.message,
            );
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Alerte ignorée avec succès",
            });
          }
        },
      );
    });
  }

  /**
   * Résout une alerte de manière simplifiée (sans stored procedure)
   * Alternative à resoudreAlerte si la stored procedure n'est pas disponible
   */
  async resoudreAlerteSimple(alerteId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE alertes_utilisateurs
        SET statut = 'resolue', date_resolution = NOW()
        WHERE id = ?
      `;

      this.mysqlConnector.query(
        query,
        [alerteId],
        (error: any, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la résolution simple de l'alerte:",
              error.message,
            );
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Alerte résolue avec succès",
            });
          }
        },
      );
    });
  }

  /**
   * Réactive une alerte précédemment ignorée ou résolue
   * @param alerteId - ID de l'alerte à réactiver
   */
  async reactiverAlerte(alerteId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE alertes_utilisateurs
        SET statut = 'active', date_resolution = NULL
        WHERE id = ?
      `;

      this.mysqlConnector.query(
        query,
        [alerteId],
        (error: any, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la réactivation de l'alerte:",
              error.message,
            );
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Alerte réactivée avec succès",
            });
          }
        },
      );
    });
  }
}
