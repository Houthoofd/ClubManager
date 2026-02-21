import React, { ComponentType } from "react";
import { Spinner } from "@patternfly/react-core";

/**
 * Simple Skeleton Loader Component
 */
const SkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div style={{ padding: "1rem" }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          height: "20px",
          backgroundColor: "var(--pf-global--BackgroundColor--200)",
          marginBottom: "0.5rem",
          borderRadius: "4px",
          animation: "skeleton-loading 1.5s ease-in-out infinite",
        }}
      />
    ))}
    <style>{`
      @keyframes skeleton-loading {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    `}</style>
  </div>
);

/**
 * Configuration options for withLoading HOC
 */
export interface WithLoadingOptions {
  /**
   * Type of loading indicator to display
   * - 'spinner': Show a centered spinner
   * - 'skeleton': Show skeleton loader
   * - 'custom': Use custom loading component
   */
  type?: "spinner" | "skeleton" | "custom";

  /**
   * Custom loading component to render when type is 'custom'
   */
  loadingComponent?: React.ComponentType;

  /**
   * Size of the spinner (when type is 'spinner')
   */
  spinnerSize?: "sm" | "md" | "lg" | "xl";

  /**
   * Number of skeleton rows (when type is 'skeleton')
   */
  skeletonRows?: number;

  /**
   * Minimum loading time in ms to prevent flashing
   */
  minLoadingTime?: number;

  /**
   * Custom CSS class for the loading container
   */
  className?: string;

  /**
   * Show loading overlay on top of content instead of replacing it
   */
  overlay?: boolean;
}

/**
 * Props injected by withLoading HOC
 */
export interface WithLoadingProps {
  isLoading?: boolean;
  loadingMessage?: string;
}

/**
 * Default loading component - centered spinner
 */
const DefaultSpinnerLoading: React.FC<{ size?: string; message?: string }> = ({
  size = "xl",
  message,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "300px",
      gap: "1rem",
    }}
  >
    <Spinner size={size as any} />
    {message && <div style={{ color: "var(--pf-global--Color--200)" }}>{message}</div>}
  </div>
);

/**
 * HOC that adds loading state management to a component
 *
 * @example
 * ```tsx
 * const UserProfile = ({ user }) => (
 *   <div>{user.name}</div>
 * );
 *
 * export default withLoading(UserProfile, {
 *   type: 'skeleton',
 *   skeletonRows: 5
 * });
 *
 * // Usage
 * <UserProfile isLoading={loading} user={user} />
 * ```
 */
export function withLoading<P extends object>(
  Component: ComponentType<P>,
  options: WithLoadingOptions = {},
) {
  const {
    type = "spinner",
    loadingComponent: CustomLoadingComponent,
    spinnerSize = "xl",
    skeletonRows = 5,
    minLoadingTime = 0,
    className = "",
    overlay = false,
  } = options;

  const WithLoading: React.FC<P & WithLoadingProps> = (props) => {
    const { isLoading, loadingMessage, ...restProps } = props;
    const [showLoading, setShowLoading] = React.useState(false);
    const loadingStartTimeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
      if (isLoading) {
        // Start loading
        loadingStartTimeRef.current = Date.now();
        setShowLoading(true);
      } else if (loadingStartTimeRef.current !== null) {
        // Stop loading with minimum time
        const elapsed = Date.now() - loadingStartTimeRef.current;
        const remaining = Math.max(0, minLoadingTime - elapsed);

        if (remaining > 0) {
          const timer = setTimeout(() => {
            setShowLoading(false);
            loadingStartTimeRef.current = null;
          }, remaining);
          return () => clearTimeout(timer);
        } else {
          setShowLoading(false);
          loadingStartTimeRef.current = null;
        }
      }
      return undefined;
    }, [isLoading]);

    const renderLoadingIndicator = () => {
      if (CustomLoadingComponent) {
        return <CustomLoadingComponent />;
      }

      switch (type) {
        case "skeleton":
          return <SkeletonLoader rows={skeletonRows} />;
        case "spinner":
          return <DefaultSpinnerLoading size={spinnerSize} message={loadingMessage} />;
        default:
          return <DefaultSpinnerLoading size={spinnerSize} message={loadingMessage} />;
      }
    };

    if (showLoading && !overlay) {
      return <div className={className}>{renderLoadingIndicator()}</div>;
    }

    if (showLoading && overlay) {
      return (
        <div style={{ position: "relative" }}>
          <div style={{ opacity: 0.5, pointerEvents: "none" }}>
            <Component {...(restProps as P)} />
          </div>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 1000,
            }}
            className={className}
          >
            {renderLoadingIndicator()}
          </div>
        </div>
      );
    }

    return <Component {...(restProps as P)} />;
  };

  WithLoading.displayName = `WithLoading(${Component.displayName || Component.name || "Component"})`;

  return WithLoading;
}

/**
 * Hook version of withLoading for functional components
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const { data, loading } = useQuery(GET_USER, { variables: { userId } });
 *   const LoadingWrapper = useLoadingWrapper({ type: 'skeleton' });
 *
 *   return (
 *     <LoadingWrapper isLoading={loading}>
 *       <div>{data?.user.name}</div>
 *     </LoadingWrapper>
 *   );
 * }
 * ```
 */
export function useLoadingWrapper(options: WithLoadingOptions = {}) {
  const {
    type = "spinner",
    loadingComponent: CustomLoadingComponent,
    spinnerSize = "xl",
    skeletonRows = 5,
    className = "",
  } = options;

  return React.useCallback<
    React.FC<{ isLoading?: boolean; loadingMessage?: string; children: React.ReactNode }>
  >(
    ({ isLoading, loadingMessage, children }) => {
      if (!isLoading) {
        return <>{children}</>;
      }

      const renderLoadingIndicator = () => {
        if (CustomLoadingComponent) {
          return <CustomLoadingComponent />;
        }

        switch (type) {
          case "skeleton":
            return <SkeletonLoader rows={skeletonRows} />;
          case "spinner":
            return <DefaultSpinnerLoading size={spinnerSize} message={loadingMessage} />;
          default:
            return <DefaultSpinnerLoading size={spinnerSize} message={loadingMessage} />;
        }
      };

      return <div className={className}>{renderLoadingIndicator()}</div>;
    },
    [type, CustomLoadingComponent, spinnerSize, skeletonRows, className],
  );
}

export default withLoading;
