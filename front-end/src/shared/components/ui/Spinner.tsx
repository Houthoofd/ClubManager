/**
 * ====================================================================
 * Spinner Component
 * ====================================================================
 *
 * Loading spinner component wrapping PatternFly Spinner.
 * Provides consistent loading indicators across the application.
 *
 * Usage:
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" />
 * <Spinner text="Loading..." />
 * ```
 */

import React from 'react';
import { Spinner as PFSpinner } from '@patternfly/react-core';

/**
 * Spinner size variants
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spinner component props
 */
export interface SpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: SpinnerSize;

  /**
   * Loading text to display next to spinner
   */
  text?: string;

  /**
   * Center the spinner in its container
   * @default false
   */
  centered?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Aria label for accessibility
   * @default 'Loading'
   */
  ariaLabel?: string;

  /**
   * Inline display (doesn't take full width)
   * @default false
   */
  inline?: boolean;
}

/**
 * Spinner component for loading states
 *
 * @example
 * ```tsx
 * // Basic spinner
 * <Spinner />
 *
 * // With text
 * <Spinner text="Loading data..." />
 *
 * // Large centered spinner
 * <Spinner size="lg" centered />
 *
 * // Inline spinner
 * <Spinner size="sm" text="Loading..." inline />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  text,
  centered = false,
  className = '',
  ariaLabel = 'Loading',
  inline = false,
}) => {
  // Map our size to PatternFly size
  const pfSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : 'md';

  const spinnerContent = (
    <>
      <PFSpinner size={pfSize} aria-label={ariaLabel} />
      {text && <span style={{ marginLeft: '0.5rem' }}>{text}</span>}
    </>
  );

  if (centered) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '100px',
        }}
      >
        {spinnerContent}
      </div>
    );
  }

  if (inline) {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {spinnerContent}
      </span>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center' }}>
      {spinnerContent}
    </div>
  );
};

/**
 * Full-page loading spinner (covers entire screen)
 *
 * @example
 * ```tsx
 * <FullPageSpinner text="Loading application..." />
 * ```
 */
export const FullPageSpinner: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999,
      }}
    >
      <PFSpinner size="xl" aria-label="Loading" />
      {text && (
        <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#151515' }}>{text}</p>
      )}
    </div>
  );
};

export default Spinner;
