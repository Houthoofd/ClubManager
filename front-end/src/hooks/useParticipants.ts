import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les participants d'un cours
export const useParticipants = (coursId: number) => {
  return useQuery({
    queryKey: ['participants', coursId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`cours/${coursId}`));
      if (!response.ok) throw new Error('Erreur lors du chargement des participants');
      const data = await response.json();
      return data.data?.Cours || null;
    },
    enabled: !!coursId // N'exécute pas la requête si coursId est invalide
  });
};

// Hook pour mettre à jour le statut de présence d'un participant
export const useUpdatePresence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ coursId, utilisateurId, action }: { coursId: number; utilisateurId: number; action: 'valider' | 'annuler' }) => {
      const response = await fetch(apiUrl(`cours/${coursId}/presence`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateurId, action })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour de la présence');
      }
      return response.json();
    },
    onSuccess: (_, { coursId }) => {
      queryClient.invalidateQueries({ queryKey: ['participants', coursId] });
    }
  });
};
