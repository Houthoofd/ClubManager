import { Cours } from '../../../core/domain/entities/Cours.js';
import { ICoursRepository } from '../../../core/domain/interfaces/ICoursRepository.js';
import { Horaire } from '../../../core/domain/value-objects/Horaire.js';
import MysqlConnector from '../../../db/connector/mysqlconnector.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Interface pour les données brutes de la base de données
 */
interface CoursRow extends RowDataPacket {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  cours_recurrent_id: number;
  annule: number; // MySQL retourne 0 ou 1 pour boolean
  created_at: Date;
}

/**
 * Implémentation MySQL du CoursRepository
 *
 * Cette classe implémente l'interface ICoursRepository en utilisant MySQL
 * comme système de persistence. Elle est responsable de :
 * - La conversion entre les entités du domaine et les données de la DB
 * - L'exécution des requêtes SQL
 * - La gestion des erreurs de base de données
 */
export class CoursRepository implements ICoursRepository {
  private db: MysqlConnector;

  constructor() {
    this.db = MysqlConnector.getInstance();
  }

  /**
   * Trouve un cours par son ID
   */
  async findById(id: number): Promise<Cours | null> {
    const query = `
      SELECT * FROM cours
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [id], (error, results: CoursRow[]) => {
        if (error) {
          reject(new Error(`Erreur lors de la recherche du cours: ${error.message}`));
          return;
        }

        if (!results || results.length === 0) {
          resolve(null);
          return;
        }

        try {
          const cours = this.mapRowToEntity(results[0]);
          resolve(cours);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve tous les cours d'une date spécifique
   */
  async findByDate(date: Date): Promise<Cours[]> {
    const query = `
      SELECT * FROM cours
      WHERE DATE(date_cours) = DATE(?)
      ORDER BY heure_debut ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [date], (error, results: CoursRow[]) => {
        if (error) {
          reject(new Error(`Erreur lors de la recherche des cours par date: ${error.message}`));
          return;
        }

        try {
          const cours = results.map((row) => this.mapRowToEntity(row));
          resolve(cours);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve tous les cours dans une plage de dates
   */
  async findByDateRange(debut: Date, fin: Date): Promise<Cours[]> {
    const query = `
      SELECT * FROM cours
      WHERE date_cours BETWEEN ? AND ?
      ORDER BY date_cours ASC, heure_debut ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [debut, fin], (error, results: CoursRow[]) => {
        if (error) {
          reject(
            new Error(`Erreur lors de la recherche des cours par plage de dates: ${error.message}`)
          );
          return;
        }

        try {
          const cours = results.map((row) => this.mapRowToEntity(row));
          resolve(cours);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve les cours d'un participant pour une semaine spécifique
   */
  async findByWeek(participantId: number, weekNumber: number): Promise<Cours[]> {
    const query = `
      SELECT c.*
      FROM cours c
      INNER JOIN inscriptions i ON i.cours_id = c.id
      WHERE i.utilisateur_id = ?
        AND WEEK(c.date_cours, 1) = ?
      ORDER BY c.date_cours ASC, c.heure_debut ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [participantId, weekNumber], (error, results: CoursRow[]) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la recherche des cours du participant pour la semaine: ${error.message}`
            )
          );
          return;
        }

        try {
          const cours = results.map((row) => this.mapRowToEntity(row));
          resolve(cours);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve les cours d'un participant avec limite optionnelle
   */
  async findForParticipant(participantId: number, limit?: number): Promise<Cours[]> {
    const limitValue = limit || 12;
    const query = `
      SELECT c.*
      FROM cours c
      INNER JOIN inscriptions i ON i.cours_id = c.id
      WHERE i.utilisateur_id = ?
        AND c.date_cours >= CURRENT_DATE
      ORDER BY c.date_cours ASC, c.heure_debut ASC
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [participantId, limitValue], (error, results: CoursRow[]) => {
        if (error) {
          reject(
            new Error(`Erreur lors de la recherche des cours du participant: ${error.message}`)
          );
          return;
        }

        try {
          const cours = results.map((row) => this.mapRowToEntity(row));
          resolve(cours);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve tous les cours
   */
  async findAll(): Promise<Cours[]> {
    const query = `
      SELECT * FROM cours
      ORDER BY date_cours ASC, heure_debut ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [], (error, results: CoursRow[]) => {
        if (error) {
          reject(new Error(`Erreur lors de la recherche de tous les cours: ${error.message}`));
          return;
        }

        try {
          const cours = results.map((row) => this.mapRowToEntity(row));
          resolve(cours);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Crée un nouveau cours
   */
  async save(cours: Cours): Promise<Cours> {
    const query = `
      INSERT INTO cours (
        date_cours, type_cours, heure_debut, heure_fin,
        cours_recurrent_id, annule, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      cours.dateCours,
      cours.typeCours,
      cours.horaire.getHeureDebut(),
      cours.horaire.getHeureFin(),
      cours.coursRecurrentId,
      cours.annule ? 1 : 0,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la création du cours: ${error.message}`));
          return;
        }

        // Récupérer le cours créé avec son ID
        this.findById(result.insertId)
          .then((createdCours) => {
            if (!createdCours) {
              reject(new Error('Cours créé mais non trouvé'));
              return;
            }
            resolve(createdCours);
          })
          .catch(reject);
      });
    });
  }

  /**
   * Met à jour un cours existant
   */
  async update(cours: Cours): Promise<Cours> {
    if (!cours.id) {
      throw new Error('Impossible de mettre à jour un cours sans ID');
    }

    const query = `
      UPDATE cours
      SET
        date_cours = ?,
        type_cours = ?,
        heure_debut = ?,
        heure_fin = ?,
        cours_recurrent_id = ?,
        annule = ?
      WHERE id = ?
    `;

    const params = [
      cours.dateCours,
      cours.typeCours,
      cours.horaire.getHeureDebut(),
      cours.horaire.getHeureFin(),
      cours.coursRecurrentId,
      cours.annule ? 1 : 0,
      cours.id,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la mise à jour du cours: ${error.message}`));
          return;
        }

        if (result.affectedRows === 0) {
          reject(new Error(`Cours avec l'ID ${cours.id} non trouvé`));
          return;
        }

        // Récupérer le cours mis à jour
        this.findById(cours.id!)
          .then((updatedCours) => {
            if (!updatedCours) {
              reject(new Error('Cours mis à jour mais non trouvé'));
              return;
            }
            resolve(updatedCours);
          })
          .catch(reject);
      });
    });
  }

  /**
   * Supprime un cours par son ID
   */
  async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM cours
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [id], (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la suppression du cours: ${error.message}`));
          return;
        }

        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Convertit une ligne de la base de données en entité Cours
   */
  private mapRowToEntity(row: CoursRow): Cours {
    try {
      // Créer le Value Object Horaire
      const horaire = Horaire.create(row.heure_debut, row.heure_fin);

      // Utiliser la factory method fromPersistence pour reconstruire l'entité
      return Cours.fromPersistence({
        id: row.id,
        dateCours: new Date(row.date_cours),
        typeCours: row.type_cours,
        horaire: horaire,
        coursRecurrentId: row.cours_recurrent_id,
        annule: row.annule === 1,
        createdAt: new Date(row.created_at),
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la conversion de la ligne DB en entité Cours: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }
}
