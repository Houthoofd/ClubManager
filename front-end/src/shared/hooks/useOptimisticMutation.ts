/**
 * useOptimisticMutation Hook
 *
 * Hook pour simplifier l'utilisation des optimistic updates avec Apollo Client.
 * Encapsule la logique commune des mutations optimistes.
 *
 * @example
 * ```tsx
 * const { mutate, loading, error } = useOptimisticMutation(
 *   useUpdateUserMutation,
 *   {
 *     successMessage: 'User updated!',
 *     errorMessage: 'Failed to update user',
 *     optimisticResponse: (variables) => ({
 *       updateUser: { ...variables.input, __typename: 'User' }
 *     })
 *   }
 * );
 * ```
 */

import { useState, useCallback } from "react";
import type { MutationFunctionOptions, OperationVariables } from "@apollo/client";
import { useToast } from "./useToast";

// Types pour les hooks de mutation générés par GraphQL CodeGen
type MutationTuple<TData, TVariables> = [
  (options?: MutationFunctionOptions<TData, TVariables>) => Promise<any>,
  { loading: boolean; error?: Error; data?: TData },
];

type MutationHookOptions<TData, TVariables> = {
  update?: (cache: any, result: { data?: TData }) => void;
  refetchQueries?: string[] | { query: string }[];
  optimisticResponse?: TData;
};

// ============================================================================
// Types
// ============================================================================

interface UseOptimisticMutationOptions<TData = any, TVariables = OperationVariables> {
  /**
   * Message de succès affiché dans un toast
   */
  successMessage?: string | ((data: TData) => string);

  /**
   * Message d'erreur affiché dans un toast
   */
  errorMessage?: string | ((error: Error) => string);

  /**
   * Génère la réponse optimiste à partir des variables
   */
  optimisticResponse?: (variables: TVariables) => TData;

  /**
   * Fonction de mise à jour du cache Apollo
   */
  update?: MutationHookOptions<TData, TVariables>["update"];

  /**
   * Queries à refetch après la mutation
   */
  refetchQueries?: MutationHookOptions<TData, TVariables>["refetchQueries"];

  /**
   * Callback appelé en cas de succès
   */
  onSuccess?: (data: TData) => void | Promise<void>;

  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void | Promise<void>;

  /**
   * Callback appelé avant l'exécution de la mutation
   */
  onBefore?: (variables: TVariables) => void | Promise<void>;

  /**
   * Callback appelé après l'exécution (succès ou erreur)
   */
  onComplete?: () => void | Promise<void>;

  /**
   * Désactive les toasts automatiques
   */
  disableToasts?: boolean;

  /**
   * Rollback automatique du cache en cas d'erreur
   * @default true
   */
  autoRollback?: boolean;
}

interface UseOptimisticMutationResult<TData = any, TVariables = OperationVariables> {
  /**
   * Fonction pour exécuter la mutation
   */
  mutate: (variables: TVariables) => Promise<TData | null>;

  /**
   * État de chargement
   */
  loading: boolean;

  /**
   * Erreur de la dernière mutation
   */
  error: Error | null;

  /**
   * Données de la dernière mutation réussie
   */
  data: TData | null;

  /**
   * Réinitialise l'état (erreur, data)
   */
  reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook pour gérer les mutations optimistes avec Apollo Client
 *
 * @param useMutationHook - Hook de mutation généré par GraphQL CodeGen
 * @param options - Options de configuration
 * @returns Résultat de la mutation avec helpers
 */
export function useOptimisticMutation<TData = any, TVariables = OperationVariables>(
  useMutationHook: (
    options?: MutationHookOptions<TData, TVariables>,
  ) => MutationTuple<TData, TVariables>,
  options: UseOptimisticMutationOptions<TData, TVariables> = {},
): UseOptimisticMutationResult<TData, TVariables> {
  const {
    successMessage,
    errorMessage,
    optimisticResponse,
    update,
    refetchQueries,
    onSuccess,
    onError,
    onBefore,
    onComplete,
    disableToasts = false,
  } = options;

  // State
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [localData, setLocalData] = useState<TData | null>(null);

  // Toast notifications
  const { showSuccess, showError } = useToast();

  // Apollo mutation hook
  const [mutationFn, { loading: apolloLoading }] = useMutationHook({
    update,
    refetchQueries,
  });

  const loading = localLoading || apolloLoading;

  /**
   * Exécute la mutation avec optimistic updates
   */
  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      try {
        // Reset previous error
        setLocalError(null);
        setLocalLoading(true);

        // Callback avant mutation
        if (onBefore) {
          await onBefore(variables);
        }

        // Prépare les options de mutation
        const mutationOptions: MutationHookOptions<TData, TVariables> = {
          variables,
        };

        // Ajoute optimistic response si fournie
        if (optimisticResponse) {
          mutationOptions.optimisticResponse = optimisticResponse(variables);
        }

        // Ajoute update et refetchQueries
        if (update) {
          mutationOptions.update = update;
        }
        if (refetchQueries) {
          mutationOptions.refetchQueries = refetchQueries;
        }

        // Exécute la mutation
        const result = await mutationFn(mutationOptions);

        if (result.errors) {
          throw new Error(result.errors[0]?.message || "Mutation failed");
        }

        const data = result.data;

        if (!data) {
          throw new Error("No data returned from mutation");
        }

        // Sauvegarde les données
        setLocalData(data);

        // Callback de succès
        if (onSuccess) {
          await onSuccess(data);
        }

        // Toast de succès
        if (!disableToasts && successMessage) {
          const message =
            typeof successMessage === "function" ? successMessage(data) : successMessage;
          showSuccess(message);
        }

        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLocalError(err);

        // Callback d'erreur
        if (onError) {
          await onError(err);
        }

        // Toast d'erreur
        if (!disableToasts && errorMessage) {
          const message = typeof errorMessage === "function" ? errorMessage(err) : errorMessage;
          showError(message);
        } else if (!disableToasts) {
          showError(err.message || "An error occurred");
        }

        // Apollo rollback automatique si optimistic response est utilisée
        // Le cache est automatiquement restauré en cas d'erreur

        return null;
      } finally {
        setLocalLoading(false);

        // Callback de complétion
        if (onComplete) {
          await onComplete();
        }
      }
    },
    [
      mutationFn,
      optimisticResponse,
      update,
      refetchQueries,
      onBefore,
      onSuccess,
      onError,
      onComplete,
      successMessage,
      errorMessage,
      disableToasts,
      showSuccess,
      showError,
    ],
  );

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setLocalError(null);
    setLocalData(null);
  }, []);

  return {
    mutate,
    loading,
    error: localError,
    data: localData,
    reset,
  };
}

export default useOptimisticMutation;

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * Example 1: Simple optimistic update
 * ------------------------------------
 * ```tsx
 * import { useUpdateUserMutation } from '@/core/api/apollo/generated/graphql';
 * import { useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation';
 *
 * function EditUserForm({ user }) {
 *   const { mutate, loading } = useOptimisticMutation(
 *     useUpdateUserMutation,
 *     {
 *       successMessage: 'User updated successfully!',
 *       errorMessage: 'Failed to update user',
 *       optimisticResponse: (variables) => ({
 *         updateUser: {
 *           __typename: 'User',
 *           id: user.id,
 *           ...variables.input,
 *         }
 *       })
 *     }
 *   );
 *
 *   const handleSubmit = async (formData) => {
 *     await mutate({ id: user.id, input: formData });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * Example 2: With cache update
 * -----------------------------
 * ```tsx
 * import { useCreateArticleMutation } from '@/core/api/apollo/generated/graphql';
 * import { useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation';
 * import { addToListCache } from '@/core/api/apollo/optimistic-updates';
 *
 * function AddArticleForm() {
 *   const { mutate, loading } = useOptimisticMutation(
 *     useCreateArticleMutation,
 *     {
 *       successMessage: 'Article created!',
 *       optimisticResponse: (variables) => ({
 *         createArticle: {
 *           __typename: 'Article',
 *           id: `temp-${Date.now()}`,
 *           ...variables.input,
 *         }
 *       }),
 *       update: addToListCache('articles', 'Article'),
 *       refetchQueries: ['GetArticles', 'GetArticleStats'],
 *     }
 *   );
 *
 *   return <button onClick={() => mutate({ input: {...} })}>Create</button>;
 * }
 * ```
 *
 * Example 3: With callbacks
 * --------------------------
 * ```tsx
 * const { mutate } = useOptimisticMutation(
 *   useDeleteUserMutation,
 *   {
 *     successMessage: (data) => `Deleted ${data.deleteUser.nom}`,
 *     onBefore: async (variables) => {
 *       const confirmed = await confirmDialog('Are you sure?');
 *       if (!confirmed) throw new Error('Cancelled');
 *     },
 *     onSuccess: (data) => {
 *       navigate('/users');
 *       logAnalytics('user_deleted', { userId: data.deleteUser.id });
 *     },
 *     onError: (error) => {
 *       logError(error);
 *     }
 *   }
 * );
 * ```
 */
