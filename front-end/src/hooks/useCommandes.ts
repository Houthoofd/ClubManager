import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Types pour les commandes selon votre structure DB réelle
export interface Commande {
  id: number;
  unique_id: string;
  numero_commande: string;
  utilisateur_id: number;
  total: string; // decimal(10,2) from DB
  date_commande: string; // timestamp
  statut: 'en attente' | 'payée' | 'expédiée' | 'annulée'; // enum from DB
  ip_address?: string;
  user_agent?: string;
  created_at: string; // timestamp
  // Données liées via JOIN
  articles?: any[];
  utilisateur_nom?: string;
  utilisateur_email?: string;
  nom_utilisateur?: string;
  first_name?: string;
  last_name?: string;
}

// Service API pour les commandes
const commandesApi = {
  getAll: async (): Promise<Commande[]> => {
    console.log('🔄 [API] Récupération des commandes...');
    
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
    console.log('✅ [API] Commandes récupérées:', {
      count: data.length,
      statuts: data.reduce((acc: any, cmd: Commande) => {
        acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
        return acc;
      }, {}),
      sample: data.slice(0, 2).map((cmd: Commande) => ({
        id: cmd.id,
        numero: cmd.numero_commande,
        statut: cmd.statut,
        total: cmd.total,
        date: cmd.date_commande || cmd.created_at
      }))
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

  // AJOUTÉ: Méthode pour récupérer les données de la DB avec détails
  getAllWithDetails: async (): Promise<Commande[]> => {
    console.log('🔄 [API] Récupération commandes avec détails...');
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token d\'authentification requis');
    }

    const response = await fetch(apiUrl('commandes?with_details=true'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // Forcer la récupération depuis la DB
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des commandes détaillées');
    }
    
    const data = await response.json();
    console.log('✅ [API] Commandes avec détails récupérées:', {
      count: data.length,
      withArticles: data.filter((c: Commande) => c.articles && c.articles.length > 0).length,
      sample: data.slice(0, 1)
    });
    
    return data;
  },

  // AJOUTÉ: Test de structure des données
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
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    // Polling pour s'assurer d'avoir les données à jour
    refetchInterval: 2 * 60 * 1000, // 2 minutes
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

// Hook pour mettre à jour le statut d'une commande
export const useUpdateCommandeStatut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commandeId, newStatut }: { commandeId: string; newStatut: string }) =>
      commandesApi.updateStatut(commandeId, newStatut),
    onSuccess: (updatedCommande, variables) => {
      console.log('✅ [Hook] Statut mis à jour avec succès:', updatedCommande);
      
      // Invalider toutes les queries de commandes
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
      
      // AJOUTÉ: Forcer un refetch immédiat pour s'assurer d'avoir les données à jour
      queryClient.refetchQueries({ queryKey: ['commandes'] });
      queryClient.refetchQueries({ queryKey: ['commandes', 'details'] });
      
      // Mise à jour optimiste du cache
      queryClient.setQueryData(['commandes'], (oldData: Commande[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(commande => 
          commande.id.toString() === variables.commandeId ||
          commande.unique_id === variables.commandeId ||
          commande.numero_commande === variables.commandeId
            ? { ...commande, statut: variables.newStatut as any }
            : commande
        );
      });
    },
    onError: (error, variables) => {
      console.error('❌ [Hook] Erreur mise à jour statut:', error, variables);
      
      // Forcer un refetch en cas d'erreur
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
    },
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
    enabled: false, // Ne s'exécute que quand appelé manuellement
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