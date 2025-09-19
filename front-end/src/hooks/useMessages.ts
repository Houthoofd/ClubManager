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

// Hook pour envoyer un message
export const useEnvoyerMessage = () => {
  return useMutation({
    mutationFn: async ({ destinataires, type_message_id }: { destinataires: number[]; type_message_id: string }) => {
      const response = await fetch(apiUrl('messages/envoie'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}` // Use the token in the Authorization header
        },
        body: JSON.stringify({ destinataires, type_message_id }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de l’envoi du message');
      return response.json();
    }
  });
};
