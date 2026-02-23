/**
 * ====================================================================
 * I18N LOADER - Suspense Wrapper for Lazy-Loaded Translations
 * ====================================================================
 *
 * Component that wraps the application with React Suspense to handle
 * lazy-loaded translations gracefully.
 *
 * FEATURES:
 * ✅ Shows loading skeleton while translations load
 * ✅ Prevents FOUC (Flash of Unstyled Content)
 * ✅ Works with lazy i18n backend
 * ✅ Minimal UI disruption
 *
 * USAGE:
 * ```tsx
 * import { I18nLoader } from '@/core/i18n/I18nLoader';
 *
 * <I18nLoader>
 *   <App />
 * </I18nLoader>
 * ```
 */

import React, { Suspense, ReactNode } from "react";
import { Spinner } from "@patternfly/react-core";

// ====================================================================
// TYPES
// ====================================================================

interface I18nLoaderProps {
  children: ReactNode;
}

// ====================================================================
// LOADING FALLBACK
// ====================================================================

const I18nLoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        background: "var(--pf-v5-global--BackgroundColor--100)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Spinner size="xl" aria-label="Loading translations" />
        <p style={{ marginTop: "1rem", color: "var(--pf-v5-global--Color--200)" }}>
          Loading translations...
        </p>
      </div>
    </div>
  );
};

// ====================================================================
// COMPONENT
// ====================================================================

/**
 * I18nLoader - Wraps children with Suspense for lazy i18n loading
 *
 * Shows a loading spinner while the selected language file is being
 * dynamically imported. Once loaded, renders children normally.
 *
 * @param {ReactNode} children - App content
 * @returns {JSX.Element}
 */
export const I18nLoader: React.FC<I18nLoaderProps> = ({ children }) => {
  return <Suspense fallback={<I18nLoadingFallback />}>{children}</Suspense>;
};

// ====================================================================
// EXPORTS
// ====================================================================

export default I18nLoader;
