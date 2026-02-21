import React, { ComponentType, useEffect } from 'react';
import * as Sentry from '@sentry/react';

/**
 * Configuration options for tracking
 */
export interface TrackingOptions {
  /**
   * Event name to track when component mounts
   */
  eventName?: string;

  /**
   * Additional properties to send with the event
   */
  properties?: Record<string, any>;

  /**
   * Whether to track page views
   */
  trackPageView?: boolean;

  /**
   * Whether to track component lifecycle (mount/unmount)
   */
  trackLifecycle?: boolean;

  /**
   * Custom tracking function
   */
  customTracker?: (eventName: string, properties: Record<string, any>) => void;
}

/**
 * Props injected by withTracking HOC
 */
export interface TrackingProps {
  /**
   * Function to manually track events
   */
  track: (eventName: string, properties?: Record<string, any>) => void;
}

/**
 * Default tracking function using Sentry breadcrumbs
 */
const defaultTracker = (eventName: string, properties: Record<string, any> = {}) => {
  // Send to Sentry as breadcrumb
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: eventName,
    level: 'info',
    data: properties,
  });

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Tracking]', eventName, properties);
  }

  // Here you can add other analytics providers
  // Example: Google Analytics, Mixpanel, etc.
  // if (window.gtag) {
  //   window.gtag('event', eventName, properties);
  // }
};

/**
 * HOC that adds tracking capabilities to a component
 *
 * @example
 * ```tsx
 * const TrackedDashboard = withTracking({
 *   eventName: 'dashboard_viewed',
 *   trackPageView: true,
 *   properties: { section: 'main' }
 * })(Dashboard);
 * ```
 */
export function withTracking<P extends object>(
  options: TrackingOptions = {}
) {
  return function (Component: ComponentType<P>) {
    const WithTracking: React.FC<P> = (props) => {
      const {
        eventName,
        properties = {},
        trackPageView = false,
        trackLifecycle = true,
        customTracker,
      } = options;

      const tracker = customTracker || defaultTracker;

      useEffect(() => {
        // Track component mount
        if (trackLifecycle && eventName) {
          tracker(`${eventName}_mounted`, {
            ...properties,
            timestamp: new Date().toISOString(),
          });
        }

        // Track page view
        if (trackPageView) {
          tracker('page_view', {
            page: window.location.pathname,
            ...properties,
          });
        }

        // Track component unmount
        return () => {
          if (trackLifecycle && eventName) {
            tracker(`${eventName}_unmounted`, {
              ...properties,
              timestamp: new Date().toISOString(),
            });
          }
        };
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      // Provide track function to wrapped component
      const track = (name: string, eventProps?: Record<string, any>) => {
        tracker(name, { ...properties, ...eventProps });
      };

      return <Component {...props} track={track} />;
    };

    WithTracking.displayName = `withTracking(${Component.displayName || Component.name || 'Component'})`;

    return WithTracking;
  };
}

/**
 * Hook version of tracking functionality
 * Can be used as an alternative to the HOC
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const track = useTracking();
 *
 *   const handleClick = () => {
 *     track('button_clicked', { buttonId: 'submit' });
 *   };
 * }
 * ```
 */
export function useTracking(
  options: Pick<TrackingOptions, 'customTracker'> = {}
): (eventName: string, properties?: Record<string, any>) => void {
  const tracker = options.customTracker || defaultTracker;

  return (eventName: string, properties?: Record<string, any>) => {
    tracker(eventName, properties || {});
  };
}

export default withTracking;
