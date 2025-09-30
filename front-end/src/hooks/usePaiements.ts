import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer tous les paiements
export const usePaiements = () => {
  return useQuery({
    queryKey: ['paiements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('paiements'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des paiements');
      return response.json();
    }
  });
};

// Hook pour créer un paiement avec différentes méthodes
export const useCreerPaiement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paiementData: any) => {
      let endpoint = 'paiements';
      
      // Déterminer l'endpoint en fonction de la méthode de paiement
      if (paiementData.payment_method) {
        switch (paiementData.payment_method) {
          case 'bancontact':
            endpoint = 'paiements/bancontact';
            break;
          case 'paypal':
            endpoint = 'paiements/paypal';
            break;
          case 'bitcoin':
            endpoint = 'paiements/bitcoin';
            break;
          default:
            endpoint = 'paiements';
        }
      }

      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du paiement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
    }
  });
};

// Hook pour créer une commande avec paiement
export const useCreerCommandeAvecPaiement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commande, paiementData }: { commande: any; paiementData: any }) => {
      // 1. Créer la commande
      const commandeResponse = await fetch(apiUrl('magasin/commandes/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commande),
        credentials: 'include',
      });

      if (!commandeResponse.ok) {
        throw new Error("Échec lors de l'enregistrement de la commande");
      }

      const commandeResult = await commandeResponse.json();

      // 2. Créer le paiement
      const paiementResponse = await fetch(apiUrl(`paiements/${paiementData.payment_method}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paiementData,
          commande_id: commandeResult.id
        }),
        credentials: 'include',
      });

      if (!paiementResponse.ok) {
        throw new Error("Échec lors du traitement du paiement");
      }

      return paiementResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
    }
  });
};

// Hook pour modifier un paiement
export const useModifierPaiement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paiementData }: { id: number; paiementData: any }) => {
      const response = await fetch(apiUrl(`paiements/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la modification du paiement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    }
  });
};

// Hook pour supprimer un paiement
export const useSupprimerPaiement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(apiUrl(`paiements/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du paiement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    }
  });
};

// Hook pour récupérer les échéances de paiement d'un utilisateur
export const useEcheancesByUserId = (userId: string) => {
  return useQuery({
    queryKey: ['echeances', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`paiements/echeances/${userId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des échéances');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userId
  });
};

// Hook pour mettre à jour un paiement
export const useUpdatePaiement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paiementData: { id: number; statut: string }) => {
      const response = await fetch(apiUrl('paiements/update'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementData),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour du paiement');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['echeances']
      });
    }
  });
};
