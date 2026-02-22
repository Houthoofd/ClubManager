/**
 * Test Helper: renderWithProviders
 *
 * A utility function to render React components with all necessary providers
 * (Apollo Client, i18n, Router, etc.) for testing purposes.
 *
 * Usage:
 *   import { renderWithProviders } from '@/__test-utils__/helpers/renderWithProviders';
 *
 *   renderWithProviders(<MyComponent />, {
 *     apolloMocks: [...],
 *     initialRoute: '/dashboard',
 *     i18n: customI18nInstance,
 *   });
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import i18n from '@/core/i18n/config';

/**
 * Options for rendering components with providers
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Apollo Client mock responses for GraphQL queries/mutations
   */
  apolloMocks?: MockedResponse[];

  /**
   * Whether to add Apollo typename to responses (default: false)
   */
  addTypename?: boolean;

  /**
   * Initial route for MemoryRouter (if provided, uses MemoryRouter instead of BrowserRouter)
   */
  initialRoute?: string;

  /**
   * Initial entries for MemoryRouter history
   */
  initialEntries?: string[];

  /**
   * Custom i18n instance (defaults to app's i18n config)
   */
  i18nInstance?: typeof i18n;

  /**
   * Whether to include router wrapper (default: true)
   */
  withRouter?: boolean;

  /**
   * Whether to include i18n wrapper (default: true)
   */
  withI18n?: boolean;

  /**
   * Whether to include Apollo wrapper (default: true if apolloMocks provided)
   */
  withApollo?: boolean;

  /**
   * Custom wrapper component to wrap around all providers
   */
  customWrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Extended render result with utilities
 */
export interface ExtendedRenderResult extends RenderResult {
  /**
   * Rerender the component with the same providers
   */
  rerenderWithProviders: (ui: ReactElement) => void;
}

/**
 * Default options
 */
const defaultOptions: Partial<RenderWithProvidersOptions> = {
  addTypename: false,
  withRouter: true,
  withI18n: true,
  withApollo: false,
};

/**
 * Renders a React element with all necessary providers for testing
 *
 * @param ui - The React element to render
 * @param options - Configuration options for providers
 * @returns Extended render result with helper utilities
 *
 * @example
 * // Basic usage
 * const { getByText } = renderWithProviders(<MyComponent />);
 *
 * @example
 * // With Apollo mocks
 * const mocks = [
 *   {
 *     request: { query: GET_USER, variables: { id: '1' } },
 *     result: { data: { user: { id: '1', name: 'John' } } },
 *   },
 * ];
 * renderWithProviders(<UserProfile userId="1" />, { apolloMocks: mocks });
 *
 * @example
 * // With routing
 * renderWithProviders(<Dashboard />, { initialRoute: '/dashboard' });
 *
 * @example
 * // Minimal providers (no router, no i18n)
 * renderWithProviders(<SimpleComponent />, {
 *   withRouter: false,
 *   withI18n: false,
 * });
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): ExtendedRenderResult {
  const {
    apolloMocks = [],
    addTypename = defaultOptions.addTypename,
    initialRoute,
    initialEntries,
    i18nInstance = i18n,
    withRouter = defaultOptions.withRouter,
    withI18n = defaultOptions.withI18n,
    withApollo = apolloMocks.length > 0 || defaultOptions.withApollo,
    customWrapper,
    ...renderOptions
  } = options;

  /**
   * Build the wrapper component with all requested providers
   */
  function AllProviders({ children }: { children: React.ReactNode }) {
    let wrapped = <>{children}</>;

    // Apollo Provider (innermost - closest to component)
    if (withApollo) {
      wrapped = (
        <MockedProvider mocks={apolloMocks} addTypename={addTypename}>
          {wrapped}
        </MockedProvider>
      );
    }

    // i18n Provider
    if (withI18n) {
      wrapped = <I18nextProvider i18n={i18nInstance}>{wrapped}</I18nextProvider>;
    }

    // Router Provider (outermost)
    if (withRouter) {
      if (initialRoute || initialEntries) {
        // Use MemoryRouter for controlled routing
        wrapped = (
          <MemoryRouter initialEntries={initialEntries || [initialRoute || '/']} initialIndex={0}>
            {wrapped}
          </MemoryRouter>
        );
      } else {
        // Use BrowserRouter for normal routing
        wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
      }
    }

    // Custom wrapper (outermost)
    if (customWrapper) {
      const CustomWrapper = customWrapper;
      wrapped = <CustomWrapper>{wrapped}</CustomWrapper>;
    }

    return wrapped;
  }

  // Render with all providers
  const renderResult = render(ui, {
    wrapper: AllProviders,
    ...renderOptions,
  });

  /**
   * Helper to rerender with the same providers
   */
  const rerenderWithProviders = (newUI: ReactElement) => {
    return renderResult.rerender(<AllProviders>{newUI}</AllProviders>);
  };

  return {
    ...renderResult,
    rerenderWithProviders,
  };
}

/**
 * Shortcut to render with only Apollo provider
 */
export function renderWithApollo(ui: ReactElement, mocks: MockedResponse[] = []) {
  return renderWithProviders(ui, {
    apolloMocks: mocks,
    withRouter: false,
    withI18n: false,
  });
}

/**
 * Shortcut to render with only Router provider
 */
export function renderWithRouter(ui: ReactElement, initialRoute: string = '/') {
  return renderWithProviders(ui, {
    initialRoute,
    withI18n: false,
    withApollo: false,
  });
}

/**
 * Shortcut to render with only i18n provider
 */
export function renderWithI18n(ui: ReactElement, i18nInstance: typeof i18n = i18n) {
  return renderWithProviders(ui, {
    i18nInstance,
    withRouter: false,
    withApollo: false,
  });
}

/**
 * Shortcut to render without any providers (bare render)
 */
export function renderBare(ui: ReactElement, options: RenderOptions = {}) {
  return render(ui, options);
}

export default renderWithProviders;
