import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # product_categories
  type ProductCategories {
    id: Int!
    name: String!
    description: String
    parent_id: Int # Pour créer une arborescence de catégories
    display_order: Int
  }

  # products
  type Products {
    id: Int!
    category_id: Int
    name: String!
    description: String
    price: Float!
    stock_quantity: Int # NULL si service/produit dématérialisé
    sku: String # Référence produit
    image_url: String
    is_physical: Boolean # 1=produit physique, 0=service/produit virtuel
    active: Boolean
    created_at: String
    updated_at: String
  }

  # orders
  type Orders {
    id: Int!
    user_id: Int!
    order_number: String! # Numéro de commande unique
    total_amount: Float!
    status: String
    payment_status: String
    delivery_address: String # Adresse de livraison si différente
    delivery_method: String
    notes: String
    created_at: String
    updated_at: String
  }

  # order_items
  type OrderItems {
    id: Int!
    order_id: Int!
    product_id: Int!
    quantity: Int
    unit_price: Float!
    total_price: Float!
    notes: String # Notes spécifiques à cet article
  }

`;
