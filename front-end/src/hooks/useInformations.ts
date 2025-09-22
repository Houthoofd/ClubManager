import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';


// Hook pour récupérer les abonnements
export const useAbonnements = () => {
  return useQuery({
    queryKey: ['abonnements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/abonnements'), {
        // credentials: 'omit' pour accès public
        credentials: 'omit',
      });
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
      const response = await fetch(apiUrl('informations/grades'), {
        credentials: 'omit',
      });
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
      const response = await fetch(apiUrl('informations/status'), {
        credentials: 'omit',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des statuts');
      return response.json();
    }
  });
};

// Hook pour récupérer les genres
export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/genres'), {
        credentials: 'omit',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des genres');
      return response.json();
    }
  });
};
