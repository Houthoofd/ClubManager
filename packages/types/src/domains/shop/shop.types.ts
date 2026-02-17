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
  status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded';
  /** Adresse de livraison si différente */
  delivery_address?: string;
  delivery_method?: 'pickup' | 'delivery' | 'digital';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrdersInsert {
  user_id: number;
  /** Numéro de commande unique */
  order_number: string;
  total_amount: number;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded';
  /** Adresse de livraison si différente */
  delivery_address?: string;
  delivery_method?: 'pickup' | 'delivery' | 'digital';
  notes?: string;
}

export interface OrdersUpdate {
  user_id?: number;
  /** Numéro de commande unique */
  order_number?: string;
  total_amount?: number;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded';
  /** Adresse de livraison si différente */
  delivery_address?: string;
  delivery_method?: 'pickup' | 'delivery' | 'digital';
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

