/**
 * Professors Feature - API Layer
 *
 * Gère toutes les requêtes HTTP liées aux professeurs.
 * Utilise le httpClient partagé et retourne des Result pour une gestion d'erreurs type-safe.
 */

import { httpClient } from "@/shared/api/client";
import type { ApiResult } from "@/shared/api/client";
import type {
  Professor,
  ProfessorResponse,
  ProfessorListItem,
  ProfessorsListResponse,
  CreateProfessorData,
  UpdateProfessorData,
  CreateProfessorResponse,
  UpdateProfessorResponse,
  DeleteProfessorResponse,
  SearchProfessorParams,
  ProfessorStatsResponse,
  AssignCourseData,
  UnassignCourseData,
  AssignCourseResponse,
} from "../model/types";

// ============================================================================
// Professors API
// ============================================================================

export const professorsApi = {
  /**
   * Récupère la liste de tous les professeurs (avec pagination et filtres)
   *
   * @param params - Paramètres de recherche et pagination
   * @returns Result contenant la liste paginée de professeurs
   *
   * @example
   * ```ts
   * const result = await professorsApi.getAll({ page: 1, limit: 10, actif: true });
   * result.match(
   *   (data) => console.log('Professeurs:', data.data),
   *   (error) => console.error('Erreur:', error.message)
   * );
   * ```
   */
  getAll: async (
    params?: SearchProfessorParams
  ): Promise<ApiResult<ProfessorsListResponse>> => {
    const queryParams = new URLSearchParams();

    if (params?.nom) queryParams.append("nom", params.nom);
    if (params?.prenom) queryParams.append("prenom", params.prenom);
    if (params?.specialite) queryParams.append("specialite", params.specialite);
    if (params?.grade_id) queryParams.append("grade_id", params.grade_id.toString());
    if (params?.actif !== undefined) queryParams.append("actif", params.actif.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.order) queryParams.append("order", params.order);

    const query = queryParams.toString();
    const url = query ? `professors?${query}` : "professors";

    return httpClient.get<ProfessorsListResponse>(url);
  },

  /**
   * Récupère un professeur par son ID
   *
   * @param id - ID du professeur
   * @returns Result contenant le professeur avec toutes ses relations
   *
   * @example
   * ```ts
   * const result = await professorsApi.getById(1);
   * result.match(
   *   (professor) => console.log('Professeur:', professor.nom_complet),
   *   (error) => console.error('Erreur:', error)
   * );
   * ```
   */
  getById: async (id: number): Promise<ApiResult<ProfessorResponse>> => {
    return httpClient.get<ProfessorResponse>(`professors/${id}`);
  },

  /**
   * Crée un nouveau professeur
   *
   * @param data - Données du professeur à créer
   * @returns Result contenant le professeur créé
   *
   * @example
   * ```ts
   * const result = await professorsApi.create({
   *   nom: 'Dupont',
   *   prenom: 'Jean',
   *   email: 'jean.dupont@example.com',
   *   specialite: 'Karaté',
   *   actif: true
   * });
   * ```
   */
  create: async (
    data: CreateProfessorData
  ): Promise<ApiResult<CreateProfessorResponse>> => {
    return httpClient.post<CreateProfessorResponse>("professors", data);
  },

  /**
   * Met à jour un professeur existant
   *
   * @param id - ID du professeur
   * @param data - Données à mettre à jour
   * @returns Result contenant le professeur mis à jour
   *
   * @example
   * ```ts
   * const result = await professorsApi.update(1, {
   *   telephone: '0612345678',
   *   specialite: 'Judo'
   * });
   * ```
   */
  update: async (
    id: number,
    data: Omit<UpdateProfessorData, "id">
  ): Promise<ApiResult<UpdateProfessorResponse>> => {
    return httpClient.put<UpdateProfessorResponse>(`professors/${id}`, data);
  },

  /**
   * Supprime un professeur (soft delete)
   *
   * @param id - ID du professeur à supprimer
   * @returns Result de confirmation
   *
   * @example
   * ```ts
   * const result = await professorsApi.delete(1);
   * result.match(
   *   (data) => console.log('Supprimé:', data.message),
   *   (error) => console.error('Erreur:', error)
   * );
   * ```
   */
  delete: async (id: number): Promise<ApiResult<DeleteProfessorResponse>> => {
    return httpClient.delete<DeleteProfessorResponse>(`professors/${id}`);
  },

  /**
   * Active ou désactive un professeur
   *
   * @param id - ID du professeur
   * @param actif - Nouveau statut (true = actif, false = inactif)
   * @returns Result contenant le professeur mis à jour
   *
   * @example
   * ```ts
   * const result = await professorsApi.toggleActive(1, false);
   * ```
   */
  toggleActive: async (
    id: number,
    actif: boolean
  ): Promise<ApiResult<UpdateProfessorResponse>> => {
    return httpClient.patch<UpdateProfessorResponse>(`professors/${id}/toggle`, {
      actif,
    });
  },

  /**
   * Upload de la photo du professeur
   *
   * @param id - ID du professeur
   * @param file - Fichier image à uploader
   * @returns Result contenant l'URL de la photo et le professeur mis à jour
   *
   * @example
   * ```ts
   * const result = await professorsApi.uploadPhoto(1, imageFile);
   * ```
   */
  uploadPhoto: async (
    id: number,
    file: File
  ): Promise<ApiResult<{ photo_url: string; professor: ProfessorResponse }>> => {
    const formData = new FormData();
    formData.append("photo", file);

    return httpClient.post<{ photo_url: string; professor: ProfessorResponse }>(
      `professors/${id}/photo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  /**
   * Supprime la photo du professeur
   *
   * @param id - ID du professeur
   * @returns Result de confirmation
   *
   * @example
   * ```ts
   * const result = await professorsApi.deletePhoto(1);
   * ```
   */
  deletePhoto: async (
    id: number
  ): Promise<ApiResult<{ success: boolean; professor: ProfessorResponse }>> => {
    return httpClient.delete<{
      success: boolean;
      professor: ProfessorResponse;
    }>(`professors/${id}/photo`);
  },

  /**
   * Récupère les statistiques d'un professeur
   *
   * @param id - ID du professeur
   * @returns Result contenant les statistiques
   *
   * @example
   * ```ts
   * const result = await professorsApi.getStats(1);
   * result.match(
   *   (stats) => console.log('Cours assignés:', stats.nombre_cours_total),
   *   (error) => console.error('Erreur:', error)
   * );
   * ```
   */
  getStats: async (id: number): Promise<ApiResult<ProfessorStatsResponse>> => {
    return httpClient.get<ProfessorStatsResponse>(`professors/${id}/stats`);
  },

  /**
   * Assigne un cours récurrent à un professeur
   *
   * @param data - Données d'assignation (professeur_id + cours_recurrent_id)
   * @returns Result de confirmation
   *
   * @example
   * ```ts
   * const result = await professorsApi.assignCourse({
   *   professeur_id: 1,
   *   cours_recurrent_id: 5
   * });
   * ```
   */
  assignCourse: async (
    data: AssignCourseData
  ): Promise<ApiResult<AssignCourseResponse>> => {
    return httpClient.post<AssignCourseResponse>(
      `professors/${data.professeur_id}/courses/${data.cours_recurrent_id}`,
      {}
    );
  },

  /**
   * Désassigne un cours récurrent d'un professeur
   *
   * @param data - Données de désassignation (professeur_id + cours_recurrent_id)
   * @returns Result de confirmation
   *
   * @example
   * ```ts
   * const result = await professorsApi.unassignCourse({
   *   professeur_id: 1,
   *   cours_recurrent_id: 5
   * });
   * ```
   */
  unassignCourse: async (
    data: UnassignCourseData
  ): Promise<ApiResult<AssignCourseResponse>> => {
    return httpClient.delete<AssignCourseResponse>(
      `professors/${data.professeur_id}/courses/${data.cours_recurrent_id}`
    );
  },

  /**
   * Récupère la liste des cours récurrents d'un professeur
   *
   * @param id - ID du professeur
   * @returns Result contenant la liste des cours
   *
   * @example
   * ```ts
   * const result = await professorsApi.getCourses(1);
   * ```
   */
  getCourses: async (
    id: number
  ): Promise<
    ApiResult<
      {
        id: number;
        type_cours: string;
        jour_semaine: number;
        jour_semaine_nom: string;
        heure_debut: string;
        heure_fin: string;
        active: boolean;
      }[]
    >
  > => {
    return httpClient.get(`professors/${id}/courses`);
  },

  /**
   * Recherche des professeurs par nom ou prénom
   *
   * @param query - Terme de recherche
   * @returns Result contenant les professeurs correspondants
   *
   * @example
   * ```ts
   * const result = await professorsApi.search('dupont');
   * ```
   */
  search: async (
    query: string
  ): Promise<ApiResult<ProfessorListItem[]>> => {
    return httpClient.get<ProfessorListItem[]>(
      `professors/search?q=${encodeURIComponent(query)}`
    );
  },

  /**
   * Récupère les professeurs actifs uniquement
   *
   * @returns Result contenant la liste des professeurs actifs
   *
   * @example
   * ```ts
   * const result = await professorsApi.getActive();
   * ```
   */
  getActive: async (): Promise<ApiResult<ProfessorListItem[]>> => {
    return httpClient.get<ProfessorListItem[]>("professors?actif=true");
  },

  /**
   * Vérifie si un email est déjà utilisé
   *
   * @param email - Email à vérifier
   * @param excludeId - ID du professeur à exclure (pour l'édition)
   * @returns Result indiquant si l'email existe
   *
   * @example
   * ```ts
   * const result = await professorsApi.checkEmailExists('jean@example.com');
   * ```
   */
  checkEmailExists: async (
    email: string,
    excludeId?: number
  ): Promise<ApiResult<{ exists: boolean; message?: string }>> => {
    const params = new URLSearchParams({ email });
    if (excludeId) params.append("excludeId", excludeId.toString());

    return httpClient.get<{ exists: boolean; message?: string }>(
      `professors/check-email?${params.toString()}`
    );
  },

  /**
   * Récupère les professeurs disponibles pour un créneau spécifique
   *
   * @param jour_semaine - Jour de la semaine (0 = dimanche, 1 = lundi, etc.)
   * @param heure_debut - Heure de début (format HH:mm)
   * @param heure_fin - Heure de fin (format HH:mm)
   * @returns Result contenant les professeurs disponibles
   *
   * @example
   * ```ts
   * const result = await professorsApi.getAvailable(1, '10:00', '11:00');
   * ```
   */
  getAvailable: async (
    jour_semaine: number,
    heure_debut: string,
    heure_fin: string
  ): Promise<ApiResult<ProfessorListItem[]>> => {
    const params = new URLSearchParams({
      jour_semaine: jour_semaine.toString(),
      heure_debut,
      heure_fin,
    });

    return httpClient.get<ProfessorListItem[]>(
      `professors/available?${params.toString()}`
    );
  },
};

// ============================================================================
// Exports
// ============================================================================

export default professorsApi;
