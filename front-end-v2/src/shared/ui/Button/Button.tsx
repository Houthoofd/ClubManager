/**
 * Shared Button Component
 *
 * Composant Button réutilisable basé sur PatternFly avec des améliorations.
 * Utilisé comme base pour tous les boutons de l'application.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Cliquer ici
 * </Button>
 *
 * <Button variant="danger" loading>
 *   Chargement...
 * </Button>
 * ```
 */

import React from 'react';
import { Button as PFButton, Spinner } from '@patternfly/react-core';
import type { ButtonProps as PFButtonProps } from '@patternfly/react-core';

// ============================================================================
// Types
// ============================================================================

export interface ButtonProps extends Omit<PFButtonProps, 'isLoading'> {
  /**
   * Affiche un spinner et désactive le bouton
   */
  loading?: boolean;

  /**
   * Texte affiché pendant le chargement
   */
  loadingText?: string;

  /**
   * Taille du bouton
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Largeur complète
   */
  fullWidth?: boolean;

  /**
   * Icône à gauche du texte
   */
  iconLeft?: React.ReactNode;

  /**
   * Icône à droite du texte
   */
  iconRight?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      size = 'md',
      fullWidth = false,
      iconLeft,
      iconRight,
      isDisabled,
      className = '',
      ...restProps
    },
    ref
  ) => {
    // Classes CSS personnalisées
    const sizeClass = size === 'sm' ? 'pf-m-small' : size === 'lg' ? 'pf-m-large' : '';
    const widthClass = fullWidth ? 'pf-m-block' : '';
    const customClasses = [sizeClass, widthClass, className].filter(Boolean).join(' ');

    // Contenu du bouton
    const buttonContent = loading ? (
      <>
        <Spinner size="md" style={{ marginRight: '8px' }} />
        {loadingText || 'Chargement...'}
      </>
    ) : (
      <>
        {iconLeft && <span style={{ marginRight: '8px' }}>{iconLeft}</span>}
        {children}
        {iconRight && <span style={{ marginLeft: '8px' }}>{iconRight}</span>}
      </>
    );

    return (
      <PFButton
        ref={ref}
        isDisabled={loading || isDisabled}
        className={customClasses}
        {...restProps}
      >
        {buttonContent}
      </PFButton>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// Exports
// ============================================================================

export default Button;
