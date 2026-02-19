/**
 * Lightweight routing page for Orders Management
 *
 * This page serves as a thin routing layer that imports and renders
 * the main OrdersPage component from the orders feature.
 */

import { OrdersPage } from '@/features/orders';

export default function OrdersManagementPage() {
  return <OrdersPage />;
}
