/**
 * UserList Component
 *
 * Displays a list of users in grid or list layout
 * Supports pagination, sorting, and bulk actions
 */

import React from 'react';
import {
  Gallery,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Pagination,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
  Spinner,
} from '@patternfly/react-core';
import { UsersIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { UserCard } from '../UserCard';
import { User } from '../UserCard/UserCard.types';

/**
 * Props for UserList component
 */
export interface UserListProps {
  /**
   * Array of users to display
   */
  users: User[];

  /**
   * Click handler for viewing user details
   */
  onView?: (user: User) => void;

  /**
   * Click handler for editing user
   */
  onEdit?: (user: User) => void;

  /**
   * Click handler for deleting user
   */
  onDelete?: (user: User) => void;

  /**
   * Click handler for activating user
   */
  onActivate?: (user: User) => void;

  /**
   * Click handler for deactivating user
   */
  onDeactivate?: (user: User) => void;

  /**
   * Show actions buttons
   * @default true
   */
  showActions?: boolean;

  /**
   * Enable pagination
   * @default false
   */
  enablePagination?: boolean;

  /**
   * Current page (1-based)
   */
  currentPage?: number;

  /**
   * Items per page
   * @default 20
   */
  pageSize?: number;

  /**
   * Total number of users (for pagination)
   */
  totalCount?: number;

  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Number of skeleton items to show when loading
   * @default 6
   */
  loadingCount?: number;

  /**
   * Empty state component (shown when no users)
   */
  emptyState?: React.ReactNode;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Compact mode (reduced spacing)
   * @default false
   */
  isCompact?: boolean;
}

/**
 * UserList component
 */
export const UserList: React.FC<UserListProps> = ({
  users,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  showActions = true,
  enablePagination = false,
  currentPage = 1,
  pageSize = 20,
  totalCount,
  onPageChange,
  isLoading = false,
  loadingCount = 6,
  emptyState,
  className,
  isCompact = false,
}) => {
  const { t } = useTranslation();

  // Calculate pagination
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Get users to display (paginated or all)
  const displayUsers = enablePagination
    ? users.slice(startIndex, endIndex)
    : users;

  // Handle page change
  const handlePageChange = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Handle per-page change
  const handlePerPageChange = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number
  ) => {
    // Reset to page 1 when changing page size
    if (onPageChange) {
      onPageChange(1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        {enablePagination && (
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem variant="pagination" alignment={{ default: 'alignRight' }}>
                <Pagination
                  itemCount={loadingCount}
                  page={1}
                  perPage={pageSize}
                  isDisabled
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        )}

        <Gallery hasGutter minWidths={{ default: '100%', md: '300px', lg: '350px' }}>
          {Array.from({ length: loadingCount }).map((_, index) => (
            <UserCard
              key={`skeleton-${index}`}
              user={{} as any}
              isLoading
              showActions={showActions}
              isCompact={isCompact}
            />
          ))}
        </Gallery>
      </div>
    );
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <div className={className}>
        {emptyState || (
          <EmptyState>
            <EmptyStateIcon icon={UsersIcon} />
            <Title headingLevel="h4" size="lg">
              {t('users.list.noUsers', { defaultValue: 'Aucun utilisateur' })}
            </Title>
            <EmptyStateBody>
              {t('users.list.noUsersMessage', { defaultValue: 'Il n\'y a aucun utilisateur pour le moment.' })}
            </EmptyStateBody>
          </EmptyState>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Pagination toolbar (top) */}
      {enablePagination && (
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem variant="pagination" alignment={{ default: 'alignRight' }}>
              <Pagination
                itemCount={totalCount || users.length}
                page={currentPage}
                perPage={pageSize}
                onSetPage={handlePageChange}
                onPerPageSelect={handlePerPageChange}
                perPageOptions={[
                  { title: '10', value: 10 },
                  { title: '20', value: 20 },
                  { title: '50', value: 50 },
                  { title: '100', value: 100 },
                ]}
                titles={{
                  items: t('common.pagination.items', { defaultValue: 'éléments' }),
                  page: t('common.pagination.page', { defaultValue: 'Page' }),
                  itemsPerPage: t('common.pagination.itemsPerPage', { defaultValue: 'Éléments par page' }),
                  perPageSuffix: t('common.pagination.perPageSuffix', { defaultValue: 'par page' }),
                  toFirstPage: t('common.pagination.first', { defaultValue: 'Première page' }),
                  toPreviousPage: t('common.pagination.previous', { defaultValue: 'Page précédente' }),
                  toLastPage: t('common.pagination.last', { defaultValue: 'Dernière page' }),
                  toNextPage: t('common.pagination.next', { defaultValue: 'Page suivante' }),
                }}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      )}

      {/* Grid layout */}
      <Gallery
        hasGutter
        minWidths={{
          default: '100%',
          sm: '100%',
          md: '300px',
          lg: '350px',
          xl: '400px',
        }}
      >
        {displayUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            showActions={showActions}
            isCompact={isCompact}
          />
        ))}
      </Gallery>

      {/* Pagination toolbar (bottom) */}
      {enablePagination && users.length > 10 && (
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem variant="pagination" alignment={{ default: 'alignRight' }}>
              <Pagination
                itemCount={totalCount || users.length}
                page={currentPage}
                perPage={pageSize}
                onSetPage={handlePageChange}
                onPerPageSelect={handlePerPageChange}
                variant="bottom"
                perPageOptions={[
                  { title: '10', value: 10 },
                  { title: '20', value: 20 },
                  { title: '50', value: 50 },
                  { title: '100', value: 100 },
                ]}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      )}
    </div>
  );
};

export default UserList;
