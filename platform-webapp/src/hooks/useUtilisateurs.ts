import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

const getAuthToken = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}'); // Retrieve user data from localStorage
  return userData.token || ''; // Extract the token from userData
};

// Hook pour récupérer tous les utilisateurs
export const useUtilisateurs = () => {
  return useQuery({
    queryKey: ['utilisateurs'],
    queryFn: async () => {
      const response = await fetch(apiUrl('utilisateurs'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // Add Authorization header
      });
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
      const response = await fetch(apiUrl(`utilisateurs/${id}`), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // Add Authorization header
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des données de l\'utilisateur');
      return response.json();
    },
    enabled: !!id // Ne s'exécute que si id est défini
  });
};

// Fonction pour vérifier si un email existe déjà
export const checkEmailExists = async (email: string, id?: number) => {
  const response = await fetch(apiUrl('verification/verifier-email'), {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}` // Add Authorization header
    },
    body: JSON.stringify({ email, id }),
    credentials: 'include',
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
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la modification de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      queryClient.invalidateQueries({ queryKey: ['utilisateurs', String(variables.id)] });
      queryClient.invalidateQueries({ queryKey: ['echeances', String(variables.id)] });
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
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
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}` // Add Authorization header
        },
        body: JSON.stringify(utilisateur),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'ajout de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalider les requêtes liées aux utilisateurs pour forcer leur rafraîchissement
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
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // Add Authorization header
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

// Hook pour obtenir tous les utilisateurs (retourne l'objet complet du backend)
export const useTousLesUtilisateurs = () => {
  return useQuery({
    queryKey: ['tousLesUtilisateurs'],
    queryFn: async () => {
      const response = await fetch(apiUrl('utilisateurs'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // Add Authorization header
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      return response.json(); // Retourne l'objet complet (isFind, data, etc.)
    }
  });
};

// Hook pour vérifier si un ou plusieurs utilisateurs sont déjà professeurs
export const useVerifierProfesseurs = () => {
  return useMutation({
    mutationFn: async (utilisateurs: { nom: string; prenom: string }[]) => {
      const response = await fetch(apiUrl('verification/verifier-professeurs'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}` // Add Authorization header
        },
        body: JSON.stringify({ utilisateurs }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la vérification des professeurs');
      }
      return response.json(); // { professeurs: [...], message }
    }
  });
};

// Hook pour supprimer un utilisateur
export const useDeleteUtilisateur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // Le log doit être ici pour voir l'id reçu à chaque appel
      console.log('[useDeleteUtilisateur] Appel mutation avec id =', id);
      const response = await fetch(apiUrl(`utilisateurs/supprimer/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      // Ajoute un log ici pour voir l'id passé à la mutation
      console.log('[useDeleteUtilisateur] onSuccess - id passé à la mutation :', variables);
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    },
  });
};
