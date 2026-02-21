import React, { ComponentType } from "react";
import { Spinner } from "@patternfly/react-core";

/**
 * ⚠️ NOTE: Ce HOC est simplifié
 *
 * Pour le fetching GraphQL, utilisez directement les hooks Apollo générés:
 * - useGetUsersQuery()
 * - useGetCoursesQuery()
 * - etc.
 *
 * Ces hooks sont générés automatiquement dans:
 * @/core/api/apollo/generated/graphql.ts
 *
 * EXEMPLE D'UTILISATION:
 * ```typescript
 * import { useGetUsersQuery } from '@/core/api/apollo/generated/graphql';
 *
 * function UsersList() {
 *   const { data, loading, error, refetch } = useGetUsersQuery();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {data?.users.map(user => <div key={user.id}>{user.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 *
 * Pour des cas d'usage avancés, consultez:
 * - /src/hocs/withLoading.tsx pour gérer les états de chargement
 * - /src/hocs/withErrorBoundary.tsx pour gérer les erreurs
 */

/**
 * Simple Error State Component
 */
const SimpleErrorState: React.FC<{ error: Error; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div
    style={{
      padding: "2rem",
      textAlign: "center",
      color: "var(--pf-global--danger-color--100)",
    }}
  >
    <p>Erreur: {error.message}</p>
    {onRetry && (
      <button onClick={onRetry} style={{ marginTop: "1rem" }}>
        Réessayer
      </button>
    )}
  </div>
);

/**
 * Simple Loading Component
 */
const SimpleLoadingState: React.FC = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px",
    }}
  >
    <Spinner />
  </div>
);

export { SimpleErrorState, SimpleLoadingState };

/**
 * Helper: Wrapper component pour gérer loading/error automatiquement
 *
 * @example
 * ```typescript
 * function UsersList() {
 *   const query = useGetUsersQuery();
 *
 *   return (
 *     <QueryWrapper query={query}>
 *       {(data) => (
 *         <div>
 *           {data.users.map(user => <div key={user.id}>{user.name}</div>)}
 *         </div>
 *       )}
 *     </QueryWrapper>
 *   );
 * }
 * ```
 */
export function QueryWrapper<TData>({
  query,
  children,
  LoadingComponent = SimpleLoadingState,
  ErrorComponent = SimpleErrorState,
}: {
  query: {
    data?: TData;
    loading: boolean;
    error?: Error;
    refetch?: () => void;
  };
  children: (data: TData) => React.ReactNode;
  LoadingComponent?: ComponentType;
  ErrorComponent?: ComponentType<{ error: Error; onRetry?: () => void }>;
}) {
  if (query.loading) {
    return <LoadingComponent />;
  }

  if (query.error) {
    return <ErrorComponent error={query.error} onRetry={query.refetch} />;
  }

  if (!query.data) {
    return null;
  }

  return <>{children(query.data)}</>;
}

export default QueryWrapper;
