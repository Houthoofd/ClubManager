import { Inscription, StatusInscription } from '../../../core/domain/entities/Inscription.js';
import { IInscriptionRepository } from '../../../core/domain/interfaces/IInscriptionRepository.js';
import MysqlConnector from '../../../db/connector/mysqlconnector.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Interface pour les données brutes de la base de données
 */
interface InscriptionRow extends RowDataPacket {
  id: number;
  cours_id: number;
  utilisateur_id: number;
  is_present: number | null; // MySQL retourne 0 ou 1 pour boolean, ou NULL
  is_validate: number | null; // MySQL retourne 0 ou 1 pour boolean, ou NULL
  status: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Implémentation MySQL du InscriptionRepository
 *
 * Cette classe implémente l'interface IInscriptionRepository en utilisant MySQL
 * comme système de persistence. Elle est responsable de :
 * - La conversion entre les entités du domaine et les données de la DB
 * - L'exécution des requêtes SQL
 * - La gestion des erreurs de base de données
 */
export class InscriptionRepository implements IInscriptionRepository {
  private db: MysqlConnector;

  constructor() {
    this.db = MysqlConnector.getInstance();
  }

  /**
   * Trouve une inscription par son ID
   */
  async findById(id: number): Promise<Inscription | null> {
    const query = `
      SELECT * FROM inscriptions
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [id], (error, results: InscriptionRow[]) => {
        if (error) {
          reject(new Error(`Erreur lors de la recherche de l'inscription: ${error.message}`));
          return;
        }

        if (!results || results.length === 0) {
          resolve(null);
          return;
        }

        try {
          const inscription = this.mapRowToEntity(results[0]);
          resolve(inscription);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve toutes les inscriptions pour un cours spécifique
   */
  async findByCours(coursId: number): Promise<Inscription[]> {
    const query = `
      SELECT * FROM inscriptions
      WHERE cours_id = ?
      ORDER BY created_at ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [coursId], (error, results: InscriptionRow[]) => {
        if (error) {
          reject(
            new Error(`Erreur lors de la recherche des inscriptions par cours: ${error.message}`)
          );
          return;
        }

        try {
          const inscriptions = results.map((row) => this.mapRowToEntity(row));
          resolve(inscriptions);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve toutes les inscriptions d'un utilisateur
   */
  async findByUtilisateur(utilisateurId: number): Promise<Inscription[]> {
    const query = `
      SELECT * FROM inscriptions
      WHERE utilisateur_id = ?
      ORDER BY created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [utilisateurId], (error, results: InscriptionRow[]) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la recherche des inscriptions par utilisateur: ${error.message}`
            )
          );
          return;
        }

        try {
          const inscriptions = results.map((row) => this.mapRowToEntity(row));
          resolve(inscriptions);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve une inscription spécifique pour un cours et un utilisateur
   */
  async findByCoursAndUtilisateur(
    coursId: number,
    utilisateurId: number
  ): Promise<Inscription | null> {
    const query = `
      SELECT * FROM inscriptions
      WHERE cours_id = ? AND utilisateur_id = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [coursId, utilisateurId], (error, results: InscriptionRow[]) => {
        if (error) {
          reject(
            new Error(
              `Erreur lors de la recherche de l'inscription par cours et utilisateur: ${error.message}`
            )
          );
          return;
        }

        if (!results || results.length === 0) {
          resolve(null);
          return;
        }

        try {
          const inscription = this.mapRowToEntity(results[0]);
          resolve(inscription);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Crée une nouvelle inscription
   */
  async save(inscription: Inscription): Promise<Inscription> {
    const query = `
      INSERT INTO inscriptions (
        cours_id, utilisateur_id, is_present, is_validate,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      inscription.cours_id,
      inscription.utilisateur_id,
      inscription.is_present === null ? null : inscription.is_present ? 1 : 0,
      inscription.is_validate === null ? null : inscription.is_validate ? 1 : 0,
      inscription.status,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la création de l'inscription: ${error.message}`));
          return;
        }

        // Récupérer l'inscription créée avec son ID
        this.findById(result.insertId)
          .then((createdInscription) => {
            if (!createdInscription) {
              reject(new Error('Inscription créée mais non trouvée'));
              return;
            }
            resolve(createdInscription);
          })
          .catch(reject);
      });
    });
  }

  /**
   * Met à jour une inscription existante
   */
  async update(inscription: Inscription): Promise<Inscription> {
    if (!inscription.id) {
      throw new Error('Impossible de mettre à jour une inscription sans ID');
    }

    const query = `
      UPDATE inscriptions
      SET
        cours_id = ?,
        utilisateur_id = ?,
        is_present = ?,
        is_validate = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      inscription.cours_id,
      inscription.utilisateur_id,
      inscription.is_present === null ? null : inscription.is_present ? 1 : 0,
      inscription.is_validate === null ? null : inscription.is_validate ? 1 : 0,
      inscription.status,
      inscription.id,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la mise à jour de l'inscription: ${error.message}`));
          return;
        }

        if (result.affectedRows === 0) {
          reject(new Error(`Inscription avec l'ID ${inscription.id} non trouvée`));
          return;
        }

        // Récupérer l'inscription mise à jour
        this.findById(inscription.id!)
          .then((updatedInscription) => {
            if (!updatedInscription) {
              reject(new Error('Inscription mise à jour mais non trouvée'));
              return;
            }
            resolve(updatedInscription);
          })
          .catch(reject);
      });
    });
  }

  /**
   * Supprime une inscription par son ID
   */
  async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM inscriptions
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [id], (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la suppression de l'inscription: ${error.message}`));
          return;
        }

        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Convertit une ligne de la base de données en entité Inscription
   */
  private mapRowToEntity(row: InscriptionRow): Inscription {
    try {
      // Convertir les valeurs MySQL (0, 1, NULL) en boolean | null
      const isPresent =
        row.is_present === null ? null : row.is_present === 1 ? true : false;
      const isValidate =
        row.is_validate === null ? null : row.is_validate === 1 ? true : false;

      // Valider et convertir le status
      const status = this.mapStatusFromDB(row.status);

      // Utiliser la factory method fromPersistence pour reconstruire l'entité
      return Inscription.fromPersistence({
        id: row.id,
        cours_id: row.cours_id,
        utilisateur_id: row.utilisateur_id,
        is_present: isPresent,
        is_validate: isValidate,
        status: status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la conversion de la ligne DB en entité Inscription: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  /**
   * Convertit le status de la DB en enum StatusInscription
   */
  private mapStatusFromDB(status: string): StatusInscription {
    // Normaliser le status (lowercase, trim)
    const normalizedStatus = status.trim().toLowerCase();

    // Mapper vers l'enum
    switch (normalizedStatus) {
      case 'en_attente':
        return StatusInscription.EN_ATTENTE;
      case 'confirmee':
        return StatusInscription.CONFIRMEE;
      case 'annulee':
        return StatusInscription.ANNULEE;
      case 'presente':
        return StatusInscription.PRESENTE;
      case 'absente':
        return StatusInscription.ABSENTE;
      default:
        // Par défaut, retourner EN_ATTENTE pour les statuts inconnus
        console.warn(`Status d'inscription inconnu: ${status}, utilisation de EN_ATTENTE par défaut`);
        return StatusInscription.EN_ATTENTE;
    }
  }
}
