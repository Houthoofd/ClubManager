import { Cours } from '../entities/Cours.js';

/**
 * Interface du Repository Cours
 *
 * Cette interface définit le contrat pour la persistence des cours.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface ICoursRepository {
  /**
   * Trouve un cours par son ID
   * @param id - Identifiant du cours
   * @returns Le cours trouvé ou null
   */
  findById(id: number): Promise<Cours | null>;

  /**
   * Trouve tous les cours d'une date spécifique
   * @param date - Date des cours recherchés
   * @returns Liste des cours pour cette date
   */
  findByDate(date: Date): Promise<Cours[]>;

  /**
   * Trouve tous les cours dans une plage de dates
   * @param debut - Date de début de la plage
   * @param fin - Date de fin de la plage
   * @returns Liste des cours dans cette plage de dates
   */
  findByDateRange(debut: Date, fin: Date): Promise<Cours[]>;

  /**
   * Trouve les cours d'un participant pour une semaine spécifique
   * @param participantId - ID du participant
   * @param weekNumber - Numéro de la semaine (1-53)
   * @returns Liste des cours du participant pour cette semaine
   */
  findByWeek(participantId: number, weekNumber: number): Promise<Cours[]>;

  /**
   * Trouve les cours d'un participant avec limite optionnelle
   * @param participantId - ID du participant
   * @param limit - Nombre maximum de cours à retourner (optionnel)
   * @returns Liste des cours du participant
   */
  findForParticipant(participantId: number, limit?: number): Promise<Cours[]>;

  /**
   * Trouve tous les cours
   * @returns Liste de tous les cours
   */
  findAll(): Promise<Cours[]>;

  /**
   * Crée un nouveau cours
   * @param cours - Entité cours à créer
   * @returns Le cours créé avec son ID
   */
  save(cours: Cours): Promise<Cours>;

  /**
   * Met à jour un cours existant
   * @param cours - Entité cours à mettre à jour
   * @returns Le cours mis à jour
   */
  update(cours: Cours): Promise<Cours>;

  /**
   * Supprime un cours par son ID
   * @param id - Identifiant du cours à supprimer
   * @returns true si la suppression a réussi, false sinon
   */
  delete(id: number): Promise<boolean>;
}
