/**
 * Courses Hooks
 *
 * React Query hooks for courses management following FSD architecture.
 * Uses Result pattern for error handling.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/coursesApi';
import type {
  CourseFilters,
  CreateCourseData,
  UpdateCourseData,
} from './types';

/**
 * Hook pour récupérer la liste des cours avec filtres optionnels
 *
 * @param filters - Filtres de recherche
 * @returns Query result avec la liste des cours
 *
 * @example
 * ```tsx
 * const { data: courses, isLoading, error } = useCourses({ type: 'krav-maga' });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return <CoursesList courses={courses} />;
 * ```
 */
export const useCourses = (filters?: CourseFilters) => {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const result = await coursesApi.getAll(filters);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
  });
};

/**
 * Hook pour récupérer un cours par son ID
 *
 * @param id - ID du cours
 * @returns Query result avec le cours
 *
 * @example
 * ```tsx
 * const { data: course, isLoading } = useCourseDetail(courseId);
 * ```
 */
export const useCourseDetail = (id: number) => {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: async () => {
      const result = await coursesApi.getById(id);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    enabled: !!id && id > 0,
  });
};

/**
 * Hook pour créer un nouveau cours
 *
 * @returns Mutation pour créer un cours
 *
 * @example
 * ```tsx
 * const createCourse = useCreateCourse();
 *
 * const handleSubmit = (data: CreateCourseData) => {
 *   createCourse.mutate(data, {
 *     onSuccess: () => {
 *       toast.success('Cours créé avec succès');
 *       navigate('/courses');
 *     },
 *   });
 * };
 * ```
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCourseData) => {
      const result = await coursesApi.create(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: () => {
      // Invalide toutes les queries de cours pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/**
 * Hook pour mettre à jour un cours existant
 *
 * @returns Mutation pour mettre à jour un cours
 *
 * @example
 * ```tsx
 * const updateCourse = useUpdateCourse();
 *
 * const handleUpdate = (data: UpdateCourseData) => {
 *   updateCourse.mutate(data, {
 *     onSuccess: () => {
 *       toast.success('Cours mis à jour');
 *     },
 *   });
 * };
 * ```
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCourseData) => {
      const result = await coursesApi.update(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: (data) => {
      // Invalide la liste des cours et le détail du cours modifié
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', data.id] });
    },
  });
};

/**
 * Hook pour supprimer un cours
 *
 * @returns Mutation pour supprimer un cours
 *
 * @example
 * ```tsx
 * const deleteCourse = useDeleteCourse();
 *
 * const handleDelete = (id: number) => {
 *   if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
 *     deleteCourse.mutate(id, {
 *       onSuccess: () => {
 *         toast.success('Cours supprimé');
 *         navigate('/courses');
 *       },
 *     });
 *   }
 * };
 * ```
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await coursesApi.delete(id);
      return result.match(
        () => id,
        (error) => {
          throw new Error(error.message);
        }
      );
    },
    onSuccess: () => {
      // Invalide toutes les queries de cours
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
