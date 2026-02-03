import { ConfirmationResult } from "@clubmanager/types";
import MysqlConnector from "../../connector/mysqlconnector.js";

export class Informations {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  obtenirToutesLesInformations(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, titre, contenu, date_creation, status_id
        FROM informations
        WHERE status_id = 1
        ORDER BY date_creation DESC
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des informations :",
            error,
          );
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  obtenirInformationParId(id: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, titre, contenu, date_creation, status_id
        FROM informations
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [id], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération de l'information :",
            error,
          );
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  ajouterInformation(infoData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO informations (titre, contenu, date_creation, status_id)
        VALUES (?, ?, NOW(), 1)
      `;

      this.mysqlConnector.query(
        sql,
        [infoData.titre, infoData.contenu],
        (error, results) => {
          if (error) {
            console.error("Erreur lors de l'ajout de l'information :", error);
            reject(error);
          } else {
            resolve({
              isConfirm: true,
              message: "Information ajoutée avec succès",
            });
          }
        },
      );
    });
  }

  modifierInformation(id: number, infoData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE informations
        SET titre = ?, contenu = ?
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(
        sql,
        [infoData.titre, infoData.contenu, id],
        (error, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la modification de l'information :",
              error,
            );
            reject(error);
          } else if (results.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: "Information non trouvée",
            });
          } else {
            resolve({
              isConfirm: true,
              message: "Information modifiée avec succès",
            });
          }
        },
      );
    });
  }

  // Récupérer les statuts
  obtenirLeStatus(): Promise<Array<{ id: number; nom: string }>> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM status`;

      console.log("Exécution de la requête pour obtenir les statuts");

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des statuts : " + error.message,
          );
          reject(error);
        } else {
          console.log("Statuts récupérés avec succès :", results);
          // Mapper nom_role vers nom
          const mapped = results.map((row: any) => ({
            id: row.id,
            nom: row.nom_role || row.nom,
          }));
          resolve(mapped);
        }
      });
    });
  }

  // Récupérer les plans tarifaires
  obtenirLesPlansTarifaires(): Promise<
    Array<{
      id: number;
      nom_plan: string;
      prix: number;
      duree_mois: number;
      description?: string;
    }>
  > {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM plans_tarifaires`;

      console.log("Exécution de la requête pour obtenir les plans tarifaires");

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des plans tarifaires : " +
              error.message,
          );
          reject(error);
        } else {
          console.log("Plans tarifaires récupérés avec succès :", results);
          // Mapper periode vers duree_mois (convertir mensuel=1, trimestriel=3, annuel=12)
          const mapped = results.map((row: any) => {
            let duree_mois = row.duree_mois;
            if (!duree_mois && row.periode) {
              const periodeMap: { [key: string]: number } = {
                mensuel: 1,
                trimestriel: 3,
                semestriel: 6,
                annuel: 12,
              };
              duree_mois = periodeMap[row.periode.toLowerCase()] || 1;
            }
            return {
              id: row.id,
              nom_plan: row.nom_plan || row.nom,
              prix: row.prix,
              duree_mois: duree_mois,
              description: row.description,
            };
          });
          resolve(mapped);
        }
      });
    });
  }

  // Récupérer les genres
  obtenirLesGenres(): Promise<Array<{ id: number; nom: string }>> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM genres`;

      console.log("Exécution de la requête pour obtenir les genres");

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des genres : " + error.message,
          );
          reject(error);
        } else {
          console.log("Genres récupérés avec succès :", results);
          // Mapper genre_nom vers nom si nécessaire
          const mapped = results.map((row: any) => ({
            id: row.id,
            nom: row.nom || row.genre_nom || row.nom_genre,
          }));
          resolve(mapped);
        }
      });
    });
  }

  // Récupérer les grades
  obtenirLesGrades(): Promise<
    Array<{ id: number; nom: string; ordre?: number }>
  > {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM grades ORDER BY id ASC`;

      console.log("Exécution de la requête pour obtenir les grades");

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des grades : " + error.message,
          );
          reject(error);
        } else {
          console.log("Grades récupérés avec succès :", results);
          // Mapper grade_id vers nom
          const mapped = results.map((row: any) => ({
            id: row.id,
            nom: row.nom || row.grade_id || row.nom_grade,
            ordre: row.ordre,
          }));
          resolve(mapped);
        }
      });
    });
  }
}
