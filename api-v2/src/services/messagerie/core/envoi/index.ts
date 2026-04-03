/**
 * Module d'envoi de messages en masse
 */

import { MessagerieError, EnvoyerMessageResult } from '@clubmanager/types';

/**
 * Envoie un message à plusieurs destinataires
 */
export async function envoyerMessageMultiple(
  prisma,
  senderId: number,
  destinataireIds: number[],
  contenu: string
): Promise<EnvoyerMessageResult> {
  if (!senderId || senderId <= 0) {
    throw new MessagerieError('ID expéditeur invalide', 'INVALID_SENDER_ID');
  }

  if (!destinataireIds || destinataireIds.length === 0) {
    throw new MessagerieError('Au moins un destinataire est requis', 'NO_RECIPIENTS');
  }

  if (!contenu || contenu.trim() === '') {
    throw new MessagerieError('Le contenu du message est requis', 'EMPTY_CONTENT');
  }

  if (contenu.length > 10000) {
    throw new MessagerieError('Le contenu du message est trop long', 'CONTENT_TOO_LONG');
  }

  // Vérifier qu'il n'y a pas de doublons
  const uniqueDestinataires = [...new Set(destinataireIds)];

  if (uniqueDestinataires.length !== destinataireIds.length) {
    throw new MessagerieError('Liste de destinataires contient des doublons', 'DUPLICATE_RECIPIENTS');
  }

  // Vérifier que l'expéditeur n'est pas dans la liste des destinataires
  if (uniqueDestinataires.includes(senderId)) {
    throw new MessagerieError('L\'expéditeur ne peut pas être destinataire', 'SENDER_IN_RECIPIENTS');
  }

  try {
    // Vérifier que l'expéditeur existe
    const sender = await prisma.utilisateurs.findUnique({
      where: { id: senderId }
    });

    if (!sender) {
      throw new MessagerieError('Expéditeur non trouvé', 'SENDER_NOT_FOUND');
    }

    // Vérifier que tous les destinataires existent
    const destinataires = await prisma.utilisateurs.findMany({
      where: {
        id: {
          in: uniqueDestinataires
        }
      },
      select: {
        id: true
      }
    });

    if (destinataires.length !== uniqueDestinataires.length) {
      throw new MessagerieError('Certains destinataires n\'existent pas', 'INVALID_RECIPIENTS');
    }

    let successCount = 0;

    // Envoyer le message à chaque destinataire
    for (const destinataireId of uniqueDestinataires) {
      try {
        const message = await prisma.messages.create({
          data: {
            sender_id: senderId,
            receiver_id: destinataireId,
            contenu: contenu.trim()
          }
        });

        // Créer le statut du message
        await prisma.message_status.create({
          data: {
            message_id: message.id,
            utilisateur_id: destinataireId,
            status: 'non_vu'
          }
        });

        successCount++;
      } catch (error) {
        // Continuer même si un message échoue
        console.error(`Erreur envoi message à utilisateur ${destinataireId}:`, error);
      }
    }

    if (successCount === 0) {
      throw new MessagerieError('Échec de l\'envoi de tous les messages', 'ALL_FAILED');
    }

    return {
      success: true,
      count: successCount,
      message: `Message envoyé à ${successCount}/${uniqueDestinataires.length} destinataire(s)`
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de l\'envoi des messages',
      'SEND_ERROR',
      error
    );
  }
}

/**
 * Envoie un message personnalisé à un utilisateur spécifique
 */
export async function envoyerMessagePersonnalise(
  prisma,
  destinataireId: number,
  contenu: string,
  expediteurId?: number
): Promise<EnvoyerMessageResult> {
  if (!destinataireId || destinataireId <= 0) {
    throw new MessagerieError('ID destinataire invalide', 'INVALID_RECEIVER_ID');
  }

  if (!contenu || contenu.trim() === '') {
    throw new MessagerieError('Le contenu du message est requis', 'EMPTY_CONTENT');
  }

  if (contenu.length > 10000) {
    throw new MessagerieError('Le contenu du message est trop long', 'CONTENT_TOO_LONG');
  }

  try {
    // Vérifier que le destinataire existe
    const destinataire = await prisma.utilisateurs.findUnique({
      where: { id: destinataireId }
    });

    if (!destinataire) {
      throw new MessagerieError('Destinataire non trouvé', 'RECEIVER_NOT_FOUND');
    }

    // Si un expéditeur est fourni, vérifier qu'il existe
    if (expediteurId) {
      const expediteur = await prisma.utilisateurs.findUnique({
        where: { id: expediteurId }
      });

      if (!expediteur) {
        throw new MessagerieError('Expéditeur non trouvé', 'SENDER_NOT_FOUND');
      }
    }

    // Créer le message personnalisé
    await prisma.messages_personnalises.create({
      data: {
        utilisateur_id: destinataireId,
        contenu: contenu.trim(),
        lu: false,
        is_active: true,
        status_envoi: 'sent'
      }
    });

    return {
      success: true,
      count: 1,
      message: 'Message personnalisé envoyé avec succès'
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2003') {
      throw new MessagerieError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de l\'envoi du message personnalisé',
      'SEND_ERROR',
      error
    );
  }
}

/**
 * Envoie un message à tous les membres d'un ou plusieurs groupes
 */
export async function envoyerMessageGroupes(
  prisma,
  senderId: number,
  groupeIds: number[],
  contenu: string
): Promise<EnvoyerMessageResult> {
  if (!senderId || senderId <= 0) {
    throw new MessagerieError('ID expéditeur invalide', 'INVALID_SENDER_ID');
  }

  if (!groupeIds || groupeIds.length === 0) {
    throw new MessagerieError('Au moins un groupe est requis', 'NO_GROUPS');
  }

  if (!contenu || contenu.trim() === '') {
    throw new MessagerieError('Le contenu du message est requis', 'EMPTY_CONTENT');
  }

  if (contenu.length > 10000) {
    throw new MessagerieError('Le contenu du message est trop long', 'CONTENT_TOO_LONG');
  }

  const uniqueGroupes = [...new Set(groupeIds)];

  try {
    let totalSuccess = 0;

    for (const groupeId of uniqueGroupes) {
      // Vérifier que le groupe existe
      const groupe = await prisma.groupes.findUnique({
        where: { id: groupeId }
      });

      if (!groupe) {
        continue; // Ignorer les groupes inexistants
      }

      // Créer le message de groupe
      const message = await prisma.messages.create({
        data: {
          sender_id: senderId,
          groupe_id: groupeId,
          contenu: contenu.trim()
        }
      });

      // Récupérer tous les membres du groupe sauf l'expéditeur
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

      // Créer les statuts pour tous les membres
      if (membres.length > 0) {
        await prisma.message_status.createMany({
          data: membres.map((membre: any) => ({
            message_id: message.id,
            utilisateur_id: membre.utilisateur_id,
            status: 'non_vu' as const
          }))
        });

        totalSuccess += membres.length;
      }
    }

    if (totalSuccess === 0) {
      throw new MessagerieError('Aucun message envoyé', 'NO_MESSAGES_SENT');
    }

    return {
      success: true,
      count: totalSuccess,
      message: `Message envoyé à ${totalSuccess} membre(s) de ${uniqueGroupes.length} groupe(s)`
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de l\'envoi des messages aux groupes',
      'SEND_ERROR',
      error
    );
  }
}
