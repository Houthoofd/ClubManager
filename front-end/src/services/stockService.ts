import { apiUrl } from '../pages/apiUrl';

interface ArticleCommande {
  article_id: number;
  taille: string;
  quantite: number;
}

interface VerificationStock {
  disponible: boolean;
  details: {
    article_id: number;
    taille: string;
    quantite_demandee: number;
    stock_disponible: number;
    disponible: boolean;
  }[];
}

export class StockApiService {
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
   * Vérifier la disponibilité du stock pour une liste d'articles
   */
  static async verifierDisponibilite(articles: ArticleCommande[]): Promise<VerificationStock> {
    return this.request<VerificationStock>('stock/verification', {
      method: 'POST',
      body: JSON.stringify({ articles }),
    });
  }

  /**
   * Obtenir un résumé des stocks par article
   */
  static async getResumeStocks() {
    return this.request('stock/resume');
  }

  /**
   * Récupérer l'historique des mouvements de stock
   */
  static async getHistoriqueMouvements(article_id?: number, taille?: string, limit: number = 100) {
    const params = new URLSearchParams();
    if (article_id) params.append('article_id', article_id.toString());
    if (taille) params.append('taille', taille);
    params.append('limit', limit.toString());

    return this.request(`stock/mouvements?${params.toString()}`);
  }
}
