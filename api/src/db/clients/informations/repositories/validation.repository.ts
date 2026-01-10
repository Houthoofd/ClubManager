/**
 * Repository de validation pour le module Informations
 * Contient toutes les méthodes de validation et vérification
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  Information,
  InformationValidationResult,
} from '../types.js';

import * as queries from '../queries/index.js';

/**
 * Repository de validation pour les informations
 */
export class InformationsValidationRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // VÉRIFICATIONS D'EXISTENCE
  // ============================================================================

  /**
   * Vérifier si une information existe
   */
  async exists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.CHECK_INFORMATION_EXISTS, [id], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si une information existe et est active
   */
  async existsAndActive(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.CHECK_INFORMATION_EXISTS_AND_ACTIVE, [id], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un slug existe déjà
   */
  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = excludeId
        ? queries.CHECK_SLUG_EXISTS_EXCLUDE_ID
        : queries.CHECK_SLUG_EXISTS;
      const params = excludeId ? [slug, excludeId] : [slug];

      this.mysqlConnector.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un titre existe déjà
   */
  async titreExists(titre: string, excludeId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = excludeId
        ? queries.CHECK_TITRE_EXISTS_EXCLUDE_ID
        : queries.CHECK_TITRE_EXISTS;
      const params = excludeId ? [titre, excludeId] : [titre];

      this.mysqlConnector.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  // ============================================================================
  // VALIDATION DES RELATIONS
  // ============================================================================

  /**
   * Vérifier si un statut existe
   */
  async statusExists(statusId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.CHECK_STATUS_EXISTS, [statusId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un genre existe
   */
  async genreExists(genreId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.CHECK_GENRE_EXISTS, [genreId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un grade existe
   */
  async gradeExists(gradeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.CHECK_GRADE_EXISTS, [gradeId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un plan tarifaire existe
   */
  async planTarifaireExists(planId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.CHECK_PLAN_TARIFAIRE_EXISTS, [planId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si une catégorie existe
   */
  async categorieExists(categorieId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.CHECK_CATEGORIE_EXISTS, [categorieId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un auteur (utilisateur) existe
   */
  async auteurExists(auteurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as exists
        FROM utilisateurs
        WHERE id = ?
      `;

      this.mysqlConnector.query(query, [auteurId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.exists > 0);
        }
      });
    });
  }

  // ============================================================================
  // VALIDATION COMPLÈTE
  // ============================================================================

  /**
   * Valider toutes les relations d'une information
   */
  async validateRelations(data: {
    status_id?: number;
    genre_id?: number;
    grade_id?: number;
    plan_tarifaire_id?: number;
    categorie_id?: number;
    auteur_id?: number;
  }): Promise<InformationValidationResult> {
    const errors: string[] = [];

    try {
      if (data.status_id !== undefined) {
        const statusValid = await this.statusExists(data.status_id);
        if (!statusValid) {
          errors.push(`Statut avec l'ID ${data.status_id} n'existe pas`);
        }
      }

      if (data.genre_id !== undefined) {
        const genreValid = await this.genreExists(data.genre_id);
        if (!genreValid) {
          errors.push(`Genre avec l'ID ${data.genre_id} n'existe pas`);
        }
      }

      if (data.grade_id !== undefined) {
        const gradeValid = await this.gradeExists(data.grade_id);
        if (!gradeValid) {
          errors.push(`Grade avec l'ID ${data.grade_id} n'existe pas`);
        }
      }

      if (data.plan_tarifaire_id !== undefined) {
        const planValid = await this.planTarifaireExists(data.plan_tarifaire_id);
        if (!planValid) {
          errors.push(`Plan tarifaire avec l'ID ${data.plan_tarifaire_id} n'existe pas`);
        }
      }

      if (data.categorie_id !== undefined) {
        const categorieValid = await this.categorieExists(data.categorie_id);
        if (!categorieValid) {
          errors.push(`Catégorie avec l'ID ${data.categorie_id} n'existe pas`);
        }
      }

      if (data.auteur_id !== undefined) {
        const auteurValid = await this.auteurExists(data.auteur_id);
        if (!auteurValid) {
          errors.push(`Auteur avec l'ID ${data.auteur_id} n'existe pas`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Erreur lors de la validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
      };
    }
  }

  /**
   * Valider l'unicité du slug
   */
  async validateSlugUniqueness(slug: string, excludeId?: number): Promise<InformationValidationResult> {
    try {
      const exists = await this.slugExists(slug, excludeId);
      return {
        valid: !exists,
        errors: exists ? [`Le slug "${slug}" est déjà utilisé`] : [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Erreur lors de la validation du slug: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
      };
    }
  }

  /**
   * Valider l'unicité du titre
   */
  async validateTitreUniqueness(titre: string, excludeId?: number): Promise<InformationValidationResult> {
    try {
      const exists = await this.titreExists(titre, excludeId);
      return {
        valid: !exists,
        errors: exists ? [`Le titre "${titre}" est déjà utilisé`] : [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Erreur lors de la validation du titre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
      };
    }
  }

  // ============================================================================
  // VALIDATION DES DATES
  // ============================================================================

  /**
   * Valider les dates d'une information
   */
  validateDates(datePublication?: Date, dateExpiration?: Date | null): InformationValidationResult {
    const errors: string[] = [];

    if (datePublication && dateExpiration) {
      if (datePublication >= dateExpiration) {
        errors.push('La date de publication doit être antérieure à la date d\'expiration');
      }
    }

    if (dateExpiration) {
      const now = new Date();
      if (dateExpiration < now) {
        errors.push('La date d\'expiration ne peut pas être dans le passé');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // VALIDATION DU CONTENU
  // ============================================================================

  /**
   * Valider le contenu d'une information
   */
  validateContent(titre?: string, contenu?: string, slug?: string): InformationValidationResult {
    const errors: string[] = [];

    if (titre !== undefined) {
      if (!titre || titre.trim().length === 0) {
        errors.push('Le titre est requis');
      } else if (titre.length < 3) {
        errors.push('Le titre doit contenir au moins 3 caractères');
      } else if (titre.length > 255) {
        errors.push('Le titre ne peut pas dépasser 255 caractères');
      }
    }

    if (contenu !== undefined) {
      if (!contenu || contenu.trim().length === 0) {
        errors.push('Le contenu est requis');
      } else if (contenu.length < 10) {
        errors.push('Le contenu doit contenir au moins 10 caractères');
      } else if (contenu.length > 65535) {
        errors.push('Le contenu est trop long (maximum 65535 caractères)');
      }
    }

    if (slug !== undefined) {
      if (!slug || slug.trim().length === 0) {
        errors.push('Le slug est requis');
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.push('Le slug doit être en minuscules, contenir uniquement des lettres, chiffres et tirets');
      } else if (slug.length > 255) {
        errors.push('Le slug ne peut pas dépasser 255 caractères');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valider une URL
   */
  validateUrl(url?: string): InformationValidationResult {
    const errors: string[] = [];

    if (url && url.trim().length > 0) {
      try {
        new URL(url);
      } catch {
        errors.push('L\'URL fournie n\'est pas valide');
      }

      if (url.length > 2048) {
        errors.push('L\'URL est trop longue (maximum 2048 caractères)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valider les tags
   */
  validateTags(tags?: string[]): InformationValidationResult {
    const errors: string[] = [];

    if (tags) {
      if (!Array.isArray(tags)) {
        errors.push('Les tags doivent être un tableau');
      } else {
        if (tags.length > 20) {
          errors.push('Maximum 20 tags autorisés');
        }

        for (const tag of tags) {
          if (typeof tag !== 'string') {
            errors.push('Tous les tags doivent être des chaînes de caractères');
            break;
          }
          if (tag.length > 50) {
            errors.push(`Le tag "${tag}" est trop long (maximum 50 caractères)`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // VALIDATION COMPLÈTE D'UNE INFORMATION
  // ============================================================================

  /**
   * Validation complète pour la création d'une information
   */
  async validateForCreation(data: {
    titre: string;
    contenu: string;
    slug: string;
    status_id: number;
    genre_id: number;
    grade_id: number;
    plan_tarifaire_id: number;
    categorie_id: number;
    auteur_id: number;
    date_publication?: Date;
    date_expiration?: Date | null;
    image_url?: string;
    lien_externe?: string;
    tags?: string[];
  }): Promise<InformationValidationResult> {
    const allErrors: string[] = [];

    // Validation du contenu
    const contentValidation = this.validateContent(data.titre, data.contenu, data.slug);
    allErrors.push(...contentValidation.errors);

    // Validation des dates
    const datesValidation = this.validateDates(data.date_publication, data.date_expiration);
    allErrors.push(...datesValidation.errors);

    // Validation des URLs
    if (data.image_url) {
      const imageUrlValidation = this.validateUrl(data.image_url);
      allErrors.push(...imageUrlValidation.errors);
    }

    if (data.lien_externe) {
      const lienExterneValidation = this.validateUrl(data.lien_externe);
      allErrors.push(...lienExterneValidation.errors);
    }

    // Validation des tags
    if (data.tags) {
      const tagsValidation = this.validateTags(data.tags);
      allErrors.push(...tagsValidation.errors);
    }

    // Validation des relations (async)
    const relationsValidation = await this.validateRelations({
      status_id: data.status_id,
      genre_id: data.genre_id,
      grade_id: data.grade_id,
      plan_tarifaire_id: data.plan_tarifaire_id,
      categorie_id: data.categorie_id,
      auteur_id: data.auteur_id,
    });
    allErrors.push(...relationsValidation.errors);

    // Validation de l'unicité du slug
    const slugValidation = await this.validateSlugUniqueness(data.slug);
    allErrors.push(...slugValidation.errors);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Validation complète pour la mise à jour d'une information
   */
  async validateForUpdate(
    id: number,
    data: Partial<{
      titre: string;
      contenu: string;
      slug: string;
      status_id: number;
      genre_id: number;
      grade_id: number;
      plan_tarifaire_id: number;
      categorie_id: number;
      date_publication: Date;
      date_expiration: Date | null;
      image_url: string;
      lien_externe: string;
      tags: string[];
    }>
  ): Promise<InformationValidationResult> {
    const allErrors: string[] = [];

    // Vérifier que l'information existe
    const exists = await this.existsAndActive(id);
    if (!exists) {
      return {
        valid: false,
        errors: [`Information avec l'ID ${id} non trouvée ou inactive`],
      };
    }

    // Validation du contenu (si fourni)
    if (data.titre !== undefined || data.contenu !== undefined || data.slug !== undefined) {
      const contentValidation = this.validateContent(data.titre, data.contenu, data.slug);
      allErrors.push(...contentValidation.errors);
    }

    // Validation des dates (si fournies)
    if (data.date_publication !== undefined || data.date_expiration !== undefined) {
      const datesValidation = this.validateDates(data.date_publication, data.date_expiration);
      allErrors.push(...datesValidation.errors);
    }

    // Validation des URLs
    if (data.image_url !== undefined) {
      const imageUrlValidation = this.validateUrl(data.image_url);
      allErrors.push(...imageUrlValidation.errors);
    }

    if (data.lien_externe !== undefined) {
      const lienExterneValidation = this.validateUrl(data.lien_externe);
      allErrors.push(...lienExterneValidation.errors);
    }

    // Validation des tags
    if (data.tags !== undefined) {
      const tagsValidation = this.validateTags(data.tags);
      allErrors.push(...tagsValidation.errors);
    }

    // Validation des relations (async)
    const relationsData: any = {};
    if (data.status_id !== undefined) relationsData.status_id = data.status_id;
    if (data.genre_id !== undefined) relationsData.genre_id = data.genre_id;
    if (data.grade_id !== undefined) relationsData.grade_id = data.grade_id;
    if (data.plan_tarifaire_id !== undefined) relationsData.plan_tarifaire_id = data.plan_tarifaire_id;
    if (data.categorie_id !== undefined) relationsData.categorie_id = data.categorie_id;

    if (Object.keys(relationsData).length > 0) {
      const relationsValidation = await this.validateRelations(relationsData);
      allErrors.push(...relationsValidation.errors);
    }

    // Validation de l'unicité du slug (si modifié)
    if (data.slug !== undefined) {
      const slugValidation = await this.validateSlugUniqueness(data.slug, id);
      allErrors.push(...slugValidation.errors);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Vérifier si un utilisateur peut modifier une information
   */
  async canUserEdit(userId: number, informationId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          (i.auteur_id = ? OR u.role = 'admin') as can_edit
        FROM informations i
        CROSS JOIN utilisateurs u
        WHERE i.id = ? AND u.id = ? AND i.actif = 1
      `;

      this.mysqlConnector.query(query, [userId, informationId, userId], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve(false);
        } else {
          resolve(results[0]?.can_edit === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un utilisateur peut supprimer une information
   */
  async canUserDelete(userId: number, informationId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          (i.auteur_id = ? OR u.role = 'admin') as can_delete
        FROM informations i
        CROSS JOIN utilisateurs u
        WHERE i.id = ? AND u.id = ? AND i.actif = 1
      `;

      this.mysqlConnector.query(query, [userId, informationId, userId], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve(false);
        } else {
          resolve(results[0]?.can_delete === 1);
        }
      });
    });
  }

  /**
   * Vérifier si un utilisateur est admin
   */
  async isUserAdmin(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT role
        FROM utilisateurs
        WHERE id = ?
      `;

      this.mysqlConnector.query(query, [userId], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve(false);
        } else {
          resolve(results[0]?.role === 'admin');
        }
      });
    });
  }
}

// Singleton
let validationRepositoryInstance: InformationsValidationRepository | null = null;

export function getInformationsValidationRepository(): InformationsValidationRepository {
  if (!validationRepositoryInstance) {
    validationRepositoryInstance = new InformationsValidationRepository();
  }
  return validationRepositoryInstance;
}
