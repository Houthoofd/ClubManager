import { User, UserRole, UserStatus } from '../entities/User.js';
import { Email } from '../value-objects/Email.js';

/**
 * Options de pagination pour les requêtes
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Filtres de recherche pour les utilisateurs
 */
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  emailVerifie?: boolean;
  search?: string; // Recherche dans nom, prénom, email
  dateInscriptionDebut?: Date;
  dateInscriptionFin?: Date;
  ville?: string;
}

/**
 * Interface du Repository User
 *
 * Cette interface définit le contrat pour la persistence des utilisateurs.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface IUserRepository {
  /**
   * Trouve un utilisateur par son ID
   * @param id - Identifiant de l'utilisateur
   * @returns L'utilisateur trouvé ou null
   */
  findById(id: number): Promise<User | null>;

  /**
   * Trouve un utilisateur par son email
   * @param email - Email de l'utilisateur
   * @returns L'utilisateur trouvé ou null
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Trouve tous les utilisateurs avec pagination
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs
   */
  findAll(options: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Trouve des utilisateurs selon des critères de filtrage
   * @param filters - Critères de filtrage
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs filtrés
   */
  findByFilters(
    filters: UserFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<User>>;

  /**
   * Trouve des utilisateurs par leur rôle
   * @param role - Rôle recherché
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs avec ce rôle
   */
  findByRole(role: UserRole, options: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Trouve des utilisateurs par leur statut
   * @param status - Statut recherché
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs avec ce statut
   */
  findByStatus(status: UserStatus, options: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Trouve des utilisateurs dont l'email n'a pas été vérifié
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs sans email vérifié
   */
  findUnverifiedEmails(options: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Compte le nombre total d'utilisateurs
   * @returns Le nombre total d'utilisateurs
   */
  count(): Promise<number>;

  /**
   * Compte le nombre d'utilisateurs selon des filtres
   * @param filters - Critères de filtrage
   * @returns Le nombre d'utilisateurs correspondant aux filtres
   */
  countByFilters(filters: UserFilters): Promise<number>;

  /**
   * Vérifie si un email existe déjà
   * @param email - Email à vérifier
   * @param excludeUserId - ID utilisateur à exclure (pour les mises à jour)
   * @returns true si l'email existe, false sinon
   */
  emailExists(email: Email, excludeUserId?: number): Promise<boolean>;

  /**
   * Crée un nouvel utilisateur
   * @param user - Entité utilisateur à créer
   * @returns L'utilisateur créé avec son ID
   */
  save(user: User): Promise<User>;

  /**
   * Met à jour un utilisateur existant
   * @param user - Entité utilisateur à mettre à jour
   * @returns L'utilisateur mis à jour
   */
  update(user: User): Promise<User>;

  /**
   * Supprime un utilisateur par son ID
   * @param id - Identifiant de l'utilisateur à supprimer
   * @returns true si la suppression a réussi, false sinon
   */
  delete(id: number): Promise<boolean>;

  /**
   * Suppression douce (soft delete) - marque l'utilisateur comme inactif
   * @param id - Identifiant de l'utilisateur
   * @returns true si la suppression douce a réussi, false sinon
   */
  softDelete(id: number): Promise<boolean>;

  /**
   * Recherche des utilisateurs par nom ou prénom (recherche textuelle)
   * @param searchTerm - Terme de recherche
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs correspondants
   */
  search(searchTerm: string, options: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Trouve les utilisateurs inactifs depuis un certain nombre de jours
   * @param days - Nombre de jours d'inactivité
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs inactifs
   */
  findInactiveUsers(days: number, options: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Trouve les utilisateurs inscrits dans une période donnée
   * @param dateDebut - Date de début
   * @param dateFin - Date de fin
   * @param options - Options de pagination
   * @returns Résultat paginé des utilisateurs inscrits dans cette période
   */
  findByRegistrationDateRange(
    dateDebut: Date,
    dateFin: Date,
    options: PaginationOptions
  ): Promise<PaginatedResult<User>>;

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param newPasswordHash - Nouveau hash du mot de passe
   * @returns true si la mise à jour a réussi
   */
  updatePassword(userId: number, newPasswordHash: string): Promise<boolean>;

  /**
   * Met à jour la date de dernière connexion
   * @param userId - ID de l'utilisateur
   * @returns true si la mise à jour a réussi
   */
  updateLastLogin(userId: number): Promise<boolean>;

  /**
   * Met à jour le statut de vérification de l'email
   * @param userId - ID de l'utilisateur
   * @param verified - Statut de vérification
   * @returns true si la mise à jour a réussi
   */
  updateEmailVerification(userId: number, verified: boolean): Promise<boolean>;

  /**
   * Exécute une transaction (pour les opérations complexes nécessitant l'atomicité)
   * @param callback - Fonction contenant les opérations à exécuter dans la transaction
   * @returns Le résultat de la transaction
   */
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}
