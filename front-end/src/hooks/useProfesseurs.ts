import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer tous les professeurs
export const useProfesseurs = () => {
  return useQuery({
    queryKey: ['professeurs'],
    queryFn: async () => {
      const response = await fetch(apiUrl('professeurs'), {
        credentials: 'include',
      });
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
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl('professeurs/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateurs: data }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la promotion des professeurs');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalider les queries liées aux professeurs et utilisateurs
      queryClient.invalidateQueries({ queryKey: ['professeurs'] });
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      queryClient.invalidateQueries({ queryKey: ['tousLesUtilisateurs'] });
    }
  });
};

// Hook pour retirer la promotion d'un professeur
export const useRetirerPromotionProfesseur = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl('professeurs/modifier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du retrait de la promotion');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalider les queries liées aux professeurs et utilisateurs
      queryClient.invalidateQueries({ queryKey: ['professeurs'] });
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      queryClient.invalidateQueries({ queryKey: ['tousLesUtilisateurs'] });
    }
  });
};

// Hook pour ajouter un cours récurrent avec professeurs
export const useAjouterCoursRecurrent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ajoutCours: any) => {
      const response = await fetch(apiUrl('cours/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ajoutCours),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'ajout du cours récurrent');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    }
  });
};

// Hook pour retirer un ou plusieurs professeurs d'un cours récurrent
export const useRetirerProfesseursDuCours = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ professeursNoms, jour }: { professeursNoms: string[]; jour: string }) => {
      const response = await fetch(apiUrl('cours/retirer-professeur'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ professeursNoms, jour }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du retrait des professeurs');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider toutes les queries liées aux cours et professeurs
      queryClient.invalidateQueries({ queryKey: ['professeurs'] });
      queryClient.invalidateQueries({ queryKey: ['joursDeCours'] });
      queryClient.invalidateQueries({ queryKey: ['planningCours'] });
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    },
  });
};

// Hook pour supprimer un cours récurrent par jour
export const useSupprimerCoursRecurrent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (jour: string) => {
      const response = await fetch(apiUrl('cours/supprimer'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jourSemaine: jour }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du cours');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider toutes les queries liées aux cours et professeurs
      queryClient.invalidateQueries({ queryKey: ['professeurs'] });
      queryClient.invalidateQueries({ queryKey: ['joursDeCours'] });
      queryClient.invalidateQueries({ queryKey: ['planningCours'] });
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    },
  });
};

// Hook pour modifier un cours récurrent
export const useModifierCoursRecurrent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (modifCours: any) => {
      const response = await fetch(apiUrl('cours/modifier'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifCours),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la modification du cours récurrent');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours'] });
    }
  });
};

