/**
 * Types for the Users feature
 *
 * This file contains all TypeScript types and interfaces used in the users domain.
 */

// ============================================================================
// Feature-Specific Types
// ============================================================================

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'professeur' | 'utilisateur';

/**
 * User status
 */
export type UserStatus = 'actif' | 'inactif' | 'suspendu';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'cancelled';

/**
 * Payment status
 */
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

/**
 * Basic user information
 */
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: UserRole;
  date_inscription?: string;
  derniere_connexion?: string;
}

/**
 * Detailed user information
 */
export interface UserDetail extends User {
  adresse?: string;
  ville?: string;
  code_postal?: string;
  date_naissance?: string;
  ceinture?: string;
  photo_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * User form data for creation/update
 */
export interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password?: string;
  status: UserRole;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  date_naissance?: string;
  ceinture?: string;
}

/**
 * User subscription information
 */
export interface UserSubscription {
  id: number;
  user_id: number;
  type: string;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  montant: number;
  auto_renew?: boolean;
}

/**
 * User payment information
 */
export interface UserPayment {
  id: number;
  user_id: number;
  montant: number;
  date: string;
  statut: PaymentStatus;
  methode: string;
  description?: string;
  echeance?: string;
}

/**
 * User statistics
 */
export interface UserStats {
  total_users: number;
  active_users: number;
  new_this_month: number;
  by_role: Record<UserRole, number>;
  by_status: Record<UserStatus, number>;
  total_revenue?: number;
  pending_payments?: number;
}

/**
 * User with subscription details
 */
export interface UserWithSubscription extends UserDetail {
  subscription?: UserSubscription;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string;
}

/**
 * User with payment history
 */
export interface UserWithPayments extends UserDetail {
  payments: UserPayment[];
  totalPaid: number;
  pendingAmount: number;
  lastPaymentDate?: string;
}

/**
 * User filter options
 */
export interface UserFilters {
  search?: string;
  role?: UserRole | null;
  status?: UserStatus | null;
  subscriptionStatus?: SubscriptionStatus | null;
  hasOverduePayments?: boolean;
}

/**
 * User sort options
 */
export type UserSortBy = 'name' | 'email' | 'date_inscription' | 'derniere_connexion' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface UserSortOptions {
  sortBy: UserSortBy;
  direction: SortDirection;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * User table row data (for data tables)
 */
export interface UserTableRow {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  date_inscription?: string;
  derniere_connexion?: string;
  subscription_status?: SubscriptionStatus;
  hasOverduePayments?: boolean;
}

/**
 * User activity log entry
 */
export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  description?: string;
  timestamp: string;
  ip_address?: string;
}

/**
 * User notification preferences
 */
export interface UserNotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  course_reminders: boolean;
  payment_reminders: boolean;
  newsletter: boolean;
}

/**
 * User validation errors
 */
export interface UserValidationErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  date_naissance?: string;
}
