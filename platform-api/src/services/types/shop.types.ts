// Types for shop functionality

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
}

export enum OrderStatus {
  PENDING = 'en attente',
  CONFIRMED = 'confirmée',
  PROCESSING = 'en traitement',
  SHIPPED = 'expédiée',
  DELIVERED = 'livrée',
  CANCELLED = 'annulée'
}

export interface Product {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  tailleId?: number;
  imageUrl?: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  utilisateurId: number;
  dateCommande: Date;
  statut: string;
  montantTotal: number;
  adresseLivraison?: string;
  notes?: string;
}