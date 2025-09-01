import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les notifications de l'utilisateur
export const useNotifications = (userId: string | number) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`notifications/utilisateur/${userId}`), {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des notifications');
      return response.json();
    },
    enabled: !!userId,
    refetchInterval: 60000 // Rafraîchir toutes les minutes
  });
};

// Hook pour marquer une notification comme lue
export const useMarquerNotificationLue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(apiUrl(`notifications/marquer-lue/${notificationId}`), {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du marquage de la notification');
      }
      return response.json();
    },
    onSuccess: (_, variables, context) => {
      // Récupérer l'état actuel des notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

// Hook pour créer une nouvelle notification (pour les administrateurs)
export const useCreerNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      titre: string; 
      message: string; 
      type: 'info' | 'warning' | 'danger'; 
      utilisateurs_ids?: number[] 
    }) => {
      const response = await fetch(apiUrl('notifications/creer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de la notification');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalider toutes les requêtes de notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};
