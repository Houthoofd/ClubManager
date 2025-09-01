import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les articles par catégorie
export const useArticlesParCategorie = () => {
  return useQuery({
    queryKey: ['articlesParCategorie'],
    queryFn: async () => {
      const response = await fetch(apiUrl('magasin/articles'));
      if (!response.ok) throw new Error('Erreur lors du chargement des articles');
      return response.json();
    }
  });
};

// Hook pour récupérer les catégories
export const useCategoriesMagasin = () => {
  return useQuery({
    queryKey: ['categoriesMagasin'],
    queryFn: async () => {
      const response = await fetch(apiUrl('magasin/articles/categories'));
      if (!response.ok) throw new Error('Erreur lors du chargement des catégories');
      return response.json();
    }
  });
};
