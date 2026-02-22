/**
 * UserCard Stories
 *
 * Storybook stories for the UserCard component
 * Demonstrates various states and configurations
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UserCard } from './UserCard';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof UserCard> = {
  title: 'Features/Users/UserCard',
  component: UserCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    id: { control: 'text' },
    firstName: { control: 'text' },
    lastName: { control: 'text' },
    email: { control: 'text' },
    phone: { control: 'text' },
    role: {
      control: 'select',
      options: ['admin', 'teacher', 'student', 'parent']
    },
    status: {
      control: 'select',
      options: ['active', 'inactive', 'pending']
    },
    avatar: { control: 'text' },
    joinDate: { control: 'date' },
    onClick: { action: 'clicked' },
    onEdit: { action: 'edit' },
    onDelete: { action: 'delete' },
  },
};

export default meta;
type Story = StoryObj<typeof UserCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default UserCard
 * Basic user card with minimal information
 */
export const Default: Story = {
  args: {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+32 485 12 34 56',
    role: 'student',
    status: 'active',
    joinDate: '2024-01-15',
  },
};

/**
 * Admin User
 * User card for an administrator
 */
export const Admin: Story = {
  args: {
    id: '2',
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@clubmanager.com',
    phone: '+32 475 98 76 54',
    role: 'admin',
    status: 'active',
    joinDate: '2020-03-10',
  },
};

/**
 * Teacher User
 * User card for a teacher/instructor
 */
export const Teacher: Story = {
  args: {
    id: '3',
    firstName: 'Pierre',
    lastName: 'Dubois',
    email: 'pierre.dubois@example.com',
    phone: '+32 495 11 22 33',
    role: 'teacher',
    status: 'active',
    joinDate: '2022-09-01',
  },
};

/**
 * Student User
 * User card for a student
 */
export const Student: Story = {
  args: {
    id: '4',
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@example.com',
    phone: '+32 470 55 66 77',
    role: 'student',
    status: 'active',
    joinDate: '2023-10-15',
  },
};

/**
 * Parent User
 * User card for a parent
 */
export const Parent: Story = {
  args: {
    id: '5',
    firstName: 'Laurent',
    lastName: 'Lefevre',
    email: 'laurent.lefevre@example.com',
    phone: '+32 478 88 99 00',
    role: 'parent',
    status: 'active',
    joinDate: '2023-11-20',
  },
};

/**
 * Inactive User
 * User card for an inactive user
 */
export const Inactive: Story = {
  args: {
    id: '6',
    firstName: 'Thomas',
    lastName: 'Petit',
    email: 'thomas.petit@example.com',
    phone: '+32 466 44 55 66',
    role: 'student',
    status: 'inactive',
    joinDate: '2022-05-10',
  },
};

/**
 * Pending User
 * User card for a pending user (registration not complete)
 */
export const Pending: Story = {
  args: {
    id: '7',
    firstName: 'Claire',
    lastName: 'Moreau',
    email: 'claire.moreau@example.com',
    phone: '+32 477 33 22 11',
    role: 'student',
    status: 'pending',
    joinDate: '2024-01-20',
  },
};

/**
 * With Avatar
 * User card with a profile picture
 */
export const WithAvatar: Story = {
  args: {
    id: '8',
    firstName: 'Nicolas',
    lastName: 'Rousseau',
    email: 'nicolas.rousseau@example.com',
    phone: '+32 499 77 88 99',
    role: 'teacher',
    status: 'active',
    avatar: 'https://i.pravatar.cc/150?img=12',
    joinDate: '2021-06-15',
  },
};

/**
 * Without Phone
 * User card without phone number
 */
export const WithoutPhone: Story = {
  args: {
    id: '9',
    firstName: 'Isabelle',
    lastName: 'Simon',
    email: 'isabelle.simon@example.com',
    role: 'student',
    status: 'active',
    joinDate: '2023-08-20',
  },
};

/**
 * With Actions
 * User card with edit and delete actions
 */
export const WithActions: Story = {
  args: {
    id: '10',
    firstName: 'Antoine',
    lastName: 'Laurent',
    email: 'antoine.laurent@example.com',
    phone: '+32 471 22 33 44',
    role: 'student',
    status: 'active',
    joinDate: '2023-12-01',
    onEdit: (user) => console.log('Edit user:', user),
    onDelete: (user) => console.log('Delete user:', user),
  },
};

/**
 * Clickable Card
 * User card that can be clicked
 */
export const Clickable: Story = {
  args: {
    id: '11',
    firstName: 'Camille',
    lastName: 'Roux',
    email: 'camille.roux@example.com',
    phone: '+32 483 55 66 77',
    role: 'student',
    status: 'active',
    joinDate: '2024-01-10',
    onClick: (user) => console.log('Clicked user:', user),
  },
};

/**
 * Long Name
 * User card with a very long name to test truncation
 */
export const LongName: Story = {
  args: {
    id: '12',
    firstName: 'Jean-François-Alexandre',
    lastName: 'De La Fontaine-Beauregard',
    email: 'jf.delafontaine@example.com',
    phone: '+32 492 11 22 33',
    role: 'student',
    status: 'active',
    joinDate: '2023-07-15',
  },
};

/**
 * Long Email
 * User card with a very long email to test truncation
 */
export const LongEmail: Story = {
  args: {
    id: '13',
    firstName: 'Emma',
    lastName: 'Blanc',
    email: 'emma.blanc.super.long.email.address@very-long-domain-name.example.com',
    phone: '+32 488 99 00 11',
    role: 'student',
    status: 'active',
    joinDate: '2023-09-20',
  },
};

/**
 * Interactive Playground
 * Playground to test all combinations
 */
export const Playground: Story = {
  args: {
    id: '999',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'email@example.com',
    phone: '+32 4XX XX XX XX',
    role: 'student',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
  },
};
