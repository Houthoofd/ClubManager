/**
 * Generated TypeScript types for shop domain
 * @generated - Do not edit manually
 */

export interface ProductCategories {
  id: number;
  name: string;
  description?: string;
  /** Pour créer une arborescence de catégories */
  parent_id?: number;
  display_order?: number;
}

export interface ProductCategoriesInsert {
  name: string;
  description?: string;
  /** Pour créer une arborescence de catégories */
  parent_id?: number;
  display_order?: number;
}

export interface ProductCategoriesUpdate {
  name?: string;
  description?: string;
  /** Pour créer une arborescence de catégories */
  parent_id?: number;
  display_order?: number;
}

export interface Products {
  id: number;
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  /** NULL si service/produit dématérialisé */
  stock_quantity?: number;
  /** Référence produit */
  sku?: string;
  image_url?: string;
  /** 1=produit physique, 0=service/produit virtuel */
  is_physical?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductsInsert {
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  /** NULL si service/produit dématérialisé */
  stock_quantity?: number;
  /** Référence produit */
  sku?: string;
  image_url?: string;
  /** 1=produit physique, 0=service/produit virtuel */
  is_physical?: boolean;
  active?: boolean;
}

export interface ProductsUpdate {
  category_id?: number;
  name?: string;
  description?: string;
  price?: number;
  /** NULL si service/produit dématérialisé */
  stock_quantity?: number;
  /** Référence produit */
  sku?: string;
  image_url?: string;
  /** 1=produit physique, 0=service/produit virtuel */
  is_physical?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Orders {
  id: number;
  user_id: number;
  /** Numéro de commande unique */
  order_number: string;
  total_amount: number;
  status?: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_status?: "unpaid" | "partial" | "paid" | "refunded";
  /** Adresse de livraison si différente */
  delivery_address?: string;
  delivery_method?: "pickup" | "delivery" | "digital";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrdersInsert {
  user_id: number;
  /** Numéro de commande unique */
  order_number: string;
  total_amount: number;
  status?: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_status?: "unpaid" | "partial" | "paid" | "refunded";
  /** Adresse de livraison si différente */
  delivery_address?: string;
  delivery_method?: "pickup" | "delivery" | "digital";
  notes?: string;
}

export interface OrdersUpdate {
  user_id?: number;
  /** Numéro de commande unique */
  order_number?: string;
  total_amount?: number;
  status?: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_status?: "unpaid" | "partial" | "paid" | "refunded";
  /** Adresse de livraison si différente */
  delivery_address?: string;
  delivery_method?: "pickup" | "delivery" | "digital";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItems {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  /** Notes spécifiques à cet article */
  notes?: string;
}

export interface OrderItemsInsert {
  order_id: number;
  product_id: number;
  quantity?: number;
  unit_price: number;
  total_price: number;
  /** Notes spécifiques à cet article */
  notes?: string;
}

export interface OrderItemsUpdate {
  order_id?: number;
  product_id?: number;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  /** Notes spécifiques à cet article */
  notes?: string;
}

// ============================================
// Stripe Payment Types
// ============================================

export interface StripeCustomer {
  id: number;
  user_id: number;
  stripe_customer_id: string;
  email?: string;
  name?: string;
  default_payment_method?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StripeCustomerInsert {
  user_id: number;
  stripe_customer_id: string;
  email?: string;
  name?: string;
  default_payment_method?: string;
  metadata?: Record<string, any>;
}

export interface StripeCustomerUpdate {
  email?: string;
  name?: string;
  default_payment_method?: string;
  metadata?: Record<string, any>;
  updated_at?: string;
}

export interface StripePaymentIntent {
  id: number;
  stripe_payment_intent_id: string;
  user_id: number;
  order_id?: number;
  amount: number;
  currency?: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded";
  payment_method?: string;
  client_secret?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StripePaymentIntentInsert {
  stripe_payment_intent_id: string;
  user_id: number;
  order_id?: number;
  amount: number;
  currency?: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded";
  payment_method?: string;
  client_secret?: string;
  metadata?: Record<string, any>;
}

export interface StripePaymentIntentUpdate {
  status?:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded";
  payment_method?: string;
  metadata?: Record<string, any>;
  updated_at?: string;
}

export interface StripeSubscription {
  id: number;
  stripe_subscription_id: string;
  user_id: number;
  stripe_customer_id: string;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  ended_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StripeSubscriptionInsert {
  stripe_subscription_id: string;
  user_id: number;
  stripe_customer_id: string;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, any>;
}

export interface StripeSubscriptionUpdate {
  status?:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  ended_at?: string;
  metadata?: Record<string, any>;
  updated_at?: string;
}

export interface StripeWebhookEvent {
  id: number;
  stripe_event_id: string;
  event_type: string;
  object_type: string;
  object_id: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  payload: Record<string, any>;
  error_message?: string;
  processed_at?: string;
  retry_count?: number;
  created_at?: string;
}

export interface StripeWebhookEventInsert {
  stripe_event_id: string;
  event_type: string;
  object_type: string;
  object_id: string;
  status?: "pending" | "processing" | "succeeded" | "failed";
  payload: Record<string, any>;
  error_message?: string;
  retry_count?: number;
}

export interface StripeWebhookEventUpdate {
  status?: "pending" | "processing" | "succeeded" | "failed";
  error_message?: string;
  processed_at?: string;
  retry_count?: number;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "sepa_debit" | "bancontact" | "ideal";
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: Record<string, any>;
  };
}

export interface CreatePaymentIntentInput {
  amount: number;
  currency?: string;
  payment_method?: string;
  customer_id?: string;
  order_id?: number;
  metadata?: Record<string, any>;
}

export interface ConfirmPaymentIntentInput {
  payment_intent_id: string;
  payment_method?: string;
}

export interface RefundInput {
  payment_intent_id: string;
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, any>;
}

export interface StripeRefund {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  created_at: number;
}
