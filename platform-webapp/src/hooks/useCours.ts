import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les horaires des cours
export const useCoursPlanning = () => {
  return useQuery({
    queryKey: ['coursPlanning'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours/informations/planning'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des horaires des cours');
      return response.json();
    }
  });
};

// Hook pour récupérer les jours de cours (planning)
export const useJoursDeCours = () => {
  return useQuery({
    queryKey: ['joursDeCours'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours/informations/planning'), {
        credentials: 'include', // Ajoutez cette ligne si l'authentification est nécessaire
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des cours');
      }
      const data = await response.json();
      return data;
    },
  });
};

// Hook pour récupérer tous les cours
export const useCours = () => {
  return useQuery({
    queryKey: ['cours'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des cours');
      return response.json();
    }
  });
};

// Hook pour ajouter un cours
export const useAjouterCours = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coursData: any) => {
      console.log('Données envoyées pour ajouter un cours:', coursData);
      const response = await fetch(apiUrl('cours/ajouter'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coursData),
        credentials: 'include',
      });
      console.log('Réponse de l\'API pour ajouter un cours:', response);

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du cours');
      }

      return response.json();
    },
    onSuccess: async () => {
      console.log('Succès ajout cours - invalidation complète des queries');
      
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
      
      // Forcer le refetch immédiat des données principales
      await queryClient.refetchQueries({ queryKey: ['joursDeCours'] });
      await queryClient.refetchQueries({ queryKey: ['professeurs'] });
      
      // Attendre que les refetch se terminent
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
  });
};

// Hook pour modifier un cours récurrent
export const useModifierCours = () => {
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
    onSuccess: async () => {
      console.log('Succès modification cours - invalidation complète des queries');
      
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
        body: JSON.stringify({ jourSemaine }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression du cours");
      }
      return response.json();
    },
    onSuccess: async () => {
      console.log('Succès suppression cours - invalidation complète des queries');
      
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
      
      // Attendre plus longtemps car la suppression est plus complexe
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  });
};

// Hook pour récupérer les professeurs
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

// Hook pour récupérer les cours à venir où l'utilisateur est inscrit
export const useCoursInscritsUtilisateur = (userId: number) => {
  return useQuery({
    queryKey: ['coursInscritsUtilisateur', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`cours/inscriptions/utilisateur/${userId}`), {
        credentials: 'include',
      });
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
        body: JSON.stringify(data),
        credentials: 'include',
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
        body: JSON.stringify(data),
        credentials: 'include',
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
