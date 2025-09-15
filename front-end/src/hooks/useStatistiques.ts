import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les statistiques de fréquentation d'un utilisateur
export const useFrequentationByUserId = (userId: string) => {
  return useQuery({
    queryKey: ['frequentation', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`statistiques/frequentation/${userId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      return response.json();
    },
    enabled: !!userId
  });
};

// Hook pour récupérer les membres les plus assidus
export const useTopAssidus = () => {
  return useQuery({
    queryKey: ['topAssidus'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/membres/assidus'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des membres assidus');
      return response.json();
    }
  });
};

// Hook pour récupérer les membres par grade
export const useMembresParGrade = () => {
  return useQuery({
    queryKey: ['membresParGrade'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/membres/par-grade'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des membres par grade');
      return response.json();
    }
  });
};

// Hook pour récupérer les membres par genre
export const useMembresParGenre = () => {
  return useQuery({
    queryKey: ['membresParGenre'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/membres/par-genre'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des membres par genre');
      return response.json();
    }
  });
};

// Hook pour récupérer les anniversaires des membres
export const useAnniversaires = () => {
  return useQuery({
    queryKey: ['anniversaires'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/membres/anniversaires'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des anniversaires');
      return response.json();
    }
  });
};

// Hook pour récupérer les articles les plus vendus
export const useArticlesVendus = () => {
  return useQuery({
    queryKey: ['articlesVendus'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/articles/plus-vendus'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des articles vendus');
      return response.json();
    }
  });
};

// Hook pour récupérer le nombre de cours prévus cette semaine
export const useCoursSemaine = () => {
  return useQuery({
    queryKey: ['coursSemaine'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/cours/semaine'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des cours de la semaine');
      return response.json();
    }
  });
};
