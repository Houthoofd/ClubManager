import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

const getAuthToken = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}'); // Retrieve user data from localStorage
  return userData.token || ''; // Extract the token from userData
};


// Hook pour récupérer les types de messages
export const useTypesMessages = () => {
  return useQuery({
    queryKey: ['typesMessages'],
    queryFn: async () => {
      const response = await fetch(apiUrl('messages'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // Use the token in the Authorization header
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des types de messages');
      const data = await response.json();
      return data.data || [];
    }
  });
};

// Hook pour créer un type de message
export const useCreerTypeMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: { title: string; content: string }) => {
      const response = await fetch(apiUrl('messages/types'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}` // Use the token in the Authorization header
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la création du type de message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesMessages'] });
    }
  });
};

// Hook pour mettre à jour un type de message
export const useModifierTypeMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: { title: string; content: string } }) => {
      const response = await fetch(apiUrl(`messages/types/${id}`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}` // Use the token in the Authorization header
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du type de message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesMessages'] });
    }
  });
};

// Hook pour supprimer un type de message
export const useSupprimerTypeMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(apiUrl(`messages/types/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // Use the token in the Authorization header
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du type de message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesMessages'] });
    }
  });
};

// Mise à jour du hook pour récupérer les messages reçus
export const useMessagesRecus = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  return useQuery({
    queryKey: ['messages-recus', userData.id],
    queryFn: async () => {
      const response = await fetch(apiUrl(`messages/recus/${userData.id}`), {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des messages');
      }
      
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!userData.id,
  });
};

// Hook pour marquer un message comme lu
export const useMarquerMessageLu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(apiUrl(`messages/${messageId}/marquer-lu`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      queryClient.invalidateQueries({ queryKey: ['messages-recus', userData.id] });
      queryClient.invalidateQueries({ queryKey: ['messages-non-lus', userData.id] });
    },
  });
};

// Hook pour supprimer un message reçu
export const useSupprimerMessageRecu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(apiUrl(`messages/${messageId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      queryClient.invalidateQueries({ queryKey: ['messages-recus', userData.id] });
      queryClient.invalidateQueries({ queryKey: ['messages-non-lus', userData.id] });
    },
  });
};

// Mise à jour du hook pour envoyer un message
export const useEnvoyerMessage = () => {
  return useMutation({
    mutationFn: async ({ destinataires, type_message_id }: { destinataires: number[]; type_message_id: string | number }) => {
      const response = await fetch(apiUrl('messages/envoie'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ destinataires, type_message_id: Number(type_message_id) }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de l\'envoi du message');
      return response.json();
    }
  });
};

// Hook pour récupérer les messages non lus
export const useMessagesNonLus = (utilisateurId: number) => {
  return useQuery({
    queryKey: ['messages', 'non-lus', utilisateurId],
    queryFn: async () => {
      // Vérifier l'authentification avant la requête
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(apiUrl(`messages/non-lus/${utilisateurId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token invalide, nettoyer et rediriger
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/pages/connexion';
          throw new Error('Session expirée');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!utilisateurId && utilisateurId > 0, // Ne pas exécuter si utilisateurId invalide
    retry: (failureCount, error: any) => {
      // Ne pas retry si erreur d'authentification
      if (error.message.includes('401') || error.message.includes('Session expirée')) {
        return false;
      }
      return failureCount < 3;
    }
  });
};
