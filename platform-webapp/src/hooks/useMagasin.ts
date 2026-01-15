import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';
import type { ArticleCreationData } from '@clubmanager/types'; // Retire Article inutilisé
import { useToast } from './useToast';

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

// AJOUTÉ: Cache pour empêcher les soumissions multiples côté client
const soumissionsEnCours = new Map<string, Promise<any>>();

export const useCreerCommande = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (commandeData: any) => {
      // AJOUTÉ: Créer une clé unique pour cette commande
      const cacheKey = `${commandeData.utilisateur_id}-${commandeData.total}-${JSON.stringify(commandeData.articles)}`;
      
      // Vérifier si une soumission identique est en cours
      if (soumissionsEnCours.has(cacheKey)) {
        console.log('⚠️ [Hook] Soumission identique en cours, attente...');
        return await soumissionsEnCours.get(cacheKey);
      }

      console.log('🔄 [Hook] Création commande avec protection doublon');
      
      // Créer la promesse et la stocker
      const promesse = (async () => {
        try {
          const response = await fetch(apiUrl('magasin/commandes/ajouter'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            credentials: 'include',
            body: JSON.stringify(commandeData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erreur réseau' }));
            throw new Error(errorData.message || `Erreur ${response.status}`);
          }

          const result = await response.json();
          
          if (result.isDuplicate) {
            console.log('ℹ️ [Hook] Doublon détecté côté serveur, commande existante retournée');
          }
          
          return result;
          
        } finally {
          // Nettoyer le cache après 3 secondes
          setTimeout(() => {
            soumissionsEnCours.delete(cacheKey);
          }, 3000);
        }
      })();

      // Stocker la promesse
      soumissionsEnCours.set(cacheKey, promesse);
      
      return await promesse;
    },
    onSuccess: (data, variables) => {
      console.log('✅ [Hook] Commande créée/récupérée:', {
        isDuplicate: data.isDuplicate,
        numero: data.commande?.numero_commande
      });
      
      if (data.isDuplicate) {
        showToast('Commande déjà existante - doublon évité', 'info');
      } else {
        showToast('Commande créée avec succès', 'success');
      }
      
      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
    },
    onError: (error: any, variables) => {
      console.error('❌ [Hook] Erreur création commande:', error);
      
      // Nettoyer le cache en cas d'erreur
      const cacheKey = `${variables.utilisateur_id}-${variables.total}-${JSON.stringify(variables.articles)}`;
      soumissionsEnCours.delete(cacheKey);
      
      showToast(error.message || 'Erreur lors de la création de la commande', 'danger');
    },
    // AJOUTÉ: Options pour empêcher les retry automatiques
    retry: false,
    
  });
};
