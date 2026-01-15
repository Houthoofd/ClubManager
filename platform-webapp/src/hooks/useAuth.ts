import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour la connexion
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch(apiUrl('auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include' // Pour inclure les cookies dans la requête
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la connexion');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Mettre à jour le cache pour le profil utilisateur
      queryClient.setQueryData(['profil'], data.user);
      
      // Invalider les requêtes qui pourraient dépendre du statut d'authentification
      queryClient.invalidateQueries({ queryKey: ['authentifie'] });
    }
  });
};

// Hook pour la déconnexion
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(apiUrl('auth/logout'), {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la déconnexion');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Réinitialiser le cache pour le profil utilisateur
      queryClient.setQueryData(['profil'], null);
      
      // Invalider les requêtes qui dépendent du statut d'authentification
      queryClient.invalidateQueries({ queryKey: ['authentifie'] });
    }
  });
};

// Hook pour vérifier si l'utilisateur est authentifié
export const useAuthentifie = () => {
  return useQuery({
    queryKey: ['authentifie'],
    queryFn: async () => {
      const response = await fetch(apiUrl('auth/status'), {
        credentials: 'include'
      });

      if (!response.ok) {
        console.log('auth/status non OK', response.status);
        return { authentifie: false, user: null };
      }

      const data = await response.json();
      console.log('auth/status data', data);

      // Correction : retourne bien le user complet (pas juste le token décodé)
      // Si le back ne renvoie que les infos du token, il faut enrichir la réponse côté back
      return {
        authentifie: data.authentifie,
        user: data.user || null
      };
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Hook pour récupérer le profil de l'utilisateur connecté
export const useProfile = () => {
  return useQuery({
    queryKey: ['profil'],
    queryFn: async () => {
      const response = await fetch(apiUrl('auth/profil'), {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Non authentifié
        }
        throw new Error('Erreur lors du chargement du profil');
      }
      
      return response.json();
    },
    retry: false
  });
};