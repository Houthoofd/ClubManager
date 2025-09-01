import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les messages d'un utilisateur
export const useMessagesUtilisateur = (userId: string | number) => {
  return useQuery({
    queryKey: ['messagerie', 'messages', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`messagerie/messages/utilisateur/${userId}`));
      if (!response.ok) throw new Error('Erreur lors du chargement des messages');
      return response.json();
    },
    enabled: !!userId
  });
};

// Hook pour récupérer une conversation entre deux utilisateurs
export const useConversation = (utilisateur1Id: string | number, utilisateur2Id: string | number) => {
  return useQuery({
    queryKey: ['messagerie', 'conversation', utilisateur1Id, utilisateur2Id],
    queryFn: async () => {
      const response = await fetch(apiUrl(`messagerie/conversation/${utilisateur1Id}/${utilisateur2Id}`));
      if (!response.ok) throw new Error('Erreur lors du chargement de la conversation');
      return response.json();
    },
    enabled: !!utilisateur1Id && !!utilisateur2Id,
    refetchInterval: 10000 // Rafraîchir toutes les 10 secondes
  });
};

// Hook pour envoyer un message
export const useEnvoyerMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: {
      expediteur_id: number;
      destinataire_id: number;
      contenu: string;
      fichiers_joints?: File[];
    }) => {
      // Utilisation de FormData pour gérer les fichiers joints
      const formData = new FormData();
      formData.append('expediteur_id', message.expediteur_id.toString());
      formData.append('destinataire_id', message.destinataire_id.toString());
      formData.append('contenu', message.contenu);
      
      if (message.fichiers_joints) {
        message.fichiers_joints.forEach(file => {
          formData.append('fichiers', file);
        });
      }
      
      const response = await fetch(apiUrl('messagerie/envoyer'), {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi du message');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalider les requêtes concernées
      queryClient.invalidateQueries({ queryKey: ['messagerie', 'messages', String(variables.expediteur_id)] });
      queryClient.invalidateQueries({ queryKey: ['messagerie', 'messages', String(variables.destinataire_id)] });
      queryClient.invalidateQueries({ 
        queryKey: ['messagerie', 'conversation', String(variables.expediteur_id), String(variables.destinataire_id)]
      });
      queryClient.invalidateQueries({ 
        queryKey: ['messagerie', 'conversation', String(variables.destinataire_id), String(variables.expediteur_id)]
      });
    }
  });
};

// Hook pour marquer un message comme lu
export const useMarquerMessageLu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(apiUrl(`messagerie/message/${messageId}/lu`), {
        method: 'PUT'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du marquage du message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Comme on ne connaît pas exactement les utilisateurs concernés, on invalide toutes les requêtes de messagerie
      queryClient.invalidateQueries({ queryKey: ['messagerie'] });
    }
  });
};

// Hook pour envoyer un message de groupe (annonce)
export const useEnvoyerMessageGroupe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: {
      expediteur_id: number;
      destinataires_ids: number[];
      objet: string;
      contenu: string;
      important?: boolean;
    }) => {
      const response = await fetch(apiUrl('messagerie/envoyer-groupe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi du message de groupe');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalider toutes les requêtes de messagerie car plusieurs utilisateurs sont concernés
      queryClient.invalidateQueries({ queryKey: ['messagerie'] });
    }
  });
};
