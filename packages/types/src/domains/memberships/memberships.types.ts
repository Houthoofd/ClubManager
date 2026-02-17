/**
 * Generated TypeScript types for memberships domain
 * @generated - Do not edit manually
 */

export interface MembershipPlans {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_months?: number;
  /** Avantages en JSON */
  features?: Record<string, any>;
  active?: boolean;
  created_at?: string;
}

export interface MembershipPlansInsert {
  name: string;
  description?: string;
  price: number;
  duration_months?: number;
  /** Avantages en JSON */
  features?: Record<string, any>;
  active?: boolean;
}

export interface MembershipPlansUpdate {
  name?: string;
  description?: string;
  price?: number;
  duration_months?: number;
  /** Avantages en JSON */
  features?: Record<string, any>;
  active?: boolean;
  created_at?: string;
}

export interface Memberships {
  id: number;
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status?: 'active' | 'expired' | 'cancelled' | 'suspended';
  auto_renew?: boolean;
  created_at?: string;
}

export interface MembershipsInsert {
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status?: 'active' | 'expired' | 'cancelled' | 'suspended';
  auto_renew?: boolean;
}

export interface MembershipsUpdate {
  user_id?: number;
  plan_id?: number;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'expired' | 'cancelled' | 'suspended';
  auto_renew?: boolean;
  created_at?: string;
}

export interface Payments {
  id: number;
  user_id: number;
  amount: number;
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'online' | 'check';
  payment_type?: 'membership' | 'session' | 'product' | 'other';
  /** ID de référence (adhésion, session, commande, etc.) */
  reference_id?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  /** ID de transaction externe */
  transaction_id?: string;
  payment_date?: string;
  notes?: string;
}

export interface PaymentsInsert {
  user_id: number;
  amount: number;
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'online' | 'check';
  payment_type?: 'membership' | 'session' | 'product' | 'other';
  /** ID de référence (adhésion, session, commande, etc.) */
  reference_id?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  /** ID de transaction externe */
  transaction_id?: string;
  payment_date?: string;
  notes?: string;
}

export interface PaymentsUpdate {
  user_id?: number;
  amount?: number;
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'online' | 'check';
  payment_type?: 'membership' | 'session' | 'product' | 'other';
  /** ID de référence (adhésion, session, commande, etc.) */
  reference_id?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  /** ID de transaction externe */
  transaction_id?: string;
  payment_date?: string;
  notes?: string;
}

