import { CoursRecurrent } from "../../../core/domain/entities/CoursRecurrent.js";
import { ICoursRecurrentRepository } from "../../../core/domain/interfaces/ICoursRecurrentRepository.js";
import { Horaire } from "../../../core/domain/value-objects/Horaire.js";
import { JourSemaine } from "../../../core/domain/value-objects/JourSemaine.js";
import MysqlConnector from "../../../db/connector/mysqlconnector.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Interface pour les données brutes de la base de données
 */
interface CoursRecurrentRow extends RowDataPacket {
  id: number;
  type_cours: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  active: number; // MySQL retourne 0 ou 1 pour boolean
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface pour les professeurs associés
 */
interface ProfesseurRow extends RowDataPacket {
  professeur_id: number;
}

/**
 * Implémentation MySQL du CoursRecurrentRepository
 *
 * Cette classe implémente l'interface ICoursRecurrentRepository en utilisant MySQL
 * comme système de persistence. Elle est responsable de :
 * - La conversion entre les entités du domaine et les données de la DB
 * - L'exécution des requêtes SQL
 * - La gestion des associations avec les professeurs
 * - La gestion des erreurs de base de données
 */
export class CoursRecurrentRepository implements ICoursRecurrentRepository {
  private db: MysqlConnector;

  constructor() {
    this.db = MysqlConnector.getInstance();
  }

  /**
   * Trouve un cours récurrent par son ID
   */
  async findById(id: number): Promise<CoursRecurrent | null> {
    const query = `
      SELECT * FROM cours_recurrent
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(
        query,
        [id],
        async (error, results: CoursRecurrentRow[]) => {
          if (error) {
            reject(
              new Error(
                `Erreur lors de la recherche du cours récurrent: ${error.message}`,
              ),
            );
            return;
          }

          if (!results || results.length === 0) {
            resolve(null);
            return;
          }

          try {
            // Récupérer les professeurs associés
            const professeurs = await this.getProfesseursForCoursRecurrent(
              results[0].id,
            );
            const coursRecurrent = this.mapRowToEntity(results[0], professeurs);
            resolve(coursRecurrent);
          } catch (mappingError) {
            reject(mappingError);
          }
        },
      );
    });
  }

  /**
   * Trouve tous les cours récurrents pour un jour de la semaine spécifique
   */
  async findByJourSemaine(jour: number): Promise<CoursRecurrent[]> {
    const query = `
      SELECT * FROM cours_recurrent
      WHERE jour_semaine = ?
      ORDER BY heure_debut ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(
        query,
        [jour],
        async (error, results: CoursRecurrentRow[]) => {
          if (error) {
            reject(
              new Error(
                `Erreur lors de la recherche des cours récurrents par jour: ${error.message}`,
              ),
            );
            return;
          }

          try {
            // Récupérer les professeurs pour chaque cours récurrent
            const coursRecurrents = await Promise.all(
              results.map(async (row) => {
                const professeurs = await this.getProfesseursForCoursRecurrent(
                  row.id,
                );
                return this.mapRowToEntity(row, professeurs);
              }),
            );
            resolve(coursRecurrents);
          } catch (mappingError) {
            reject(mappingError);
          }
        },
      );
    });
  }

  /**
   * Trouve tous les cours récurrents
   */
  async findAll(): Promise<CoursRecurrent[]> {
    const query = `
      SELECT * FROM cours_recurrent
      ORDER BY jour_semaine ASC, heure_debut ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [], async (error, results: CoursRecurrentRow[]) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la recherche de tous les cours récurrents: ${error.message}`,
            ),
          );
          return;
        }

        try {
          // Récupérer les professeurs pour chaque cours récurrent
          const coursRecurrents = await Promise.all(
            results.map(async (row) => {
              const professeurs = await this.getProfesseursForCoursRecurrent(
                row.id,
              );
              return this.mapRowToEntity(row, professeurs);
            }),
          );
          resolve(coursRecurrents);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve tous les cours récurrents actifs
   */
  async findActive(): Promise<CoursRecurrent[]> {
    const query = `
      SELECT * FROM cours_recurrent
      WHERE active = 1
      ORDER BY jour_semaine ASC, heure_debut ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [], async (error, results: CoursRecurrentRow[]) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la recherche des cours récurrents actifs: ${error.message}`,
            ),
          );
          return;
        }

        try {
          // Récupérer les professeurs pour chaque cours récurrent
          const coursRecurrents = await Promise.all(
            results.map(async (row) => {
              const professeurs = await this.getProfesseursForCoursRecurrent(
                row.id,
              );
              return this.mapRowToEntity(row, professeurs);
            }),
          );
          resolve(coursRecurrents);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Crée un nouveau cours récurrent
   */
  async save(coursRecurrent: CoursRecurrent): Promise<CoursRecurrent> {
    const query = `
      INSERT INTO cours_recurrent (
        type_cours, jour_semaine, heure_debut, heure_fin,
        active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      coursRecurrent.typeCours,
      coursRecurrent.jourSemaine.getNumero(),
      coursRecurrent.horaire.getHeureDebut(),
      coursRecurrent.horaire.getHeureFin(),
      coursRecurrent.active ? 1 : 0,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, async (error, result: ResultSetHeader) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la création du cours récurrent: ${error.message}`,
            ),
          );
          return;
        }

        try {
          const coursRecurrentId = result.insertId;

          // Sauvegarder les professeurs associés
          if (coursRecurrent.professeurs.length > 0) {
            await this.saveProfesseurs(
              coursRecurrentId,
              coursRecurrent.professeurs,
            );
          }

          // Récupérer le cours récurrent créé avec son ID
          const createdCoursRecurrent = await this.findById(coursRecurrentId);

          if (!createdCoursRecurrent) {
            reject(new Error("Cours récurrent créé mais non trouvé"));
            return;
          }

          resolve(createdCoursRecurrent);
        } catch (saveError) {
          reject(saveError);
        }
      });
    });
  }

  /**
   * Met à jour un cours récurrent existant
   */
  async update(coursRecurrent: CoursRecurrent): Promise<CoursRecurrent> {
    if (!coursRecurrent.id) {
      throw new Error("Impossible de mettre à jour un cours récurrent sans ID");
    }

    const coursRecurrentId = coursRecurrent.id;

    const query = `
      UPDATE cours_recurrent
      SET
        type_cours = ?,
        jour_semaine = ?,
        heure_debut = ?,
        heure_fin = ?,
        active = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      coursRecurrent.typeCours,
      coursRecurrent.jourSemaine.getNumero(),
      coursRecurrent.horaire.getHeureDebut(),
      coursRecurrent.horaire.getHeureFin(),
      coursRecurrent.active ? 1 : 0,
      coursRecurrentId,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, async (error, result: ResultSetHeader) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la mise à jour du cours récurrent: ${error.message}`,
            ),
          );
          return;
        }

        if (result.affectedRows === 0) {
          reject(
            new Error(
              `Cours récurrent avec l'ID ${coursRecurrentId} non trouvé`,
            ),
          );
          return;
        }

        try {
          // Mettre à jour les professeurs (supprimer les anciens et ajouter les nouveaux)
          await this.deleteProfesseurs(coursRecurrentId);
          if (coursRecurrent.professeurs.length > 0) {
            await this.saveProfesseurs(
              coursRecurrentId,
              coursRecurrent.professeurs,
            );
          }

          // Récupérer le cours récurrent mis à jour
          const updatedCoursRecurrent = await this.findById(coursRecurrentId);

          if (!updatedCoursRecurrent) {
            reject(new Error("Cours récurrent mis à jour mais non trouvé"));
            return;
          }

          resolve(updatedCoursRecurrent);
        } catch (updateError) {
          reject(updateError);
        }
      });
    });
  }

  /**
   * Supprime un cours récurrent par son ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      // D'abord supprimer les associations professeurs
      await this.deleteProfesseurs(id);

      // Ensuite supprimer le cours récurrent
      const query = `
        DELETE FROM cours_recurrent
        WHERE id = ?
      `;

      return new Promise((resolve, reject) => {
        this.db.query(query, [id], (error, result: ResultSetHeader) => {
          if (error) {
            reject(
              new Error(
                `Erreur lors de la suppression du cours récurrent: ${error.message}`,
              ),
            );
            return;
          }

          resolve(result.affectedRows > 0);
        });
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la suppression du cours récurrent: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Récupère les IDs des professeurs associés à un cours récurrent
   */
  private getProfesseursForCoursRecurrent(
    coursRecurrentId: number,
  ): Promise<number[]> {
    const query = `
      SELECT professeur_id
      FROM cours_recurrent_professeur
      WHERE cours_recurrent_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(
        query,
        [coursRecurrentId],
        (error, results: ProfesseurRow[]) => {
          if (error) {
            reject(
              new Error(
                `Erreur lors de la récupération des professeurs: ${error.message}`,
              ),
            );
            return;
          }

          const professeurIds = results.map((row) => row.professeur_id);
          resolve(professeurIds);
        },
      );
    });
  }

  /**
   * Sauvegarde les associations professeurs pour un cours récurrent
   */
  private saveProfesseurs(
    coursRecurrentId: number,
    professeurIds: number[],
  ): Promise<void> {
    if (professeurIds.length === 0) {
      return Promise.resolve();
    }

    // Créer les placeholders pour l'insertion multiple
    const values = professeurIds.map((profId) => [coursRecurrentId, profId]);
    const placeholders = professeurIds.map(() => "(?, ?)").join(", ");

    const query = `
      INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
      VALUES ${placeholders}
    `;

    // Aplatir le tableau de valeurs
    const flatValues = values.flat();

    return new Promise((resolve, reject) => {
      this.db.query(query, flatValues, (error, result: ResultSetHeader) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la sauvegarde des associations professeurs: ${error.message}`,
            ),
          );
          return;
        }

        resolve();
      });
    });
  }

  /**
   * Supprime toutes les associations professeurs pour un cours récurrent
   */
  private deleteProfesseurs(coursRecurrentId: number): Promise<void> {
    const query = `
      DELETE FROM cours_recurrent_professeur
      WHERE cours_recurrent_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(
        query,
        [coursRecurrentId],
        (error, result: ResultSetHeader) => {
          if (error) {
            reject(
              new Error(
                `Erreur lors de la suppression des associations professeurs: ${error.message}`,
              ),
            );
            return;
          }

          resolve();
        },
      );
    });
  }

  /**
   * Convertit une ligne de la base de données en entité CoursRecurrent
   */
  private mapRowToEntity(
    row: CoursRecurrentRow,
    professeurs: number[],
  ): CoursRecurrent {
    try {
      // Créer les Value Objects
      const horaire = Horaire.create(row.heure_debut, row.heure_fin);
      const jourSemaine = JourSemaine.fromNumero(row.jour_semaine);

      // Utiliser la factory method fromPersistence pour reconstruire l'entité
      return CoursRecurrent.fromPersistence({
        id: row.id,
        typeCours: row.type_cours,
        jourSemaine: jourSemaine,
        horaire: horaire,
        active: row.active === 1,
        professeurs: professeurs,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la conversion de la ligne DB en entité CoursRecurrent: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }
}
