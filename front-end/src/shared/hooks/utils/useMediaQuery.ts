/**
 * ====================================================================
 * useMediaQuery Hook
 * ====================================================================
 *
 * React hook for responsive design using CSS media queries.
 * Returns true/false based on whether the media query matches.
 *
 * Usage:
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * Common breakpoints for responsive design
 */
export const BREAKPOINTS = {
  xs: '(max-width: 575px)', // Mobile portrait
  sm: '(min-width: 576px) and (max-width: 767px)', // Mobile landscape
  md: '(min-width: 768px) and (max-width: 991px)', // Tablet
  lg: '(min-width: 992px) and (max-width: 1199px)', // Desktop
  xl: '(min-width: 1200px)', // Large desktop

  // Utility breakpoints
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 991px)',
  desktop: '(min-width: 992px)',

  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',

  // User preferences
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',

  // Touch capability
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
} as const;

/**
 * Hook to check if a media query matches
 *
 * @param query - CSS media query string
 * @returns Boolean indicating if the query matches
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *       {isDarkMode && <DarkModeStyles />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch in SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if matchMedia is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    // Use addEventListener if available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook to check multiple media queries at once
 *
 * @param queries - Object with named media queries
 * @returns Object with boolean values for each query
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useMediaQueries({
 *   isMobile: '(max-width: 767px)',
 *   isTablet: '(min-width: 768px) and (max-width: 991px)',
 *   isDesktop: '(min-width: 992px)',
 * });
 * ```
 */
export function useMediaQueries<T extends Record<string, string>>(
  queries: T
): { [K in keyof T]: boolean } {
  const [matches, setMatches] = useState<{ [K in keyof T]: boolean }>(() => {
    const initial = {} as { [K in keyof T]: boolean };
    for (const key in queries) {
      initial[key] = false;
    }
    return initial;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQueries: { [key: string]: MediaQueryList } = {};
    const handlers: { [key: string]: (e: MediaQueryListEvent) => void } = {};

    // Set up all media queries
    for (const key in queries) {
      const query = queries[key];
      const mediaQuery = window.matchMedia(query);

      mediaQueries[key] = mediaQuery;

      // Set initial value
      setMatches((prev) => ({
        ...prev,
        [key]: mediaQuery.matches,
      }));

      // Create handler
      handlers[key] = (event: MediaQueryListEvent) => {
        setMatches((prev) => ({
          ...prev,
          [key]: event.matches,
        }));
      };

      // Add listener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handlers[key]);
      } else {
        mediaQuery.addListener(handlers[key]);
      }
    }

    // Cleanup
    return () => {
      for (const key in mediaQueries) {
        const mediaQuery = mediaQueries[key];
        const handler = handlers[key];

        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handler);
        } else {
          mediaQuery.removeListener(handler);
        }
      }
    };
  }, [queries]);

  return matches;
}

/**
 * Predefined responsive hooks for common breakpoints
 */

export function useIsMobile(): boolean {
  return useMediaQuery(BREAKPOINTS.mobile);
}

export function useIsTablet(): boolean {
  return useMediaQuery(BREAKPOINTS.tablet);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.desktop);
}

export function useIsPortrait(): boolean {
  return useMediaQuery(BREAKPOINTS.portrait);
}

export function useIsLandscape(): boolean {
  return useMediaQuery(BREAKPOINTS.landscape);
}

export function useIsDarkMode(): boolean {
  return useMediaQuery(BREAKPOINTS.darkMode);
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(BREAKPOINTS.reducedMotion);
}

export function useIsTouchDevice(): boolean {
  return useMediaQuery(BREAKPOINTS.touch);
}

/**
 * Hook to get current breakpoint name
 *
 * @returns Current breakpoint name ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * // breakpoint = 'md'
 * ```
 */
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  const breakpoints = useMediaQueries({
    xs: BREAKPOINTS.xs,
    sm: BREAKPOINTS.sm,
    md: BREAKPOINTS.md,
    lg: BREAKPOINTS.lg,
    xl: BREAKPOINTS.xl,
  });

  if (breakpoints.xl) return 'xl';
  if (breakpoints.lg) return 'lg';
  if (breakpoints.md) return 'md';
  if (breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Hook to get responsive value based on breakpoint
 *
 * @param values - Object with values for each breakpoint
 * @param defaultValue - Default value if no breakpoint matches
 * @returns Value for current breakpoint
 *
 * @example
 * ```tsx
 * const columns = useResponsiveValue(
 *   { xs: 1, sm: 2, md: 3, lg: 4, xl: 6 },
 *   1
 * );
 * ```
 */
export function useResponsiveValue<T>(
  values: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', T>>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint();
  return values[breakpoint] ?? defaultValue;
}

// Export default
export default useMediaQuery;
