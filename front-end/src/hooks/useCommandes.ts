import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer toutes les commandes
export const useCommandes = () => {
  return useQuery({
    queryKey: ['commandes'],
    queryFn: async () => {
      const response = await fetch(apiUrl('magasin/commandes'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des commandes');
      const data = await response.json();
      return data.commandes;
    }
  });
};

// Hook pour mettre à jour le statut d'une commande
export const useUpdateCommandeStatut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commandeId, newStatut }: { commandeId: string; newStatut: string }) => {
      const response = await fetch(apiUrl(`magasin/commandes/${commandeId}/statut`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour du statut de la commande');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
    }
  });
};
