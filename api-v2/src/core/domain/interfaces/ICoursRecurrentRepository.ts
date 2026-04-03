import { CoursRecurrent } from '../entities/CoursRecurrent.js';

/**
 * Interface du Repository CoursRecurrent
 *
 * Cette interface définit le contrat pour la persistence des cours récurrents.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface ICoursRecurrentRepository {
  /**
   * Trouve un cours récurrent par son ID
   * @param id - Identifiant du cours récurrent
   * @returns Le cours récurrent trouvé ou null
   */
  findById(id: number): Promise<CoursRecurrent | null>;

  /**
   * Trouve tous les cours récurrents pour un jour de la semaine spécifique
   * @param jour - Jour de la semaine (1-7, où 1 = Lundi, 7 = Dimanche)
   * @returns Liste des cours récurrents pour ce jour
   */
  findByJourSemaine(jour: number): Promise<CoursRecurrent[]>;

  /**
   * Trouve tous les cours récurrents
   * @returns Liste de tous les cours récurrents
   */
  findAll(): Promise<CoursRecurrent[]>;

  /**
   * Trouve tous les cours récurrents actifs
   * @returns Liste des cours récurrents actifs uniquement
   */
  findActive(): Promise<CoursRecurrent[]>;

  /**
   * Crée un nouveau cours récurrent
   * @param coursRecurrent - Entité cours récurrent à créer
   * @returns Le cours récurrent créé avec son ID
   */
  save(coursRecurrent: CoursRecurrent): Promise<CoursRecurrent>;

  /**
   * Met à jour un cours récurrent existant
   * @param coursRecurrent - Entité cours récurrent à mettre à jour
   * @returns Le cours récurrent mis à jour
   */
  update(coursRecurrent: CoursRecurrent): Promise<CoursRecurrent>;

  /**
   * Supprime un cours récurrent par son ID
   * @param id - Identifiant du cours récurrent à supprimer
   * @returns true si la suppression a réussi, false sinon
   */
  delete(id: number): Promise<boolean>;
}
