import { User, UserRole, UserStatus } from '../../../core/domain/entities/User.js';
import { Email } from '../../../core/domain/value-objects/Email.js';
import {
  IUserRepository,
  PaginationOptions,
  PaginatedResult,
  UserFilters,
} from '../../../core/domain/interfaces/IUserRepository.js';
import MysqlConnector from '../../../db/connector/mysqlconnector.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Interface pour les données brutes de la base de données
 */
interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  password_hash?: string;
  telephone?: string;
  date_naissance?: Date;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  role: string;
  status: string;
  email_verifie: number; // MySQL retourne 0 ou 1 pour boolean
  date_inscription: Date;
  derniere_connexion?: Date;
  photo_url?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Implémentation MySQL du UserRepository
 *
 * Cette classe implémente l'interface IUserRepository en utilisant MySQL
 * comme système de persistence. Elle est responsable de :
 * - La conversion entre les entités du domaine et les données de la DB
 * - L'exécution des requêtes SQL
 * - La gestion des erreurs de base de données
 *
 * Avantages de cette approche :
 * - Le domaine ne connaît pas MySQL (découplage)
 * - On peut facilement changer de DB (PostgreSQL, MongoDB, etc.)
 * - Les tests peuvent utiliser un mock de l'interface
 */
export class UserRepository implements IUserRepository {
  private db: MysqlConnector;

  constructor() {
    this.db = MysqlConnector.getInstance();
  }

  /**
   * Trouve un utilisateur par son ID
   */
  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT * FROM utilisateurs
      WHERE id = ? AND status != 'deleted'
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [id], (error, results: UserRow[]) => {
        if (error) {
          reject(new Error(`Erreur lors de la recherche de l'utilisateur: ${error.message}`));
          return;
        }

        if (!results || results.length === 0) {
          resolve(null);
          return;
        }

        try {
          const user = this.mapRowToEntity(results[0]);
          resolve(user);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve un utilisateur par son email
   */
  async findByEmail(email: Email): Promise<User | null> {
    const query = `
      SELECT * FROM utilisateurs
      WHERE email = ? AND status != 'deleted'
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [email.getValue()], (error, results: UserRow[]) => {
        if (error) {
          reject(new Error(`Erreur lors de la recherche par email: ${error.message}`));
          return;
        }

        if (!results || results.length === 0) {
          resolve(null);
          return;
        }

        try {
          const user = this.mapRowToEntity(results[0]);
          resolve(user);
        } catch (mappingError) {
          reject(mappingError);
        }
      });
    });
  }

  /**
   * Trouve tous les utilisateurs avec pagination
   */
  async findAll(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const offset = (options.page - 1) * options.limit;
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM utilisateurs WHERE status != 'deleted'`;
    const dataQuery = `
      SELECT * FROM utilisateurs
      WHERE status != 'deleted'
      ORDER BY ${this.sanitizeSortColumn(sortBy)} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    return new Promise((resolve, reject) => {
      // Récupérer le total
      this.db.query(countQuery, [], (countError, countResults: any[]) => {
        if (countError) {
          reject(new Error(`Erreur lors du comptage: ${countError.message}`));
          return;
        }

        const total = countResults[0].total;

        // Récupérer les données
        this.db.query(dataQuery, [options.limit, offset], (dataError, dataResults: UserRow[]) => {
          if (dataError) {
            reject(new Error(`Erreur lors de la récupération des données: ${dataError.message}`));
            return;
          }

          try {
            const users = dataResults.map((row) => this.mapRowToEntity(row));
            resolve({
              data: users,
              total,
              page: options.page,
              limit: options.limit,
              totalPages: Math.ceil(total / options.limit),
            });
          } catch (mappingError) {
            reject(mappingError);
          }
        });
      });
    });
  }

  /**
   * Trouve des utilisateurs selon des filtres
   */
  async findByFilters(
    filters: UserFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const offset = (options.page - 1) * options.limit;
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM utilisateurs ${whereClause}`;
    const dataQuery = `
      SELECT * FROM utilisateurs
      ${whereClause}
      ORDER BY ${this.sanitizeSortColumn(sortBy)} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(countQuery, params, (countError, countResults: any[]) => {
        if (countError) {
          reject(new Error(`Erreur lors du comptage filtré: ${countError.message}`));
          return;
        }

        const total = countResults[0].total;

        this.db.query(
          dataQuery,
          [...params, options.limit, offset],
          (dataError, dataResults: UserRow[]) => {
            if (dataError) {
              reject(new Error(`Erreur lors de la récupération filtrée: ${dataError.message}`));
              return;
            }

            try {
              const users = dataResults.map((row) => this.mapRowToEntity(row));
              resolve({
                data: users,
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
              });
            } catch (mappingError) {
              reject(mappingError);
            }
          }
        );
      });
    });
  }

  /**
   * Trouve des utilisateurs par rôle
   */
  async findByRole(
    role: UserRole,
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    return this.findByFilters({ role }, options);
  }

  /**
   * Trouve des utilisateurs par statut
   */
  async findByStatus(
    status: UserStatus,
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    return this.findByFilters({ status }, options);
  }

  /**
   * Trouve les utilisateurs sans email vérifié
   */
  async findUnverifiedEmails(options: PaginationOptions): Promise<PaginatedResult<User>> {
    return this.findByFilters({ emailVerifie: false }, options);
  }

  /**
   * Compte le nombre total d'utilisateurs
   */
  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as total FROM utilisateurs WHERE status != 'deleted'`;

    return new Promise((resolve, reject) => {
      this.db.query(query, [], (error, results: any[]) => {
        if (error) {
          reject(new Error(`Erreur lors du comptage: ${error.message}`));
          return;
        }
        resolve(results[0].total);
      });
    });
  }

  /**
   * Compte les utilisateurs selon des filtres
   */
  async countByFilters(filters: UserFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const query = `SELECT COUNT(*) as total FROM utilisateurs ${whereClause}`;

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error, results: any[]) => {
        if (error) {
          reject(new Error(`Erreur lors du comptage filtré: ${error.message}`));
          return;
        }
        resolve(results[0].total);
      });
    });
  }

  /**
   * Vérifie si un email existe déjà
   */
  async emailExists(email: Email, excludeUserId?: number): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM utilisateurs WHERE email = ? AND status != 'deleted'`;
    const params: any[] = [email.getValue()];

    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error, results: any[]) => {
        if (error) {
          reject(new Error(`Erreur lors de la vérification de l'email: ${error.message}`));
          return;
        }
        resolve(results[0].count > 0);
      });
    });
  }

  /**
   * Crée un nouvel utilisateur
   */
  async save(user: User): Promise<User> {
    const query = `
      INSERT INTO utilisateurs (
        email, nom, prenom, password_hash, telephone, date_naissance,
        adresse, code_postal, ville, role, status, email_verifie,
        date_inscription, photo_url, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      user.email.getValue(),
      user.nom,
      user.prenom,
      user.passwordHash,
      user.telephone || null,
      user.dateNaissance || null,
      user.adresse || null,
      user.codePostal || null,
      user.ville || null,
      user.role,
      user.status,
      user.emailVerifie ? 1 : 0,
      user.dateInscription,
      user.photoUrl || null,
      user.notes || null,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`));
          return;
        }

        // Récupérer l'utilisateur créé avec son ID
        this.findById(result.insertId)
          .then((createdUser) => {
            if (!createdUser) {
              reject(new Error('Utilisateur créé mais non trouvé'));
              return;
            }
            resolve(createdUser);
          })
          .catch(reject);
      });
    });
  }

  /**
   * Met à jour un utilisateur existant
   */
  async update(user: User): Promise<User> {
    if (!user.id) {
      throw new Error('Impossible de mettre à jour un utilisateur sans ID');
    }

    const query = `
      UPDATE utilisateurs SET
        email = ?,
        nom = ?,
        prenom = ?,
        password_hash = ?,
        telephone = ?,
        date_naissance = ?,
        adresse = ?,
        code_postal = ?,
        ville = ?,
        role = ?,
        status = ?,
        email_verifie = ?,
        derniere_connexion = ?,
        photo_url = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      user.email.getValue(),
      user.nom,
      user.prenom,
      user.passwordHash,
      user.telephone || null,
      user.dateNaissance || null,
      user.adresse || null,
      user.codePostal || null,
      user.ville || null,
      user.role,
      user.status,
      user.emailVerifie ? 1 : 0,
      user.derniereConnexion || null,
      user.photoUrl || null,
      user.notes || null,
      user.id,
    ];

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (error) => {
        if (error) {
          reject(new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`));
          return;
        }

        // Récupérer l'utilisateur mis à jour
        this.findById(user.id!)
          .then((updatedUser) => {
            if (!updatedUser) {
              reject(new Error('Utilisateur mis à jour mais non trouvé'));
              return;
            }
            resolve(updatedUser);
          })
          .catch(reject);
      });
    });
  }

  /**
   * Supprime définitivement un utilisateur
   */
  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM utilisateurs WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.query(query, [id], (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`));
          return;
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Suppression douce (marque comme deleted)
   */
  async softDelete(id: number): Promise<boolean> {
    const query = `UPDATE utilisateurs SET status = 'deleted', updated_at = NOW() WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.query(query, [id], (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la suppression douce: ${error.message}`));
          return;
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Recherche textuelle dans nom, prénom, email
   */
  async search(searchTerm: string, options: PaginationOptions): Promise<PaginatedResult<User>> {
    return this.findByFilters({ search: searchTerm }, options);
  }

  /**
   * Trouve les utilisateurs inactifs depuis X jours
   */
  async findInactiveUsers(
    days: number,
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    const offset = (options.page - 1) * options.limit;
    const sortBy = options.sortBy || 'derniere_connexion';
    const sortOrder = options.sortOrder || 'ASC';

    const countQuery = `
      SELECT COUNT(*) as total FROM utilisateurs
      WHERE status = 'actif'
        AND (derniere_connexion IS NULL OR derniere_connexion < DATE_SUB(NOW(), INTERVAL ? DAY))
    `;

    const dataQuery = `
      SELECT * FROM utilisateurs
      WHERE status = 'actif'
        AND (derniere_connexion IS NULL OR derniere_connexion < DATE_SUB(NOW(), INTERVAL ? DAY))
      ORDER BY ${this.sanitizeSortColumn(sortBy)} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(countQuery, [days], (countError, countResults: any[]) => {
        if (countError) {
          reject(new Error(`Erreur lors du comptage des inactifs: ${countError.message}`));
          return;
        }

        const total = countResults[0].total;

        this.db.query(
          dataQuery,
          [days, options.limit, offset],
          (dataError, dataResults: UserRow[]) => {
            if (dataError) {
              reject(new Error(`Erreur lors de la récupération des inactifs: ${dataError.message}`));
              return;
            }

            try {
              const users = dataResults.map((row) => this.mapRowToEntity(row));
              resolve({
                data: users,
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
              });
            } catch (mappingError) {
              reject(mappingError);
            }
          }
        );
      });
    });
  }

  /**
   * Trouve les utilisateurs inscrits dans une période
   */
  async findByRegistrationDateRange(
    dateDebut: Date,
    dateFin: Date,
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    const offset = (options.page - 1) * options.limit;
    const sortBy = options.sortBy || 'date_inscription';
    const sortOrder = options.sortOrder || 'DESC';

    const countQuery = `
      SELECT COUNT(*) as total FROM utilisateurs
      WHERE date_inscription BETWEEN ? AND ? AND status != 'deleted'
    `;

    const dataQuery = `
      SELECT * FROM utilisateurs
      WHERE date_inscription BETWEEN ? AND ? AND status != 'deleted'
      ORDER BY ${this.sanitizeSortColumn(sortBy)} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(countQuery, [dateDebut, dateFin], (countError, countResults: any[]) => {
        if (countError) {
          reject(new Error(`Erreur lors du comptage par période: ${countError.message}`));
          return;
        }

        const total = countResults[0].total;

        this.db.query(
          dataQuery,
          [dateDebut, dateFin, options.limit, offset],
          (dataError, dataResults: UserRow[]) => {
            if (dataError) {
              reject(new Error(`Erreur lors de la récupération par période: ${dataError.message}`));
              return;
            }

            try {
              const users = dataResults.map((row) => this.mapRowToEntity(row));
              resolve({
                data: users,
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
              });
            } catch (mappingError) {
              reject(mappingError);
            }
          }
        );
      });
    });
  }

  /**
   * Met à jour le mot de passe
   */
  async updatePassword(userId: number, newPasswordHash: string): Promise<boolean> {
    const query = `UPDATE utilisateurs SET password_hash = ?, updated_at = NOW() WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.query(query, [newPasswordHash, userId], (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la mise à jour du mot de passe: ${error.message}`));
          return;
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Met à jour la dernière connexion
   */
  async updateLastLogin(userId: number): Promise<boolean> {
    const query = `UPDATE utilisateurs SET derniere_connexion = NOW(), updated_at = NOW() WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.query(query, [userId], (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la mise à jour de la connexion: ${error.message}`));
          return;
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Met à jour le statut de vérification de l'email
   */
  async updateEmailVerification(userId: number, verified: boolean): Promise<boolean> {
    const query = `UPDATE utilisateurs SET email_verifie = ?, updated_at = NOW() WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.query(query, [verified ? 1 : 0, userId], (error, result: ResultSetHeader) => {
        if (error) {
          reject(new Error(`Erreur lors de la mise à jour de la vérification: ${error.message}`));
          return;
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Exécute une transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // Note: Implémentation basique. Une vraie implémentation nécessiterait
    // un meilleur support des transactions dans MysqlConnector
    try {
      const result = await callback();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // ============== MÉTHODES PRIVÉES ==============

  /**
   * Mappe une ligne de la DB vers une entité User
   */
  private mapRowToEntity(row: UserRow): User {
    return User.fromPersistence({
      id: row.id,
      email: new Email(row.email),
      nom: row.nom,
      prenom: row.prenom,
      passwordHash: row.password_hash,
      telephone: row.telephone,
      dateNaissance: row.date_naissance,
      adresse: row.adresse,
      codePostal: row.code_postal,
      ville: row.ville,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      emailVerifie: row.email_verifie === 1,
      dateInscription: row.date_inscription,
      derniereConnexion: row.derniere_connexion,
      photoUrl: row.photo_url,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Construit une clause WHERE à partir des filtres
   */
  private buildWhereClause(filters: UserFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = ["status != 'deleted'"];
    const params: any[] = [];

    if (filters.role) {
      conditions.push('role = ?');
      params.push(filters.role);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.emailVerifie !== undefined) {
      conditions.push('email_verifie = ?');
      params.push(filters.emailVerifie ? 1 : 0);
    }

    if (filters.search) {
      conditions.push('(nom LIKE ? OR prenom LIKE ? OR email LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters.dateInscriptionDebut) {
      conditions.push('date_inscription >= ?');
      params.push(filters.dateInscriptionDebut);
    }

    if (filters.dateInscriptionFin) {
      conditions.push('date_inscription <= ?');
      params.push(filters.dateInscriptionFin);
    }

    if (filters.ville) {
      conditions.push('ville = ?');
      params.push(filters.ville);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { whereClause, params };
  }

  /**
   * Sécurise les noms de colonnes pour le tri (évite les injections SQL)
   */
  private sanitizeSortColumn(column: string): string {
    const allowedColumns = [
      'id',
      'email',
      'nom',
      'prenom',
      'role',
      'status',
      'date_inscription',
      'derniere_connexion',
      'created_at',
      'updated_at',
    ];

    if (allowedColumns.includes(column)) {
      return column;
    }

    // Par défaut, trier par date de création
    return 'created_at';
  }
}
