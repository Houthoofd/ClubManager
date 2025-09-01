import { useQuery, useMutation } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les informations utilisateur
export const useCompteInfo = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['compteInfo', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`compte/informations`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des informations utilisateur');
      return response.json();
    },
    enabled: !!userId,
  });
};

// Hook pour récupérer les statistiques de fréquentation
export const useStatFrequentation = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['statFrequentation', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`statistiques/frequentation/${userId}`));
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques de fréquentation');
      return response.json();
    },
    enabled: !!userId,
  });
};

// Hook pour récupérer les abonnements
export const useAbonnements = () => {
  return useQuery({
    queryKey: ['abonnements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/abonnements'));
      if (!response.ok) throw new Error('Erreur lors du chargement des abonnements');
      return response.json();
    },
  });
};

// Hook pour récupérer les grades
export const useGrades = () => {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/grades'));
      if (!response.ok) throw new Error('Erreur lors du chargement des grades');
      return response.json();
    },
  });
};

// Hook pour récupérer les statuts
export const useStatus = () => {
  return useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/status'));
      if (!response.ok) throw new Error('Erreur lors du chargement des statuts');
      return response.json();
    },
  });
};

// Hook pour mettre à jour les informations utilisateur
export const useUpdateCompte = () => {
  return useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(apiUrl('utilisateurs/modifier'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour des informations utilisateur');
      }
      return response.json();
    },
  });
};
