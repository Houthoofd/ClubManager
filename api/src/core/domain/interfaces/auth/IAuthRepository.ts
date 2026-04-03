import { User } from '../../entities/User.js';
import { Email } from '../../value-objects/auth/Email.js';
import { Password } from '../../value-objects/auth/Password.js';
import { AuthAttempt } from '@clubmanager/types';

/**
 * Interface du Repository Auth
 *
 * Cette interface définit le contrat pour la persistence des utilisateurs
 * et des opérations d'authentification.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface IAuthRepository {
  /**
   * Trouve un utilisateur par son email
   * @param email - Email de l'utilisateur (Value Object)
   * @returns L'utilisateur trouvé ou null
   */
  findUserByEmail(email: Email): Promise<User | null>;

  /**
   * Trouve un utilisateur par son ID
   * @param id - Identifiant de l'utilisateur
   * @returns L'utilisateur trouvé ou null
   */
  findUserById(id: number): Promise<User | null>;

  /**
   * Crée un nouveau compte utilisateur
   * @param data - Données de l'utilisateur à créer
   * @returns L'utilisateur créé avec son ID
   */
  createUser(data: {
    email: Email;
    password: Password;
    nom: string;
    prenom: string;
    telephone?: string;
    dateNaissance?: Date;
    adresse?: string;
    codePostal?: string;
    ville?: string;
  }): Promise<User>;

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param password - Nouveau mot de passe hashé (Value Object)
   * @returns Promesse vide une fois l'opération terminée
   */
  updatePassword(userId: number, password: Password): Promise<void>;

  /**
   * Vérifie si un email existe déjà dans le système
   * @param email - Email à vérifier (Value Object)
   * @returns true si l'email existe, false sinon
   */
  checkEmailExists(email: Email): Promise<boolean>;

  /**
   * Enregistre une tentative d'authentification pour l'audit
   * @param attempt - Données de la tentative d'authentification
   * @returns Promesse vide une fois l'opération terminée
   */
  recordAuthAttempt(attempt: AuthAttempt): Promise<void>;
}
