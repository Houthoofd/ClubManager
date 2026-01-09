/**
 * Repository pour les opérations de récupération des données Alertes
 * Responsabilité : Exécution des requêtes et mapping des résultats
 */

import { VerifyResultWithData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';
import * as queries from './queries.js';
import type { AlerteActive, DashboardAlerte, StatistiquesAlertes } from './types.js';

export class AlertesRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  /**
   * Récupère le dashboard des alertes via stored procedure
   */
  async obtenirDashboard(): Promise<VerifyResultWithData<DashboardAlerte[]>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CALL_OBTENIR_DASHBOARD_ALERTES,
        [],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la récupération du dashboard:', error.message);
            reject(error);
          } else {
            resolve({
              isFind: true,
              message: 'Dashboard des alertes récupéré avec succès',
              data: results[0] || []
            });
          }
        }
      );
    });
  }

  /**
   * Récupère toutes les alertes actives avec leurs détails
   */
  async obtenirAlertesActives(): Promise<VerifyResultWithData<AlerteActive[]>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_ALERTES_ACTIVES,
        [],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la récupération des alertes actives:', error.message);
            reject(error);
          } else {
            resolve({
              isFind: true,
              message: 'Alertes actives récupérées avec succès',
              data: results || []
            });
          }
        }
      );
    });
  }

  /**
   * Récupère les alertes d'un utilisateur spécifique
   * @param userId - ID de l'utilisateur
   */
  async obtenirAlertesUtilisateur(userId: number): Promise<VerifyResultWithData<any[]>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CALL_OBTENIR_ALERTES_UTILISATEUR,
        [userId],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la récupération des alertes utilisateur:', error.message);
            reject(error);
          } else {
            resolve({
              isFind: true,
              message: 'Alertes utilisateur récupérées avec succès',
              data: results[0] || []
            });
          }
        }
      );
    });
  }

  /**
   * Récupère les statistiques globales des alertes
   */
  async obtenirStatistiques(): Promise<VerifyResultWithData<StatistiquesAlertes>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_STATISTIQUES_ALERTES,
        [],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la récupération des statistiques:', error.message);
            reject(error);
          } else {
            resolve({
              isFind: true,
              message: 'Statistiques des alertes récupérées avec succès',
              data: results[0] || {}
            });
          }
        }
      );
    });
  }
}
