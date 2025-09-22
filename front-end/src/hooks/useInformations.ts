import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

const getAuthToken = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}'); // Retrieve user data from localStorage
  return userData.token || ''; // Extract the token from userData
};

// Hook pour récupérer les abonnements
export const useAbonnements = () => {
  return useQuery({
    queryKey: ['abonnements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/abonnements'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
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
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
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
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
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
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des genres');
      return response.json();
    }
  });
};
