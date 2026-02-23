/**
 * ManageUsersPage
 *
 * Comprehensive user management page using atomic components and business hooks
 * Features: search, filters, stats, GraphQL integration, Zustand notifications
 *
 * Refactored architecture:
 * - Atomic components (UserList, UserSearch, UserCard, etc.)
 * - Business hooks (useUserSearch, useUserFilter)
 * - GraphQL queries/mutations
 * - i18n support
 * - Analytics tracking
 * - Error boundaries
 */

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Title,
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  FlexItem,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Select,
  SelectOption,
  SelectVariant,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  Alert,
  Spinner,
  Grid,
  GridItem,
  Card,
  CardBody,
} from '@patternfly/react-core';
import {
  FilterIcon,
  SyncAltIcon,
  PlusIcon,
  ExportIcon,
  UsersIcon,
  CheckCircleIcon,
  TimesCircleIcon,
} from '@/shared/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Components
import {
  UserList,
  UserSearch,
  EmptyUserState,
  User,
} from '../components';

// Hooks
import { useUserSearch } from '../hooks/useUserSearch';
import { useUserFilter } from '../hooks/useUserFilter';

// Store
import { useUIStore } from '@/core/store/uiStore';

// Utils
import { UserRole, UserStatus } from '../utils/user-formatters';

/**
 * GraphQL Queries
 */
const GET_USERS = gql`
  query GetUsers(
    $role: UserRole
    $status: UserStatus
    $limit: Int
    $offset: Int
    $searchQuery: String
  ) {
    users(
      role: $role
      status: $status
      limit: $limit
      offset: $offset
      searchQuery: $searchQuery
    ) {
      id
      firstName
      lastName
      email
      phone
      role
      status
      avatar
      birthDate
      createdAt
      lastLogin
      grade
      subscription
      bio
    }
    userStats {
      totalUsers
      activeUsers
      inactiveUsers
      byRole {
        role
        count
      }
      byStatus {
        status
        count
      }
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
`;

const ACTIVATE_USER = gql`
  mutation ActivateUser($id: ID!) {
    activateUser(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

const DEACTIVATE_USER = gql`
  mutation DeactivateUser($id: ID!) {
    deactivateUser(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

/**
 * ManageUsersPage Component
 */
export const ManageUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();

  // State
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // GraphQL
  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: {
      limit: 100,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
    onError: (err) => {
      showNotification({
        type: 'danger',
        title: t('users.errors.loadFailed', { defaultValue: 'Erreur de chargement' }),
        message: err.message,
      });
    },
  });

  const [deleteUser, { loading: deleteLoading }] = useMutation(DELETE_USER, {
    onCompleted: () => {
      showNotification({
        type: 'success',
        title: t('users.notifications.deleted', { defaultValue: 'Utilisateur supprimé' }),
      });
      setDeleteModalOpen(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (err) => {
      showNotification({
        type: 'danger',
        title: t('users.errors.deleteFailed', { defaultValue: 'Erreur de suppression' }),
        message: err.message,
      });
    },
  });

  const [activateUser, { loading: activateLoading }] = useMutation(ACTIVATE_USER, {
    onCompleted: () => {
      showNotification({
        type: 'success',
        title: t('users.notifications.activated', { defaultValue: 'Utilisateur activé' }),
      });
      setActivateModalOpen(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (err) => {
      showNotification({
        type: 'danger',
        title: t('users.errors.activateFailed', { defaultValue: 'Erreur d\'activation' }),
        message: err.message,
      });
    },
  });

  const [deactivateUser, { loading: deactivateLoading }] = useMutation(DEACTIVATE_USER, {
    onCompleted: () => {
      showNotification({
        type: 'success',
        title: t('users.notifications.deactivated', { defaultValue: 'Utilisateur désactivé' }),
      });
      setDeactivateModalOpen(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (err) => {
      showNotification({
        type: 'danger',
        title: t('users.errors.deactivateFailed', { defaultValue: 'Erreur de désactivation' }),
        message: err.message,
      });
    },
  });

  // Extract data
  const users: User[] = data?.users || [];
  const stats = data?.userStats || {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  };

  // Hooks - Search
  const {
    searchQuery,
    setSearchQuery,
    filteredUsers: searchedUsers,
    clearSearch,
    isSearching,
  } = useUserSearch(users, {
    searchFields: ['firstName', 'lastName', 'email', 'phone', 'grade'],
  });

  // Hooks - Filter
  const {
    filters,
    filteredUsers: finalUsers,
    setRoleFilter,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
  } = useUserFilter(searchedUsers);

  // Handlers
  const handleViewUser = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}`);
    },
    [navigate]
  );

  const handleEditUser = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}/edit`);
    },
    [navigate]
  );

  const handleDeleteClick = useCallback((user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  }, []);

  const handleActivateClick = useCallback((user: User) => {
    setSelectedUser(user);
    setActivateModalOpen(true);
  }, []);

  const handleDeactivateClick = useCallback((user: User) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (selectedUser) {
      deleteUser({ variables: { id: selectedUser.id } });
    }
  }, [selectedUser, deleteUser]);

  const handleConfirmActivate = useCallback(() => {
    if (selectedUser) {
      activateUser({ variables: { id: selectedUser.id } });
    }
  }, [selectedUser, activateUser]);

  const handleConfirmDeactivate = useCallback(() => {
    if (selectedUser) {
      deactivateUser({ variables: { id: selectedUser.id } });
    }
  }, [selectedUser, deactivateUser]);

  const handleRefresh = useCallback(() => {
    refetch();
    showNotification({
      type: 'info',
      title: t('common.messages.success'),
      message: t('users.notifications.refreshed', { defaultValue: 'Données actualisées' }),
    });
  }, [refetch, showNotification, t]);

  const handleAddUser = useCallback(() => {
    navigate('/users/add');
  }, [navigate]);

  // Breadcrumb
  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbItem to="/">{t('navigation.menu.home')}</BreadcrumbItem>
      <BreadcrumbItem to="/users" isActive>
        {t('users.list.title', { defaultValue: 'Utilisateurs' })}
      </BreadcrumbItem>
    </Breadcrumb>
  );

  // Error state
  if (error && !loading) {
    return (
      <Page breadcrumb={breadcrumb}>
        <PageSection variant={PageSectionVariants.light}>
          <Alert variant="danger" title={t('errors.generic')}>
            {error.message}
          </Alert>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page breadcrumb={breadcrumb}>
      {/* Header */}
      <PageSection variant={PageSectionVariants.light}>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              {t('users.list.title', { defaultValue: 'Gestion des utilisateurs' })}
            </Title>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Button
                  variant="primary"
                  icon={<PlusIcon />}
                  onClick={handleAddUser}
                >
                  {t('users.list.addUser', { defaultValue: 'Ajouter un utilisateur' })}
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="secondary"
                  icon={<SyncAltIcon />}
                  onClick={handleRefresh}
                  isLoading={loading}
                >
                  {t('common.actions.refresh')}
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="secondary" icon={<ExportIcon />} isDisabled>
                  {t('common.actions.export')}
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Statistics */}
      <PageSection variant={PageSectionVariants.light}>
        <Grid hasGutter>
          <GridItem span={4}>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <UsersIcon style={{ fontSize: '2rem', color: 'var(--pf-global--primary-color--100)' }} />
                  </FlexItem>
                  <FlexItem>
                    <TextContent>
                      <Text component="small" style={{ color: 'var(--pf-global--Color--200)' }}>
                        {t('users.stats.total', { defaultValue: 'Total utilisateurs' })}
                      </Text>
                    </TextContent>
                  </FlexItem>
                  <FlexItem>
                    <TextContent>
                      <Text component="h2" style={{ color: 'var(--pf-global--primary-color--100)' }}>
                        {stats.totalUsers}
                      </Text>
                    </TextContent>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <CheckCircleIcon style={{ fontSize: '2rem', color: 'var(--pf-global--success-color--100)' }} />
                  </FlexItem>
                  <FlexItem>
                    <TextContent>
                      <Text component="small" style={{ color: 'var(--pf-global--Color--200)' }}>
                        {t('users.stats.active', { defaultValue: 'Utilisateurs actifs' })}
                      </Text>
                    </TextContent>
                  </FlexItem>
                  <FlexItem>
                    <TextContent>
                      <Text component="h2" style={{ color: 'var(--pf-global--success-color--100)' }}>
                        {stats.activeUsers}
                      </Text>
                    </TextContent>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <TimesCircleIcon style={{ fontSize: '2rem', color: 'var(--pf-global--Color--200)' }} />
                  </FlexItem>
                  <FlexItem>
                    <TextContent>
                      <Text component="small" style={{ color: 'var(--pf-global--Color--200)' }}>
                        {t('users.stats.inactive', { defaultValue: 'Utilisateurs inactifs' })}
                      </Text>
                    </TextContent>
                  </FlexItem>
                  <FlexItem>
                    <TextContent>
                      <Text component="h2" style={{ color: 'var(--pf-global--Color--200)' }}>
                        {stats.inactiveUsers}
                      </Text>
                    </TextContent>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>

      {/* Search & Filters */}
      <PageSection variant={PageSectionVariants.light}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem style={{ flex: 1 }}>
              <UserSearch
                value={searchQuery}
                onChange={setSearchQuery}
                isLoading={loading}
              />
            </ToolbarItem>
            <ToolbarItem>
              <Select
                variant={SelectVariant.single}
                onToggle={(_event, isOpen) => setIsRoleFilterOpen(isOpen)}
                onSelect={(_event, value) => {
                  setRoleFilter(value as UserRole | 'all');
                  setIsRoleFilterOpen(false);
                }}
                selections={filters.role}
                isOpen={isRoleFilterOpen}
                placeholderText={t('users.filters.role', { defaultValue: 'Filtrer par rôle' })}
                toggleIcon={<FilterIcon />}
              >
                <SelectOption value="all">{t('users.filters.all', { defaultValue: 'Tous' })}</SelectOption>
                <SelectOption value="admin">{t('auth.roles.admin')}</SelectOption>
                <SelectOption value="teacher">{t('auth.roles.teacher')}</SelectOption>
                <SelectOption value="student">{t('auth.roles.student')}</SelectOption>
                <SelectOption value="member">{t('auth.roles.member')}</SelectOption>
                <SelectOption value="guest">{t('auth.roles.guest')}</SelectOption>
              </Select>
            </ToolbarItem>
            <ToolbarItem>
              <Select
                variant={SelectVariant.single}
                onToggle={(_event, isOpen) => setIsStatusFilterOpen(isOpen)}
                onSelect={(_event, value) => {
                  setStatusFilter(value as UserStatus | 'all');
                  setIsStatusFilterOpen(false);
                }}
                selections={filters.status}
                isOpen={isStatusFilterOpen}
                placeholderText={t('users.filters.status', { defaultValue: 'Filtrer par statut' })}
                toggleIcon={<FilterIcon />}
              >
                <SelectOption value="all">{t('users.filters.all', { defaultValue: 'Tous' })}</SelectOption>
                <SelectOption value="active">{t('common.status.active')}</SelectOption>
                <SelectOption value="inactive">{t('common.status.inactive')}</SelectOption>
                <SelectOption value="pending">{t('common.status.pending')}</SelectOption>
                <SelectOption value="suspended">{t('users.status.suspended', { defaultValue: 'Suspendu' })}</SelectOption>
                <SelectOption value="banned">{t('users.status.banned', { defaultValue: 'Banni' })}</SelectOption>
              </Select>
            </ToolbarItem>
            {(hasActiveFilters || isSearching) && (
              <ToolbarItem>
                <Button
                  variant="link"
                  onClick={() => {
                    clearFilters();
                    clearSearch();
                  }}
                >
                  {t('users.filters.clear', { defaultValue: 'Effacer les filtres' })}
                </Button>
              </ToolbarItem>
            )}
          </ToolbarContent>
        </Toolbar>
      </PageSection>

      {/* Users List */}
      <PageSection variant={PageSectionVariants.default}>
        {loading && users.length === 0 ? (
          <Flex justifyContent={{ default: 'justifyContentCenter' }}>
            <FlexItem>
              <Spinner size="xl" />
            </FlexItem>
          </Flex>
        ) : (
          <UserList
            users={finalUsers}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteClick}
            onActivate={handleActivateClick}
            onDeactivate={handleDeactivateClick}
            showActions
            isLoading={loading}
            emptyState={
              isSearching ? (
                <EmptyUserState variant="search" onAction={clearSearch} />
              ) : hasActiveFilters ? (
                <EmptyUserState variant="filter" onAction={clearFilters} />
              ) : (
                <EmptyUserState variant="default" onAction={handleAddUser} />
              )
            }
          />
        )}
      </PageSection>

      {/* Delete User Modal */}
      <Modal
        variant={ModalVariant.small}
        title={t('users.delete.confirmTitle', { defaultValue: 'Supprimer l\'utilisateur' })}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        actions={[
          <Button
            key="confirm"
            variant="danger"
            onClick={handleConfirmDelete}
            isLoading={deleteLoading}
          >
            {t('common.actions.delete')}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setDeleteModalOpen(false)}
            isDisabled={deleteLoading}
          >
            {t('common.actions.cancel')}
          </Button>,
        ]}
      >
        <TextContent>
          <Text>
            {t('users.delete.confirmMessage', { defaultValue: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?' })}
          </Text>
          {selectedUser && (
            <Text>
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
            </Text>
          )}
        </TextContent>
      </Modal>

      {/* Activate User Modal */}
      <Modal
        variant={ModalVariant.small}
        title={t('users.activate.confirmTitle', { defaultValue: 'Activer l\'utilisateur' })}
        isOpen={activateModalOpen}
        onClose={() => setActivateModalOpen(false)}
        actions={[
          <Button
            key="confirm"
            variant="primary"
            onClick={handleConfirmActivate}
            isLoading={activateLoading}
          >
            {t('users.details.activate', { defaultValue: 'Activer' })}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setActivateModalOpen(false)}
            isDisabled={activateLoading}
          >
            {t('common.actions.cancel')}
          </Button>,
        ]}
      >
        <TextContent>
          <Text>
            {t('users.activate.confirmMessage', { defaultValue: 'Êtes-vous sûr de vouloir activer cet utilisateur ?' })}
          </Text>
          {selectedUser && (
            <Text>
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
            </Text>
          )}
        </TextContent>
      </Modal>

      {/* Deactivate User Modal */}
      <Modal
        variant={ModalVariant.small}
        title={t('users.deactivate.confirmTitle', { defaultValue: 'Désactiver l\'utilisateur' })}
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        actions={[
          <Button
            key="confirm"
            variant="danger"
            onClick={handleConfirmDeactivate}
            isLoading={deactivateLoading}
          >
            {t('users.details.deactivate', { defaultValue: 'Désactiver' })}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setDeactivateModalOpen(false)}
            isDisabled={deactivateLoading}
          >
            {t('common.actions.cancel')}
          </Button>,
        ]}
      >
        <TextContent>
          <Text>
            {t('users.deactivate.confirmMessage', { defaultValue: 'Êtes-vous sûr de vouloir désactiver cet utilisateur ?' })}
          </Text>
          {selectedUser && (
            <Text>
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
            </Text>
          )}
        </TextContent>
      </Modal>
    </Page>
  );
};

export default ManageUsersPage;
