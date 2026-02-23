/**
 * EmptyUserState Component
 *
 * Displays empty state when no users are available
 * Supports different variants (default, search, filter, error)
 */

import React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
  Button,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import {
  UsersIcon,
  SearchIcon,
  FilterIcon,
  ExclamationCircleIcon,
} from '@/shared/icons';
import { useTranslation } from 'react-i18next';

/**
 * Props for EmptyUserState component
 */
export interface EmptyUserStateProps {
  /**
   * Title text for empty state
   */
  title?: string;

  /**
   * Description text for empty state
   */
  description?: string;

  /**
   * Icon to display
   */
  icon?: React.ComponentType<any>;

  /**
   * Action button text
   */
  actionText?: string;

  /**
   * Action button handler
   */
  onAction?: () => void;

  /**
   * Secondary action button text
   */
  secondaryActionText?: string;

  /**
   * Secondary action button handler
   */
  onSecondaryAction?: () => void;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Show illustration/image
   * @default true
   */
  showIcon?: boolean;

  /**
   * Variant type
   * @default 'default'
   */
  variant?: 'default' | 'search' | 'filter' | 'error';
}

/**
 * Get default icon for variant
 */
const getDefaultIcon = (variant: EmptyUserStateProps['variant']): React.ComponentType<any> => {
  const icons = {
    default: UsersIcon,
    search: SearchIcon,
    filter: FilterIcon,
    error: ExclamationCircleIcon,
  };
  return icons[variant || 'default'];
};

/**
 * EmptyUserState component
 */
export const EmptyUserState: React.FC<EmptyUserStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className,
  showIcon = true,
  variant = 'default',
}) => {
  const { t } = useTranslation();

  // Get default content based on variant
  const getDefaultTitle = () => {
    switch (variant) {
      case 'search':
        return t('users.empty.search.title', { defaultValue: 'Aucun utilisateur trouvé' });
      case 'filter':
        return t('users.empty.filter.title', { defaultValue: 'Aucun utilisateur ne correspond aux filtres' });
      case 'error':
        return t('users.empty.error.title', { defaultValue: 'Erreur de chargement' });
      default:
        return t('users.list.noUsers', { defaultValue: 'Aucun utilisateur' });
    }
  };

  const getDefaultDescription = () => {
    switch (variant) {
      case 'search':
        return t('users.empty.search.description', {
          defaultValue: 'Aucun utilisateur ne correspond à votre recherche. Essayez avec d\'autres termes.',
        });
      case 'filter':
        return t('users.empty.filter.description', {
          defaultValue: 'Essayez de modifier ou supprimer certains filtres pour voir plus de résultats.',
        });
      case 'error':
        return t('users.empty.error.description', {
          defaultValue: 'Une erreur est survenue lors du chargement des utilisateurs.',
        });
      default:
        return t('users.list.noUsersMessage', {
          defaultValue: 'Il n\'y a aucun utilisateur pour le moment. Les nouveaux utilisateurs apparaîtront ici.',
        });
    }
  };

  const getDefaultActionText = () => {
    switch (variant) {
      case 'search':
      case 'filter':
        return t('common.actions.clear', { defaultValue: 'Effacer les filtres' });
      case 'error':
        return t('common.actions.refresh', { defaultValue: 'Réessayer' });
      default:
        return t('users.list.addUser', { defaultValue: 'Ajouter un utilisateur' });
    }
  };

  const IconComponent = icon || getDefaultIcon(variant);
  const displayTitle = title || getDefaultTitle();
  const displayDescription = description || getDefaultDescription();
  const displayActionText = actionText || (onAction ? getDefaultActionText() : undefined);

  return (
    <EmptyState variant={EmptyStateVariant.sm} className={className}>
      <EmptyStateHeader
        titleText={displayTitle}
        icon={showIcon ? <EmptyStateIcon icon={IconComponent} /> : undefined}
        headingLevel="h4"
      />
      <EmptyStateBody>{displayDescription}</EmptyStateBody>
      {(onAction || onSecondaryAction) && (
        <EmptyStateFooter>
          {onAction && displayActionText && (
            <Button variant="primary" onClick={onAction}>
              {displayActionText}
            </Button>
          )}
          {onSecondaryAction && secondaryActionText && (
            <EmptyStateActions>
              <Button variant="link" onClick={onSecondaryAction}>
                {secondaryActionText}
              </Button>
            </EmptyStateActions>
          )}
        </EmptyStateFooter>
      )}
    </EmptyState>
  );
};

export default EmptyUserState;
