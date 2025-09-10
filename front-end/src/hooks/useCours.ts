import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les horaires des cours
export const useCoursPlanning = () => {
  return useQuery({
    queryKey: ['coursPlanning'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours/informations/planning'));
      if (!response.ok) throw new Error('Erreur lors du chargement des horaires des cours');
      return response.json();
    }
  });
};

// Hook pour récupérer tous les cours
export const useCours = () => {
  return useQuery({
    queryKey: ['cours'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours'));
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

// Hook pour récupérer les cours à venir où l'utilisateur est inscrit
export const useCoursInscritsUtilisateur = (userId: number) => {
  return useQuery({
    queryKey: ['coursInscritsUtilisateur', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`cours/inscriptions/utilisateur/${userId}`));
      if (!response.ok) throw new Error('Erreur lors du chargement des cours inscrits');
      return response.json();
    },
    enabled: !!userId
  });
};

// Hook pour annuler la présence d'un utilisateur à un cours (PATCH)
export const useAnnulerPresence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { cours_id: number; utilisateur_nom: string; utilisateur_prenom: string }) => {
      const response = await fetch(apiUrl('cours/inscription/annulation'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'annulation de la présence");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  });
};

// Hook pour valider la présence d'un utilisateur à un cours (PATCH)
export const useValiderPresence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { cours_id: number; utilisateur_nom: string; utilisateur_prenom: string }) => {
      const response = await fetch(apiUrl('cours/inscription/validation'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la validation de la présence");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  });
};
