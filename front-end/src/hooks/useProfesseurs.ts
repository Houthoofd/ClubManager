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
    mutationFn: async (utilisateurs: { id: number; nom: string; prenom: string }[]) => {
      const response = await fetch(apiUrl('professeurs/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateurs }),
        credentials: 'include',
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
        body: JSON.stringify({ id, status_id }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du retrait de la promotion');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalider toutes les queries liées aux professeurs
      queryClient.invalidateQueries({ queryKey: ['professeurs'] });
      
      // Invalider les queries des utilisateurs (pour mettre à jour la liste des utilisateurs disponibles)
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      queryClient.invalidateQueries({ queryKey: ['tousLesUtilisateurs'] });
      
      // Invalider les queries des cours (car les professeurs assignés aux cours peuvent changer)
      queryClient.invalidateQueries({ queryKey: ['cours'] });
      queryClient.invalidateQueries({ queryKey: ['joursDeCours'] });
      queryClient.invalidateQueries({ queryKey: ['planningCours'] });
      queryClient.invalidateQueries({ queryKey: ['coursRecurrents'] });
      
      // Invalider aussi les queries pour la gestion/modification des cours
      queryClient.invalidateQueries({ queryKey: ['coursInformations'] });
      queryClient.invalidateQueries({ queryKey: ['coursPlanning'] });
      queryClient.invalidateQueries({ queryKey: ['coursGestion'] });
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

// Hook pour supprimer un cours récurrent par jour
export const useSupprimerCoursRecurrent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (jourSemaine: string) => {
      const response = await fetch(apiUrl('cours/supprimer'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jourSemaine }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du cours');
      }

      return response.json();
    },
    onSuccess: async () => {
      console.log('Succès suppression cours récurrent - invalidation complète des queries');
      
      // Invalider toutes les queries liées aux cours et professeurs
      await queryClient.invalidateQueries({ queryKey: ['professeurs'] });
      await queryClient.invalidateQueries({ queryKey: ['joursDeCours'] });
      await queryClient.invalidateQueries({ queryKey: ['planningCours'] });
      await queryClient.invalidateQueries({ queryKey: ['cours'] });
      await queryClient.invalidateQueries({ queryKey: ['coursPlanning'] });
      await queryClient.invalidateQueries({ queryKey: ['coursRecurrents'] });
      await queryClient.invalidateQueries({ queryKey: ['coursInformations'] });
      await queryClient.invalidateQueries({ queryKey: ['coursGestion'] });
      await queryClient.invalidateQueries({ queryKey: ['coursRecurrentProfesseur'] });
      await queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      await queryClient.invalidateQueries({ queryKey: ['tousLesUtilisateurs'] });
      
      // Forcer le refetch immédiat avec un délai plus long
      await queryClient.refetchQueries({ queryKey: ['joursDeCours'] });
      await queryClient.refetchQueries({ queryKey: ['professeurs'] });
      
      // Attendre plus longtemps car la suppression est plus complexe
      await new Promise(resolve => setTimeout(resolve, 1500));
    },
  });
};

// Hook pour retirer un ou plusieurs professeurs d'un cours récurrent
export const useRetirerProfesseursDuCours = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ professeursNoms, jour }: { professeursNoms: string[], jour: string }) => {
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
    onSuccess: async () => {
      console.log('Succès dissociation professeur - invalidation complète des queries');
      
      // Invalider toutes les queries liées aux cours et professeurs
      await queryClient.invalidateQueries({ queryKey: ['professeurs'] });
      await queryClient.invalidateQueries({ queryKey: ['joursDeCours'] });
      await queryClient.invalidateQueries({ queryKey: ['planningCours'] });
      await queryClient.invalidateQueries({ queryKey: ['cours'] });
      await queryClient.invalidateQueries({ queryKey: ['coursPlanning'] });
      await queryClient.invalidateQueries({ queryKey: ['coursRecurrents'] });
      await queryClient.invalidateQueries({ queryKey: ['coursInformations'] });
      await queryClient.invalidateQueries({ queryKey: ['coursGestion'] });
      await queryClient.invalidateQueries({ queryKey: ['coursRecurrentProfesseur'] });
      await queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      await queryClient.invalidateQueries({ queryKey: ['tousLesUtilisateurs'] });
      
      // Forcer le refetch immédiat
      await queryClient.refetchQueries({ queryKey: ['joursDeCours'] });
      await queryClient.refetchQueries({ queryKey: ['professeurs'] });
      
      // Attendre que les refetch se terminent
      await new Promise(resolve => setTimeout(resolve, 1000));
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
