/**
 * Queries pour les messages personnalisés
 */

import { MessageRecu, MessagerieError, StatutMessage } from '@clubmanager/types';

/**
 * Récupère tous les messages personnalisés reçus par un utilisateur
 */
export async function obtenirMessagesRecus(
  prisma,
  utilisateurId: number
): Promise<MessageRecu[]> {
  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    const messages = await prisma.messages_personnalises.findMany({
      where: {
        utilisateur_id: utilisateurId,
        is_active: true,
        deleted_at: null
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      content: msg.contenu,
      date_reception: msg.created_at,
      expediteur_prenom: 'Système',
      expediteur_nom: '',
      title: 'Message personnalisé',
      lu: msg.lu ?? false,
      statut: msg.lu ? 'lu' as const : 'non_lu' as const
    }));
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de la récupération des messages',
      'QUERY_ERROR',
      error
    );
  }
}

/**
 * Récupère un message personnalisé par son ID
 */
export async function obtenirMessagePersonnaliseParId(
  prisma,
  messageId: number,
  utilisateurId: number
): Promise<MessageRecu | null> {
  if (!messageId || messageId <= 0) {
    throw new MessagerieError('ID message invalide', 'INVALID_MESSAGE_ID');
  }

  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    const message = await prisma.messages_personnalises.findFirst({
      where: {
        id: messageId,
        utilisateur_id: utilisateurId,
        is_active: true,
        deleted_at: null
      }
    });

    if (!message) {
      return null;
    }

    return {
      id: message.id,
      content: message.contenu,
      date_reception: message.created_at,
      expediteur_prenom: 'Système',
      expediteur_nom: '',
      title: 'Message personnalisé',
      lu: message.lu ?? false,
      statut: message.lu ? StatutMessage.LU : StatutMessage.NON_LU
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de la récupération du message',
      'QUERY_ERROR',
      error
    );
  }
}

/**
 * Compte le nombre de messages non lus pour un utilisateur
 */
export async function compterMessagesNonLus(
  prisma,
  utilisateurId: number
): Promise<number> {
  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    return await prisma.messages_personnalises.count({
      where: {
        utilisateur_id: utilisateurId,
        lu: false,
        is_active: true,
        deleted_at: null
      }
    });
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors du comptage des messages non lus',
      'COUNT_ERROR',
      error
    );
  }
}
