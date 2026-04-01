import { Inscription } from '../entities/Inscription.js';

/**
 * Interface du Repository Inscription
 *
 * Cette interface définit le contrat pour la persistence des inscriptions.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface IInscriptionRepository {
  /**
   * Trouve une inscription par son ID
   * @param id - Identifiant de l'inscription
   * @returns L'inscription trouvée ou null
   */
  findById(id: number): Promise<Inscription | null>;

  /**
   * Trouve toutes les inscriptions pour un cours spécifique
   * @param coursId - Identifiant du cours
   * @returns Liste des inscriptions pour ce cours
   */
  findByCours(coursId: number): Promise<Inscription[]>;

  /**
   * Trouve toutes les inscriptions d'un utilisateur
   * @param utilisateurId - Identifiant de l'utilisateur
   * @returns Liste des inscriptions de cet utilisateur
   */
  findByUtilisateur(utilisateurId: number): Promise<Inscription[]>;

  /**
   * Trouve une inscription spécifique pour un cours et un utilisateur
   * @param coursId - Identifiant du cours
   * @param utilisateurId - Identifiant de l'utilisateur
   * @returns L'inscription trouvée ou null
   */
  findByCoursAndUtilisateur(coursId: number, utilisateurId: number): Promise<Inscription | null>;

  /**
   * Crée une nouvelle inscription
   * @param inscription - Entité inscription à créer
   * @returns L'inscription créée avec son ID
   */
  save(inscription: Inscription): Promise<Inscription>;

  /**
   * Met à jour une inscription existante
   * @param inscription - Entité inscription à mettre à jour
   * @returns L'inscription mise à jour
   */
  update(inscription: Inscription): Promise<Inscription>;

  /**
   * Supprime une inscription par son ID
   * @param id - Identifiant de l'inscription à supprimer
   * @returns true si la suppression a réussi, false sinon
   */
  delete(id: number): Promise<boolean>;
}
