import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer tous les cours
export const useCours = () => {
  return useQuery({
    queryKey: ['cours'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours/informations/planning'));
      if (!response.ok) throw new Error('Erreur lors du chargement des cours');
      return response.json();
    }
  });
};

// Hook pour ajouter un cours
export const useAjouterCours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nouveauCours: any) => {
      const response = await fetch(apiUrl('cours/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nouveauCours)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'ajout du cours");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    }
  });
};

// Hook pour modifier un cours
export const useModifierCours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modifCours: any) => {
      const response = await fetch(apiUrl('cours/modifier'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifCours)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la modification du cours");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    }
  });
};

// Hook pour supprimer un cours
export const useSupprimerCours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jourSemaine: string) => {
      const response = await fetch(apiUrl('cours/supprimer'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jourSemaine })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression du cours");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    }
  });
};

// Hook pour récupérer les professeurs
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
