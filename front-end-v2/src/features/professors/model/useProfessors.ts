/**
 * Professors Feature - React Query Hooks
 *
 * Hooks React Query complets pour gérer les professeurs.
 * Fournit toutes les opérations CRUD, gestion de photos, assignations de cours, et recherche.
 *
 * @example
 * ```tsx
 * const { professors, isLoading } = useProfessors({ page: 1, actif: true });
 * const { professor } = useProfessor(1);
 * const createProfessor = useCreateProfessor();
 * ```
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { professorsApi } from "../api/professorsApi";
import type {
  Professor,
  ProfessorResponse,
  ProfessorListItem,
  ProfessorsListResponse,
  CreateProfessorData,
  UpdateProfessorData,
  SearchProfessorParams,
  ProfessorStatsResponse,
  AssignCourseData,
  UnassignCourseData,
} from "./types";

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Clés de requête pour les professeurs
 * Utilisées pour la gestion du cache et l'invalidation
 */
export const professorsKeys = {
  all: ["professors"] as const,
  lists: () => [...professorsKeys.all, "list"] as const,
  list: (params?: SearchProfessorParams) =>
    [...professorsKeys.lists(), params] as const,
  details: () => [...professorsKeys.all, "detail"] as const,
  detail: (id: number) => [...professorsKeys.details(), id] as const,
  stats: (id: number) => [...professorsKeys.all, "stats", id] as const,
  courses: (id: number) => [...professorsKeys.all, "courses", id] as const,
  active: () => [...professorsKeys.all, "active"] as const,
  search: (query: string) => [...professorsKeys.all, "search", query] as const,
  available: (jour: number, debut: string, fin: string) =>
    [...professorsKeys.all, "available", jour, debut, fin] as const,
};

// ============================================================================
// useProfessors Hook - Liste paginée avec filtres
// ============================================================================

/**
 * Hook pour récupérer la liste paginée de professeurs avec filtres
 *
 * @param params - Paramètres de recherche et pagination
 * @returns Liste paginée de professeurs et état de chargement
 *
 * @example
 * ```tsx
 * const { professors, total, isLoading, refetch } = useProfessors({
 *   page: 1,
 *   limit: 10,
 *   actif: true,
 *   sort: 'nom',
 *   order: 'asc'
 * });
 * ```
 */
export const useProfessors = (params?: SearchProfessorParams) => {
  const query = useQuery({
    queryKey: professorsKeys.list(params),
    queryFn: async () => {
      const result = await professorsApi.getAll(params);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });

  return {
    professors: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    limit: query.data?.limit ?? 10,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// useProfessor Hook - Détail d'un professeur
// ============================================================================

/**
 * Hook pour récupérer un professeur par son ID
 *
 * @param id - ID du professeur à récupérer
 * @returns Professeur avec toutes ses relations et état de chargement
 *
 * @example
 * ```tsx
 * const { professor, isLoading, error } = useProfessor(1);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return <ProfessorDetail professor={professor} />;
 * ```
 */
export const useProfessor = (id: number) => {
  const query = useQuery({
    queryKey: professorsKeys.detail(id),
    queryFn: async () => {
      const result = await professorsApi.getById(id);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    professor: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// useCreateProfessor Hook - Création
// ============================================================================

/**
 * Hook pour créer un nouveau professeur
 *
 * @returns Mutation pour créer un professeur
 *
 * @example
 * ```tsx
 * const createProfessor = useCreateProfessor();
 *
 * const handleSubmit = async (data: CreateProfessorData) => {
 *   try {
 *     const result = await createProfessor.mutateAsync(data);
 *     toast.success('Professeur créé avec succès');
 *     navigate(`/professors/${result.professor.id}`);
 *   } catch (error) {
 *     toast.error(error.message);
 *   }
 * };
 * ```
 */
export const useCreateProfessor = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: CreateProfessorData) => {
      const result = await professorsApi.create(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data) => {
      // Invalider les listes pour refetch
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professorsKeys.active() });

      // Ajouter le nouveau professeur au cache
      queryClient.setQueryData(
        professorsKeys.detail(data.professor.id),
        data.professor,
      );
    },
    onError: (error: Error) => {
      console.error("Create professor error:", error);
    },
  });
};

// ============================================================================
// useUpdateProfessor Hook - Mise à jour
// ============================================================================

/**
 * Hook pour mettre à jour un professeur existant
 *
 * @returns Mutation pour mettre à jour un professeur
 *
 * @example
 * ```tsx
 * const updateProfessor = useUpdateProfessor();
 *
 * const handleUpdate = async () => {
 *   await updateProfessor.mutateAsync({
 *     id: 1,
 *     data: {
 *       telephone: '0612345678',
 *       specialite: 'Judo'
 *     }
 *   });
 * };
 * ```
 */
export const useUpdateProfessor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Omit<UpdateProfessorData, "id">;
    }) => {
      const result = await professorsApi.update(id, data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onMutate: async ({ id, data }) => {
      // Annuler les requêtes en cours pour ce professeur
      await queryClient.cancelQueries({ queryKey: professorsKeys.detail(id) });

      // Snapshot de la valeur précédente
      const previousProfessor = queryClient.getQueryData<ProfessorResponse>(
        professorsKeys.detail(id),
      );

      // Optimistic update
      if (previousProfessor) {
        queryClient.setQueryData<ProfessorResponse>(
          professorsKeys.detail(id),
          {
            ...previousProfessor,
            ...data,
          },
        );
      }

      return { previousProfessor };
    },
    onSuccess: (data, variables) => {
      // Mettre à jour le cache avec les données du serveur
      queryClient.setQueryData(
        professorsKeys.detail(variables.id),
        data.professor,
      );

      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professorsKeys.active() });
      queryClient.invalidateQueries({
        queryKey: professorsKeys.stats(variables.id),
      });
    },
    onError: (error: Error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousProfessor) {
        queryClient.setQueryData(
          professorsKeys.detail(variables.id),
          context.previousProfessor,
        );
      }
      console.error("Update professor error:", error);
    },
  });
};

// ============================================================================
// useDeleteProfessor Hook - Suppression
// ============================================================================

/**
 * Hook pour supprimer un professeur (soft delete)
 *
 * @returns Mutation pour supprimer un professeur
 *
 * @example
 * ```tsx
 * const deleteProfessor = useDeleteProfessor();
 *
 * const handleDelete = async (id: number) => {
 *   if (confirm('Êtes-vous sûr de vouloir supprimer ce professeur ?')) {
 *     await deleteProfessor.mutateAsync(id);
 *     navigate('/professors');
 *   }
 * };
 * ```
 */
export const useDeleteProfessor = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await professorsApi.delete(id);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data, id) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: professorsKeys.detail(id) });
      queryClient.removeQueries({ queryKey: professorsKeys.stats(id) });
      queryClient.removeQueries({ queryKey: professorsKeys.courses(id) });

      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professorsKeys.active() });
    },
    onError: (error: Error) => {
      console.error("Delete professor error:", error);
    },
  });
};

// ============================================================================
// useToggleProfessorActive Hook - Toggle statut actif
// ============================================================================

/**
 * Hook pour activer/désactiver un professeur
 *
 * @returns Mutation pour toggle le statut actif
 *
 * @example
 * ```tsx
 * const toggleActive = useToggleProfessorActive();
 *
 * const handleToggle = async (id: number, currentStatus: boolean) => {
 *   await toggleActive.mutateAsync({
 *     id,
 *     actif: !currentStatus
 *   });
 * };
 * ```
 */
export const useToggleProfessorActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, actif }: { id: number; actif: boolean }) => {
      const result = await professorsApi.toggleActive(id, actif);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onMutate: async ({ id, actif }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: professorsKeys.detail(id) });

      // Snapshot
      const previousProfessor = queryClient.getQueryData<ProfessorResponse>(
        professorsKeys.detail(id),
      );

      // Optimistic update
      if (previousProfessor) {
        queryClient.setQueryData<ProfessorResponse>(
          professorsKeys.detail(id),
          {
            ...previousProfessor,
            actif,
          },
        );
      }

      return { previousProfessor };
    },
    onSuccess: (data, variables) => {
      // Mettre à jour avec les données du serveur
      queryClient.setQueryData(
        professorsKeys.detail(variables.id),
        data.professor,
      );

      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professorsKeys.active() });
    },
    onError: (error: Error, variables, context) => {
      // Rollback
      if (context?.previousProfessor) {
        queryClient.setQueryData(
          professorsKeys.detail(variables.id),
          context.previousProfessor,
        );
      }
      console.error("Toggle active error:", error);
    },
  });
};

// ============================================================================
// useProfessorPhoto Hook - Gestion de la photo
// ============================================================================

/**
 * Hook pour gérer la photo d'un professeur (upload et suppression)
 *
 * @returns Mutations pour upload et suppression de photo
 *
 * @example
 * ```tsx
 * const { uploadPhoto, deletePhoto } = useProfessorPhoto();
 *
 * const handleUpload = async (file: File) => {
 *   await uploadPhoto.mutateAsync({ id: professorId, file });
 * };
 *
 * const handleDelete = async () => {
 *   await deletePhoto.mutateAsync(professorId);
 * };
 * ```
 */
export const useProfessorPhoto = () => {
  const queryClient = useQueryClient();

  const uploadPhoto = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const result = await professorsApi.uploadPhoto(id, file);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data, variables) => {
      // Mettre à jour le cache avec la nouvelle photo
      queryClient.setQueryData(
        professorsKeys.detail(variables.id),
        data.professor,
      );

      // Invalider les listes pour refléter le changement
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professorsKeys.active() });
    },
    onError: (error: Error) => {
      console.error("Upload photo error:", error);
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (id: number) => {
      const result = await professorsApi.deletePhoto(id);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data, id) => {
      // Mettre à jour le cache
      queryClient.setQueryData(professorsKeys.detail(id), data.professor);

      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professorsKeys.active() });
    },
    onError: (error: Error) => {
      console.error("Delete photo error:", error);
    },
  });

  return {
    uploadPhoto,
    deletePhoto,
  };
};

// ============================================================================
// useProfessorStats Hook - Statistiques
// ============================================================================

/**
 * Hook pour récupérer les statistiques d'un professeur
 *
 * @param id - ID du professeur
 * @returns Statistiques du professeur (nombre de cours, prochains cours, etc.)
 *
 * @example
 * ```tsx
 * const { stats, isLoading } = useProfessorStats(1);
 *
 * return (
 *   <div>
 *     <p>Cours total: {stats?.nombre_cours_total}</p>
 *     <p>Cours actifs: {stats?.nombre_cours_actifs}</p>
 *   </div>
 * );
 * ```
 */
export const useProfessorStats = (id: number) => {
  const query = useQuery({
    queryKey: professorsKeys.stats(id),
    queryFn: async () => {
      const result = await professorsApi.getStats(id);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    enabled: !!id && id > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// useAssignCourse Hook - Assigner un cours
// ============================================================================

/**
 * Hook pour assigner un cours récurrent à un professeur
 *
 * @returns Mutation pour assigner un cours
 *
 * @example
 * ```tsx
 * const assignCourse = useAssignCourse();
 *
 * const handleAssign = async (professorId: number, courseId: number) => {
 *   await assignCourse.mutateAsync({
 *     professeur_id: professorId,
 *     cours_recurrent_id: courseId
 *   });
 * };
 * ```
 */
export const useAssignCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignCourseData) => {
      const result = await professorsApi.assignCourse(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data, variables) => {
      // Invalider les données du professeur et ses cours
      queryClient.invalidateQueries({
        queryKey: professorsKeys.detail(variables.professeur_id),
      });
      queryClient.invalidateQueries({
        queryKey: professorsKeys.courses(variables.professeur_id),
      });
      queryClient.invalidateQueries({
        queryKey: professorsKeys.stats(variables.professeur_id),
      });

      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
    },
    onError: (error: Error) => {
      console.error("Assign course error:", error);
    },
  });
};

// ============================================================================
// useUnassignCourse Hook - Désassigner un cours
// ============================================================================

/**
 * Hook pour désassigner un cours récurrent d'un professeur
 *
 * @returns Mutation pour désassigner un cours
 *
 * @example
 * ```tsx
 * const unassignCourse = useUnassignCourse();
 *
 * const handleUnassign = async (professorId: number, courseId: number) => {
 *   if (confirm('Êtes-vous sûr de vouloir retirer ce cours ?')) {
 *     await unassignCourse.mutateAsync({
 *       professeur_id: professorId,
 *       cours_recurrent_id: courseId
 *     });
 *   }
 * };
 * ```
 */
export const useUnassignCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UnassignCourseData) => {
      const result = await professorsApi.unassignCourse(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data, variables) => {
      // Invalider les données du professeur et ses cours
      queryClient.invalidateQueries({
        queryKey: professorsKeys.detail(variables.professeur_id),
      });
      queryClient.invalidateQueries({
        queryKey: professorsKeys.courses(variables.professeur_id),
      });
      queryClient.invalidateQueries({
        queryKey: professorsKeys.stats(variables.professeur_id),
      });

      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: professorsKeys.lists() });
    },
    onError: (error: Error) => {
      console.error("Unassign course error:", error);
    },
  });
};

// ============================================================================
// useProfessorCourses Hook - Cours d'un professeur
// ============================================================================

/**
 * Hook pour récupérer la liste des cours récurrents d'un professeur
 *
 * @param id - ID du professeur
 * @returns Liste des cours assignés au professeur
 *
 * @example
 * ```tsx
 * const { courses, isLoading } = useProfessorCourses(1);
 *
 * return (
 *   <ul>
 *     {courses?.map(course => (
 *       <li key={course.id}>
 *         {course.type_cours} - {course.jour_semaine_nom}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export const useProfessorCourses = (id: number) => {
  const query = useQuery({
    queryKey: professorsKeys.courses(id),
    queryFn: async () => {
      const result = await professorsApi.getCourses(id);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    enabled: !!id && id > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  return {
    courses: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// useActiveProfessors Hook - Professeurs actifs uniquement
// ============================================================================

/**
 * Hook pour récupérer uniquement les professeurs actifs
 * Utile pour les listes déroulantes et les sélecteurs
 *
 * @returns Liste des professeurs actifs
 *
 * @example
 * ```tsx
 * const { activeProfessors, isLoading } = useActiveProfessors();
 *
 * return (
 *   <select>
 *     {activeProfessors.map(prof => (
 *       <option key={prof.id} value={prof.id}>
 *         {prof.nom_complet}
 *       </option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export const useActiveProfessors = () => {
  const query = useQuery({
    queryKey: professorsKeys.active(),
    queryFn: async () => {
      const result = await professorsApi.getActive();
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    activeProfessors: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// useSearchProfessors Hook - Recherche de professeurs
// ============================================================================

/**
 * Hook pour rechercher des professeurs par nom ou prénom
 *
 * @param query - Terme de recherche
 * @param enabled - Si la recherche doit être activée (par défaut: true si query existe)
 * @returns Liste des professeurs correspondants
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const { results, isLoading } = useSearchProfessors(searchTerm);
 *
 * return (
 *   <div>
 *     <input
 *       value={searchTerm}
 *       onChange={e => setSearchTerm(e.target.value)}
 *       placeholder="Rechercher un professeur..."
 *     />
 *     {isLoading && <Spinner />}
 *     {results.map(prof => <ProfessorCard key={prof.id} professor={prof} />)}
 *   </div>
 * );
 * ```
 */
export const useSearchProfessors = (query: string, enabled: boolean = true) => {
  const searchQuery = useQuery({
    queryKey: professorsKeys.search(query),
    queryFn: async () => {
      const result = await professorsApi.search(query);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 30 * 1000, // 30 secondes
    retry: 1,
  });

  return {
    results: searchQuery.data ?? [],
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    refetch: searchQuery.refetch,
  };
};

// ============================================================================
// useAvailableProfessors Hook - Professeurs disponibles
// ============================================================================

/**
 * Hook pour récupérer les professeurs disponibles pour un créneau spécifique
 *
 * @param params - Paramètres du créneau (jour, heure début, heure fin)
 * @param enabled - Si la requête doit être activée
 * @returns Liste des professeurs disponibles pour ce créneau
 *
 * @example
 * ```tsx
 * const { available, isLoading } = useAvailableProfessors({
 *   jour_semaine: 1, // Lundi
 *   heure_debut: '10:00',
 *   heure_fin: '11:00'
 * });
 * ```
 */
export const useAvailableProfessors = (
  params: {
    jour_semaine: number;
    heure_debut: string;
    heure_fin: string;
  },
  enabled: boolean = true,
) => {
  const query = useQuery({
    queryKey: professorsKeys.available(
      params.jour_semaine,
      params.heure_debut,
      params.heure_fin,
    ),
    queryFn: async () => {
      const result = await professorsApi.getAvailable(
        params.jour_semaine,
        params.heure_debut,
        params.heure_fin,
      );
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    enabled:
      enabled &&
      params.jour_semaine >= 0 &&
      !!params.heure_debut &&
      !!params.heure_fin,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });

  return {
    available: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// useCheckEmailExists Hook - Vérification d'email
// ============================================================================

/**
 * Hook pour vérifier si un email est déjà utilisé
 *
 * @param email - Email à vérifier
 * @param excludeId - ID du professeur à exclure (pour l'édition)
 * @param enabled - Si la vérification doit être activée
 * @returns Résultat de la vérification
 *
 * @example
 * ```tsx
 * const { exists, isLoading } = useCheckEmailExists(
 *   'jean.dupont@example.com',
 *   professorId
 * );
 *
 * if (exists) {
 *   return <Error message="Cet email est déjà utilisé" />;
 * }
 * ```
 */
export const useCheckEmailExists = (
  email: string,
  excludeId?: number,
  enabled: boolean = true,
) => {
  const query = useQuery({
    queryKey: [...professorsKeys.all, "check-email", email, excludeId] as const,
    queryFn: async () => {
      const result = await professorsApi.checkEmailExists(email, excludeId);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    enabled: enabled && !!email && email.trim().length > 0,
    staleTime: 0, // Toujours vérifier
    retry: 1,
  });

  return {
    exists: query.data?.exists ?? false,
    message: query.data?.message,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

// ============================================================================
// usePrefetchProfessor Hook - Prefetch pour optimisation
// ============================================================================

/**
 * Hook pour prefetch les données d'un professeur
 * Utile pour améliorer l'UX en chargeant les données avant la navigation
 *
 * @returns Fonction pour prefetch un professeur
 *
 * @example
 * ```tsx
 * const prefetchProfessor = usePrefetchProfessor();
 *
 * return (
 *   <Link
 *     to={`/professors/${prof.id}`}
 *     onMouseEnter={() => prefetchProfessor(prof.id)}
 *   >
 *     {prof.nom_complet}
 *   </Link>
 * );
 * ```
 */
export const usePrefetchProfessor = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: professorsKeys.detail(id),
      queryFn: async () => {
        const result = await professorsApi.getById(id);
        return result.match(
          (data) => data,
          (error) => {
            throw new Error(error.message);
          },
        );
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
};

// ============================================================================
// useProfessorMutations Hook - Toutes les mutations groupées
// ============================================================================

/**
 * Hook qui regroupe toutes les mutations pour un professeur
 * Utile pour les composants qui ont besoin de plusieurs mutations
 *
 * @returns Objet avec toutes les mutations disponibles
 *
 * @example
 * ```tsx
 * const {
 *   create,
 *   update,
 *   deleteProfessor,
 *   toggleActive,
 *   assignCourse,
 *   unassignCourse,
 *   uploadPhoto,
 *   deletePhoto
 * } = useProfessorMutations();
 * ```
 */
export const useProfessorMutations = () => {
  const create = useCreateProfessor();
  const update = useUpdateProfessor();
  const deleteMutation = useDeleteProfessor();
  const toggleActive = useToggleProfessorActive();
  const assignCourse = useAssignCourse();
  const unassignCourse = useUnassignCourse();
  const { uploadPhoto, deletePhoto } = useProfessorPhoto();

  return {
    create,
    update,
    delete: deleteMutation,
    toggleActive,
    assignCourse,
    unassignCourse,
    uploadPhoto,
    deletePhoto,
    isLoading:
      create.isPending ||
      update.isPending ||
      deleteMutation.isPending ||
      toggleActive.isPending ||
      assignCourse.isPending ||
      unassignCourse.isPending ||
      uploadPhoto.isPending ||
      deletePhoto.isPending,
  };
};

// ============================================================================
// Exports
// ============================================================================

export default {
  // Query keys
  professorsKeys,

  // Queries
  useProfessors,
  useProfessor,
  useProfessorStats,
  useProfessorCourses,
  useActiveProfessors,
  useSearchProfessors,
  useAvailableProfessors,
  useCheckEmailExists,

  // Mutations
  useCreateProfessor,
  useUpdateProfessor,
  useDeleteProfessor,
  useToggleProfessorActive,
  useAssignCourse,
  useUnassignCourse,
  useProfessorPhoto,

  // Utilities
  usePrefetchProfessor,
  useProfessorMutations,
};
