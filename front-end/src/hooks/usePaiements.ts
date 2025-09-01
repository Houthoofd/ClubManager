import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer tous les paiements
export const usePaiements = () => {
  return useQuery({
    queryKey: ['paiements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('paiements'));
      if (!response.ok) throw new Error('Erreur lors du chargement des paiements');
      return response.json();
    }
  });
};

// Hook pour créer un paiement
export const useCreerPaiement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paiementData: any) => {
      const response = await fetch(apiUrl('paiements'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementData),
      });
      if (!response.ok) throw new Error('Erreur lors de la création du paiement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
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
      const response = await fetch(apiUrl(`paiements/echeances/${userId}`));
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
        body: JSON.stringify(paiementData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour du paiement');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalider les requêtes concernées pour forcer leur rafraîchissement
      queryClient.invalidateQueries({ 
        queryKey: ['echeances']
      });
    }
  });
};
