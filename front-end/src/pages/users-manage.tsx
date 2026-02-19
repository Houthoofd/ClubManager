/**
 * Lightweight routing page for User Management
 *
 * This page serves as a thin routing layer that imports and renders
 * the main AddUserPage component from the users feature.
 */

import { AddUserPage } from '@/features/users';

export default function UsersManagePage() {
  return <AddUserPage />;
}
