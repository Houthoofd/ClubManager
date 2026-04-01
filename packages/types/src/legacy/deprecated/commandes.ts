export interface Commande {
  commande_id: string;
  utilisateur_id: number;
  statut: 'en_attente' | 'confirmee' | 'en_preparation' | 'expediee' | 'livree' | 'annulee';
  total: number;
  articles: string; // JSON string
  date_commande: string;
  updated_at?: string;
  payment_intent_id?: string;
  nom_utilisateur?: string;
  email?: string;
}

export interface CreateCommandeData {
  commande_id: string;
  utilisateur_id: number;
  articles: any[];
  total: number;
  statut?: string;
  payment_intent_id?: string;
}

export interface UpdateCommandeData {
  statut?: string;
  total?: number;
  articles?: any[];
  payment_intent_id?: string;
}

// Commande complète avec articles parsés (pour le front-end)
export type CommandeComplete = {
  user_id: number;
  articles: {
    id: number;          // article_id
    nom: string;
    prix: number;
    quantite?: number;
    taille?: string;
  }[];
  total: number;
  statut: string;
  date: string;          // date ISO
};