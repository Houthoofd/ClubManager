import { ConfirmationResult, VerifyResultWithData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Alerte {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  async obtenirDashboardAlertes(): Promise<VerifyResultWithData> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query('CALL obtenir_dashboard_alertes()', [], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la récupération du dashboard:', error.message);
          reject(error);
        } else {
          const confirmation: VerifyResultWithData = {
            isFind: true,
            message: "Dashboard des alertes récupéré avec succès",
            data: results[0] || []
          };
          resolve(confirmation);
        }
      });
    });
  }

  async obtenirAlertesActives(): Promise<VerifyResultWithData> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          au.id,
          au.utilisateur_id,
          at.nom as type_alerte,
          at.code,
          at.description,
          at.priorite,
          au.donnees_contexte,
          au.date_detection,
          CONCAT(u.first_name, ' ', u.last_name) as nom_utilisateur,
          u.email,
          u.status_id
        FROM alertes_utilisateurs au
        JOIN alertes_types at ON au.alerte_type_id = at.id
        JOIN utilisateurs u ON au.utilisateur_id = u.id
        WHERE au.statut = 'active'
        ORDER BY 
          CASE at.priorite 
            WHEN 'critique' THEN 1 
            WHEN 'haute' THEN 2 
            WHEN 'normale' THEN 3 
            WHEN 'basse' THEN 4 
          END,
          au.date_detection DESC
      `;

      this.mysqlConnector.query(query, [], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la récupération des alertes actives:', error.message);
          reject(error);
        } else {
          const confirmation: VerifyResultWithData = {
            isFind: true,
            message: "Alertes actives récupérées avec succès",
            data: results || []
          };
          resolve(confirmation);
        }
      });
    });
  }

  async obtenirAlertesUtilisateur(userId: number): Promise<VerifyResultWithData> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query('CALL obtenir_alertes_utilisateur(?)', [userId], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la récupération des alertes utilisateur:', error.message);
          reject(error);
        } else {
          const confirmation: VerifyResultWithData = {
            isFind: true,
            message: "Alertes utilisateur récupérées avec succès",
            data: results[0] || []
          };
          resolve(confirmation);
        }
      });
    });
  }

  async detecterAlertes(): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query('CALL detecter_alertes_utilisateurs()', [], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la détection des alertes:', error.message);
          reject(error);
        } else {
          const confirmation: ConfirmationResult = {
            isConfirm: true,
            message: "Détection des alertes effectuée avec succès"
          };
          resolve(confirmation);
        }
      });
    });
  }

  async resoudreAlerte(alerteId: number, notes: string, effectuePar: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query('CALL resoudre_alerte(?, ?, ?)', [alerteId, notes, effectuePar], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la résolution de l\'alerte:', error.message);
          reject(error);
        } else {
          const confirmation: ConfirmationResult = {
            isConfirm: true,
            message: "Alerte résolue avec succès"
          };
          resolve(confirmation);
        }
      });
    });
  }

  async ignorerAlerte(alerteId: number, notes: string): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE alertes_utilisateurs 
        SET statut = 'ignoree', notes = ?, date_resolution = NOW()
        WHERE id = ?
      `;

      this.mysqlConnector.query(query, [notes, alerteId], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de l\'ignorement de l\'alerte:', error.message);
          reject(error);
        } else {
          const confirmation: ConfirmationResult = {
            isConfirm: true,
            message: "Alerte ignorée avec succès"
          };
          resolve(confirmation);
        }
      });
    });
  }

  async obtenirStatistiquesAlertes(): Promise<VerifyResultWithData> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_alertes,
          COUNT(CASE WHEN statut = 'active' THEN 1 END) as alertes_actives,
          COUNT(CASE WHEN statut = 'resolue' THEN 1 END) as alertes_resolues,
          COUNT(CASE WHEN at.priorite = 'critique' AND au.statut = 'active' THEN 1 END) as alertes_critiques
        FROM alertes_utilisateurs au
        JOIN alertes_types at ON au.alerte_type_id = at.id
        WHERE au.date_detection >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      this.mysqlConnector.query(query, [], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la récupération des statistiques:', error.message);
          reject(error);
        } else {
          const confirmation: VerifyResultWithData = {
            isFind: true,
            message: "Statistiques des alertes récupérées avec succès",
            data: results[0] || {}
          };
          resolve(confirmation);
        }
      });
    });
  }
}
