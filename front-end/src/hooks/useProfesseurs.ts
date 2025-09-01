import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer tous les professeurs
export const useProfesseurs = () => {
  return useQuery({
    queryKey: ['professeurs'],
    queryFn: async () => {
      const response = await fetch(apiUrl('professeurs'));
      if (!response.ok) throw new Error('Erreur lors du chargement des professeurs');
      const data = await response.json();
      return data.data || [];
    }
  });
};

// Hook pour promouvoir des utilisateurs en professeurs
export const usePromouvoirProfesseurs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (utilisateurs: { id: number; nom: string; prenom: string }[]) => {
      const response = await fetch(apiUrl('professeurs/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateurs })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la promotion des professeurs');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professeurs'] });
    }
  });
};

// Hook pour retirer la promotion d'un professeur
export const useRetirerPromotionProfesseur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status_id }: { id: number; status_id: number }) => {
      const response = await fetch(apiUrl('professeurs/modifier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status_id })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du retrait de la promotion');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professeurs'] });
    }
  });
};
