/**
 * Courses API
 *
 * API layer for courses management following FSD architecture.
 * Uses the centralized HTTP client with Result pattern.
 */

import { httpClient } from '@/shared/api/client';
import type { ApiResult } from '@/shared/api/client';
import type {
  Course,
  CreateCourseData,
  UpdateCourseData,
  CourseFilters,
} from '../model/types';

/**
 * API endpoints pour la gestion des cours
 */
export const coursesApi = {
  /**
   * Récupère tous les cours avec filtres optionnels
   *
   * @param filters - Filtres de recherche
   * @returns Promise avec la liste des cours
   *
   * @example
   * ```ts
   * const result = await coursesApi.getAll({ type: 'krav-maga', level: 'beginner' });
   * result.match(
   *   (courses) => console.log(courses),
   *   (error) => console.error(error)
   * );
   * ```
   */
  getAll: async (filters?: CourseFilters): Promise<ApiResult<Course[]>> => {
    const params = new URLSearchParams();

    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.level) {
      params.append('level', filters.level);
    }
    if (filters?.professorId) {
      params.append('professorId', filters.professorId.toString());
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `courses?${queryString}` : 'courses';

    return httpClient.get<Course[]>(url);
  },

  /**
   * Récupère un cours par son ID
   *
   * @param id - ID du cours
   * @returns Promise avec le cours
   *
   * @example
   * ```ts
   * const result = await coursesApi.getById(1);
   * result.match(
   *   (course) => console.log(course.name),
   *   (error) => console.error(error)
   * );
   * ```
   */
  getById: async (id: number): Promise<ApiResult<Course>> => {
    return httpClient.get<Course>(`courses/${id}`);
  },

  /**
   * Crée un nouveau cours
   *
   * @param data - Données du cours à créer
   * @returns Promise avec le cours créé
   *
   * @example
   * ```ts
   * const result = await coursesApi.create({
   *   name: 'Krav Maga Débutants',
   *   description: 'Cours pour débutants',
   *   type: 'krav-maga',
   *   level: 'beginner',
   *   professorId: 1,
   *   capacity: 20,
   *   price: 50,
   *   duration: 90,
   * });
   * ```
   */
  create: async (data: CreateCourseData): Promise<ApiResult<Course>> => {
    return httpClient.post<Course>('courses', data);
  },

  /**
   * Met à jour un cours existant
   *
   * @param data - Données de mise à jour (doit inclure l'ID)
   * @returns Promise avec le cours mis à jour
   *
   * @example
   * ```ts
   * const result = await coursesApi.update({
   *   id: 1,
   *   capacity: 25,
   *   price: 55,
   * });
   * ```
   */
  update: async (data: UpdateCourseData): Promise<ApiResult<Course>> => {
    const { id, ...updateData } = data;
    return httpClient.put<Course>(`courses/${id}`, updateData);
  },

  /**
   * Supprime un cours
   *
   * @param id - ID du cours à supprimer
   * @returns Promise avec void en cas de succès
   *
   * @example
   * ```ts
   * const result = await coursesApi.delete(1);
   * result.match(
   *   () => console.log('Cours supprimé'),
   *   (error) => console.error(error)
   * );
   * ```
   */
  delete: async (id: number): Promise<ApiResult<void>> => {
    return httpClient.delete<void>(`courses/${id}`);
  },
};
