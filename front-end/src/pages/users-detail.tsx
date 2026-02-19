/**
 * Lightweight routing page for User Details
 *
 * This page serves as a thin routing layer that imports and renders
 * the main UserDetailPage component from the users feature.
 */

import { UserDetailPage } from '@/features/users';

export default function UsersDetailPage() {
  return <UserDetailPage />;
}
