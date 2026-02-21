/**
 * Optimistic Updates Utilities
 *
 * Helpers pour améliorer l'UX en mettant à jour le cache Apollo
 * AVANT la réponse du serveur (optimistic UI).
 *
 * Benefits:
 * - ✅ UI instantanée (pas d'attente réseau)
 * - ✅ Meilleure perception de performance
 * - ✅ Rollback automatique en cas d'erreur
 *
 * @see https://www.apollographql.com/docs/react/performance/optimistic-ui/
 */

import type { MutationUpdaterFn, Reference } from '@apollo/client';

// ============================================================================
// Types
// ============================================================================

interface OptimisticUser {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  statut?: string;
  __typename?: string;
}

interface OptimisticArticle {
  id: string;
  nom?: string;
  prix?: number;
  stock?: number;
  description?: string;
  categorie?: string;
  __typename?: string;
}

interface OptimisticSession {
  id: string;
  date?: string;
  heureDebut?: string;
  heureFin?: string;
  capaciteMax?: number;
  inscriptions?: number;
  __typename?: string;
}

interface OptimisticMessage {
  id: string;
  objet?: string;
  contenu?: string;
  dateEnvoi?: string;
  lu?: boolean;
  __typename?: string;
}

// ============================================================================
// Optimistic Response Generators
// ============================================================================

/**
 * Génère une réponse optimiste pour la création d'un utilisateur
 */
export const createOptimisticUser = (input: Partial<OptimisticUser>): OptimisticUser => ({
  __typename: 'User',
  id: `temp-${Date.now()}`, // ID temporaire
  nom: input.nom ?? '',
  prenom: input.prenom ?? '',
  email: input.email ?? '',
  telephone: input.telephone ?? '',
  adresse: input.adresse ?? '',
  statut: input.statut ?? 'ACTIF',
  ...input,
});

/**
 * Génère une réponse optimiste pour la mise à jour d'un utilisateur
 */
export const updateOptimisticUser = (
  id: string,
  updates: Partial<OptimisticUser>
): OptimisticUser => ({
  __typename: 'User',
  id,
  ...updates,
});

/**
 * Génère une réponse optimiste pour la création d'un article
 */
export const createOptimisticArticle = (
  input: Partial<OptimisticArticle>
): OptimisticArticle => ({
  __typename: 'Article',
  id: `temp-${Date.now()}`,
  nom: input.nom ?? '',
  prix: input.prix ?? 0,
  stock: input.stock ?? 0,
  description: input.description ?? '',
  categorie: input.categorie ?? '',
  ...input,
});

/**
 * Génère une réponse optimiste pour la mise à jour d'un article
 */
export const updateOptimisticArticle = (
  id: string,
  updates: Partial<OptimisticArticle>
): OptimisticArticle => ({
  __typename: 'Article',
  id,
  ...updates,
});

/**
 * Génère une réponse optimiste pour la création d'une session
 */
export const createOptimisticSession = (
  input: Partial<OptimisticSession>
): OptimisticSession => ({
  __typename: 'Session',
  id: `temp-${Date.now()}`,
  date: input.date ?? new Date().toISOString(),
  heureDebut: input.heureDebut ?? '',
  heureFin: input.heureFin ?? '',
  capaciteMax: input.capaciteMax ?? 0,
  inscriptions: input.inscriptions ?? 0,
  ...input,
});

/**
 * Génère une réponse optimiste pour marquer un message comme lu
 */
export const markMessageAsReadOptimistic = (id: string): OptimisticMessage => ({
  __typename: 'Message',
  id,
  lu: true,
});

// ============================================================================
// Cache Update Functions
// ============================================================================

/**
 * Met à jour le cache Apollo après la création d'un élément
 * (ajoute l'élément à une liste existante)
 *
 * @example
 * ```ts
 * useMutation(CREATE_USER, {
 *   update: addToListCache('users', 'User')
 * })
 * ```
 */
export const addToListCache = <T>(
  queryName: string,
  typename: string
): MutationUpdaterFn<T> => {
  return (cache, { data }) => {
    if (!data) return;

    const mutationKey = Object.keys(data)[0];
    const newItem = (data as any)[mutationKey];

    cache.modify({
      fields: {
        [queryName](existingRefs = [], { toReference }) {
          const newRef = toReference({
            __typename: typename,
            id: newItem.id,
          });

          // Évite les doublons
          if (existingRefs.some((ref: Reference) => ref.__ref === newRef?.__ref)) {
            return existingRefs;
          }

          return [...existingRefs, newRef];
        },
      },
    });
  };
};

/**
 * Met à jour le cache Apollo après la suppression d'un élément
 * (retire l'élément d'une liste existante)
 *
 * @example
 * ```ts
 * useMutation(DELETE_USER, {
 *   update: removeFromListCache('users', deletedUserId)
 * })
 * ```
 */
export const removeFromListCache = <T>(
  queryName: string,
  itemId: string
): MutationUpdaterFn<T> => {
  return (cache) => {
    cache.modify({
      fields: {
        [queryName](existingRefs: Reference[] = [], { readField }) {
          return existingRefs.filter(
            (ref) => itemId !== readField('id', ref)
          );
        },
      },
    });

    // Éviction de l'item du cache
    cache.evict({ id: cache.identify({ __typename: queryName.slice(0, -1), id: itemId }) });
    cache.gc();
  };
};

/**
 * Met à jour un champ spécifique dans le cache
 *
 * @example
 * ```ts
 * useMutation(UPDATE_STOCK, {
 *   update: updateFieldInCache('Article', articleId, 'stock', newStock)
 * })
 * ```
 */
export const updateFieldInCache = <T>(
  typename: string,
  itemId: string,
  fieldName: string,
  newValue: any
): MutationUpdaterFn<T> => {
  return (cache) => {
    const id = cache.identify({ __typename: typename, id: itemId });

    if (id) {
      cache.modify({
        id,
        fields: {
          [fieldName]() {
            return newValue;
          },
        },
      });
    }
  };
};

/**
 * Incrémente/décrémente un champ numérique dans le cache
 *
 * @example
 * ```ts
 * // Incrémenter le nombre d'inscriptions
 * useMutation(ENROLL_USER, {
 *   update: incrementFieldInCache('Session', sessionId, 'inscriptions', 1)
 * })
 *
 * // Décrémenter le stock
 * useMutation(PURCHASE_ITEM, {
 *   update: incrementFieldInCache('Article', articleId, 'stock', -quantity)
 * })
 * ```
 */
export const incrementFieldInCache = <T>(
  typename: string,
  itemId: string,
  fieldName: string,
  delta: number
): MutationUpdaterFn<T> => {
  return (cache) => {
    const id = cache.identify({ __typename: typename, id: itemId });

    if (id) {
      cache.modify({
        id,
        fields: {
          [fieldName](existingValue = 0) {
            return existingValue + delta;
          },
        },
      });
    }
  };
};

// ============================================================================
// Refetch Queries Helpers
// ============================================================================

/**
 * Crée une liste de queries à refetch après une mutation
 *
 * @example
 * ```ts
 * useMutation(CREATE_USER, {
 *   refetchQueries: createRefetchQueries(['GetUsers', 'GetUserStats'])
 * })
 * ```
 */
export const createRefetchQueries = (queryNames: string[]) => {
  return queryNames.map(name => ({ query: name }));
};

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Configuration complète pour optimistic update lors de la création d'utilisateur
 */
export const optimisticCreateUserConfig = (input: Partial<OptimisticUser>) => ({
  optimisticResponse: {
    createUser: createOptimisticUser(input),
  },
  update: addToListCache('users', 'User'),
});

/**
 * Configuration complète pour optimistic update lors de la mise à jour d'utilisateur
 */
export const optimisticUpdateUserConfig = (id: string, updates: Partial<OptimisticUser>) => ({
  optimisticResponse: {
    updateUser: updateOptimisticUser(id, updates),
  },
});

/**
 * Configuration complète pour optimistic update lors de la suppression d'utilisateur
 */
export const optimisticDeleteUserConfig = (id: string) => ({
  optimisticResponse: {
    deleteUser: { id, __typename: 'User' },
  },
  update: removeFromListCache('users', id),
});

/**
 * Configuration complète pour optimistic update lors de l'achat d'article (décrémente stock)
 */
export const optimisticPurchaseArticleConfig = (articleId: string, quantity: number) => ({
  update: incrementFieldInCache('Article', articleId, 'stock', -quantity),
});

/**
 * Configuration complète pour optimistic update lors de l'inscription à une session
 */
export const optimisticEnrollSessionConfig = (sessionId: string) => ({
  update: incrementFieldInCache('Session', sessionId, 'inscriptions', 1),
});

/**
 * Configuration complète pour optimistic update lors de la désinscription d'une session
 */
export const optimisticUnenrollSessionConfig = (sessionId: string) => ({
  update: incrementFieldInCache('Session', sessionId, 'inscriptions', -1),
});

/**
 * Configuration complète pour optimistic update lors du marquage de message comme lu
 */
export const optimisticMarkMessageReadConfig = (messageId: string) => ({
  optimisticResponse: {
    markMessageAsRead: markMessageAsReadOptimistic(messageId),
  },
  update: updateFieldInCache('Message', messageId, 'lu', true),
});

// ============================================================================
// Usage Examples (documentation)
// ============================================================================

/**
 * EXEMPLE D'UTILISATION:
 *
 * ```tsx
 * import { useCreateUserMutation } from '@/core/api/apollo/generated/graphql';
 * import { optimisticCreateUserConfig } from '@/core/api/apollo/optimistic-updates';
 *
 * function AddUserForm() {
 *   const [createUser, { loading }] = useCreateUserMutation();
 *
 *   const handleSubmit = async (formData) => {
 *     await createUser({
 *       variables: { input: formData },
 *       ...optimisticCreateUserConfig(formData), // ✨ Optimistic UI
 *       onCompleted: () => showSuccessToast(),
 *       onError: () => showErrorToast(), // Rollback automatique
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * EXEMPLE PERSONNALISÉ:
 *
 * ```tsx
 * const [enrollUser] = useEnrollUserMutation({
 *   optimisticResponse: {
 *     enrollUser: {
 *       __typename: 'Enrollment',
 *       id: `temp-${Date.now()}`,
 *       userId: currentUserId,
 *       sessionId: selectedSessionId,
 *       dateInscription: new Date().toISOString(),
 *     }
 *   },
 *   update: (cache) => {
 *     // Incrémente le compteur d'inscriptions
 *     incrementFieldInCache('Session', selectedSessionId, 'inscriptions', 1)(cache);
 *
 *     // Ajoute l'inscription à la liste de l'utilisateur
 *     cache.modify({
 *       id: cache.identify({ __typename: 'User', id: currentUserId }),
 *       fields: {
 *         enrollments(existing = []) {
 *           return [...existing, newEnrollmentRef];
 *         }
 *       }
 *     });
 *   }
 * });
 * ```
 */
