import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer tous les articles
export const useArticles = () => {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const response = await fetch(apiUrl('magasin/articles'));
      if (!response.ok) throw new Error('Erreur lors du chargement des articles');
      const data = await response.json();

      // Reconstruire le tableau d'articles avec la catégorie associée
      const articlesArray: any[] = [];
      Object.entries(data).forEach(([categorieNom, articles]) => {
        if (Array.isArray(articles)) {
          articles.forEach((article: any) => {
            articlesArray.push({
              ...article,
              categorie_nom: categorieNom
            });
          });
        }
      });
      return articlesArray;
    }
  });
};

// Hook pour récupérer les catégories d'articles
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(apiUrl('magasin/articles/categories'));
      if (!response.ok) throw new Error('Erreur lors du chargement des catégories');
      const data = await response.json();
      return Array.isArray(data) ? data : Object.values(data).flat();
    }
  });
};

// Hook pour ajouter un article
export const useAjouterArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: any) => {
      const response = await fetch(apiUrl('magasin/articles/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'ajout de l'article");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    }
  });
};

// Hook pour modifier un article
export const useModifierArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, article }: { id: number; article: any }) => {
      const response = await fetch(apiUrl(`magasin/modifier/article/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la modification de l'article");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    }
  });
};

// Hook pour supprimer un article
export const useSupprimerArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(apiUrl(`magasin/articles/${id}`), {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression de l'article");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    }
  });
};
