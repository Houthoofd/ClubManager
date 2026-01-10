/**
 * Repository d'écriture pour le module Informations
 * Contient toutes les méthodes de création, modification et suppression
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  Information,
  CreateInformationData,
  UpdateInformationData,
  InformationConfirmationResult,
} from '../types.js';

import {
  parseInformationRow,
  parseInformationRows,
} from '../utils/parsing.utils.js';

import {
  validateCreateInformationData,
  validateUpdateInformationData,
  sanitizeInformationData,
} from '../utils/validation.utils.js';

import * as queries from '../queries/index.js';

/**
 * Repository d'écriture pour les informations
 */
export class InformationsWriteRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // CRÉATION
  // ============================================================================

  /**
   * Créer une nouvelle information
   */
  async create(data: CreateInformationData): Promise<Information> {
    // Validation des données
    const validationErrors = validateCreateInformationData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    // Sanitization
    const sanitizedData = sanitizeInformationData(data);

    return new Promise((resolve, reject) => {
      const params = [
        sanitizedData.titre,
        sanitizedData.contenu,
        sanitizedData.slug,
        sanitizedData.status_id,
        sanitizedData.genre_id,
        sanitizedData.grade_id,
        sanitizedData.plan_tarifaire_id,
        sanitizedData.categorie_id,
        sanitizedData.prioritaire ? 1 : 0,
        sanitizedData.date_publication,
        sanitizedData.date_expiration || null,
        sanitizedData.auteur_id,
        sanitizedData.image_url || null,
        sanitizedData.lien_externe || null,
        sanitizedData.tags ? JSON.stringify(sanitizedData.tags) : null,
        sanitizedData.metadata ? JSON.stringify(sanitizedData.metadata) : null,
      ];

      this.mysqlConnector.query(queries.INSERT_INFORMATION, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          const insertId = results.insertId;
          // Récupérer l'information créée
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [insertId],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information créée mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Créer plusieurs informations en batch
   */
  async createBatch(dataArray: CreateInformationData[]): Promise<Information[]> {
    const createdInformations: Information[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const information = await this.create(dataArray[i]);
        createdInformations.push(information);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    if (errors.length > 0) {
      console.warn('Erreurs lors de la création batch:', errors);
    }

    return createdInformations;
  }

  // ============================================================================
  // MISE À JOUR
  // ============================================================================

  /**
   * Mettre à jour une information
   */
  async update(id: number, data: UpdateInformationData): Promise<Information> {
    // Validation des données
    const validationErrors = validateUpdateInformationData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    // Sanitization
    const sanitizedData = sanitizeInformationData(data);

    // Construction dynamique de la requête UPDATE
    const updateFields: string[] = [];
    const params: any[] = [];

    if (sanitizedData.titre !== undefined) {
      updateFields.push('titre = ?');
      params.push(sanitizedData.titre);
    }

    if (sanitizedData.contenu !== undefined) {
      updateFields.push('contenu = ?');
      params.push(sanitizedData.contenu);
    }

    if (sanitizedData.slug !== undefined) {
      updateFields.push('slug = ?');
      params.push(sanitizedData.slug);
    }

    if (sanitizedData.status_id !== undefined) {
      updateFields.push('status_id = ?');
      params.push(sanitizedData.status_id);
    }

    if (sanitizedData.genre_id !== undefined) {
      updateFields.push('genre_id = ?');
      params.push(sanitizedData.genre_id);
    }

    if (sanitizedData.grade_id !== undefined) {
      updateFields.push('grade_id = ?');
      params.push(sanitizedData.grade_id);
    }

    if (sanitizedData.plan_tarifaire_id !== undefined) {
      updateFields.push('plan_tarifaire_id = ?');
      params.push(sanitizedData.plan_tarifaire_id);
    }

    if (sanitizedData.categorie_id !== undefined) {
      updateFields.push('categorie_id = ?');
      params.push(sanitizedData.categorie_id);
    }

    if (sanitizedData.prioritaire !== undefined) {
      updateFields.push('prioritaire = ?');
      params.push(sanitizedData.prioritaire ? 1 : 0);
    }

    if (sanitizedData.date_publication !== undefined) {
      updateFields.push('date_publication = ?');
      params.push(sanitizedData.date_publication);
    }

    if (sanitizedData.date_expiration !== undefined) {
      updateFields.push('date_expiration = ?');
      params.push(sanitizedData.date_expiration);
    }

    if (sanitizedData.image_url !== undefined) {
      updateFields.push('image_url = ?');
      params.push(sanitizedData.image_url);
    }

    if (sanitizedData.lien_externe !== undefined) {
      updateFields.push('lien_externe = ?');
      params.push(sanitizedData.lien_externe);
    }

    if (sanitizedData.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(sanitizedData.tags ? JSON.stringify(sanitizedData.tags) : null);
    }

    if (sanitizedData.metadata !== undefined) {
      updateFields.push('metadata = ?');
      params.push(sanitizedData.metadata ? JSON.stringify(sanitizedData.metadata) : null);
    }

    if (updateFields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajout de la mise à jour automatique du champ updated_at
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const updateQuery = `
      UPDATE informations
      SET ${updateFields.join(', ')}
      WHERE id = ? AND actif = 1
    `;

    params.push(id);

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(updateQuery, params, (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée ou inactive`));
        } else {
          // Récupérer l'information mise à jour
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information mise à jour mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Mettre à jour partiellement une information
   */
  async patch(id: number, data: Partial<UpdateInformationData>): Promise<Information> {
    return this.update(id, data as UpdateInformationData);
  }

  // ============================================================================
  // SUPPRESSION
  // ============================================================================

  /**
   * Supprimer logiquement une information (soft delete)
   */
  async softDelete(id: number): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SOFT_DELETE_INFORMATION, [id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            success: false,
            message: `Information avec l'ID ${id} non trouvée`,
          });
        } else {
          resolve({
            success: true,
            message: 'Information supprimée avec succès (soft delete)',
          });
        }
      });
    });
  }

  /**
   * Supprimer définitivement une information (hard delete)
   */
  async delete(id: number): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.DELETE_INFORMATION, [id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            success: false,
            message: `Information avec l'ID ${id} non trouvée`,
          });
        } else {
          resolve({
            success: true,
            message: 'Information supprimée définitivement',
          });
        }
      });
    });
  }

  /**
   * Restaurer une information supprimée logiquement
   */
  async restore(id: number): Promise<Information> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.RESTORE_INFORMATION, [id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée`));
        } else {
          // Récupérer l'information restaurée
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information restaurée mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Supprimer en batch (soft delete)
   */
  async softDeleteBatch(ids: number[]): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      if (ids.length === 0) {
        resolve({
          success: false,
          message: 'Aucun ID fourni',
        });
        return;
      }

      const placeholders = ids.map(() => '?').join(',');
      const query = `
        UPDATE informations
        SET actif = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `;

      this.mysqlConnector.query(query, ids, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            success: true,
            message: `${results.affectedRows} information(s) supprimée(s)`,
          });
        }
      });
    });
  }

  // ============================================================================
  // ACTIONS SPÉCIFIQUES
  // ============================================================================

  /**
   * Publier une information
   */
  async publish(id: number): Promise<Information> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.PUBLISH_INFORMATION, [id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée`));
        } else {
          // Récupérer l'information publiée
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information publiée mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Archiver une information
   */
  async archive(id: number): Promise<Information> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.ARCHIVE_INFORMATION, [id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée`));
        } else {
          // Récupérer l'information archivée
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information archivée mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Mettre en brouillon une information
   */
  async draft(id: number): Promise<Information> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.DRAFT_INFORMATION, [id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée`));
        } else {
          // Récupérer l'information en brouillon
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information mise en brouillon mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Marquer une information comme prioritaire
   */
  async setPrioritaire(id: number, prioritaire: boolean): Promise<Information> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE informations
        SET prioritaire = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND actif = 1
      `;

      this.mysqlConnector.query(query, [prioritaire ? 1 : 0, id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée`));
        } else {
          // Récupérer l'information mise à jour
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information mise à jour mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Dupliquer une information
   */
  async duplicate(id: number, newTitre?: string): Promise<Information> {
    return new Promise((resolve, reject) => {
      // Récupérer l'information source
      this.mysqlConnector.query(
        queries.SELECT_INFORMATION_BY_ID,
        [id],
        async (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            reject(new Error(`Information avec l'ID ${id} non trouvée`));
          } else {
            const sourceInfo = parseInformationRow(results[0]);

            // Créer une copie
            const duplicateData: CreateInformationData = {
              titre: newTitre || `${sourceInfo.titre} (copie)`,
              contenu: sourceInfo.contenu,
              slug: `${sourceInfo.slug}-copie-${Date.now()}`,
              status_id: sourceInfo.status_id,
              genre_id: sourceInfo.genre_id,
              grade_id: sourceInfo.grade_id,
              plan_tarifaire_id: sourceInfo.plan_tarifaire_id,
              categorie_id: sourceInfo.categorie_id,
              prioritaire: false, // Par défaut, la copie n'est pas prioritaire
              date_publication: new Date(),
              auteur_id: sourceInfo.auteur_id,
              image_url: sourceInfo.image_url,
              lien_externe: sourceInfo.lien_externe,
              tags: sourceInfo.tags,
              metadata: sourceInfo.metadata,
            };

            try {
              const duplicated = await this.create(duplicateData);
              resolve(duplicated);
            } catch (err) {
              reject(err);
            }
          }
        }
      );
    });
  }

  /**
   * Mettre à jour les tags d'une information
   */
  async updateTags(id: number, tags: string[]): Promise<Information> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE informations
        SET tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND actif = 1
      `;

      this.mysqlConnector.query(query, [JSON.stringify(tags), id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée`));
        } else {
          // Récupérer l'information mise à jour
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information mise à jour mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }

  /**
   * Mettre à jour les métadonnées d'une information
   */
  async updateMetadata(id: number, metadata: Record<string, any>): Promise<Information> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE informations
        SET metadata = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND actif = 1
      `;

      this.mysqlConnector.query(query, [JSON.stringify(metadata), id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          reject(new Error(`Information avec l'ID ${id} non trouvée`));
        } else {
          // Récupérer l'information mise à jour
          this.mysqlConnector.query(
            queries.SELECT_INFORMATION_BY_ID,
            [id],
            (error, selectResults) => {
              if (error) {
                reject(error);
              } else if (selectResults.length === 0) {
                reject(new Error('Information mise à jour mais non retrouvée'));
              } else {
                resolve(parseInformationRow(selectResults[0]));
              }
            }
          );
        }
      });
    });
  }
}

// Singleton
let writeRepositoryInstance: InformationsWriteRepository | null = null;

export function getInformationsWriteRepository(): InformationsWriteRepository {
  if (!writeRepositoryInstance) {
    writeRepositoryInstance = new InformationsWriteRepository();
  }
  return writeRepositoryInstance;
}
