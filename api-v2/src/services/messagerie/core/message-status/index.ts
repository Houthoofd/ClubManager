/**
 * Gestion des statuts de messages
 */

import { MessagerieError, MessagerieResponse } from '@clubmanager/types';

/**
 * Marque un message comme vu
 */
export async function marquerMessageVu(
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
    // Vérifier que le message existe
    const message = await prisma.messages.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new MessagerieError('Message non trouvé', 'MESSAGE_NOT_FOUND');
    }

    // Mettre à jour ou créer le statut
    await prisma.message_status.upsert({
      where: {
        uk_message_utilisateur: {
          message_id: messageId,
          utilisateur_id: utilisateurId
        }
      },
      update: {
        status: 'vu',
        updated_at: new Date()
      },
      create: {
        message_id: messageId,
        utilisateur_id: utilisateurId,
        status: 'vu'
      }
    });

    return {
      success: true,
      data: { message: 'Message marqué comme vu' }
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2003') {
      throw new MessagerieError('Message ou utilisateur non trouvé', 'NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de la mise à jour du statut',
      'UPDATE_ERROR',
      error
    );
  }
}

/**
 * Récupère le statut d'un message pour un utilisateur
 */
export async function obtenirStatutMessage(
  prisma,
  messageId: number,
  utilisateurId: number
): Promise<'vu' | 'non_vu'> {
  if (!messageId || messageId <= 0) {
    throw new MessagerieError('ID message invalide', 'INVALID_MESSAGE_ID');
  }

  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    const statut = await prisma.message_status.findUnique({
      where: {
        uk_message_utilisateur: {
          message_id: messageId,
          utilisateur_id: utilisateurId
        }
      }
    });

    return statut?.status === 'vu' ? 'vu' : 'non_vu';
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de la récupération du statut',
      'QUERY_ERROR',
      error
    );
  }
}

/**
 * Compte le nombre de messages non vus pour un utilisateur
 */
export async function compterMessagesNonVus(
  prisma,
  utilisateurId: number
): Promise<number> {
  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    // Compter les messages standards non vus
    const messagesStandardsNonVus = await prisma.message_status.count({
      where: {
        utilisateur_id: utilisateurId,
        status: 'non_vu'
      }
    });

    // Compter les messages personnalisés non lus
    const messagesPersonnalisesNonLus = await prisma.messages_personnalises.count({
      where: {
        utilisateur_id: utilisateurId,
        lu: false,
        is_active: true,
        deleted_at: null
      }
    });

    return messagesStandardsNonVus + messagesPersonnalisesNonLus;
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors du comptage des messages non vus',
      'COUNT_ERROR',
      error
    );
  }
}

/**
 * Marque tous les messages d'un utilisateur comme vus
 */
export async function marquerTousMessagesVus(
  prisma,
  utilisateurId: number
): Promise<MessagerieResponse<{ count: number }>> {
  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    // Marquer les messages standards comme vus
    const resultStandards = await prisma.message_status.updateMany({
      where: {
        utilisateur_id: utilisateurId,
        status: 'non_vu'
      },
      data: {
        status: 'vu',
        updated_at: new Date()
      }
    });

    // Marquer les messages personnalisés comme lus
    const resultPersonnalises = await prisma.messages_personnalises.updateMany({
      where: {
        utilisateur_id: utilisateurId,
        lu: false,
        is_active: true,
        deleted_at: null
      },
      data: {
        lu: true,
        date_lecture: new Date()
      }
    });

    const totalCount = resultStandards.count + resultPersonnalises.count;

    return {
      success: true,
      data: { count: totalCount },
      message: `${totalCount} message(s) marqué(s) comme vu(s)`
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de la mise à jour des statuts',
      'UPDATE_ERROR',
      error
    );
  }
}
