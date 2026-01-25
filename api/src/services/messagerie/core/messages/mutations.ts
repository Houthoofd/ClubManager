/**
 * Mutations pour les messages standards
 */

import { MessagerieError, MessagerieResponse } from '@clubmanager/types';

/**
 * Envoie un message à un utilisateur
 */
export async function envoyerMessageUtilisateur(
  prisma,
  senderId: number,
  receiverId: number,
  contenu: string
): Promise<MessagerieResponse<{ id: number }>> {
  if (!senderId || senderId <= 0) {
    throw new MessagerieError('ID expéditeur invalide', 'INVALID_SENDER_ID');
  }

  if (!receiverId || receiverId <= 0) {
    throw new MessagerieError('ID destinataire invalide', 'INVALID_RECEIVER_ID');
  }

  if (!contenu || contenu.trim() === '') {
    throw new MessagerieError('Le contenu du message est requis', 'EMPTY_CONTENT');
  }

  if (contenu.length > 10000) {
    throw new MessagerieError('Le contenu du message est trop long', 'CONTENT_TOO_LONG');
  }

  if (senderId === receiverId) {
    throw new MessagerieError('Impossible de s\'envoyer un message à soi-même', 'SAME_SENDER_RECEIVER');
  }

  try {
    // Vérifier que les utilisateurs existent
    const [sender, receiver] = await Promise.all([
      prisma.utilisateurs.findUnique({ where: { id: senderId } }),
      prisma.utilisateurs.findUnique({ where: { id: receiverId } })
    ]);

    if (!sender) {
      throw new MessagerieError('Expéditeur non trouvé', 'SENDER_NOT_FOUND');
    }

    if (!receiver) {
      throw new MessagerieError('Destinataire non trouvé', 'RECEIVER_NOT_FOUND');
    }

    // Créer le message
    const message = await prisma.messages.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        contenu: contenu.trim()
      }
    });

    // Créer le statut du message pour le destinataire
    await prisma.message_status.create({
      data: {
        message_id: message.id,
        utilisateur_id: receiverId,
        status: 'non_vu'
      }
    });

    return {
      success: true,
      data: { id: message.id },
      message: 'Message envoyé avec succès'
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2003') {
      throw new MessagerieError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de l\'envoi du message',
      'SEND_ERROR',
      error
    );
  }
}

/**
 * Envoie un message à un groupe
 */
export async function envoyerMessageGroupe(
  prisma,
  senderId: number,
  groupeId: number,
  contenu: string
): Promise<MessagerieResponse<{ id: number }>> {
  if (!senderId || senderId <= 0) {
    throw new MessagerieError('ID expéditeur invalide', 'INVALID_SENDER_ID');
  }

  if (!groupeId || groupeId <= 0) {
    throw new MessagerieError('ID groupe invalide', 'INVALID_GROUP_ID');
  }

  if (!contenu || contenu.trim() === '') {
    throw new MessagerieError('Le contenu du message est requis', 'EMPTY_CONTENT');
  }

  if (contenu.length > 10000) {
    throw new MessagerieError('Le contenu du message est trop long', 'CONTENT_TOO_LONG');
  }

  try {
    // Vérifier que l'expéditeur existe et fait partie du groupe
    const isMembre = await prisma.groupes_utilisateurs.findFirst({
      where: {
        groupe_id: groupeId,
        utilisateur_id: senderId
      }
    });

    if (!isMembre) {
      throw new MessagerieError('Utilisateur non membre du groupe', 'NOT_GROUP_MEMBER');
    }

    // Récupérer tous les membres du groupe (sauf l'expéditeur)
    const membres = await prisma.groupes_utilisateurs.findMany({
      where: {
        groupe_id: groupeId,
        utilisateur_id: {
          not: senderId
        }
      },
      select: {
        utilisateur_id: true
      }
    });

    if (membres.length === 0) {
      throw new MessagerieError('Aucun destinataire dans le groupe', 'NO_GROUP_MEMBERS');
    }

    // Créer le message
    const message = await prisma.messages.create({
      data: {
        sender_id: senderId,
        groupe_id: groupeId,
        contenu: contenu.trim()
      }
    });

    // Créer les statuts pour tous les membres
    await prisma.message_status.createMany({
      data: membres.map((membre: any) => ({
        message_id: message.id,
        utilisateur_id: membre.utilisateur_id,
        status: 'non_vu' as const
      }))
    });

    return {
      success: true,
      data: { id: message.id },
      message: `Message envoyé à ${membres.length} membre(s) du groupe`
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2003') {
      throw new MessagerieError('Groupe ou utilisateur non trouvé', 'NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de l\'envoi du message au groupe',
      'SEND_ERROR',
      error
    );
  }
}

/**
 * Supprime un message
 */
export async function supprimerMessage(
  prisma,
  messageId: number,
  utilisateurId: number
): Promise<MessagerieResponse<{ message: string }>> {
  if (!messageId || messageId <= 0) {
    throw new MessagerieError('ID message invalide', 'INVALID_MESSAGE_ID');
  }

  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    // Vérifier que le message existe et que l'utilisateur est l'expéditeur
    const message = await prisma.messages.findFirst({
      where: {
        id: messageId,
        sender_id: utilisateurId
      }
    });

    if (!message) {
      throw new MessagerieError('Message non trouvé ou non autorisé', 'MESSAGE_NOT_FOUND');
    }

    // Supprimer le message (cascade delete pour les statuts)
    await prisma.messages.delete({
      where: { id: messageId }
    });

    return {
      success: true,
      data: { message: 'Message supprimé avec succès' }
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2025') {
      throw new MessagerieError('Message non trouvé', 'MESSAGE_NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de la suppression du message',
      'DELETE_ERROR',
      error
    );
  }
}
