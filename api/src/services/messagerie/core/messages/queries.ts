/**
 * Queries pour les messages standards
 */

import { MessageRecu, MessagerieError, StatutMessage } from '@clubmanager/types';

/**
 * Récupère tous les messages reçus par un utilisateur (messages standards)
 */
export async function obtenirMessagesRecusUtilisateur(
  prisma,
  utilisateurId: number
): Promise<MessageRecu[]> {
  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          { receiver_id: utilisateurId },
          {
            groupe_id: {
              not: null
            },
            groupes: {
              groupes_utilisateurs: {
                some: {
                  utilisateur_id: utilisateurId
                }
              }
            }
          }
        ]
      },
      include: {
        utilisateurs_messages_sender_idToutilisateurs: {
          select: {
            prenom: true,
            nom: true
          }
        },
        message_status: {
          where: {
            utilisateur_id: utilisateurId
          },
          select: {
            status: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      content: msg.contenu,
      date_reception: msg.created_at,
      expediteur_prenom: msg.utilisateurs_messages_sender_idToutilisateurs.prenom,
      expediteur_nom: msg.utilisateurs_messages_sender_idToutilisateurs.nom,
      title: 'Message',
      lu: msg.message_status.length > 0 && msg.message_status[0].status === 'vu',
      statut: msg.message_status.length > 0 && msg.message_status[0].status === 'vu' 
        ? 'lu' as const 
        : 'non_lu' as const
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
 * Récupère un message par son ID
 */
export async function obtenirMessageParId(
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
    const message = await prisma.messages.findFirst({
      where: {
        id: messageId,
        OR: [
          { receiver_id: utilisateurId },
          { sender_id: utilisateurId }
        ]
      },
      include: {
        utilisateurs_messages_sender_idToutilisateurs: {
          select: {
            prenom: true,
            nom: true
          }
        },
        message_status: {
          where: {
            utilisateur_id: utilisateurId
          },
          select: {
            status: true
          }
        }
      }
    });

    if (!message) {
      return null;
    }

    return {
      id: message.id,
      content: message.contenu,
      date_reception: message.created_at,
      expediteur_prenom: message.utilisateurs_messages_sender_idToutilisateurs.prenom,
      expediteur_nom: message.utilisateurs_messages_sender_idToutilisateurs.nom,
      title: 'Message',
      lu: message.message_status.length > 0 && message.message_status[0].status === 'vu',
      statut: message.message_status.length > 0 && message.message_status[0].status === 'vu'
        ? StatutMessage.LU
        : StatutMessage.NON_LU
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
 * Récupère les messages d'un groupe
 */
export async function obtenirMessagesGroupe(
  prisma,
  groupeId: number,
  utilisateurId: number
): Promise<MessageRecu[]> {
  if (!groupeId || groupeId <= 0) {
    throw new MessagerieError('ID groupe invalide', 'INVALID_GROUP_ID');
  }

  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    // Vérifier que l'utilisateur fait partie du groupe
    const isMembre = await prisma.groupes_utilisateurs.findFirst({
      where: {
        groupe_id: groupeId,
        utilisateur_id: utilisateurId
      }
    });

    if (!isMembre) {
      throw new MessagerieError('Utilisateur non membre du groupe', 'NOT_GROUP_MEMBER');
    }

    const messages = await prisma.messages.findMany({
      where: {
        groupe_id: groupeId
      },
      include: {
        utilisateurs_messages_sender_idToutilisateurs: {
          select: {
            prenom: true,
            nom: true
          }
        },
        message_status: {
          where: {
            utilisateur_id: utilisateurId
          },
          select: {
            status: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      content: msg.contenu,
      date_reception: msg.created_at,
      expediteur_prenom: msg.utilisateurs_messages_sender_idToutilisateurs.prenom,
      expediteur_nom: msg.utilisateurs_messages_sender_idToutilisateurs.nom,
      title: 'Message de groupe',
      lu: msg.message_status.length > 0 && msg.message_status[0].status === 'vu',
      statut: msg.message_status.length > 0 && msg.message_status[0].status === 'vu'
        ? 'lu' as const
        : 'non_lu' as const
    }));
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de la récupération des messages du groupe',
      'QUERY_ERROR',
      error
    );
  }
}
