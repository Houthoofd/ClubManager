import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les abonnements
export const useAbonnements = () => {
  return useQuery({
    queryKey: ['abonnements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/abonnements'));
      if (!response.ok) throw new Error('Erreur lors du chargement des abonnements');
      return response.json();
    }
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
    }
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
    }
  });
};
