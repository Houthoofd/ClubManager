import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';
import type { ArticleCreationData } from '@clubmanager/types'; // Retire Article inutilisé

// Hook pour récupérer les articles par catégorie
export const useArticlesParCategorie = () => {
  return useQuery({
    queryKey: ['articlesParCategorie'],
    queryFn: async () => {
      const response = await fetch(apiUrl('magasin/articles'), {
        credentials: 'include',
      });
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
      const response = await fetch(apiUrl('magasin/articles/categories'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des catégories');
      return response.json();
    }
  });
};

// Hook pour récupérer les tailles disponibles depuis l'API
export const useTaillesMagasin = () => {
  return useQuery({
    queryKey: ['taillesMagasin'],
    queryFn: async () => {
      const response = await fetch(apiUrl('magasin/tailles'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des tailles');
      // Retourne directement le tableau des tailles
      const data = await response.json();
      return data.tailles;
    }
  });
};

// Hook pour ajouter un article
export const useAjouterArticleMagasin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (article: ArticleCreationData) => {
      const response = await fetch(apiUrl('magasin/articles/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de l\'ajout de l\'article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articlesParCategorie'] });
    }
  });
};

// Hook pour modifier un article
export const useModifierArticleMagasin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, article }: { id: number, article: ArticleCreationData }) => {
      const response = await fetch(apiUrl(`magasin/articles/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la modification de l\'article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articlesParCategorie'] });
    }
  });
};

// Hook pour supprimer un article
export const useSupprimerArticleMagasin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(apiUrl(`magasin/articles/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression de l\'article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articlesParCategorie'] });
    }
  });
};
