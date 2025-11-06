import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// CORRIGÉ: Types pour les commandes avec articles détaillés selon la structure DB
export interface CommandeArticle {
  commande_article_id: number;
  commande_id: number;
  article_id: number;
  taille_id: number;
  quantite: number;
  prix: string; // Prix au moment de la commande
  // Données de l'article via JOIN
  article_nom: string;
  article_description?: string;
  prix_unitaire: string; // Prix actuel de l'article
  taille: string; // Nom de la taille (ex: "M", "L", "XL")
  categorie_nom?: string;
  images?: string[]; // URLs des images
  image_url?: string; // Image principale (fallback)
  // Aliases pour compatibilité
  nom?: string;
}

export interface Commande {
  id: number;
  unique_id: string;
  numero_commande: string;
  utilisateur_id: number;
  total: string; // DECIMAL(10,2) depuis la DB
  date_commande: string;
  statut: 'en attente' | 'payée' | 'expédiée' | 'annulée';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Données utilisateur via JOIN
  utilisateur_nom?: string;
  utilisateur_email?: string;
  nom_utilisateur: string;
  first_name: string;
  last_name: string;
  user_id: string; // userId de l'utilisateur
  // Articles détaillés avec toutes les relations
  articles: CommandeArticle[];
}

// Service API pour les commandes
const commandesApi = {
  getAll: async (): Promise<Commande[]> => {
    console.log('🔄 [API] Récupération des commandes avec détails...');
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token d\'authentification requis');
    }
    
    const response = await fetch(apiUrl('commandes'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [API] Erreur récupération commandes:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: apiUrl('commandes')
      });
      
      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      throw new Error(errorData.message || 'Erreur lors de la récupération des commandes');
    }
    
    const data = await response.json();
    console.log('✅ [API] Commandes avec détails récupérées:', {
      count: data.length,
      statuts: data.reduce((acc: any, cmd: Commande) => {
        acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
        return acc;
      }, {}),
      totalArticles: data.reduce((sum: number, cmd: Commande) => sum + (cmd.articles?.length || 0), 0),
      articlesParCommande: data.map((cmd: Commande) => ({
        commandeId: cmd.id,
        nbArticles: cmd.articles?.length || 0,
        articles: cmd.articles?.map(a => ({
          nom: a.article_nom,
          taille: a.taille,
          quantite: a.quantite,
          prixCommande: a.prix,
          prixActuel: a.prix_unitaire
        }))
      })).slice(0, 3) // Afficher seulement les 3 premières pour debug
    });
    
    return data;
  },

  updateStatut: async (commandeId: string, newStatut: string): Promise<Commande> => {
    console.log('🔄 [API] Mise à jour statut commande:', { commandeId, newStatut });
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token d\'authentification requis');
    }
    
    const response = await fetch(apiUrl(`commandes/${commandeId}/statut`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ statut: newStatut }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [API] Erreur mise à jour statut:', errorData);
      
      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      throw new Error(errorData.message || 'Erreur lors de la mise à jour du statut');
    }
    
    const data = await response.json();
    console.log('✅ [API] Statut mis à jour:', data);
    
    return data;
  },

  // AJOUTÉ: Méthode pour tester la structure des données
  testStructure: async (): Promise<any> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(apiUrl('commandes/debug/structure'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la structure');
    }
    
    return response.json();
  },
};

// Hook principal pour récupérer toutes les commandes
export const useCommandes = () => {
  return useQuery({
    queryKey: ['commandes'],
    queryFn: commandesApi.getAll,
    staleTime: 2 * 60 * 1000, // AUGMENTÉ: 2 minutes au lieu de 1
    gcTime: 10 * 60 * 1000, // AUGMENTÉ: 10 minutes au lieu de 5
    refetchOnWindowFocus: false, // DÉSACTIVÉ pour éviter les refetch intempestifs
    refetchOnMount: true,
    refetchInterval: false, // DÉSACTIVÉ le polling automatique
  });
};

// AJOUTÉ: Hook pour récupérer les commandes avec tous les détails
export const useCommandesWithDetails = () => {
  return useQuery({
    queryKey: ['commandes', 'details'],
    queryFn: commandesApi.getAllWithDetails,
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

// Hook pour mettre à jour le statut d'une commande - VERSION OPTIMISÉE
export const useUpdateCommandeStatut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commandeId, newStatut }: { commandeId: string; newStatut: string }) =>
      commandesApi.updateStatut(commandeId, newStatut),
    onMutate: async ({ commandeId, newStatut }) => {
      // AJOUTÉ: Mise à jour optimiste immédiate pour une meilleure UX
      await queryClient.cancelQueries({ queryKey: ['commandes'] });
      
      const previousCommandes = queryClient.getQueryData(['commandes']);
      
      queryClient.setQueryData(['commandes'], (oldData: Commande[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(commande => 
          commande.id.toString() === commandeId ||
          commande.unique_id === commandeId ||
          commande.numero_commande === commandeId
            ? { ...commande, statut: newStatut as any }
            : commande
        );
      });
      
      return { previousCommandes };
    },
    onSuccess: (updatedCommande, variables, context) => {
      console.log('🚀 [Hook] Statut mis à jour avec optimisation:', {
        optimized: updatedCommande.optimized,
        articlesTraites: updatedCommande.articlesTraites
      });
      
      // Invalider les stocks seulement si nécessaire
      if (updatedCommande.stocksAffectes) {
        queryClient.invalidateQueries({ queryKey: ['stocks'] });
        console.log('📦 [Hook] Stocks invalidés car modifiés');
      }
      
      // Rafraîchir les commandes pour être sûr
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
    },
    onError: (error, variables, context) => {
      // AJOUTÉ: Restaurer les données précédentes en cas d'erreur
      if (context?.previousCommandes) {
        queryClient.setQueryData(['commandes'], context.previousCommandes);
      }
      console.error('❌ [Hook] Erreur mise à jour:', error);
    },
    // AJOUTÉ: Options pour améliorer la performance
    retry: false, // Pas de retry automatique pour éviter les conflits
    
  });
};

// AJOUTÉ: Hook pour forcer la synchronisation avec la DB
export const useRefreshCommandes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Invalider le cache et forcer un refetch
      await queryClient.invalidateQueries({ queryKey: ['commandes'] });
      return queryClient.refetchQueries({ queryKey: ['commandes'] });
    },
    onSuccess: () => {
      console.log('✅ [Hook] Commandes rafraîchies depuis la DB');
    },
    onError: (error) => {
      console.error('❌ [Hook] Erreur rafraîchissement commandes:', error);
    },
  });
};

// AJOUTÉ: Hook pour tester la structure des données
export const useTestCommandesStructure = () => {
  return useQuery({
    queryKey: ['commandes', 'structure'],
    queryFn: commandesApi.testStructure,
    enabled: false,
  });
};

// CORRIGÉ: Hook pour obtenir les statistiques en temps réel avec vérifications de sécurité
export const useCommandesStats = (commandes: Commande[]) => {
  // AJOUTÉ: Vérification de sécurité
  const commandesValides = Array.isArray(commandes) ? commandes : [];
  
  return {
    total: commandesValides.length,
    enAttente: commandesValides.filter(c => c?.statut === 'en attente').length,
    payees: commandesValides.filter(c => c?.statut === 'payée').length,
    expediees: commandesValides.filter(c => c?.statut === 'expédiée').length,
    annulees: commandesValides.filter(c => c?.statut === 'annulée').length,
    chiffreAffaires: commandesValides
      .filter(c => c?.statut === 'payée' || c?.statut === 'expédiée')
      .reduce((sum, c) => sum + parseFloat(c?.total || '0'), 0),
    commandesMoyennes: commandesValides.length > 0 ? 
      commandesValides.reduce((sum, c) => sum + parseFloat(c?.total || '0'), 0) / commandesValides.length : 0,
    repartitionStatuts: commandesValides.reduce((acc, c) => {
      const statut = c?.statut || 'inconnu';
      acc[statut] = (acc[statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    // MODIFIÉ: Stats sur la fraîcheur des données avec vérifications
    derniereCommande: commandesValides.length > 0 ? 
      new Date(Math.max(...commandesValides
        .map(c => new Date(c?.created_at || c?.date_commande || 0).getTime())
        .filter(time => !isNaN(time))
      )) : null,
    commandesAujourdhui: commandesValides.filter(c => {
      if (!c?.created_at && !c?.date_commande) return false;
      try {
        const today = new Date().toDateString();
        const cmdDate = new Date(c.created_at || c.date_commande).toDateString();
        return today === cmdDate;
      } catch {
        return false;
      }
    }).length
  };
};