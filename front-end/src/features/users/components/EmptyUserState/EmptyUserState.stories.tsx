/**
 * EmptyUserState Stories
 *
 * Storybook stories for the EmptyUserState component
 * Demonstrates empty states for various user-related scenarios
 */

import type { Meta, StoryObj } from '@storybook/react';
import { EmptyUserState } from './EmptyUserState';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof EmptyUserState> = {
  title: 'Features/Users/EmptyUserState',
  component: EmptyUserState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    actionText: { control: 'text' },
    onAction: { action: 'action-clicked' },
    icon: { control: 'text' },
    variant: {
      control: 'select',
      options: ['info', 'warning', 'error', 'success'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyUserState>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default Empty State
 * Basic empty state for users list
 */
export const Default: Story = {
  args: {
    title: 'Aucun utilisateur',
    description: 'Il n\'y a aucun utilisateur à afficher pour le moment.',
  },
};

/**
 * No Users Found
 * Empty state when user list is empty
 */
export const NoUsers: Story = {
  args: {
    title: 'Aucun utilisateur trouvé',
    description: 'La liste des utilisateurs est vide. Commencez par ajouter votre premier utilisateur.',
    actionText: 'Ajouter un utilisateur',
    onAction: () => console.log('Add user clicked'),
  },
};

/**
 * Search Results Empty
 * Empty state for search with no results
 */
export const NoSearchResults: Story = {
  args: {
    title: 'Aucun résultat',
    description: 'Aucun utilisateur ne correspond à vos critères de recherche. Essayez d\'affiner votre recherche.',
    actionText: 'Réinitialiser les filtres',
    onAction: () => console.log('Reset filters clicked'),
  },
};

/**
 * Filter Results Empty
 * Empty state when filters return no results
 */
export const NoFilterResults: Story = {
  args: {
    title: 'Aucun utilisateur avec ces critères',
    description: 'Aucun utilisateur ne correspond aux filtres sélectionnés. Modifiez vos filtres pour voir plus de résultats.',
    actionText: 'Effacer les filtres',
    onAction: () => console.log('Clear filters clicked'),
    variant: 'info',
  },
};

/**
 * No Active Users
 * Empty state specifically for active users
 */
export const NoActiveUsers: Story = {
  args: {
    title: 'Aucun utilisateur actif',
    description: 'Il n\'y a actuellement aucun utilisateur actif. Vérifiez les utilisateurs inactifs ou en attente.',
    actionText: 'Voir tous les utilisateurs',
    onAction: () => console.log('View all users clicked'),
  },
};

/**
 * No Pending Users
 * Empty state for pending approvals
 */
export const NoPendingUsers: Story = {
  args: {
    title: 'Aucune inscription en attente',
    description: 'Toutes les inscriptions ont été traitées. Il n\'y a aucune demande en attente.',
    variant: 'success',
  },
};

/**
 * No Teachers
 * Empty state for teachers list
 */
export const NoTeachers: Story = {
  args: {
    title: 'Aucun professeur',
    description: 'Vous n\'avez pas encore ajouté de professeurs. Commencez par promouvoir un utilisateur en tant que professeur.',
    actionText: 'Promouvoir un professeur',
    onAction: () => console.log('Promote teacher clicked'),
  },
};

/**
 * No Students
 * Empty state for students list
 */
export const NoStudents: Story = {
  args: {
    title: 'Aucun élève inscrit',
    description: 'Il n\'y a pas encore d\'élèves inscrits. Invitez des utilisateurs à rejoindre vos cours.',
    actionText: 'Inviter des élèves',
    onAction: () => console.log('Invite students clicked'),
  },
};

/**
 * No Admins
 * Empty state for administrators list
 */
export const NoAdmins: Story = {
  args: {
    title: 'Aucun administrateur',
    description: 'Attention : aucun administrateur n\'est défini. Attribuez le rôle d\'administrateur à au moins un utilisateur.',
    actionText: 'Gérer les rôles',
    onAction: () => console.log('Manage roles clicked'),
    variant: 'warning',
  },
};

/**
 * Error Loading Users
 * Error state when user data fails to load
 */
export const ErrorLoading: Story = {
  args: {
    title: 'Erreur de chargement',
    description: 'Une erreur s\'est produite lors du chargement des utilisateurs. Veuillez réessayer.',
    actionText: 'Réessayer',
    onAction: () => console.log('Retry clicked'),
    variant: 'error',
  },
};

/**
 * No Permission
 * Empty state when user lacks permission
 */
export const NoPermission: Story = {
  args: {
    title: 'Accès refusé',
    description: 'Vous n\'avez pas les permissions nécessaires pour consulter cette liste d\'utilisateurs.',
    variant: 'warning',
  },
};

/**
 * Inactive Users Only
 * Empty state showing only inactive users exist
 */
export const OnlyInactiveUsers: Story = {
  args: {
    title: 'Tous les utilisateurs sont inactifs',
    description: 'Tous les utilisateurs de cette liste sont actuellement inactifs. Activez des comptes pour les voir apparaître ici.',
    actionText: 'Gérer les utilisateurs inactifs',
    onAction: () => console.log('Manage inactive users clicked'),
  },
};

/**
 * Import Required
 * Empty state suggesting data import
 */
export const ImportRequired: Story = {
  args: {
    title: 'Importez vos utilisateurs',
    description: 'Commencez rapidement en important vos utilisateurs existants depuis un fichier CSV ou Excel.',
    actionText: 'Importer des utilisateurs',
    onAction: () => console.log('Import users clicked'),
  },
};

/**
 * First Time Setup
 * Empty state for first-time users
 */
export const FirstTimeSetup: Story = {
  args: {
    title: 'Bienvenue !',
    description: 'Commencez par créer votre premier utilisateur pour profiter de toutes les fonctionnalités de l\'application.',
    actionText: 'Créer mon premier utilisateur',
    onAction: () => console.log('Create first user clicked'),
    variant: 'success',
  },
};

/**
 * Maintenance Mode
 * Empty state during system maintenance
 */
export const MaintenanceMode: Story = {
  args: {
    title: 'Maintenance en cours',
    description: 'Le système est actuellement en maintenance. La liste des utilisateurs sera à nouveau disponible sous peu.',
    variant: 'warning',
  },
};

/**
 * With Custom Icon
 * Empty state with custom icon
 */
export const WithCustomIcon: Story = {
  args: {
    title: 'Liste vide',
    description: 'Personnalisez cette vue avec votre propre icône et message.',
    actionText: 'Action personnalisée',
    onAction: () => console.log('Custom action clicked'),
    icon: 'UserPlusIcon',
  },
};

/**
 * Interactive Playground
 * Playground to test all combinations
 */
export const Playground: Story = {
  args: {
    title: 'Titre personnalisé',
    description: 'Description personnalisée pour l\'état vide.',
    actionText: 'Action',
    variant: 'info',
  },
};
