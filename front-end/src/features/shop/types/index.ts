/**
 * Shop Feature Types
 * Re-exports from @clubmanager/types package + local types
 */

// Re-export only what's actually available from @clubmanager/types
export type {
  Products,
  ProductCategories,
  Orders,
  OrderItems,
  ProductsInsert,
  ProductsUpdate,
  OrdersInsert,
  StripePaymentIntent,
  PaymentMethod,
} from "@clubmanager/types";

// Local feature-specific types
export interface CartItem {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  categorie_id?: number;
  images?: string[];
  taille?: string;
  quantite: number;
  stocks?: Array<{
    taille: string;
    quantite: number;
    quantiteOriginale?: number;
  }>;
}

export interface ArticleWithCategory {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  categorie_id?: number;
  images?: string[];
  stocks?: Array<{
    taille: string;
    quantite: number;
  }>;
  category?: {
    id: number;
    nom: string;
    description?: string;
  };
}

export interface OrderWithItems {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: number;
  status?: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_status?: "unpaid" | "partial" | "paid" | "refunded";
  created_at?: string;
  items: Array<{
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
}

export type ArticlesParCategorie = Record<string, Products[]>;

export interface CheckoutFormData {
  delivery_method: "pickup" | "delivery" | "digital";
  delivery_address?: string;
  notes?: string;
}

export interface PaymentFormData {
  payment_method: string;
  save_payment_method?: boolean;
}

// Article type compatible with the existing codebase
export interface Article {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  categorie_id?: number;
  images?: string[];
  taille?: string;
  quantite: number;
  stocks?: Array<{
    id?: number;
    taille: string;
    quantite: number;
    quantiteOriginale?: number;
  }>;
}
