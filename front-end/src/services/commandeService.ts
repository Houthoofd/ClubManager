import { apiUrl } from '../pages/apiUrl';

interface Commande {
  commande_id: string;
  utilisateur_id: number;
  statut: string;
  total: number;
  date_commande: string;
  articles: any[];
  nom_utilisateur?: string;
  email?: string;
}

interface StatistiquesCommandes {
  total_commandes: number;
  commandes_en_attente: number;
  commandes_confirmees: number;
  commandes_livrees: number;
  commandes_annulees: number;
  chiffre_affaires_total: number;
  chiffre_affaires_mois: number;
}

export class CommandeApiService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('authToken') || 
                 JSON.parse(localStorage.getItem('userData') || '{}').token;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(apiUrl(endpoint), config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    return response.json();
  }

  /**
   * Récupérer toutes les commandes
   */
  static async getAllCommandes(): Promise<Commande[]> {
    return this.request<Commande[]>('commandes');
  }

  /**
   * Récupérer une commande par son ID
   */
  static async getCommandeById(commandeId: string): Promise<Commande> {
    return this.request<Commande>(`commandes/${commandeId}`);
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  static async updateStatut(
    commandeId: string, 
    newStatut: string
  ): Promise<{ success: boolean; message: string; ancien_statut: string; nouveau_statut: string }> {
    return this.request(`commandes/${commandeId}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut: newStatut }),
    });
  }

  /**
   * Créer une nouvelle commande
   */
  static async createCommande(commandeData: {
    utilisateur_id: number;
    articles: any[];
    total: number;
    statut?: string;
  }): Promise<{ commande_id: string; success: boolean }> {
    return this.request('commandes', {
      method: 'POST',
      body: JSON.stringify(commandeData),
    });
  }

  /**
   * Récupérer les statistiques des commandes
   */
  static async getStatistiques(): Promise<StatistiquesCommandes> {
    return this.request<StatistiquesCommandes>('commandes/statistiques');
  }

  /**
   * Récupérer les commandes d'un utilisateur spécifique
   */
  static async getCommandesUtilisateur(utilisateurId: number): Promise<Commande[]> {
    return this.request<Commande[]>(`commandes/utilisateur/${utilisateurId}`);
  }

  /**
   * Rechercher des commandes avec filtres
   */
  static async rechercherCommandes(filters: {
    statut?: string;
    date_debut?: string;
    date_fin?: string;
    utilisateur_id?: number;
    search?: string;
  }): Promise<Commande[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `commandes/search?${queryString}` : 'commandes';
    
    return this.request<Commande[]>(endpoint);
  }

  /**
   * Exporter les commandes en CSV
   */
  static async exportCommandes(filters?: {
    statut?: string;
    date_debut?: string;
    date_fin?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `commandes/export?${queryString}` : 'commandes/export';

    const token = localStorage.getItem('token') || 
                 localStorage.getItem('authToken') || 
                 JSON.parse(localStorage.getItem('userData') || '{}').token;

    const response = await fetch(apiUrl(endpoint), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  }
}
