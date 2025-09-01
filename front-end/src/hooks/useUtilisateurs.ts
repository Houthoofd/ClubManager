import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer tous les utilisateurs
export const useUtilisateurs = () => {
  return useQuery({
    queryKey: ['utilisateurs'],
    queryFn: async () => {
      const response = await fetch(apiUrl('utilisateurs'));
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await response.json();
      return data.data || [];
    }
  });
};

// Hook pour récupérer un utilisateur par ID
export const useUtilisateurById = (id: string) => {
  return useQuery({
    queryKey: ['utilisateurs', id],
    queryFn: async () => {
      const response = await fetch(apiUrl(`utilisateurs/${id}`));
      if (!response.ok) throw new Error('Erreur lors du chargement des données de l\'utilisateur');
      return response.json();
    },
    enabled: !!id // Ne s'exécute que si id est défini
  });
};

// Fonction pour vérifier si un email existe déjà
export const checkEmailExists = async (email: string, id?: number) => {
  const response = await fetch(apiUrl('utilisateurs/verifier-email'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, id })
  });
  return response.json();
};

// Hook pour mettre à jour un utilisateur
export const useUpdateUtilisateur = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch(apiUrl('utilisateurs/modifier'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la modification de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalider les requêtes concernées pour forcer leur rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      queryClient.invalidateQueries({ queryKey: ['utilisateurs', String(variables.id)] });
    }
  });
};

// Hook pour ajouter un utilisateur
export const useAjouterUtilisateur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (utilisateur: any) => {
      const response = await fetch(apiUrl('utilisateurs/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(utilisateur)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'ajout de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    }
  });
};

// Hook pour supprimer un utilisateur
export const useSupprimerUtilisateur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (utilisateurId: number) => {
      const response = await fetch(apiUrl(`utilisateurs/${utilisateurId}`), {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    }
  });
};
