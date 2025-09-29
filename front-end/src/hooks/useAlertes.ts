import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

const getAuthToken = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  return userData.token || '';
};

// Hook pour récupérer toutes les alertes actives
export const useAlertes = () => {
  return useQuery({
    queryKey: ['alertes-actives'],
    queryFn: async () => {
      const response = await fetch(apiUrl('alertes/actives'), {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des alertes');
      }
      
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch toutes les minutes
  });
};

// Hook pour récupérer les alertes d'un utilisateur spécifique
export const useAlertesUtilisateur = (userId: number) => {
  return useQuery({
    queryKey: ['alertes-utilisateur', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`alertes/utilisateur/${userId}`), {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des alertes utilisateur');
      }
      
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!userId,
  });
};

// Hook pour obtenir les statistiques des alertes
export const useStatistiquesAlertes = () => {
  return useQuery({
    queryKey: ['statistiques-alertes'],
    queryFn: async () => {
      const response = await fetch(apiUrl('alertes/dashboard'), {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }
      
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
