import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setNombreMessagesNonLus, 
  decrementMessagesNonLus,
  incrementMessagesNonLus, // AJOUTÉ
  setLoadingMessages 
} from '../redux/slices/messagesSlice';
import { apiUrl } from '../pages/apiUrl';
import React, { useState, useEffect } from 'react';
import { RootState } from '../redux/store';

// Fonction utilitaire pour récupérer le token
const getAuthToken = () => {
  // Essayer d'abord userData.token
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (userData.token) {
    return userData.token;
  }
  
  // Puis authToken
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    return authToken;
  }
  
  // Enfin les cookies
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  return null;
};

// Fonction fetchWithAuth améliorée
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Ajouter le token soit en header soit en cookie
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important pour envoyer les cookies
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
};

// Hook pour récupérer les types de messages
export const useTypesMessages = () => {
  return useQuery({
    queryKey: ['typesMessages'],
    queryFn: () => fetchWithAuth(apiUrl('messages'))
  });
};

// Hook pour créer un type de message
export const useCreerTypeMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: { title: string; content: string }) => {
      const token = getAuthToken();
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl('messages/types'), {
        method: 'POST',
        headers,
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
      const token = getAuthToken();
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl(`messages/types/${id}`), {
        method: 'PUT',
        headers,
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
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl(`messages/types/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du type de message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesMessages'] });
    }
  });
};

// Hook pour marquer un message comme lu - EMPÊCHER LE REFETCH IMMÉDIAT
export const useMarquerMessageLu = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl(`messages/${messageId}/marquer-lu`), {
        method: 'PUT',
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du message');
      }
      
      return response.json();
    },
    onMutate: async (messageId: number) => {
      // OPTIMISTIC UPDATE: Mettre à jour immédiatement le cache
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Annuler toutes les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ['messagesRecus', userData.id] });
      
      // Sauvegarder l'état précédent
      const previousMessages = queryClient.getQueryData(['messagesRecus', userData.id]);
      
      // Mise à jour optimiste du cache
      queryClient.setQueryData(['messagesRecus', userData.id], (old: any) => {
        if (!old) return old;
        
        return old.map((message: any) => 
          message.id === messageId 
            ? { ...message, lu: true, date_lecture: new Date().toISOString() }
            : message
        );
      });
      
      // Décrémenter immédiatement le badge
      dispatch(decrementMessagesNonLus());
      
      return { previousMessages };
    },
    onError: (err, messageId, context) => {
      // En cas d'erreur, restaurer l'état précédent
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (context?.previousMessages) {
        queryClient.setQueryData(['messagesRecus', userData.id], context.previousMessages);
      }
    },
    onSettled: () => {
      // NE PAS invalider immédiatement - attendre plus longtemps
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['messagesRecus', userData.id],
          refetchType: 'none' // IMPORTANT: Ne pas refetch automatiquement
        });
        queryClient.invalidateQueries({ 
          queryKey: ['messages', 'non-lus', userData.id],
          refetchType: 'none'
        });
      }, 10000); // Attendre 10 secondes avant de synchroniser
    },
  });
};

// Hook pour supprimer un message reçu - EMPÊCHER LE REFETCH IMMÉDIAT
export const useSupprimerMessageRecu = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl(`messages/${messageId}`), {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du message');
      }
      
      return response.json();
    },
    onMutate: async (messageId: number) => {
      // OPTIMISTIC UPDATE: Supprimer immédiatement du cache
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Annuler toutes les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['messagesRecus', userData.id] });
      
      // Sauvegarder l'état précédent
      const previousMessages = queryClient.getQueryData(['messagesRecus', userData.id]);
      
      // Vérifier si le message était non lu avant suppression
      let wasUnread = false;
      if (Array.isArray(previousMessages)) {
        const messageToDelete = previousMessages.find((msg: any) => msg.id === messageId);
        wasUnread = messageToDelete && !messageToDelete.lu;
      }
      
      // Mise à jour optimiste: supprimer le message du cache
      queryClient.setQueryData(['messagesRecus', userData.id], (old: any[]) => {
        if (!old) return old;
        return old.filter((message: any) => message.id !== messageId);
      });
      
      // Décrémenter le badge seulement si le message était non lu
      if (wasUnread) {
        dispatch(decrementMessagesNonLus());
      }
      
      return { previousMessages, wasUnread };
    },
    onError: (err, messageId, context) => {
      // En cas d'erreur, restaurer l'état précédent
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (context?.previousMessages) {
        queryClient.setQueryData(['messagesRecus', userData.id], context.previousMessages);
        
        // Restaurer le compteur si nécessaire
        if (context.wasUnread) {
          dispatch(incrementMessagesNonLus());
        }
      }
    },
    onSettled: () => {
      // NE PAS invalider immédiatement
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['messagesRecus', userData.id],
          refetchType: 'none'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['messages', 'non-lus', userData.id],
          refetchType: 'none'
        });
      }, 10000);
    },
  });
};

// Hook pour envoyer un message avec notification email - AMÉLIORÉ avec feedback détaillé
export const useEnvoyerMessage = () => {
  return useMutation({
    mutationFn: async ({ 
      destinataires, 
      type_message_id, 
      envoyerEmail = true 
    }: { 
      destinataires: number[]; 
      type_message_id: string | number;
      envoyerEmail?: boolean;
    }) => {
      const token = getAuthToken();
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 [Frontend] Envoi de messages:', {
        destinataires: destinataires.length,
        type_message_id,
        envoyerEmail
      });

      const response = await fetch(apiUrl('messages/envoie'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          destinataires, 
          type_message_id: Number(type_message_id),
          envoyerEmail 
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      
      const data = await response.json();
      console.log('✅ [Frontend] Réponse serveur:', data);
      
      return data;
    }
  });
};

// Hook pour récupérer les messages non lus - VERSION SIMPLIFIÉE
export const useMessagesNonLus = (utilisateurId: number) => {
  const dispatch = useDispatch();
  
  const query = useQuery({
    queryKey: ['messages', 'non-lus', utilisateurId],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(apiUrl(`messages/non-lus/${utilisateurId}`), {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/pages/connexion';
          throw new Error('Session expirée');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!utilisateurId && utilisateurId > 0,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
      if (error.message.includes('401') || error.message.includes('Session expirée')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Gérer les états avec useEffect
  React.useEffect(() => {
    if (query.isLoading) {
      dispatch(setLoadingMessages(true));
    } else {
      dispatch(setLoadingMessages(false));
    }
  }, [query.isLoading, dispatch]);

  React.useEffect(() => {
    if (query.data?.data?.count !== undefined) {
      const currentCount = query.data.data.count || 0;
      dispatch(setNombreMessagesNonLus(currentCount));
    }
  }, [query.data, dispatch]);

  return query;
};

// Hook pour récupérer les messages reçus - RÉDUIRE LA FRÉQUENCE DE REFETCH
export const useMessagesRecus = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userId = userData.id;
  
  return useQuery({
    queryKey: ['messagesRecus', userId],
    queryFn: () => fetchWithAuth(apiUrl(`messages/recus/${userId}`)),
    enabled: !!userId,
    staleTime: 60000, // Considérer les données comme fraîches pendant 1 minute
    refetchOnWindowFocus: false, // Ne pas refetch au focus
    refetchInterval: false // Désactiver le refetch automatique
  });
};

// NOUVEAU: Hook pour récupérer la corbeille
export const useMessagesCorbeille = (utilisateurId: number) => {
  return useQuery({
    queryKey: ['messagesCorbeille', utilisateurId],
    queryFn: () => fetchWithAuth(apiUrl(`messages/corbeille/${utilisateurId}`)),
    enabled: !!utilisateurId,
    staleTime: 30000
  });
};

// NOUVEAU: Hook pour restaurer un message
export const useRestaurerMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl(`messages/${messageId}/restaurer`), {
        method: 'PUT',
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la restauration du message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      // Invalider toutes les requêtes de messages
      queryClient.invalidateQueries({ queryKey: ['messagesRecus', userData.id] });
      queryClient.invalidateQueries({ queryKey: ['messagesCorbeille', userData.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'non-lus', userData.id] });
    },
  });
};

export const useMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Récupérer l'utilisateur depuis Redux au lieu de UserContext
  const userData = useSelector((state: RootState) => state.auth.user);
  
  const fetchUnreadCount = async () => {
    if (!userData?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/non-lus/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de messages non lus:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [userData?.id]);

  return {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount
  };
};